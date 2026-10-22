"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { CategoriaId, FotoPortfolio } from "@/config/site";
import { Foto } from "@/components/ui/Foto";
import { cx } from "@/components/ui/primitives";

type Props = {
  itens: FotoPortfolio[];
  categorias: { id: CategoriaId; nome: string }[];
};

export function Galeria({ itens, categorias }: Props) {
  const [filtro, setFiltro] = useState<CategoriaId | "todos">("todos");
  const [aberta, setAberta] = useState<number | null>(null);

  const visiveis = useMemo(
    () => (filtro === "todos" ? itens : itens.filter((f) => f.categoria === filtro)),
    [itens, filtro],
  );
  // Só fotos reais entram no lightbox
  const comFoto = useMemo(() => visiveis.filter((f) => f.src), [visiveis]);

  return (
    <>
      {categorias.length > 1 && (
        <div role="group" aria-label="Filtrar por categoria" className="-mx-5 mb-10 overflow-x-auto px-5 sm:mx-0 sm:px-0">
          <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
            {[{ id: "todos" as const, nome: "Todos" }, ...categorias].map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={filtro === c.id}
                onClick={() => setFiltro(c.id)}
                className={cx(
                  "min-h-10 rounded-full border px-4 text-sm whitespace-nowrap transition-colors duration-300",
                  filtro === c.id ? "border-ink bg-ink text-paper" : "border-ink/15 hover:border-ink",
                )}
              >
                {c.nome}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="sr-only" aria-live="polite">
        {visiveis.length} {visiveis.length === 1 ? "trabalho exibido" : "trabalhos exibidos"}
      </p>

      <ul className="columns-2 gap-3 sm:gap-5 lg:columns-3">
        {visiveis.map((f, i) => {
          const indiceLightbox = f.src ? comFoto.indexOf(f) : -1;
          return (
            <li key={`${f.alt}-${i}`} className="animar-surgir mb-3 break-inside-avoid sm:mb-5" style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}>
              <figure>
                {f.src ? (
                  <button
                    type="button"
                    onClick={() => setAberta(indiceLightbox)}
                    className="group block w-full overflow-hidden"
                    aria-label={`Ampliar: ${f.alt}`}
                  >
                    <Foto
                      src={f.src}
                      alt={f.alt}
                      proporcao={f.proporcao ?? 4 / 5}
                      sizes="(min-width: 1024px) 33vw, 50vw"
                      prioridade={i < 2}
                      imagemClassName="transition-transform duration-[1.2s] ease-soft group-hover:scale-[1.03]"
                    />
                  </button>
                ) : (
                  <Foto src={null} alt={f.alt} proporcao={f.proporcao ?? 4 / 5} descricaoPendente={f.legenda ?? f.alt} />
                )}
                {f.legenda && <figcaption className="mt-2.5 text-sm text-taupe">{f.legenda}</figcaption>}
              </figure>
            </li>
          );
        })}
      </ul>

      {aberta !== null && comFoto[aberta] && (
        <Lightbox fotos={comFoto} indice={aberta} aoMudar={setAberta} aoFechar={() => setAberta(null)} />
      )}
    </>
  );
}

function Lightbox({
  fotos,
  indice,
  aoMudar,
  aoFechar,
}: {
  fotos: FotoPortfolio[];
  indice: number;
  aoMudar: (i: number) => void;
  aoFechar: () => void;
}) {
  const dialogo = useRef<HTMLDivElement>(null);
  const toqueInicio = useRef<number | null>(null);
  const foto = fotos[indice];
  const total = fotos.length;

  const anterior = useCallback(() => aoMudar((indice - 1 + total) % total), [indice, total, aoMudar]);
  const proxima = useCallback(() => aoMudar((indice + 1) % total), [indice, total, aoMudar]);

  useEffect(() => {
    const focoAnterior = document.activeElement as HTMLElement | null;
    dialogo.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      focoAnterior?.focus();
    };
  }, []);

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoFechar();
      else if (e.key === "ArrowLeft") anterior();
      else if (e.key === "ArrowRight") proxima();
      else if (e.key === "Tab" && dialogo.current) {
        // mantém o foco dentro do lightbox
        const focaveis = dialogo.current.querySelectorAll<HTMLElement>("button");
        const primeiro = focaveis[0];
        const ultimo = focaveis[focaveis.length - 1];
        if (e.shiftKey && document.activeElement === primeiro) {
          e.preventDefault();
          ultimo.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault();
          primeiro.focus();
        }
      }
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [anterior, proxima, aoFechar]);

  if (!foto?.src) return null;

  return (
    <div
      ref={dialogo}
      role="dialog"
      aria-modal="true"
      aria-label={`Foto ${indice + 1} de ${total}: ${foto.alt}`}
      tabIndex={-1}
      className="tema-escuro animar-esmaecer fixed inset-0 z-50 flex flex-col bg-ink/97 text-paper outline-none"
      onTouchStart={(e) => (toqueInicio.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (toqueInicio.current == null) return;
        const delta = e.changedTouches[0].clientX - toqueInicio.current;
        if (Math.abs(delta) > 50) (delta > 0 ? anterior : proxima)();
        toqueInicio.current = null;
      }}
    >
      <div className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8">
        <span className="text-sm tabular-nums text-paper/60">
          {indice + 1} / {total}
        </span>
        <button type="button" onClick={aoFechar} className="inline-flex size-11 items-center justify-center" aria-label="Fechar">
          <X className="size-6" strokeWidth={1.4} />
        </button>
      </div>

      <div className="relative flex-1" onClick={aoFechar}>
        <Image
          key={foto.src}
          src={foto.src}
          alt={foto.alt}
          fill
          sizes="100vw"
          className="animar-esmaecer object-contain p-4 sm:p-10"
          onClick={(e) => e.stopPropagation()}
        />
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                anterior();
              }}
              className="absolute top-1/2 left-2 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full border border-paper/20 transition-colors hover:border-gold sm:inline-flex"
              aria-label="Foto anterior"
            >
              <ChevronLeft className="size-5" strokeWidth={1.4} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                proxima();
              }}
              className="absolute top-1/2 right-2 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full border border-paper/20 transition-colors hover:border-gold sm:inline-flex"
              aria-label="Próxima foto"
            >
              <ChevronRight className="size-5" strokeWidth={1.4} />
            </button>
          </>
        )}
      </div>

      <div className="min-h-16 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-center text-sm text-paper/70 sm:px-8">
        {foto.legenda ?? foto.alt}
        {total > 1 && <span className="mt-1 block text-xs text-paper/40 sm:hidden">Deslize para ver as outras fotos</span>}
      </div>
    </div>
  );
}
