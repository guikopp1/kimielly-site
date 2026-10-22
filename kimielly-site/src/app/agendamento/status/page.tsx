import { metadadosDaPagina } from "@/lib/seo";
import { Container } from "@/components/ui/primitives";
import { CabecalhoPagina } from "@/components/sections/CabecalhoPagina";
import { ConsultaStatus } from "@/components/booking/ConsultaStatus";

export const metadata = {
  ...metadadosDaPagina({
    titulo: "Consultar agendamento",
    descricao: "Consulte o status da sua solicitação de agendamento com o código recebido.",
    caminho: "/agendamento/status",
  }),
  robots: { index: false, follow: true },
};

export default function StatusAgendamento() {
  return (
    <>
      <CabecalhoPagina
        rotulo="Agendamento"
        titulo="Consultar solicitação"
        descricao="Informe o código recebido ao concluir o agendamento e o mesmo celular usado na solicitação."
      />
      <section className="py-12 sm:py-16">
        <Container className="max-w-[880px]">
          <ConsultaStatus />
        </Container>
      </section>
    </>
  );
}
