import { site, type CategoriaId, type FotoPortfolio, type Servico } from "@/config/site";

export function servicoPorId(id: string): Servico | undefined {
  return site.servicos.find((s) => s.id === id);
}

export function servicosAgendaveis(): Servico[] {
  return site.servicos.filter((s) => s.agendavel);
}

export function servicosEmDestaque(): Servico[] {
  return site.servicos.filter((s) => s.destaque);
}

/** Agrupa serviços por categoria, preservando a ordem do arquivo de configuração. */
export function servicosPorCategoria(): { id: CategoriaId; nome: string; servicos: Servico[] }[] {
  const grupos = new Map<CategoriaId, Servico[]>();
  for (const s of site.servicos) {
    grupos.set(s.categoria, [...(grupos.get(s.categoria) ?? []), s]);
  }
  return [...grupos.entries()].map(([id, servicos]) => ({ id, nome: site.categorias[id], servicos }));
}

/** Fotos publicáveis: têm arquivo e autorização. */
export function fotosPublicadas(): (FotoPortfolio & { src: string })[] {
  return site.portfolio.filter((f): f is FotoPortfolio & { src: string } => Boolean(f.src) && f.autorizada);
}

/**
 * Itens a exibir na galeria. Com `mostrarPendencias`, inclui espaços reservados
 * (sem foto) para indicar onde entram os trabalhos reais.
 */
export function itensPortfolio(): FotoPortfolio[] {
  const publicadas = fotosPublicadas();
  if (publicadas.length > 0 || !site.mostrarPendencias) return publicadas;
  return site.portfolio.map((f) => ({ ...f, src: null }));
}

/** Somente categorias que realmente possuem itens. */
export function categoriasDoPortfolio(itens: FotoPortfolio[]): { id: CategoriaId; nome: string }[] {
  const ids = [...new Set(itens.map((f) => f.categoria))];
  return ids.map((id) => ({ id, nome: site.categorias[id] }));
}
