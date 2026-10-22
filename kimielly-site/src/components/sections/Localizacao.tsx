import { MapPin } from "lucide-react";
import { site } from "@/config/site";
import { enderecoCompleto, linkComoChegar, linkMapaEmbed, linkWhatsApp } from "@/lib/format";
import { BotaoExterno, CabecalhoSecao, Container, Pendente, SetaAnimada } from "@/components/ui/primitives";
import { Revelar } from "@/components/ui/Revelar";

export function Localizacao() {
  const endereco = enderecoCompleto();
  const whatsapp = linkWhatsApp("Olá, Kimiélly! Pode me passar o endereço do atendimento?");

  return (
    <section aria-labelledby="titulo-localizacao" className="bg-paper py-20 sm:py-28">
      <Container className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
        <Revelar className="lg:col-span-5">
          <CabecalhoSecao
            rotulo="Localização"
            titulo={<span id="titulo-localizacao">Atendimento em {site.endereco.cidade}</span>}
          />
          <div className="mt-8 space-y-4 text-taupe">
            <p className="flex items-start gap-3 text-ink">
              <MapPin className="mt-0.5 size-5 shrink-0 text-bronze" strokeWidth={1.4} aria-hidden />
              <span>
                {endereco ?? `${site.endereco.cidade} · ${site.endereco.uf}`}
                {site.endereco.espaco && <span className="block text-sm text-taupe">{site.endereco.espaco}</span>}
              </span>
            </p>
            {!endereco && (
              <p className="text-sm leading-relaxed">
                O endereço completo é enviado junto com a confirmação do seu horário.
              </p>
            )}
            <Pendente titulo="endereço completo">
              Informe rua, número, bairro e o link do Google Maps em <code>src/config/site.ts → endereco</code>.
            </Pendente>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <BotaoExterno href={linkComoChegar()} variante="primario">
              Como chegar <SetaAnimada />
            </BotaoExterno>
            {!endereco && whatsapp && (
              <BotaoExterno href={whatsapp} variante="secundario">
                Pedir endereço
              </BotaoExterno>
            )}
          </div>
        </Revelar>

        <Revelar atraso={120} className="lg:col-span-7">
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-sand sm:aspect-[16/10]">
            <iframe
              title={`Mapa: ${endereco ?? `${site.endereco.cidade}, ${site.endereco.uf}`}`}
              src={linkMapaEmbed()}
              className="absolute inset-0 size-full grayscale-[35%] sepia-[12%]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </Revelar>
      </Container>
    </section>
  );
}
