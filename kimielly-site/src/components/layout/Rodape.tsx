import Link from "next/link";
import { site } from "@/config/site";
import { enderecoCompleto, linkComoChegar, linkWhatsApp } from "@/lib/format";
import { Container, IconeInstagram, IconeWhatsApp, Monograma } from "@/components/ui/primitives";
import { NAVEGACAO } from "@/config/navegacao";

export function Rodape() {
  const whatsapp = linkWhatsApp("Olá, Kimiélly! Vim pelo site e gostaria de mais informações.");
  const endereco = enderecoCompleto();

  return (
    <footer className="tema-escuro bg-ink text-paper/80">
      <Container className="grid gap-12 py-16 sm:py-20 md:grid-cols-12">
        <div className="md:col-span-4">
          <div className="flex items-center gap-4">
            <Monograma className="size-14" />
            <div>
              <p className="titulo-display text-[1.7rem] text-paper">{site.profissional.nome}</p>
              <p className="rotulo mt-1 text-[0.62rem] text-gold">{site.profissional.assinatura}</p>
            </div>
          </div>
          <p className="mt-6 max-w-sm font-display text-xl italic leading-snug text-paper/70">
            {site.profissional.frase}
          </p>
        </div>

        <nav aria-label="Rodapé" className="md:col-span-2">
          <p className="rotulo mb-4 text-gold">Páginas</p>
          <ul className="space-y-2.5 text-sm">
            {NAVEGACAO.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition-colors hover:text-gold-soft">
                  {item.rotulo}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/agendamento/status" className="transition-colors hover:text-gold-soft">
                Consultar agendamento
              </Link>
            </li>
          </ul>
        </nav>

        <div className="md:col-span-3">
          <p className="rotulo mb-4 text-gold">Atendimento</p>
          <address className="space-y-2.5 text-sm not-italic">
            {endereco ? <p>{endereco}</p> : <p>{site.endereco.cidade} · {site.endereco.uf}</p>}
            <p>{site.atendimento.resumo}</p>
            {site.atendimento.horarios.map((h) => (
              <p key={h.dias}>
                <span className="text-paper">{h.dias}</span> · {h.horas}
              </p>
            ))}
            <p>
              <a href={linkComoChegar()} target="_blank" rel="noopener noreferrer" className="underline decoration-paper/25 underline-offset-4 hover:text-gold-soft">
                Como chegar
              </a>
            </p>
          </address>
        </div>

        <div className="md:col-span-3">
          <p className="rotulo mb-4 text-gold">Contato</p>
          <ul className="space-y-3 text-sm">
            {whatsapp && (
              <li>
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-gold-soft">
                  <IconeWhatsApp className="size-4" /> {site.contato.whatsappExibicao}
                </a>
              </li>
            )}
            <li>
              <a href={site.contato.instagram.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 [overflow-wrap:anywhere] hover:text-gold-soft">
                <IconeInstagram className="size-4 shrink-0" /> @{site.contato.instagram.usuario}
              </a>
            </li>
            {site.contato.email && (
              <li>
                <a href={`mailto:${site.contato.email}`} className="hover:text-gold-soft">
                  {site.contato.email}
                </a>
              </li>
            )}
          </ul>
        </div>
      </Container>
      <div className="border-t border-paper/10">
        <Container className="flex flex-col gap-2 py-6 text-xs text-paper/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {site.profissional.nome}. Todos os direitos reservados.</p>
          <Link href="/privacidade" className="hover:text-gold-soft">
            Política de privacidade
          </Link>
        </Container>
      </div>
    </footer>
  );
}
