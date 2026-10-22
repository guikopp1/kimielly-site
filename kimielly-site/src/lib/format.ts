import { site } from "@/config/site";

export const TIMEZONE = "America/Sao_Paulo";

/** Data de hoje no fuso de Vera Cruz/RS, formato YYYY-MM-DD. */
export function hojeISO(agora: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(agora);
}

/** "2026-10-22" → Date ao meio-dia UTC (evita trocas de dia por fuso). */
export function dataDeISO(iso: string): Date {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d, 12));
}

export function isoDeData(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function formatarDataLonga(isoData: string): string {
  const texto = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(dataDeISO(isoData));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function formatarDataCurta(isoData: string): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric" }).format(
    dataDeISO(isoData),
  );
}

/** Horário (HH:mm) de um timestamp ISO, no fuso local da profissional. */
export function formatarHora(isoTimestamp: string): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: TIMEZONE, hour: "2-digit", minute: "2-digit" }).format(
    new Date(isoTimestamp),
  );
}

/** Data (YYYY-MM-DD) de um timestamp ISO, no fuso local da profissional. */
export function dataLocalDeTimestamp(isoTimestamp: string): string {
  return hojeISO(new Date(isoTimestamp));
}

export function formatarPreco(valor: number | null, prefixo?: string): string {
  if (valor == null) return "Consulte valores";
  const reais = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
  return prefixo ? `${prefixo} ${reais}` : reais;
}

export function formatarDuracao(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const r = min % 60;
  return r ? `${h}h${String(r).padStart(2, "0")}` : `${h}h`;
}

/** Link wa.me com mensagem preenchida. O envio sempre depende da cliente. */
export function linkWhatsApp(mensagem?: string): string | null {
  const numero = site.contato.whatsapp?.replace(/\D/g, "");
  if (!numero) return null;
  const base = `https://wa.me/${numero}`;
  return mensagem ? `${base}?text=${encodeURIComponent(mensagem)}` : base;
}

export function enderecoCompleto(): string | null {
  const e = site.endereco;
  if (!e.logradouro) return null;
  return [e.logradouro, e.bairro, `${e.cidade} - ${e.uf}`, e.cep].filter(Boolean).join(", ");
}

/** Consulta usada no mapa: endereço completo quando houver, senão apenas a cidade. */
export function consultaMapa(): string {
  return enderecoCompleto() ?? `${site.endereco.cidade}, ${site.endereco.uf}, Brasil`;
}

export function linkComoChegar(): string {
  if (site.endereco.linkMapa) return site.endereco.linkMapa;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(consultaMapa())}`;
}

export function linkMapaEmbed(): string {
  return `https://maps.google.com/maps?q=${encodeURIComponent(consultaMapa())}&z=${
    enderecoCompleto() ? 16 : 13
  }&output=embed`;
}

/** Máscara simples de telefone brasileiro: (51) 98765-4321 */
export function mascararTelefone(valor: string): string {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
