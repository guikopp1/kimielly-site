"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Check, Loader2, LogOut, RefreshCw, Search, X } from "lucide-react";
import { Botao, IconeWhatsApp, Monograma, cx } from "@/components/ui/primitives";
import { dataLocalDeTimestamp, formatarDataLonga, formatarHora, hojeISO, isoDeData, dataDeISO, mascararTelefone } from "@/lib/format";

type Status = "pending" | "confirmed" | "declined" | "cancelled";

export type Agendamento = {
  id: string;
  codigo: string;
  servico: string;
  cliente: string;
  telefone: string;
  observacoes: string | null;
  inicio: string;
  fim: string;
  status: Status;
  criadoEm: string;
};

type Aba = "aguardando" | "proximos" | "historico";

const STATUS: Record<Status, { rotulo: string; classe: string }> = {
  pending: { rotulo: "Aguardando", classe: "bg-gold/20 text-bronze" },
  confirmed: { rotulo: "Confirmado", classe: "bg-success/12 text-success" },
  declined: { rotulo: "Recusado", classe: "bg-danger/10 text-danger" },
  cancelled: { rotulo: "Cancelado", classe: "bg-ink/8 text-taupe" },
};

export function PainelAgenda({
  agendamentosIniciais,
  falha,
  geradoEm,
}: {
  agendamentosIniciais: Agendamento[];
  falha: string | null;
  geradoEm: string;
}) {
  const router = useRouter();
  const [lista, setLista] = useState(agendamentosIniciais);
  const [aba, setAba] = useState<Aba>(() =>
    agendamentosIniciais.some((a) => a.status === "pending" && new Date(a.fim) > new Date()) ? "aguardando" : "proximos",
  );
  const [busca, setBusca] = useState("");
  const [atualizando, setAtualizando] = useState(false);
  const [agora, setAgora] = useState(() => new Date(geradoEm));
  const [aviso, setAviso] = useState<{ texto: string; nome: string; link: string } | null>(null);

  // Dados novos vindos do servidor (após "Atualizar")
  useEffect(() => {
    setLista(agendamentosIniciais);
    setAgora(new Date(geradoEm));
    setAtualizando(false);
  }, [agendamentosIniciais, geradoEm]);

  // Atualiza sozinho ao voltar para a aba do navegador e a cada 2 minutos
  useEffect(() => {
    const atualizar = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    document.addEventListener("visibilitychange", atualizar);
    const t = setInterval(atualizar, 120_000);
    return () => {
      document.removeEventListener("visibilitychange", atualizar);
      clearInterval(t);
    };
  }, [router]);

  const hoje = hojeISO(agora);
  const amanha = isoDeData(new Date(dataDeISO(hoje).getTime() + 86_400_000));

  const { aguardando, proximos, historico, hojeAtivos } = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const digitos = termo.replace(/\D/g, "");
    const filtrados = termo
      ? lista.filter(
          (a) =>
            a.cliente.toLowerCase().includes(termo) ||
            a.codigo.toLowerCase().includes(termo) ||
            a.servico.toLowerCase().includes(termo) ||
            (digitos.length >= 3 && a.telefone.includes(digitos)),
        )
      : lista;
    const futuro = (a: Agendamento) => new Date(a.fim) > agora;
    const ativo = (a: Agendamento) => a.status === "pending" || a.status === "confirmed";
    return {
      aguardando: filtrados.filter((a) => a.status === "pending" && futuro(a)),
      proximos: filtrados.filter((a) => ativo(a) && futuro(a)),
      historico: filtrados.filter((a) => !ativo(a) || !futuro(a)).reverse(),
      hojeAtivos: lista.filter((a) => ativo(a) && futuro(a) && dataLocalDeTimestamp(a.inicio) === hoje).length,
    };
  }, [lista, busca, agora, hoje]);

  const totalSemana = useMemo(() => {
    const limite = isoDeData(new Date(dataDeISO(hoje).getTime() + 6 * 86_400_000));
    return lista.filter((a) => {
      const d = dataLocalDeTimestamp(a.inicio);
      return (a.status === "pending" || a.status === "confirmed") && new Date(a.fim) > agora && d >= hoje && d <= limite;
    }).length;
  }, [lista, hoje, agora]);

  const visiveis = aba === "aguardando" ? aguardando : aba === "proximos" ? proximos : historico;

  const grupos = useMemo(() => {
    const mapa = new Map<string, Agendamento[]>();
    for (const a of visiveis) {
      const d = dataLocalDeTimestamp(a.inicio);
      mapa.set(d, [...(mapa.get(d) ?? []), a]);
    }
    return [...mapa.entries()];
  }, [visiveis]);

  const aoAtualizarStatus = (id: string, status: Status, avisoNovo: { texto: string; nome: string; link: string }) => {
    setLista((l) => l.map((a) => (a.id === id ? { ...a, status } : a)));
    setAviso(avisoNovo);
  };

  const sair = async () => {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => null);
    router.replace("/admin/login");
    router.refresh();
  };

  const rotuloDia = (d: string) =>
    d === hoje ? `Hoje · ${formatarDataLonga(d)}` : d === amanha ? `Amanhã · ${formatarDataLonga(d)}` : formatarDataLonga(d);

  return (
    <div className="min-h-dvh bg-linen">
      {/* Barra superior */}
      <header className="tema-escuro sticky top-0 z-30 bg-ink text-paper">
        <div className="mx-auto flex h-16 max-w-[960px] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Monograma className="size-9 shrink-0" />
            <div className="min-w-0 leading-tight">
              <p className="truncate font-display text-xl">Agenda</p>
              <p className="rotulo text-[0.58rem] text-gold">Painel da profissional</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/" className="hidden px-3 py-2 text-sm text-paper/70 hover:text-gold-soft sm:block">
              Ver site
            </Link>
            <button
              type="button"
              onClick={sair}
              className="inline-flex min-h-11 items-center gap-2 px-3 text-sm text-paper/80 hover:text-gold-soft"
            >
              <LogOut className="size-4" strokeWidth={1.6} aria-hidden /> Sair
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[960px] px-4 pt-6 pb-40 sm:px-6 sm:pt-10">
        {falha && (
          <p role="alert" className="mb-6 flex items-start gap-2 border-l-2 border-danger bg-danger/6 px-4 py-3 text-sm">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden /> {falha}
          </p>
        )}

        {/* Resumo */}
        <section aria-label="Resumo" className="grid grid-cols-3 border border-ink/10 bg-paper">
          {[
            ["Hoje", hojeAtivos],
            ["Aguardando", aguardando.length],
            ["Próx. 7 dias", totalSemana],
          ].map(([rotulo, n], i) => (
            <div key={rotulo} className={cx("px-3 py-4 sm:px-6 sm:py-5", i > 0 && "border-l border-ink/10")}>
              <p className="text-[0.68rem] font-semibold tracking-[0.12em] text-taupe uppercase sm:text-xs">{rotulo}</p>
              <p className={cx("mt-1 font-display text-4xl tabular-nums", rotulo === "Aguardando" && Number(n) > 0 && "text-bronze")}>
                {n}
              </p>
            </div>
          ))}
        </section>

        {/* Abas + busca */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div role="tablist" aria-label="Filtrar agendamentos" className="flex gap-1 border-b border-ink/10">
            {(
              [
                ["aguardando", "Aguardando", aguardando.length],
                ["proximos", "Próximos", proximos.length],
                ["historico", "Histórico", null],
              ] as [Aba, string, number | null][]
            ).map(([id, rotulo, n]) => (
              <button
                key={id}
                role="tab"
                type="button"
                aria-selected={aba === id}
                onClick={() => setAba(id)}
                className={cx(
                  "-mb-px inline-flex min-h-11 items-center gap-2 border-b-2 px-3 text-sm transition-colors",
                  aba === id ? "border-ink font-semibold text-ink" : "border-transparent text-taupe hover:text-ink",
                )}
              >
                {rotulo}
                {n !== null && n > 0 && (
                  <span
                    className={cx(
                      "rounded-full px-2 py-0.5 text-xs tabular-nums",
                      id === "aguardando" ? "bg-gold/25 text-bronze" : "bg-ink/8 text-taupe",
                    )}
                  >
                    {n}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <label className="relative flex-1 sm:w-64 sm:flex-none">
              <span className="sr-only">Buscar por nome, telefone, serviço ou código</span>
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-taupe" aria-hidden />
              <input
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar cliente ou código"
                className="block min-h-11 w-full border border-ink/15 bg-paper pr-3 pl-9 text-[16px] focus:border-ink focus:outline-none sm:text-sm"
              />
            </label>
            <button
              type="button"
              onClick={() => {
                setAtualizando(true);
                router.refresh();
              }}
              className="inline-flex size-11 shrink-0 items-center justify-center border border-ink/15 bg-paper hover:border-ink"
              aria-label="Atualizar lista"
              title="Atualizar"
            >
              <RefreshCw className={cx("size-4", atualizando && "animate-spin")} strokeWidth={1.6} />
            </button>
          </div>
        </div>

        {/* Lista */}
        <div role="tabpanel" className="mt-6">
          {grupos.length === 0 ? (
            <div className="border border-dashed border-ink/15 px-6 py-14 text-center">
              <p className="font-display text-2xl">
                {busca
                  ? "Nenhum resultado para essa busca"
                  : aba === "aguardando"
                    ? "Nenhuma solicitação aguardando"
                    : aba === "proximos"
                      ? "Nenhum atendimento marcado"
                      : "Nada no histórico ainda"}
              </p>
              <p className="mt-2 text-sm text-taupe">
                {aba === "aguardando" && !busca
                  ? "Novas solicitações feitas pelo site aparecem aqui."
                  : "A lista atualiza sozinha a cada 2 minutos."}
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {grupos.map(([dia, itens]) => (
                <section key={dia} aria-label={rotuloDia(dia)}>
                  <h2
                    className={cx(
                      "mb-3 text-xs font-semibold tracking-[0.12em] uppercase",
                      dia === hoje ? "text-bronze" : "text-taupe",
                    )}
                  >
                    {rotuloDia(dia)}
                    <span className="ml-2 font-normal tracking-normal normal-case">
                      · {itens.length} {itens.length === 1 ? "atendimento" : "atendimentos"}
                    </span>
                  </h2>
                  <ul className="divide-y divide-ink/10 border border-ink/10 bg-paper">
                    {itens.map((a) => (
                      <CartaoAgendamento
                        key={a.id}
                        agendamento={a}
                        passado={new Date(a.fim) <= agora}
                        aoAtualizar={aoAtualizarStatus}
                        aoExpirar={() => router.replace("/admin/login")}
                      />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>

        <p className="mt-10 text-center text-xs text-taupe">
          Atualizado às {formatarHora(agora.toISOString())} · mostra agendamentos dos últimos 60 dias em diante
        </p>
      </div>

      {/* Aviso após confirmar/recusar/cancelar, com atalho para avisar a cliente */}
      {aviso && (
        <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div
            role="status"
            className="animar-surgir tema-escuro mx-auto flex max-w-[640px] flex-col gap-3 bg-ink p-4 text-paper shadow-[0_18px_40px_-16px_rgba(21,18,15,0.6)] sm:flex-row sm:items-center sm:justify-between sm:p-5"
          >
            <p className="text-sm">
              {aviso.texto} <span className="text-paper/60">Quer avisar {aviso.nome}?</span>
            </p>
            <div className="flex items-center gap-2">
              <a
                href={aviso.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setAviso(null)}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-gold px-5 text-xs font-semibold tracking-[0.08em] text-ink uppercase hover:bg-gold-soft sm:flex-none"
              >
                <IconeWhatsApp className="size-4" /> Avisar no WhatsApp
              </a>
              <button
                type="button"
                onClick={() => setAviso(null)}
                className="inline-flex size-11 items-center justify-center text-paper/70 hover:text-paper"
                aria-label="Fechar aviso"
              >
                <X className="size-5" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------------ */

type Acao = "confirmed" | "declined" | "cancelled";

function CartaoAgendamento({
  agendamento: a,
  passado,
  aoAtualizar,
  aoExpirar,
}: {
  agendamento: Agendamento;
  passado: boolean;
  aoAtualizar: (id: string, s: Status, aviso: { texto: string; nome: string; link: string }) => void;
  aoExpirar: () => void;
}) {
  const [pendente, setPendente] = useState<Acao | null>(null);
  const [perguntando, setPerguntando] = useState<Acao | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const primeiroNome = a.cliente.split(" ")[0];
  const data = formatarDataLonga(dataLocalDeTimestamp(a.inicio)).toLowerCase();
  const hora = formatarHora(a.inicio);

  const whatsapp = (texto: string) => `https://wa.me/55${a.telefone.replace(/\D/g, "").replace(/^55/, "")}?text=${encodeURIComponent(texto)}`;
  const mensagens: Record<"conversar" | Status, string> = {
    conversar: `Olá, ${primeiroNome}! Aqui é a Kimiélly, sobre o seu agendamento de ${a.servico} em ${data}, às ${hora}.`,
    confirmed: `Olá, ${primeiroNome}! Seu horário de ${a.servico} está confirmado para ${data}, às ${hora}. Até lá! — Kimiélly`,
    declined: `Olá, ${primeiroNome}! Infelizmente não vou conseguir atender ${a.servico} em ${data}, às ${hora}. Podemos combinar outro horário? — Kimiélly`,
    cancelled: `Olá, ${primeiroNome}! Precisei cancelar o seu horário de ${a.servico} em ${data}, às ${hora}. Podemos combinar outro dia? — Kimiélly`,
    pending: "",
  };

  const executar = async (status: Acao) => {
    setPendente(status);
    setPerguntando(null);
    setErro(null);
    try {
      const r = await fetch(`/api/admin/agendamentos/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const corpo = await r.json().catch(() => null);
      if (r.status === 401) return aoExpirar();
      if (!r.ok || !corpo?.ok) {
        setErro(corpo?.mensagem ?? "Não foi possível atualizar.");
      } else {
        const texto = status === "confirmed" ? `Agendamento de ${a.cliente} confirmado.` : status === "declined" ? `Solicitação de ${a.cliente} recusada.` : `Atendimento de ${a.cliente} cancelado.`;
        aoAtualizar(a.id, status, { texto, nome: primeiroNome, link: whatsapp(mensagens[status]) });
      }
    } catch {
      setErro("Sem conexão. Tente novamente.");
    }
    setPendente(null);
  };

  const ROTULO_ACAO: Record<Acao, { pergunta: string; botao: string }> = {
    confirmed: { pergunta: "", botao: "Confirmar" },
    declined: { pergunta: "Recusar esta solicitação? O horário volta a ficar livre.", botao: "Sim, recusar" },
    cancelled: { pergunta: "Cancelar este atendimento? O horário volta a ficar livre.", botao: "Sim, cancelar" },
  };

  return (
    <li className={cx("px-4 py-5 sm:px-6", (a.status === "cancelled" || a.status === "declined") && "opacity-70")}>
      <div className="grid grid-cols-[4.25rem_1fr] gap-x-4 sm:grid-cols-[5rem_1fr_auto]">
        <p className={cx("font-display text-[1.7rem] leading-none tabular-nums", passado && "text-taupe")}>{hora}</p>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="text-[1.02rem] font-semibold [overflow-wrap:anywhere]">{a.cliente}</p>
            <span className={cx("rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold tracking-[0.06em] uppercase", STATUS[a.status].classe)}>
              {passado && a.status === "pending" ? "Não confirmado" : STATUS[a.status].rotulo}
            </span>
          </div>
          <p className="mt-1 text-sm text-ink">{a.servico}</p>
          <p className="mt-1 text-sm text-taupe">
            <a
              href={whatsapp(mensagens.conversar)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 underline decoration-ink/20 underline-offset-4 hover:text-ink hover:decoration-bronze"
            >
              <IconeWhatsApp className="size-3.5" /> {mascararTelefone(a.telefone)}
            </a>
            <span className="mx-2 text-ink/25">·</span>
            <span className="font-mono text-xs tracking-wider">{a.codigo}</span>
          </p>
          {a.observacoes && (
            <p className="mt-2 border-l-2 border-sand pl-3 text-sm leading-relaxed text-taupe [overflow-wrap:anywhere]">
              {a.observacoes}
            </p>
          )}
        </div>

        {/* Ações */}
        {!passado && (a.status === "pending" || a.status === "confirmed") && !perguntando && (
          <div className="col-span-2 mt-4 grid grid-cols-2 gap-2 sm:col-span-1 sm:col-start-3 sm:row-start-1 sm:mt-0 sm:flex sm:flex-col sm:items-stretch">
            {a.status === "pending" && (
              <>
                <Botao type="button" compacto onClick={() => executar("confirmed")} disabled={pendente !== null}>
                  {pendente === "confirmed" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Check className="size-4" strokeWidth={2} aria-hidden />}
                  Confirmar
                </Botao>
                <Botao
                  type="button"
                  variante="secundario"
                  compacto
                  onClick={() => setPerguntando("declined")}
                  disabled={pendente !== null}
                 
                >
                  <X className="size-4" strokeWidth={2} aria-hidden /> Recusar
                </Botao>
              </>
            )}
            {a.status === "confirmed" && (
              <Botao
                type="button"
                variante="secundario"
                compacto
                onClick={() => setPerguntando("cancelled")}
                disabled={pendente !== null}
                className="col-span-2"
              >
                {pendente === "cancelled" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <X className="size-4" strokeWidth={2} aria-hidden />}
                Cancelar
              </Botao>
            )}
          </div>
        )}
      </div>

      {/* Confirmação de ação destrutiva */}
      {perguntando && (
        <div role="alertdialog" aria-label={ROTULO_ACAO[perguntando].pergunta} className="animar-surgir mt-4 border border-danger/30 bg-danger/5 p-4 sm:ml-24">
          <p className="text-sm">{ROTULO_ACAO[perguntando].pergunta}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => executar(perguntando)}
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-danger px-5 text-xs font-semibold tracking-[0.08em] text-paper uppercase hover:opacity-90"
            >
              {ROTULO_ACAO[perguntando].botao}
            </button>
            <button
              type="button"
              onClick={() => setPerguntando(null)}
              className="inline-flex min-h-10 items-center rounded-full border border-ink/20 px-5 text-xs font-semibold tracking-[0.08em] uppercase hover:border-ink"
            >
              Voltar
            </button>
          </div>
        </div>
      )}

      {erro && (
        <p role="alert" className="mt-3 flex items-center gap-1.5 text-sm text-danger sm:ml-24">
          <AlertCircle className="size-4 shrink-0" aria-hidden /> {erro}
        </p>
      )}

    </li>
  );
}
