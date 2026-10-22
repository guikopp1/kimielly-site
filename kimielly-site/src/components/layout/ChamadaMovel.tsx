"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BotaoLink, cx } from "@/components/ui/primitives";

/**
 * CTA fixo no rodapé do celular: aparece só depois que a pessoa rola a página
 * e nunca na página de agendamento (para não competir com o formulário).
 */
export function ChamadaMovel() {
  const pathname = usePathname();
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const aoRolar = () => setVisivel(window.scrollY > window.innerHeight * 0.8);
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  if (pathname.startsWith("/agendamento")) return null;

  return (
    <div
      className={cx(
        "fixed inset-x-0 bottom-0 z-30 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-[transform,opacity] duration-500 ease-soft sm:hidden",
        visivel ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0",
      )}
      aria-hidden={!visivel}
    >
      <BotaoLink href="/agendamento" variante="primario" className="w-full shadow-[0_10px_30px_-12px_rgba(21,18,15,0.55)]" tabIndex={visivel ? 0 : -1}>
        Agendar horário
      </BotaoLink>
    </div>
  );
}
