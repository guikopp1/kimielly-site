import type { ReactNode } from "react";
import { CabecalhoSecao, Container } from "@/components/ui/primitives";

export function CabecalhoPagina({
  rotulo,
  titulo,
  descricao,
  children,
}: {
  rotulo: string;
  titulo: ReactNode;
  descricao?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="border-b border-ink/10 pt-14 pb-14 sm:pt-24 sm:pb-20">
      <Container>
        <div className="animar-surgir">
          <CabecalhoSecao as="h1" rotulo={rotulo} titulo={titulo} descricao={descricao} />
        </div>
        {children}
      </Container>
    </section>
  );
}
