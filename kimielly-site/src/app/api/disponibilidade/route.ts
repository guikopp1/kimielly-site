import { z } from "zod";
import { listarHorarios } from "@/lib/booking/repository";
import { erro, excedeuLimite, ipDaRequisicao, json, tratarExcecao } from "@/lib/http";
import { dataISO, servicoId } from "@/lib/validation/booking";
import { servicoPorId } from "@/lib/content";

export const dynamic = "force-dynamic";

const consulta = z.object({ servico: servicoId, data: dataISO });

/** GET /api/disponibilidade?servico=maquiagem&data=2026-11-03 → horários livres (ISO). */
export async function GET(req: Request) {
  if (excedeuLimite(`disp:${ipDaRequisicao(req)}`, 120, 60_000)) {
    return erro(429, "RATE_LIMIT", "Muitas consultas seguidas. Aguarde um instante.");
  }
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const entrada = consulta.safeParse(params);
  if (!entrada.success || !servicoPorId(entrada.data.servico)?.agendavel) {
    return erro(400, "BAD_REQUEST", "Serviço ou data inválidos.");
  }
  try {
    const horarios = await listarHorarios(entrada.data.servico, entrada.data.data);
    return json({ ok: true as const, horarios });
  } catch (e) {
    return tratarExcecao(e);
  }
}
