"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Esconde cabeçalho, rodapé e CTA do site público dentro do painel (/admin). */
export function OcultarNoAdmin({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  return <>{children}</>;
}
