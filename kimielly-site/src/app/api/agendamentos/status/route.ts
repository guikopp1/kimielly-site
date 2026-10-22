import { consultarReserva } from "@/lib/booking/repository";
import { erro, excedeuLimite, ipDaRequisicao, json, tratarExcecao } from "@/lib/http";
import { consultarStatusSchema, errosPorCampo, normalizarTelefone } from "@/lib/validation/booking";

export const dynamic = "force-dynamic";

/** POST /api/agendamentos/status — consulta por código + telefone (dados no corpo, nunca na URL). */
export async function POST(req: Request) {
  if (excedeuLimite(`status:${ipDaRequisicao(req)}`, 20, 10 * 60_000)) {
    return erro(429, "RATE_LIMIT", "Muitas consultas. Aguarde alguns minutos.");
  }
  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    return erro(400, "BAD_REQUEST", "Requisição inválida.");
  }
  const entrada = consultarStatusSchema.safeParse(corpo);
  if (!entrada.success) {
    return erro(422, "VALIDATION", "Revise os campos.", errosPorCampo(entrada.error));
  }
  try {
    const reserva = await consultarReserva(entrada.data.codigo, normalizarTelefone(entrada.data.telefone));
    if (!reserva) {
      return erro(404, "NOT_FOUND", "Não encontramos uma solicitação com esse código e telefone.");
    }
    return json({ ok: true as const, reserva });
  } catch (e) {
    return tratarExcecao(e);
  }
}
