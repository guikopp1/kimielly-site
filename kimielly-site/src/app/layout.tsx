import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { site } from "@/config/site";
import { enderecoCompleto } from "@/lib/format";
import { URL_SITE } from "@/lib/seo";
import { Cabecalho } from "@/components/layout/Cabecalho";
import { Rodape } from "@/components/layout/Rodape";
import { ChamadaMovel } from "@/components/layout/ChamadaMovel";
import { OcultarNoAdmin } from "@/components/layout/OcultarNoAdmin";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(URL_SITE),
  title: { default: site.seo.titulo, template: `%s · ${site.profissional.nome}` },
  description: site.seo.descricao,
  applicationName: site.profissional.nome,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: site.profissional.nome,
    title: site.seo.titulo,
    description: site.seo.descricao,
  },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#15120f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

function dadosEstruturados() {
  return {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    name: `${site.profissional.nome} — ${site.profissional.assinatura}`,
    description: site.seo.descricao,
    url: URL_SITE,
    telephone: site.contato.whatsapp ? `+${site.contato.whatsapp}` : undefined,
    sameAs: [site.contato.instagram.url],
    address: {
      "@type": "PostalAddress",
      streetAddress: enderecoCompleto() ? site.endereco.logradouro : undefined,
      addressLocality: site.endereco.cidade,
      addressRegion: site.endereco.uf,
      postalCode: site.endereco.cep ?? undefined,
      addressCountry: "BR",
    },
    makesOffer: site.servicos.map((s) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: s.nome } })),
  };
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${cormorant.variable} ${manrope.variable}`} suppressHydrationWarning>
      <head>
        {/* Ativa as animações de entrada apenas quando há JavaScript */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(dadosEstruturados()) }}
        />
      </head>
      <body className="min-h-dvh">
        <OcultarNoAdmin>
          <Cabecalho />
        </OcultarNoAdmin>
        <main id="conteudo" tabIndex={-1} className="outline-none">
          {children}
        </main>
        <OcultarNoAdmin>
          <Rodape />
          <ChamadaMovel />
        </OcultarNoAdmin>
      </body>
    </html>
  );
}
