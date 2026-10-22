import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { site } from "@/config/site";
import { COOKIE_SESSAO, painelConfigurado, tokenValido } from "@/lib/admin/sessao";
import { Monograma } from "@/components/ui/primitives";
import { FormLogin } from "@/components/admin/FormLogin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Entrar no painel",
  robots: { index: false, follow: false },
};

export default async function LoginAdmin() {
  const jar = await cookies();
  if (tokenValido(jar.get(COOKIE_SESSAO)?.value)) redirect("/admin");

  return (
    <div className="flex min-h-dvh items-center justify-center bg-linen px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex flex-col items-center text-center">
          <Monograma className="size-14" tom="tinta" />
          <p className="titulo-display mt-5 text-3xl">{site.profissional.nome}</p>
          <p className="rotulo mt-2 text-bronze">Painel de agendamentos</p>
        </div>
        {painelConfigurado() ? (
          <FormLogin />
        ) : (
          <div role="status" className="border border-ink/12 bg-paper p-6 text-sm leading-relaxed text-taupe">
            <p className="font-semibold text-ink">Painel ainda sem senha</p>
            <p className="mt-2">
              Na Cloudflare, cadastre a variável <code className="text-ink">ADMIN_PASSWORD</code> (tipo Secret, com pelo
              menos 8 caracteres) e faça um novo deploy.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
