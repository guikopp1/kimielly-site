import { site } from "@/config/site";
import { IconeInstagram, cx } from "@/components/ui/primitives";

/** Chamada discreta para acompanhar os trabalhos no Instagram (link oficial). */
export function ChamadaInstagram({ className }: { className?: string }) {
  return (
    <a
      href={site.contato.instagram.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cx(
        "group flex flex-col gap-4 border-y border-ink/12 py-7 transition-colors sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <span className="flex items-center gap-4">
        <IconeInstagram className="size-7 shrink-0 text-bronze" />
        <span>
          <span className="block font-display text-2xl leading-tight">Acompanhe os trabalhos mais recentes</span>
          <span className="text-sm text-taupe">Novas produções e bastidores no Instagram</span>
        </span>
      </span>
      <span className="text-sm font-semibold tracking-[0.04em] break-all text-ink underline decoration-ink/25 underline-offset-[6px] transition-colors group-hover:decoration-bronze">
        @{site.contato.instagram.usuario}
      </span>
    </a>
  );
}
