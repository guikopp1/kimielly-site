import Link from "next/link";
import { site } from "@/config/site";
import { fotosPublicadas, itensPortfolio, servicosEmDestaque } from "@/lib/content";
import { formatarPreco } from "@/lib/format";
import { metadadosDaPagina } from "@/lib/seo";
import { BotaoLink, CabecalhoSecao, Container, SetaAnimada } from "@/components/ui/primitives";
import { Foto } from "@/components/ui/Foto";
import { Revelar } from "@/components/ui/Revelar";
import { Localizacao } from "@/components/sections/Localizacao";
import { ChamadaAgendamento } from "@/components/sections/ChamadaAgendamento";
import { ChamadaInstagram } from "@/components/sections/ChamadaInstagram";

export const metadata = metadadosDaPagina({
  titulo: site.seo.titulo,
  descricao: site.seo.descricao,
  caminho: "/",
});

export default function Inicio() {
  const destaques = servicosEmDestaque();
  const fotoHero = site.profissional.foto ?? fotosPublicadas()[0]?.src ?? null;
  const vitrine = itensPortfolio().slice(0, 4);

  return (
    <>
      {/* HERO */}
      <section className="tema-escuro relative bg-ink text-paper">
        <Container className="grid items-end gap-12 pt-10 pb-16 sm:pt-16 lg:grid-cols-12 lg:gap-10 lg:pt-20 lg:pb-24">
          <div className="lg:col-span-7 lg:pb-10">
            <p className="rotulo animar-surgir text-gold">
              Estética · Cosmetologia · Maquiagem
            </p>
            <h1
              className="titulo-display animar-surgir mt-7 text-[2.9rem] text-balance sm:text-7xl lg:text-[5.4rem]"
              style={{ animationDelay: "80ms" }}
            >
              Beleza natural, realçada com <em className="font-normal text-gold-soft">cuidado</em> em cada detalhe.
            </h1>
            <p
              className="animar-surgir mt-8 max-w-md text-[1.05rem] leading-relaxed text-paper/70"
              style={{ animationDelay: "160ms" }}
            >
              {site.profissional.apresentacao}
            </p>
            <div className="animar-surgir mt-10 flex flex-col gap-3 sm:flex-row sm:items-center" style={{ animationDelay: "240ms" }}>
              <BotaoLink href="/agendamento" variante="dourado">
                Agendar horário <SetaAnimada />
              </BotaoLink>
              <BotaoLink href="/servicos" variante="claro">
                Conhecer os serviços
              </BotaoLink>
            </div>
          </div>

          <div className="animar-esmaecer relative lg:col-span-5" style={{ animationDelay: "200ms" }}>
            <div className="relative ml-auto max-w-md">
              <div className="absolute -inset-2 border border-gold/30 sm:-inset-4" aria-hidden />
              <Foto
                src={fotoHero}
                alt={`${site.profissional.nome}, ${site.profissional.area.toLowerCase()}`}
                proporcao={4 / 5}
                prioridade
                escuro
                sizes="(min-width: 1024px) 40vw, 90vw"
                descricaoPendente="Retrato profissional ou trabalho de destaque"
              />
            </div>
          </div>
        </Container>

        <div className="border-t border-paper/10">
          <Container className="flex flex-col gap-2 py-5 text-[0.8rem] tracking-[0.06em] text-paper/60 sm:flex-row sm:items-center sm:justify-between">
            <span>
              {site.endereco.cidade} · {site.endereco.uf}
            </span>
            <span>{site.atendimento.resumo}</span>
            <a href={site.contato.instagram.url} target="_blank" rel="noopener noreferrer" className="hover:text-gold-soft">
              @{site.contato.instagram.usuario}
            </a>
          </Container>
        </div>
      </section>

      {/* APRESENTAÇÃO */}
      <section aria-labelledby="titulo-sobre" className="py-20 sm:py-32">
        <Container className="grid gap-10 lg:grid-cols-12">
          <Revelar className="lg:col-span-4">
            <p className="rotulo text-bronze">Sobre</p>
          </Revelar>
          <Revelar atraso={80} className="lg:col-span-8">
            <h2 id="titulo-sobre" className="titulo-display text-[2.2rem] text-balance sm:text-[3.4rem]">
              “{site.profissional.frase.replace(/\.$/, "")}.”
            </h2>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-taupe">
              Cada atendimento acontece com horário reservado, para que o seu momento seja tranquilo e o resultado
              combine com você — do dia a dia às ocasiões especiais.
            </p>
            <Link
              href="/sobre"
              className="group mt-8 inline-flex items-center gap-2 text-sm font-semibold tracking-[0.06em] uppercase underline decoration-ink/25 underline-offset-[6px] hover:decoration-bronze"
            >
              Conhecer a {site.profissional.nome.split(" ")[0]} <SetaAnimada />
            </Link>
          </Revelar>
        </Container>
      </section>

      {/* SERVIÇOS EM DESTAQUE — índice editorial */}
      <section aria-labelledby="titulo-servicos" className="bg-paper py-20 sm:py-28">
        <Container>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <Revelar>
              <CabecalhoSecao rotulo="Serviços" titulo={<span id="titulo-servicos">Cuidados para você</span>} />
            </Revelar>
            <Revelar atraso={80}>
              <BotaoLink href="/servicos" variante="texto">
                Todos os serviços <SetaAnimada />
              </BotaoLink>
            </Revelar>
          </div>

          <ol className="mt-14 border-t border-ink/12">
            {destaques.map((s, i) => (
              <Revelar as="li" key={s.id} atraso={i * 60} className="border-b border-ink/12">
                <Link
                  href={`/servicos#${s.id}`}
                  className="group grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-x-4 py-7 sm:grid-cols-[4rem_1.1fr_1.4fr_auto] sm:py-9"
                >
                  <span className="text-sm tabular-nums text-bronze">{String(i + 1).padStart(2, "0")}</span>
                  <span className="titulo-display text-[1.75rem] transition-colors duration-300 group-hover:text-bronze sm:text-4xl">
                    {s.nome}
                  </span>
                  <span className="col-start-2 mt-2 text-sm leading-relaxed text-taupe sm:col-start-auto sm:mt-0 sm:max-w-md">
                    {s.descricao}
                  </span>
                  <span className="row-start-1 col-start-3 flex items-center gap-3 text-xs tracking-[0.08em] text-taupe uppercase sm:row-auto sm:col-auto">
                    <span className="hidden md:inline">{formatarPreco(s.preco, s.precoPrefixo)}</span>
                    <span className="inline-flex size-9 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors duration-300 group-hover:border-ink group-hover:bg-ink group-hover:text-paper">
                      <SetaAnimada />
                    </span>
                  </span>
                </Link>
              </Revelar>
            ))}
          </ol>
        </Container>
      </section>

      {/* PORTFÓLIO */}
      {vitrine.length > 0 && (
        <section aria-labelledby="titulo-portfolio" className="py-20 sm:py-28">
          <Container>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <Revelar>
                <CabecalhoSecao rotulo="Portfólio" titulo={<span id="titulo-portfolio">Trabalhos recentes</span>} />
              </Revelar>
              <Revelar atraso={80}>
                <BotaoLink href="/portfolio" variante="texto">
                  Ver portfólio completo <SetaAnimada />
                </BotaoLink>
              </Revelar>
            </div>
            <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {vitrine.map((f, i) => (
                <Revelar key={`${f.alt}-${i}`} atraso={i * 70} className={i % 2 === 1 ? "lg:mt-16" : undefined}>
                  <Link href="/portfolio" className="group block overflow-hidden" aria-label={`Ver no portfólio: ${f.alt}`}>
                    <Foto
                      src={f.src}
                      alt={f.alt}
                      proporcao={f.proporcao ?? 4 / 5}
                      sizes="(min-width: 1024px) 25vw, 50vw"
                      descricaoPendente={f.legenda ?? f.alt}
                      imagemClassName="transition-transform duration-[1.2s] ease-soft group-hover:scale-[1.03]"
                    />
                  </Link>
                  {f.legenda && <p className="mt-3 text-sm text-taupe">{f.legenda}</p>}
                </Revelar>
              ))}
            </div>
            <ChamadaInstagram className="mt-16" />
          </Container>
        </section>
      )}

      {/* COMO FUNCIONA — descreve o processo real do site, sem promessas */}
      <section aria-labelledby="titulo-como" className="border-t border-ink/10 py-20 sm:py-28">
        <Container>
          <Revelar>
            <CabecalhoSecao
              rotulo="Agendamento online"
              titulo={<span id="titulo-como">Seu horário em três passos</span>}
            />
          </Revelar>
          <ol className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-8">
            {[
              ["Escolha o serviço", "Veja os procedimentos disponíveis e selecione o que deseja."],
              ["Escolha data e horário", "O calendário mostra apenas os horários realmente livres."],
              [
                site.atendimento.exigeConfirmacao ? "Receba a confirmação" : "Pronto",
                site.atendimento.exigeConfirmacao
                  ? "Sua solicitação fica reservada e a Kimiélly confirma com você pelo WhatsApp."
                  : "Seu horário fica reservado na hora, com todos os detalhes.",
              ],
            ].map(([t, d], i) => (
              <Revelar as="li" key={t} atraso={i * 90} className="border-t border-ink/15 pt-6">
                <span className="font-display text-5xl text-bronze/70">{i + 1}</span>
                <h3 className="mt-4 text-lg font-semibold">{t}</h3>
                <p className="mt-2 leading-relaxed text-taupe">{d}</p>
              </Revelar>
            ))}
          </ol>
        </Container>
      </section>

      <Localizacao />
      <ChamadaAgendamento />
    </>
  );
}
