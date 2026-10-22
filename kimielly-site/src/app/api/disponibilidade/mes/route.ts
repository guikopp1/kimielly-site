import { z } from "zod";
import { resumoDoMes } from "@/lib/booking/repository";
import { erro, excedeuLimite, ipDaRequisicao, json, tratarExcecao } from "@/lib/http";
import { servicoId } from "@/lib/validation/booking";
import { servicoPorId } from "@/lib/content";

export const dynamic = "force-dynamic";

const consulta = z.object({ servico: servicoId, mes: z.string().regex(/^\d{4}-\d{2}$/) });

/** GET /api/disponibilidade/mes?servico=maquiagem&mes=2026-11 → dias com horários livres. */
export async function GET(req: Request) {
  if (excedeuLimite(`mes:${ipDaRequisicao(req)}`, 60, 60_000)) {
    return erro(429, "RATE_LIMIT", "Muitas consultas seguidas. Aguarde um instante.");
  }
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const entrada = consulta.safeParse(params);
  if (!entrada.success || !servicoPorId(entrada.data.servico)?.agendavel) {
    return erro(400, "BAD_REQUEST", "Serviço ou mês inválidos.");
  }
  try {
    const dias = await resumoDoMes(entrada.data.servico, entrada.data.mes);
    return json({ ok: true as const, dias });
  } catch (e) {
    return tratarExcecao(e);
  }
}
