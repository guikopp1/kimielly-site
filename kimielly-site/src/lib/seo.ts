import type { Metadata } from "next";

export const URL_SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** Metadados por página: título, descrição, URL canônica e Open Graph. */
export function metadadosDaPagina({
  titulo,
  descricao,
  caminho,
}: {
  titulo: string;
  descricao: string;
  caminho: string;
}): Metadata {
  return {
    title: titulo,
    description: descricao,
    alternates: { canonical: caminho },
    openGraph: { title: titulo, description: descricao, url: caminho, locale: "pt_BR", type: "website" },
  };
}
