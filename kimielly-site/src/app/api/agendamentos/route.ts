import { criarReserva } from "@/lib/booking/repository";
import { erro, excedeuLimite, ipDaRequisicao, json, tratarExcecao } from "@/lib/http";
import { criarAgendamentoSchema, errosPorCampo, normalizarTelefone } from "@/lib/validation/booking";
import { servicoPorId } from "@/lib/content";

export const dynamic = "force-dynamic";

const TEMPO_MINIMO_MS = 4_000; // humanos levam mais que isso para preencher o formulário

/** POST /api/agendamentos — cria a solicitação de agendamento. */
export async function POST(req: Request) {
  const ip = ipDaRequisicao(req);
  if (excedeuLimite(`criar:${ip}`, 8, 10 * 60_000)) {
    return erro(429, "RATE_LIMIT", "Muitas tentativas. Aguarde alguns minutos ou fale pelo WhatsApp.");
  }

  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    return erro(400, "BAD_REQUEST", "Requisição inválida.");
  }

  const entrada = criarAgendamentoSchema.safeParse(corpo);
  if (!entrada.success) {
    return erro(422, "VALIDATION", "Revise os campos destacados.", errosPorCampo(entrada.error));
  }
  const d = entrada.data;

  // Anti-spam: campo-armadilha preenchido ou envio instantâneo
  if (d.site || Date.now() - d.iniciadoEm < TEMPO_MINIMO_MS) {
    return erro(400, "SPAM", "Não foi possível validar o envio. Confira os dados e tente novamente.");
  }

  if (!servicoPorId(d.servicoId)?.agendavel) {
    return erro(422, "SERVICE_UNAVAILABLE", "Este serviço não está disponível para agendamento online.");
  }

  try {
    const reserva = await criarReserva({
      servicoId: d.servicoId,
      inicio: d.inicio,
      nome: d.nome,
      telefone: normalizarTelefone(d.telefone),
      observacoes: d.observacoes,
      ip,
    });
    return json({ ok: true as const, reserva }, 201);
  } catch (e) {
    return tratarExcecao(e);
  }
}
