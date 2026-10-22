import { site } from "@/config/site";
import { linkWhatsApp } from "@/lib/format";
import { metadadosDaPagina } from "@/lib/seo";
import { Container } from "@/components/ui/primitives";
import { CabecalhoPagina } from "@/components/sections/CabecalhoPagina";

export const metadata = metadadosDaPagina({
  titulo: "Política de privacidade",
  descricao: "Como os dados informados no agendamento online são tratados, conforme a LGPD.",
  caminho: "/privacidade",
});

/**
 * Texto base, alinhado ao funcionamento real do site. Recomenda-se revisão
 * por profissional de direito antes da publicação definitiva.
 */
export default function Privacidade() {
  const whatsapp = linkWhatsApp("Olá! Gostaria de falar sobre os meus dados pessoais.");
  const p = site.profissional;
  return (
    <>
      <CabecalhoPagina rotulo="Transparência" titulo="Política de privacidade" descricao="Última atualização: outubro de 2026." />
      <section className="py-14 sm:py-20">
        <Container className="max-w-[760px]">
          <div className="space-y-10 leading-relaxed text-taupe [&_h2]:mb-3 [&_h2]:font-display [&_h2]:text-[1.7rem] [&_h2]:text-ink [&_strong]:text-ink [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
            <div>
              <h2>Quem cuida dos seus dados</h2>
              <p>
                Este site pertence a <strong>{p.nomeCompleto}</strong> ({p.nome}), profissional de{" "}
                {p.area.toLowerCase()} em {site.endereco.cidade}/{site.endereco.uf}, controladora dos dados pessoais
                tratados aqui, nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).
              </p>
            </div>

            <div>
              <h2>Quais dados coletamos</h2>
              <p>No agendamento online, coletamos somente o necessário:</p>
              <ul className="mt-3">
                <li>nome completo;</li>
                <li>número de celular com WhatsApp;</li>
                <li>serviço, data e horário escolhidos;</li>
                <li>observações que você decidir escrever (opcional);</li>
                <li>
                  registro técnico anonimizado do acesso (resumo criptográfico do endereço IP), usado apenas para
                  evitar abusos e envios automáticos.
                </li>
              </ul>
              <p className="mt-3">
                Não pedimos documentos, dados de pagamento nem informações de saúde pelo site. Se precisar comentar
                algo sensível sobre a sua pele ou saúde, prefira conversar diretamente no atendimento.
              </p>
            </div>

            <div>
              <h2>Para que usamos</h2>
              <ul>
                <li>registrar e organizar a sua solicitação de horário;</li>
                <li>entrar em contato para confirmar, remarcar ou tirar dúvidas sobre o atendimento;</li>
                <li>impedir reservas duplicadas e envios automatizados (spam).</li>
              </ul>
              <p className="mt-3">
                A base legal é a execução de procedimentos preliminares ao serviço solicitado por você (art. 7º, V, da
                LGPD) e o seu consentimento, registrado no momento do envio (art. 7º, I). Seus dados não são vendidos
                nem usados para publicidade.
              </p>
            </div>

            <div>
              <h2>Com quem compartilhamos</h2>
              <p>
                Os dados ficam armazenados em um banco de dados hospedado pela Supabase, e o site é publicado em um
                serviço de hospedagem na nuvem. Esses fornecedores atuam apenas como operadores, para manter o
                agendamento funcionando. Ao usar o botão do WhatsApp, a mensagem é enviada por você, pelo aplicativo
                WhatsApp, sujeito às regras desse serviço.
              </p>
            </div>

            <div>
              <h2>Por quanto tempo guardamos</h2>
              <p>
                As solicitações são mantidas pelo tempo necessário para o atendimento e para a organização da agenda,
                e excluídas ou anonimizadas em até 12 meses após a data do atendimento, salvo obrigação legal.
              </p>
            </div>

            <div>
              <h2>Seus direitos</h2>
              <p>
                Você pode, a qualquer momento, pedir para confirmar, acessar, corrigir ou excluir seus dados, além de
                revogar o consentimento (art. 18 da LGPD). Basta falar com a {p.nome.split(" ")[0]}
                {whatsapp ? (
                  <>
                    {" "}pelo{" "}
                    <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="text-ink underline underline-offset-4">
                      WhatsApp {site.contato.whatsappExibicao}
                    </a>
                  </>
                ) : null}
                .
              </p>
            </div>

            <div>
              <h2>Cookies</h2>
              <p>
                Este site não usa cookies de publicidade nem ferramentas de rastreamento. O mapa incorporado é
                fornecido pelo Google Maps, que pode aplicar suas próprias políticas ao ser exibido.
              </p>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
