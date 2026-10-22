import { BotaoLink, Container } from "@/components/ui/primitives";

export default function NaoEncontrada() {
  return (
    <section className="py-28 sm:py-40">
      <Container className="max-w-xl text-center">
        <p className="rotulo text-bronze">Erro 404</p>
        <h1 className="titulo-display mt-5 text-5xl sm:text-6xl">Página não encontrada</h1>
        <p className="mt-5 text-taupe">O endereço pode ter mudado. Que tal voltar ao início ou ver os serviços?</p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <BotaoLink href="/" variante="primario">Voltar ao início</BotaoLink>
          <BotaoLink href="/servicos" variante="secundario">Ver serviços</BotaoLink>
        </div>
      </Container>
    </section>
  );
}
