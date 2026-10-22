import { z } from "zod";
import { erro, json } from "@/lib/http";
import { adminAutenticado } from "@/lib/admin/sessao";
import { AgendamentoNaoEncontrado, alterarStatus, TransicaoInvalida } from "@/lib/admin/agendamentos";

export const dynamic = "force-dynamic";

const entrada = z.object({ status: z.enum(["confirmed", "declined", "cancelled"]) });

/** PATCH /api/admin/agendamentos/:id — confirma, recusa ou cancela. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await adminAutenticado())) return erro(401, "UNAUTHORIZED", "Sua sessão expirou. Entre novamente.");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return erro(400, "BAD_REQUEST", "Agendamento inválido.");
  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    return erro(400, "BAD_REQUEST", "Requisição inválida.");
  }
  const dados = entrada.safeParse(corpo);
  if (!dados.success) return erro(422, "VALIDATION", "Ação inválida.");
  try {
    const status = await alterarStatus(id, dados.data.status);
    return json({ ok: true as const, status });
  } catch (e) {
    if (e instanceof AgendamentoNaoEncontrado) return erro(404, "NOT_FOUND", e.message);
    if (e instanceof TransicaoInvalida) return erro(409, "CONFLICT", e.message);
    console.error("[admin]", e);
    return erro(500, "INTERNAL", "Não foi possível atualizar agora. Tente novamente.");
  }
}
