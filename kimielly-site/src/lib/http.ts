import "server-only";
import { NextResponse } from "next/server";
import { AgendaNaoConfigurada } from "@/lib/supabase/server";
import { ErroAgenda } from "@/lib/booking/repository";

/** Limite simples por IP (memória da instância). Complementa as regras do banco. */
const janelas = new Map<string, { inicio: number; contagem: number }>();

export function excedeuLimite(chave: string, maximo: number, janelaMs: number): boolean {
  const agora = Date.now();
  const atual = janelas.get(chave);
  if (!atual || agora - atual.inicio > janelaMs) {
    janelas.set(chave, { inicio: agora, contagem: 1 });
    if (janelas.size > 5000) janelas.clear();
    return false;
  }
  atual.contagem += 1;
  return atual.contagem > maximo;
}

export function ipDaRequisicao(req: Request): string | null {
  const encaminhado = req.headers.get("x-forwarded-for");
  return encaminhado?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;
}

export function json<T>(corpo: T, status = 200) {
  return NextResponse.json(corpo, { status, headers: { "Cache-Control": "no-store" } });
}

export function erro(status: number, codigo: string, mensagem: string, campos?: Record<string, string>) {
  return json({ ok: false as const, codigo, mensagem, campos }, status);
}

/** Converte exceções conhecidas em respostas claras, sem vazar detalhes internos. */
export function tratarExcecao(e: unknown) {
  if (e instanceof AgendaNaoConfigurada) {
    return erro(
      503,
      "NOT_CONFIGURED",
      "O agendamento online ainda está sendo configurado. Por enquanto, agende pelo WhatsApp.",
    );
  }
  if (e instanceof ErroAgenda) {
    const status = e.codigo === "SLOT_UNAVAILABLE" ? 409 : e.codigo === "TOO_MANY_PENDING" ? 429 : 422;
    return erro(status, e.codigo, e.message);
  }
  console.error("[agenda]", e);
  return erro(500, "INTERNAL", "Não foi possível concluir agora. Tente novamente em instantes.");
}
