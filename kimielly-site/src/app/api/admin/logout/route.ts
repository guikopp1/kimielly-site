import { NextResponse } from "next/server";
import { COOKIE_SESSAO, opcoesCookie } from "@/lib/admin/sessao";

export const dynamic = "force-dynamic";

/** POST /api/admin/logout — apaga o cookie de sessão. */
export async function POST() {
  const res = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  res.cookies.set(COOKIE_SESSAO, "", opcoesCookie(0));
  return res;
}
