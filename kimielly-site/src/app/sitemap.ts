import type { MetadataRoute } from "next";
import { URL_SITE } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const paginas: [string, number][] = [
    ["/", 1],
    ["/servicos", 0.9],
    ["/portfolio", 0.9],
    ["/agendamento", 0.8],
    ["/sobre", 0.7],
    ["/privacidade", 0.2],
  ];
  return paginas.map(([caminho, prioridade]) => ({
    url: `${URL_SITE}${caminho === "/" ? "" : caminho}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: prioridade,
  }));
}
