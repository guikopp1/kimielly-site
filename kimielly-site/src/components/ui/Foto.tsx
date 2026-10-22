import Image from "next/image";
import { site } from "@/config/site";
import { Monograma, cx } from "./primitives";

/**
 * Moldura de fotografia com proporção fixa (nunca distorce a imagem).
 * Sem `src`: mostra um espaço reservado identificado ("Foto a adicionar")
 * ou, quando as pendências estão ocultas, um painel discreto com o monograma.
 * Nunca usa banco de imagens ou imagem gerada no lugar de um trabalho real.
 */
export function Foto({
  src,
  alt,
  proporcao = 4 / 5,
  sizes = "(min-width: 1024px) 33vw, 100vw",
  prioridade = false,
  descricaoPendente,
  escuro = false,
  className,
  imagemClassName,
}: {
  src: string | null | undefined;
  alt: string;
  proporcao?: number;
  sizes?: string;
  prioridade?: boolean;
  descricaoPendente?: string;
  escuro?: boolean;
  className?: string;
  imagemClassName?: string;
}) {
  return (
    <div
      className={cx("relative w-full overflow-hidden", escuro ? "bg-ink-soft" : "bg-sand/60", className)}
      style={{ aspectRatio: String(proporcao) }}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={prioridade}
          loading={prioridade ? undefined : "lazy"}
          className={cx("object-cover", imagemClassName)}
        />
      ) : site.mostrarPendencias ? (
        <div
          className={cx(
            "absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center",
            escuro ? "border border-dashed border-gold/35 text-paper/60" : "pendente text-taupe",
          )}
          role="img"
          aria-label={`Espaço reservado: ${alt}`}
        >
          <Monograma className="size-10 opacity-70" tom={escuro ? "dourado" : "tinta"} />
          <span className={cx("rotulo", escuro ? "text-gold" : "text-bronze")}>Foto a adicionar</span>
          {descricaoPendente && <span className="max-w-[22ch] text-xs leading-relaxed">{descricaoPendente}</span>}
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
          <Monograma className="size-16 opacity-40" tom={escuro ? "dourado" : "tinta"} />
        </div>
      )}
    </div>
  );
}
