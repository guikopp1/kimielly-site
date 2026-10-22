import { site } from "@/config/site";
import { metadadosDaPagina } from "@/lib/seo";
import { BotaoLink, Container, Pendente, SetaAnimada } from "@/components/ui/primitives";
import { Foto } from "@/components/ui/Foto";
import { Revelar } from "@/components/ui/Revelar";
import { CabecalhoPagina } from "@/components/sections/CabecalhoPagina";
import { ChamadaAgendamento } from "@/components/sections/ChamadaAgendamento";

export const metadata = metadadosDaPagina({
  titulo: "Sobre a profissional",
  descricao: `Conheça ${site.profissional.nome}, profissional de ${site.profissional.area.toLowerCase()} em ${site.endereco.cidade}/${site.endereco.uf}.`,
  caminho: "/sobre",
});

/**
 * Princípios de atendimento — derivados do que a profissional publica
 * ("realçando sua beleza natural com amor", "carinho e profissionalismo",
 * "atendimento com horário marcado"). Edite livremente.
 */
const PRINCIPIOS = [
  {
    titulo: "Beleza natural",
    texto: "O objetivo é realçar os seus traços, respeitando o seu estilo e o que faz você se sentir bem.",
  },
  {
    titulo: "Carinho e profissionalismo",
    texto: "Atenção a cada etapa do procedimento, com explicações claras antes e depois do atendimento.",
  },
  {
    titulo: "Horário reservado",
    texto: "Os atendimentos são com horário marcado, para que o seu momento seja tranquilo e sem pressa.",
  },
];

export default function Sobre() {
  const p = site.profissional;
  return (
    <>
      <CabecalhoPagina rotulo="Sobre a profissional" titulo={<>Prazer, eu sou a {p.nome.split(" ")[0]}.</>} />

      <section className="py-16 sm:py-24">
        <Container className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <Revelar className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <Foto
                src={p.foto}
                alt={`Retrato de ${p.nome}`}
                proporcao={4 / 5}
                prioridade
                sizes="(min-width: 1024px) 40vw, 100vw"
                descricaoPendente="Retrato profissional da Kimiélly"
              />
              <p className="mt-4 text-sm text-taupe">
                {p.nomeCompleto} · {p.area}
              </p>
            </div>
          </Revelar>

          <div className="space-y-14 lg:col-span-7">
            <Revelar>
              <p className="font-display text-[1.75rem] leading-snug text-balance sm:text-[2.1rem]">{p.apresentacao}</p>
            </Revelar>

            <Revelar>
              <h2 className="rotulo mb-5 text-bronze">Minha história</h2>
              {p.historia ? (
                <div className="space-y-4 text-lg leading-relaxed text-taupe">
                  {p.historia.split(/\n{2,}/).map((par) => (
                    <p key={par.slice(0, 24)}>{par}</p>
                  ))}
                </div>
              ) : (
                <Pendente titulo="história pessoal">
                  Como começou na estética, o que mais gosta no trabalho e o que deseja que cada cliente sinta.
                  Edite <code>profissional.historia</code> em <code>src/config/site.ts</code>.
                </Pendente>
              )}
            </Revelar>

            <Revelar>
              <h2 className="rotulo mb-5 text-bronze">Formação</h2>
              {p.formacao.length > 0 ? (
                <ul className="divide-y divide-ink/10 border-y border-ink/10">
                  {p.formacao.map((f) => (
                    <li key={f.titulo} className="flex flex-col gap-1 py-4 sm:flex-row sm:justify-between">
                      <span className="font-medium">{f.titulo}</span>
                      <span className="text-sm text-taupe">
                        {f.instituicao}
                        {f.ano && ` · ${f.ano}`}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <Pendente titulo="formação e certificações">
                  Liste apenas cursos e certificações comprováveis (curso, instituição e ano).
                </Pendente>
              )}
            </Revelar>

            <Revelar>
              <h2 className="rotulo mb-6 text-bronze">Como eu atendo</h2>
              <ul className="grid gap-8 sm:grid-cols-3 sm:gap-6">
                {PRINCIPIOS.map((pr) => (
                  <li key={pr.titulo} className="border-t border-ink/15 pt-5">
                    <h3 className="font-display text-2xl">{pr.titulo}</h3>
                    <p className="mt-2 text-[0.95rem] leading-relaxed text-taupe">{pr.texto}</p>
                  </li>
                ))}
              </ul>
            </Revelar>

            <Revelar>
              <h2 className="rotulo mb-5 text-bronze">O espaço</h2>
              {p.fotosEspaco.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {p.fotosEspaco.map((f, i) => (
                    <Foto
                      key={f.src}
                      src={f.src}
                      alt={f.alt}
                      proporcao={i === 0 ? 4 / 5 : 4 / 5}
                      sizes="(min-width: 1024px) 28vw, 50vw"
                    />
                  ))}
                </div>
              ) : (
                <Pendente titulo="fotos do espaço">Duas a quatro fotos do local de atendimento.</Pendente>
              )}
            </Revelar>

            <Revelar className="flex flex-col gap-3 sm:flex-row">
              <BotaoLink href="/servicos" variante="secundario">
                Conhecer os serviços
              </BotaoLink>
              <BotaoLink href="/agendamento" variante="primario">
                Agendar horário <SetaAnimada />
              </BotaoLink>
            </Revelar>
          </div>
        </Container>
      </section>

      <ChamadaAgendamento titulo="Vamos cuidar de você?" />
    </>
  );
}
