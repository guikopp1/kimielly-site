import { z } from "zod";
import { NextResponse } from "next/server";
import { erro, excedeuLimite, ipDaRequisicao } from "@/lib/http";
import { COOKIE_SESSAO, criarToken, opcoesCookie, painelConfigurado, senhaCorreta } from "@/lib/admin/sessao";

export const dynamic = "force-dynamic";

const entrada = z.object({ senha: z.string().min(1).max(200) });

/** POST /api/admin/login — confere a senha e grava o cookie de sessão. */
export async function POST(req: Request) {
  if (!painelConfigurado()) {
    return erro(503, "NOT_CONFIGURED", "O painel ainda não tem senha. Cadastre ADMIN_PASSWORD (mínimo 8 caracteres) na Cloudflare.");
  }
  if (excedeuLimite(`login:${ipDaRequisicao(req)}`, 5, 15 * 60_000)) {
    return erro(429, "RATE_LIMIT", "Muitas tentativas. Aguarde 15 minutos e tente de novo.");
  }
  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    return erro(400, "BAD_REQUEST", "Requisição inválida.");
  }
  const dados = entrada.safeParse(corpo);
  if (!dados.success || !senhaCorreta(dados.data.senha)) {
    await new Promise((r) => setTimeout(r, 600)); // dificulta tentativas automáticas
    return erro(401, "INVALID", "Senha incorreta.");
  }
  const token = criarToken();
  const res = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  res.cookies.set(COOKIE_SESSAO, token.valor, opcoesCookie(token.maxAge));
  return res;
}
