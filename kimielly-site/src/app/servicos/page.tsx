import { Clock } from "lucide-react";
import { site } from "@/config/site";
import { servicosPorCategoria } from "@/lib/content";
import { formatarDuracao, formatarPreco, linkWhatsApp } from "@/lib/format";
import { metadadosDaPagina } from "@/lib/seo";
import { BotaoLink, Container, Pendente, SetaAnimada } from "@/components/ui/primitives";
import { Foto } from "@/components/ui/Foto";
import { Revelar } from "@/components/ui/Revelar";
import { CabecalhoPagina } from "@/components/sections/CabecalhoPagina";
import { ChamadaAgendamento } from "@/components/sections/ChamadaAgendamento";

export const metadata = metadadosDaPagina({
  titulo: "Serviços",
  descricao: `Maquiagem, sobrancelhas, cílios, Hidragloss, limpeza de pele, massagens e drenagem em ${site.endereco.cidade}/${site.endereco.uf}. Veja os serviços e agende online.`,
  caminho: "/servicos",
});

export default function Servicos() {
  const grupos = servicosPorCategoria();
  const algumSemPreco = site.servicos.some((s) => s.preco == null);
  const whatsappValores = linkWhatsApp("Olá, Kimiélly! Gostaria de saber os valores dos serviços.");

  return (
    <>
      <CabecalhoPagina
        rotulo="Serviços"
        titulo="Procedimentos pensados para realçar você"
        descricao={
          algumSemPreco ? (
            <>
              Os valores são informados pelo WhatsApp, de acordo com cada procedimento.{" "}
              {whatsappValores && (
                <a href={whatsappValores} target="_blank" rel="noopener noreferrer" className="text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-bronze">
                  Consultar valores
                </a>
              )}
            </>
          ) : undefined
        }
      >
        <nav aria-label="Categorias de serviços" className="mt-10 -mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
          <ul className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
            {grupos.map((g) => (
              <li key={g.id}>
                <a
                  href={`#categoria-${g.id}`}
                  className="inline-flex min-h-10 items-center rounded-full border border-ink/15 px-4 text-sm whitespace-nowrap transition-colors hover:border-ink hover:bg-ink hover:text-paper"
                >
                  {g.nome}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </CabecalhoPagina>

      <div className="py-8 sm:py-12">
        {grupos.map((g) => (
          <section key={g.id} id={`categoria-${g.id}`} aria-labelledby={`titulo-${g.id}`} className="scroll-mt-28 py-10 sm:py-14">
            <Container>
              <Revelar>
                <h2 id={`titulo-${g.id}`} className="rotulo border-b border-ink/12 pb-4 text-bronze">
                  {g.nome}
                </h2>
              </Revelar>
              <ul className="divide-y divide-ink/12">
                {g.servicos.map((s) => (
                  <Revelar as="li" key={s.id}>
                    <article id={s.id} className="grid scroll-mt-28 gap-6 py-10 sm:grid-cols-[minmax(0,15rem)_1fr] sm:gap-10 lg:grid-cols-[18rem_1fr_auto]">
                      <Foto
                        src={s.foto}
                        alt={`${s.nome} — ${site.profissional.nome}`}
                        proporcao={4 / 5}
                        sizes="(min-width: 640px) 18rem, 100vw"
                        descricaoPendente={`Foto real de ${s.nome.toLowerCase()}`}
                        className="max-w-[18rem]"
                      />
                      <div className="flex flex-col">
                        <h3 className="titulo-display text-[2rem] sm:text-[2.4rem]">{s.nome}</h3>
                        <p className="mt-3 max-w-lg leading-relaxed text-taupe">{s.descricao}</p>
                        <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm">
                          <div>
                            <dt className="sr-only">Valor</dt>
                            <dd className="font-semibold">{formatarPreco(s.preco, s.precoPrefixo)}</dd>
                          </div>
                          {s.duracaoConfirmada && (
                            <div className="flex items-center gap-1.5 text-taupe">
                              <dt className="sr-only">Duração estimada</dt>
                              <Clock className="size-4" strokeWidth={1.4} aria-hidden />
                              <dd>{formatarDuracao(s.duracaoMinutos)}</dd>
                            </div>
                          )}
                        </dl>
                        <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:hidden">
                          {s.agendavel && (
                            <BotaoLink href={`/agendamento?servico=${s.id}`} variante="primario">
                              Agendar este serviço <SetaAnimada />
                            </BotaoLink>
                          )}
                        </div>
                      </div>
                      <div className="hidden lg:block">
                        {s.agendavel && (
                          <BotaoLink href={`/agendamento?servico=${s.id}`} variante="secundario" aria-label={`Agendar ${s.nome}`}>
                            Agendar este serviço <SetaAnimada />
                          </BotaoLink>
                        )}
                      </div>
                    </article>
                  </Revelar>
                ))}
              </ul>
            </Container>
          </section>
        ))}

        <Container>
          <Pendente titulo="preços e durações" className="mt-4">
            Quando a profissional confirmar, preencha <code>preco</code> e <code>duracaoMinutos</code> (com{" "}
            <code>duracaoConfirmada: true</code>) em <code>src/config/site.ts</code> e rode{" "}
            <code>npm run sync:services</code>.
          </Pendente>
        </Container>
      </div>

      <ChamadaAgendamento />
    </>
  );
}
