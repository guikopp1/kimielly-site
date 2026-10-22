import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { site } from "@/config/site";

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("mx-auto w-full max-w-[1200px] px-5 sm:px-8 lg:px-12", className)}>{children}</div>;
}

type Variante = "primario" | "secundario" | "dourado" | "claro" | "texto";

const estilosBotao: Record<Variante, string> = {
  primario: "bg-ink text-paper hover:bg-ink-soft border border-ink",
  secundario: "border border-ink/25 text-ink hover:border-ink hover:bg-ink hover:text-paper",
  dourado: "bg-gold text-ink hover:bg-gold-soft border border-gold",
  claro: "border border-paper/30 text-paper hover:border-gold hover:text-gold-soft",
  texto: "text-ink underline decoration-ink/25 underline-offset-[6px] hover:decoration-bronze",
};

export function classesBotao(variante: Variante = "primario", className?: string, compacto = false) {
  // Tamanho fica fora da base para não conflitar com a variante "texto"
  const tamanho = variante === "texto" ? "" : compacto ? "min-h-11 px-6" : "min-h-12 px-7";
  return cx(
    "group inline-flex items-center justify-center gap-2.5 rounded-full text-[0.82rem] font-semibold tracking-[0.08em] uppercase",
    tamanho,
    "transition-[background-color,color,border-color,transform] duration-300 ease-soft active:scale-[0.98]",
    "disabled:pointer-events-none disabled:opacity-45",
    estilosBotao[variante],
    className,
  );
}

export function BotaoLink({
  variante,
  className,
  compacto,
  ...props
}: ComponentProps<typeof Link> & { variante?: Variante; compacto?: boolean }) {
  return <Link className={classesBotao(variante, className, compacto)} {...props} />;
}

export function BotaoExterno({
  variante,
  className,
  ...props
}: ComponentProps<"a"> & { variante?: Variante }) {
  return <a target="_blank" rel="noopener noreferrer" className={classesBotao(variante, className)} {...props} />;
}

export function Botao({
  variante,
  className,
  compacto,
  ...props
}: ComponentProps<"button"> & { variante?: Variante; compacto?: boolean }) {
  return <button className={classesBotao(variante, className, compacto)} {...props} />;
}

/** Seta que desliza levemente no hover do botão pai (.group). */
export function SetaAnimada() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className="size-4 transition-transform duration-300 ease-soft group-hover:translate-x-0.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M3 10h13M11 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CabecalhoSecao({
  rotulo,
  titulo,
  descricao,
  alinhamento = "esquerda",
  escuro = false,
  as: Tag = "h2",
}: {
  rotulo?: string;
  titulo: ReactNode;
  descricao?: ReactNode;
  alinhamento?: "esquerda" | "centro";
  escuro?: boolean;
  as?: "h1" | "h2";
}) {
  return (
    <div className={cx("max-w-2xl", alinhamento === "centro" && "mx-auto text-center")}>
      {rotulo && <p className={cx("rotulo mb-5", escuro ? "text-gold" : "text-bronze")}>{rotulo}</p>}
      <Tag
        className={cx(
          "titulo-display text-balance",
          Tag === "h1" ? "text-[2.6rem] sm:text-6xl lg:text-[4.2rem]" : "text-[2.1rem] sm:text-5xl",
          escuro ? "text-paper" : "text-ink",
        )}
      >
        {titulo}
      </Tag>
      {descricao && (
        <p className={cx("mt-5 text-base leading-relaxed text-pretty sm:text-[1.05rem]", escuro ? "text-paper/70" : "text-taupe")}>
          {descricao}
        </p>
      )}
    </div>
  );
}

/** Bloco tracejado para conteúdo que a profissional ainda vai enviar. */
export function Pendente({ titulo, children, className }: { titulo: string; children?: ReactNode; className?: string }) {
  if (!site.mostrarPendencias) return null;
  return (
    <div className={cx("pendente rounded-sm p-5 text-sm text-taupe", className)} role="note">
      <p className="rotulo mb-1.5 text-bronze">A preencher · {titulo}</p>
      {children && <div className="leading-relaxed">{children}</div>}
    </div>
  );
}

export function Monograma({ className, tom = "dourado" }: { className?: string; tom?: "dourado" | "tinta" }) {
  const cor = tom === "dourado" ? "var(--color-gold)" : "var(--color-ink)";
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <circle cx="32" cy="32" r="30.5" fill="none" stroke={cor} strokeWidth="1" />
      <circle cx="32" cy="32" r="27.5" fill="none" stroke={cor} strokeWidth="0.5" opacity="0.6" />
      <text
        x="32"
        y="40.5"
        textAnchor="middle"
        fill={cor}
        style={{ fontFamily: "var(--font-display)", fontSize: 25, fontWeight: 500, letterSpacing: "-1px" }}
      >
        KW
      </text>
    </svg>
  );
}

export function IconeInstagram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconeWhatsApp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path
        d="M4.5 19.5l1.1-3.9A8 8 0 1 1 8.6 18.6l-4.1.9z"
        strokeLinejoin="round"
      />
      <path
        d="M9.2 8.6c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.6 1.5c.1.2 0 .4-.1.6l-.4.5c-.1.1-.1.3 0 .5.5.9 1.2 1.6 2.1 2.1.2.1.4.1.5 0l.5-.5c.2-.2.4-.2.6-.1l1.5.7c.2.1.3.3.3.5 0 .9-.7 1.6-1.6 1.6-3.2-.2-5.8-2.8-6-6 0-.5.1-1 .3-1.4z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}
