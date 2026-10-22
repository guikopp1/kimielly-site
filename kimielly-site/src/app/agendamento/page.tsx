import Link from "next/link";
import { site } from "@/config/site";
import { servicosAgendaveis } from "@/lib/content";
import { formatarDuracao, formatarPreco, linkWhatsApp } from "@/lib/format";
import { metadadosDaPagina } from "@/lib/seo";
import { supabaseConfigurado } from "@/lib/supabase/server";
import { BotaoExterno, Container, IconeWhatsApp } from "@/components/ui/primitives";
import { CabecalhoPagina } from "@/components/sections/CabecalhoPagina";
import { AssistenteAgendamento, type ServicoAgenda } from "@/components/booking/AssistenteAgendamento";

export const dynamic = "force-dynamic";

export const metadata = metadadosDaPagina({
  titulo: "Agendamento online",
  descricao: `Escolha o serviço, a data e um horário livre para agendar com ${site.profissional.nome} em ${site.endereco.cidade}/${site.endereco.uf}.`,
  caminho: "/agendamento",
});

export default async function Agendamento({ searchParams }: { searchParams: Promise<{ servico?: string }> }) {
  const { servico } = await searchParams;
  const configurado = supabaseConfigurado();
  const whatsapp = linkWhatsApp("Olá, Kimiélly! Gostaria de agendar um horário.");

  const servicos: ServicoAgenda[] = servicosAgendaveis().map((s) => ({
    id: s.id,
    nome: s.nome,
    categoria: site.categorias[s.categoria],
    preco: formatarPreco(s.preco, s.precoPrefixo),
    duracao: s.duracaoConfirmada ? formatarDuracao(s.duracaoMinutos) : null,
  }));

  return (
    <>
      <CabecalhoPagina
        rotulo="Agendamento online"
        titulo="Reserve o seu horário"
        descricao={
          site.atendimento.exigeConfirmacao
            ? "Escolha o serviço e um horário livre. Sua solicitação fica reservada até a Kimiélly confirmar com você."
            : "Escolha o serviço e um horário livre — a confirmação é imediata."
        }
      />

      <section className="py-12 sm:py-16">
        <Container className="max-w-[880px]">
          {configurado ? (
            <AssistenteAgendamento
              servicos={servicos}
              servicoInicial={servicos.some((s) => s.id === servico) ? servico : undefined}
              exigeConfirmacao={site.atendimento.exigeConfirmacao}
              whatsappNumero={site.contato.whatsapp}
              nomeProfissional={site.profissional.nome}
            />
          ) : (
            <div role="status" className="border border-ink/12 bg-paper p-8 sm:p-12">
              <p className="rotulo text-bronze">Agenda online em configuração</p>
              <h2 className="titulo-display mt-4 text-3xl sm:text-4xl">Por enquanto, agende pelo WhatsApp</h2>
              <p className="mt-4 max-w-lg leading-relaxed text-taupe">
                O agendamento pelo site ainda não está conectado ao banco de horários. Nenhuma reserva é registrada
                aqui até que isso seja feito — fale diretamente com a Kimiélly para marcar.
              </p>
              {whatsapp && (
                <BotaoExterno href={whatsapp} variante="primario" className="mt-8">
                  <IconeWhatsApp className="size-4" /> Agendar pelo WhatsApp
                </BotaoExterno>
              )}
            </div>
          )}

          <p className="mt-10 text-center text-sm text-taupe">
            Já fez uma solicitação?{" "}
            <Link href="/agendamento/status" className="text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-bronze">
              Consultar status
            </Link>
          </p>
        </Container>
      </section>
    </>
  );
}
