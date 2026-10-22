"use client";

import { useState, type FormEvent } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Botao, cx } from "@/components/ui/primitives";
import { dataLocalDeTimestamp, formatarDataLonga, formatarHora, mascararTelefone } from "@/lib/format";
import { consultarStatusSchema, errosPorCampo } from "@/lib/validation/booking";

type Resultado = {
  codigo: string;
  status: "pending" | "confirmed" | "declined" | "cancelled";
  inicio: string;
  servico: string;
  primeiroNome: string;
};

const ROTULOS: Record<Resultado["status"], { texto: string; descricao: string; classe: string }> = {
  pending: {
    texto: "Aguardando confirmação",
    descricao: "Seu horário está reservado. A Kimiélly vai confirmar com você pelo WhatsApp.",
    classe: "bg-gold/20 text-bronze",
  },
  confirmed: { texto: "Confirmado", descricao: "Tudo certo! Esperamos você no horário marcado.", classe: "bg-success/12 text-success" },
  declined: {
    texto: "Não confirmado",
    descricao: "Este horário não pôde ser confirmado. Faça uma nova solicitação ou fale pelo WhatsApp.",
    classe: "bg-danger/10 text-danger",
  },
  cancelled: { texto: "Cancelado", descricao: "Esta solicitação foi cancelada.", classe: "bg-ink/8 text-taupe" },
};

export function ConsultaStatus() {
  const [codigo, setCodigo] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erros, setErros] = useState<Record<string, string>>({});
  const [estado, setEstado] = useState<"ocioso" | "carregando" | "erro">("ocioso");
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  const consultar = async (e: FormEvent) => {
    e.preventDefault();
    setResultado(null);
    setMensagem(null);
    const v = consultarStatusSchema.safeParse({ codigo, telefone });
    if (!v.success) {
      setErros(errosPorCampo(v.error));
      return;
    }
    setErros({});
    setEstado("carregando");
    try {
      const r = await fetch("/api/agendamentos/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(v.data),
      });
      const corpo = await r.json().catch(() => null);
      if (r.ok && corpo?.ok) {
        setResultado(corpo.reserva as Resultado);
        setEstado("ocioso");
      } else {
        setEstado("erro");
        setMensagem(corpo?.mensagem ?? "Não foi possível consultar agora.");
      }
    } catch {
      setEstado("erro");
      setMensagem("Sem conexão no momento. Tente novamente.");
    }
  };

  const campo = (comErro: boolean) =>
    cx(
      "block min-h-13 w-full border bg-paper px-4 transition-colors focus:border-ink focus:outline-none",
      comErro ? "border-danger" : "border-ink/20",
    );

  return (
    <div>
      <form onSubmit={consultar} noValidate className="grid gap-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div>
          <label htmlFor="codigo" className="mb-2 block text-sm font-medium">
            Código da solicitação
          </label>
          <input
            id="codigo"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            placeholder="KW-XXXXXX"
            autoComplete="off"
            autoCapitalize="characters"
            aria-invalid={Boolean(erros.codigo)}
            aria-describedby={erros.codigo ? "erro-codigo" : undefined}
            className={cx(campo(Boolean(erros.codigo)), "font-mono tracking-wider")}
          />
        </div>
        <div>
          <label htmlFor="telefone" className="mb-2 block text-sm font-medium">
            Celular informado
          </label>
          <input
            id="telefone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="(51) 98765-4321"
            value={telefone}
            onChange={(e) => setTelefone(mascararTelefone(e.target.value))}
            aria-invalid={Boolean(erros.telefone)}
            aria-describedby={erros.telefone ? "erro-telefone" : undefined}
            className={campo(Boolean(erros.telefone))}
          />
        </div>
        <Botao type="submit" disabled={estado === "carregando"}>
          {estado === "carregando" ? <Loader2 className="size-4 animate-spin" aria-label="Consultando" /> : "Consultar"}
        </Botao>
        {(erros.codigo || erros.telefone) && (
          <div className="space-y-1 text-sm text-danger sm:col-span-3" role="alert">
            {erros.codigo && <p id="erro-codigo">{erros.codigo}</p>}
            {erros.telefone && <p id="erro-telefone">{erros.telefone}</p>}
          </div>
        )}
      </form>

      <div aria-live="polite" className="mt-10">
        {mensagem && (
          <p className="flex items-start gap-2 border-l-2 border-danger bg-danger/6 px-4 py-3 text-sm" role="alert">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden /> {mensagem}
          </p>
        )}
        {resultado && (
          <div className="animar-surgir border border-ink/12 bg-paper p-7 sm:p-10">
            <span className={cx("inline-flex rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-[0.08em] uppercase", ROTULOS[resultado.status].classe)}>
              {ROTULOS[resultado.status].texto}
            </span>
            <p className="titulo-display mt-5 text-3xl">Olá, {resultado.primeiroNome}!</p>
            <p className="mt-2 text-taupe">{ROTULOS[resultado.status].descricao}</p>
            <dl className="mt-6 grid gap-4 border-t border-ink/10 pt-6 sm:grid-cols-3">
              <div>
                <dt className="text-xs font-semibold tracking-[0.12em] text-taupe uppercase">Serviço</dt>
                <dd className="mt-1">{resultado.servico}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold tracking-[0.12em] text-taupe uppercase">Data</dt>
                <dd className="mt-1">{formatarDataLonga(dataLocalDeTimestamp(resultado.inicio))}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold tracking-[0.12em] text-taupe uppercase">Horário</dt>
                <dd className="mt-1">{formatarHora(resultado.inicio)}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
