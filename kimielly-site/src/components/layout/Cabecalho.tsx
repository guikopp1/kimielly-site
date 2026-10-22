"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { site } from "@/config/site";
import { NAVEGACAO } from "@/config/navegacao";
import { BotaoLink, Container, Monograma, cx } from "@/components/ui/primitives";


export function Cabecalho() {
  const pathname = usePathname();
  const escuro = pathname === "/";
  const [aberto, setAberto] = useState(false);
  const [rolou, setRolou] = useState(false);
  const botaoMenu = useRef<HTMLButtonElement>(null);

  useEffect(() => setAberto(false), [pathname]);

  useEffect(() => {
    const aoRolar = () => setRolou(window.scrollY > 12);
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  useEffect(() => {
    if (!aberto) return;
    document.body.style.overflow = "hidden";
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAberto(false);
        botaoMenu.current?.focus();
      }
    };
    window.addEventListener("keydown", aoTeclar);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto]);

  const ativo = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header
      className={cx(
        "sticky top-0 z-40 transition-[background-color,box-shadow,border-color] duration-500",
        escuro ? "tema-escuro bg-ink text-paper" : "bg-linen/90 text-ink backdrop-blur-md",
        rolou && !escuro && "border-b border-ink/8",
        rolou && escuro && "border-b border-paper/8",
        !rolou && "border-b border-transparent",
      )}
    >
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-paper focus:px-4 focus:py-2 focus:text-ink"
      >
        Pular para o conteúdo
      </a>
      <Container className="flex h-[72px] items-center justify-between gap-6 lg:h-20">
        <Link href="/" className="flex items-center gap-3" aria-label={`${site.profissional.nome} — página inicial`}>
          {site.profissional.logo ? (
            <Image src={site.profissional.logo} alt="" width={40} height={40} className="size-10 shrink-0 rounded-full object-cover" priority />
          ) : (
            <Monograma className="size-10 shrink-0" tom={escuro ? "dourado" : "tinta"} />
          )}
          <span className="flex flex-col leading-none">
            <span className="titulo-display text-[1.35rem]">{site.profissional.nome}</span>
            <span className={cx("rotulo mt-1 text-[0.6rem]", escuro ? "text-gold" : "text-bronze")}>
              {site.profissional.assinatura}
            </span>
          </span>
        </Link>

        <nav aria-label="Principal" className="hidden lg:block">
          <ul className="flex items-center gap-9">
            {NAVEGACAO.slice(0, 4).map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={ativo(item.href) ? "page" : undefined}
                  className={cx(
                    "relative py-2 text-[0.84rem] tracking-[0.04em] transition-colors",
                    "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:transition-transform after:duration-500 after:ease-soft hover:after:scale-x-100",
                    escuro ? "after:bg-gold hover:text-gold-soft" : "after:bg-bronze hover:text-bronze",
                    ativo(item.href) && "after:scale-x-100",
                  )}
                >
                  {item.rotulo}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden sm:block">
            <BotaoLink href="/agendamento" variante={escuro ? "dourado" : "primario"} compacto>
              Agendar horário
            </BotaoLink>
          </span>
          <button
            ref={botaoMenu}
            type="button"
            className="-mr-2 inline-flex size-11 items-center justify-center lg:hidden"
            aria-expanded={aberto}
            aria-controls="menu-movel"
            aria-label={aberto ? "Fechar menu" : "Abrir menu"}
            onClick={() => setAberto((v) => !v)}
          >
            {aberto ? <X className="size-6" strokeWidth={1.4} /> : <Menu className="size-6" strokeWidth={1.4} />}
          </button>
        </div>
      </Container>

      {/* Menu móvel */}
      <div
        id="menu-movel"
        hidden={!aberto}
        className={cx("fixed inset-x-0 top-[72px] bottom-0 z-40 lg:hidden", escuro ? "bg-ink" : "bg-linen")}
      >
        <nav aria-label="Menu móvel" className="animar-esmaecer flex h-full flex-col">
          <Container className="flex flex-1 flex-col pt-6 pb-[max(2rem,env(safe-area-inset-bottom))]">
            <ul className={cx("divide-y", escuro ? "divide-paper/10" : "divide-ink/10")}>
              {NAVEGACAO.map((item, i) => (
                <li key={item.href} className="animar-surgir" style={{ animationDelay: `${i * 45}ms` }}>
                  <Link
                    href={item.href}
                    aria-current={ativo(item.href) ? "page" : undefined}
                    className="flex items-baseline justify-between py-4"
                  >
                    <span className="titulo-display text-[2rem]">{item.rotulo}</span>
                    <span className={cx("text-xs tabular-nums", escuro ? "text-gold" : "text-bronze")}>
                      0{i + 1}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-8">
              <BotaoLink href="/agendamento" variante={escuro ? "dourado" : "primario"} className="w-full">
                Agendar horário
              </BotaoLink>
              <p className={cx("mt-4 text-center text-sm", escuro ? "text-paper/60" : "text-taupe")}>
                {site.endereco.cidade} · {site.endereco.uf} — {site.atendimento.resumo.toLowerCase()}
              </p>
            </div>
          </Container>
        </nav>
      </div>
    </header>
  );
}
