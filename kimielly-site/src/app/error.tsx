"use client";

import { useEffect } from "react";
import { Botao, BotaoLink, Container } from "@/components/ui/primitives";

export default function Erro({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="py-28 sm:py-40">
      <Container className="max-w-xl text-center">
        <p className="rotulo text-bronze">Algo deu errado</p>
        <h1 className="titulo-display mt-5 text-5xl">Não foi possível carregar esta página</h1>
        <p className="mt-5 text-taupe">Tente novamente em alguns instantes.</p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Botao type="button" onClick={reset}>Tentar novamente</Botao>
          <BotaoLink href="/" variante="secundario">Voltar ao início</BotaoLink>
        </div>
      </Container>
    </section>
  );
}
