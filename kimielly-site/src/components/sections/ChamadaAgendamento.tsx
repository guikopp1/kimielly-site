import { site } from "@/config/site";
import { linkWhatsApp } from "@/lib/format";
import { BotaoExterno, BotaoLink, Container, IconeWhatsApp, Monograma, SetaAnimada } from "@/components/ui/primitives";
import { Revelar } from "@/components/ui/Revelar";

export function ChamadaAgendamento({ titulo = "Reserve o seu momento." }: { titulo?: string }) {
  const whatsapp = linkWhatsApp("Olá, Kimiélly! Gostaria de agendar um horário.");
  return (
    <section className="tema-escuro relative overflow-hidden bg-ink py-24 text-paper sm:py-32">
      <Monograma className="pointer-events-none absolute -right-24 -bottom-24 size-[420px] opacity-[0.07]" />
      <Container>
        <Revelar className="max-w-2xl">
          <p className="rotulo mb-6 text-gold">{site.atendimento.resumo}</p>
          <h2 className="titulo-display text-[2.4rem] text-balance sm:text-6xl">{titulo}</h2>
          <p className="mt-6 max-w-lg text-paper/70">
            Escolha o serviço, veja os horários livres e envie sua solicitação em poucos passos.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <BotaoLink href="/agendamento" variante="dourado">
              Agendar horário <SetaAnimada />
            </BotaoLink>
            {whatsapp && (
              <BotaoExterno href={whatsapp} variante="claro">
                <IconeWhatsApp className="size-4" /> Falar no WhatsApp
              </BotaoExterno>
            )}
          </div>
        </Revelar>
      </Container>
    </section>
  );
}
