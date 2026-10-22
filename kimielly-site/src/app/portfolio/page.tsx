import { site } from "@/config/site";
import { categoriasDoPortfolio, itensPortfolio } from "@/lib/content";
import { metadadosDaPagina } from "@/lib/seo";
import { BotaoExterno, Container, IconeInstagram, Pendente } from "@/components/ui/primitives";
import { Galeria } from "@/components/portfolio/Galeria";
import { CabecalhoPagina } from "@/components/sections/CabecalhoPagina";
import { ChamadaInstagram } from "@/components/sections/ChamadaInstagram";
import { ChamadaAgendamento } from "@/components/sections/ChamadaAgendamento";

export const metadata = metadadosDaPagina({
  titulo: "Portfólio",
  descricao: `Trabalhos de maquiagem, sobrancelhas, cílios e estética realizados por ${site.profissional.nome} em ${site.endereco.cidade}/${site.endereco.uf}.`,
  caminho: "/portfolio",
});

export default function Portfolio() {
  const itens = itensPortfolio();
  const categorias = categoriasDoPortfolio(itens);
  const semFotosReais = itens.every((f) => !f.src);

  return (
    <>
      <CabecalhoPagina
        rotulo="Portfólio"
        titulo="Trabalhos realizados"
        descricao="Produções de maquiagem, sobrancelhas, cílios e cuidados com a pele — todas feitas pela Kimiélly."
      />

      <section className="py-14 sm:py-20">
        <Container>
          {semFotosReais && (
            <Pendente titulo="fotos do portfólio" className="mb-10">
              Coloque as fotos originais (com autorização das clientes) em <code>public/images/portfolio/</code> e
              preencha <code>src</code> e <code>autorizada: true</code> em <code>src/config/site.ts → portfolio</code>.
              Os espaços abaixo mostram onde cada trabalho vai aparecer.
            </Pendente>
          )}

          {itens.length > 0 ? (
            <Galeria itens={itens} categorias={categorias} />
          ) : (
            <div className="mx-auto max-w-md py-16 text-center">
              <IconeInstagram className="mx-auto size-8 text-bronze" />
              <p className="mt-5 font-display text-3xl">Novos trabalhos em breve</p>
              <p className="mt-3 text-taupe">Enquanto isso, veja as produções mais recentes no Instagram.</p>
              <BotaoExterno href={site.contato.instagram.url} variante="secundario" className="mt-8">
                Abrir o Instagram
              </BotaoExterno>
            </div>
          )}

          {itens.length > 0 && <ChamadaInstagram className="mt-16" />}
        </Container>
      </section>

      <ChamadaAgendamento />
    </>
  );
}
