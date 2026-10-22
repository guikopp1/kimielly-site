import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Login da área administrativa.
 * - A senha fica na variável de ambiente ADMIN_PASSWORD (cadastre como "Secret").
 * - A sessão é um cookie httpOnly assinado (HMAC), válido por 7 dias.
 * - Nada disso depende de tabelas novas no banco.
 */

export const COOKIE_SESSAO = "kw_admin";
const DURACAO_SEGUNDOS = 60 * 60 * 24 * 7;

export function painelConfigurado(): boolean {
  return (process.env.ADMIN_PASSWORD ?? "").length >= 8;
}

function segredo(): Buffer {
  const base = process.env.ADMIN_SESSION_SECRET || `kw-admin:${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}:${process.env.ADMIN_PASSWORD ?? ""}`;
  return createHash("sha256").update(base).digest();
}

function assinar(dados: string): string {
  return createHmac("sha256", segredo()).update(dados).digest("base64url");
}

function iguais(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function senhaCorreta(tentativa: string): boolean {
  if (!painelConfigurado()) return false;
  return iguais(tentativa, process.env.ADMIN_PASSWORD!);
}

export function criarToken(): { valor: string; maxAge: number } {
  const exp = Math.floor(Date.now() / 1000) + DURACAO_SEGUNDOS;
  const dados = Buffer.from(JSON.stringify({ exp })).toString("base64url");
  return { valor: `${dados}.${assinar(dados)}`, maxAge: DURACAO_SEGUNDOS };
}

export function tokenValido(token: string | undefined | null): boolean {
  if (!token || !painelConfigurado()) return false;
  const [dados, assinatura] = token.split(".");
  if (!dados || !assinatura || !iguais(assinatura, assinar(dados))) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(dados, "base64url").toString()) as { exp: number };
    return typeof exp === "number" && exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

/** Para páginas: redireciona ao login se não houver sessão válida. */
export async function exigirAdmin(): Promise<void> {
  const jar = await cookies();
  if (!tokenValido(jar.get(COOKIE_SESSAO)?.value)) redirect("/admin/login");
}

/** Para rotas de API. */
export async function adminAutenticado(): Promise<boolean> {
  const jar = await cookies();
  return tokenValido(jar.get(COOKIE_SESSAO)?.value);
}

export const opcoesCookie = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge,
});
