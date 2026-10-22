"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { AlertCircle, Check, Loader2, Pencil } from "lucide-react";
import { Botao, BotaoExterno, IconeWhatsApp, SetaAnimada, cx } from "@/components/ui/primitives";
import {
  dataLocalDeTimestamp,
  formatarDataLonga,
  formatarHora,
  hojeISO,
  mascararTelefone,
} from "@/lib/format";
import { dadosClienteSchema, errosPorCampo } from "@/lib/validation/booking";
import { Calendario, somarMeses } from "./Calendario";

export type ServicoAgenda = {
  id: string;
  nome: string;
  categoria: string;
  preco: string;
  duracao: string | null;
};

type Reserva = { id: string; codigo: string; status: "pending" | "confirmed" | "declined" | "cancelled"; inicio: string; servico: string };
type RespostaErro = { ok: false; codigo: string; mensagem: string; campos?: Record<string, string> };
type Estado = "ocioso" | "carregando" | "ok" | "erro";

const ETAPAS = ["Serviço", "Data e horário", "Seus dados", "Revisão"] as const;

export function AssistenteAgendamento({
  servicos,
  servicoInicial,
  exigeConfirmacao,
  whatsappNumero,
  nomeProfissional,
}: {
  servicos: ServicoAgenda[];
  servicoInicial?: string;
  exigeConfirmacao: boolean;
  whatsappNumero: string | null;
  nomeProfissional: string;
}) {
  const hoje = hojeISO();
  const mesAtual = hoje.slice(0, 7);

  const [etapa, setEtapa] = useState<1 | 2 | 3 | 4 | 5>(servicoInicial ? 2 : 1);
  const [servicoId, setServicoId] = useState<string | null>(servicoInicial ?? null);
  const [mes, setMes] = useState(mesAtual);
  const [diasMes, setDiasMes] = useState<Record<string, number> | null>(null);
  const [estadoMes, setEstadoMes] = useState<Estado>("ocioso");
  const [data, setData] = useState<string | null>(null);
  const [horarios, setHorarios] = useState<string[] | null>(null);
  const [estadoHorarios, setEstadoHorarios] = useState<Estado>("ocioso");
  const [inicio, setInicio] = useState<string | null>(null);
  const [dados, setDados] = useState({ nome: "", telefone: "", observacoes: "", consentimento: false });
  const [erros, setErros] = useState<Record<string, string>>({});
  const [aviso, setAviso] = useState<string | null>(null);
  const [envio, setEnvio] = useState<Estado>("ocioso");
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [reserva, setReserva] = useState<Reserva | null>(null);
  const [recarregar, setRecarregar] = useState(0);

  const iniciadoEm = useRef(Date.now());
  const armadilha = useRef<HTMLInputElement>(null);
  const topo = useRef<HTMLDivElement>(null);
  const tituloEtapa = useRef<HTMLHeadingElement>(null);
  const primeiraRenderizacao = useRef(true);

  const servico = servicos.find((s) => s.id === servicoId) ?? null;

  // Ao trocar de etapa: leva o foco ao título (leitores de tela) e rola até o topo do assistente
  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    tituloEtapa.current?.focus({ preventScroll: true });
    topo.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [etapa]);

  // Disponibilidade do mês
  useEffect(() => {
    if (etapa !== 2 || !servicoId) return;
    const ctrl = new AbortController();
    setEstadoMes("carregando");
    fetch(`/api/disponibilidade/mes?servico=${encodeURIComponent(servicoId)}&mes=${mes}`, { signal: ctrl.signal })
      .then(async (r) => {
        const corpo = await r.json();
        if (!r.ok || !corpo.ok) throw new Error((corpo as RespostaErro).mensagem);
        const mapa: Record<string, number> = {};
        for (const d of corpo.dias as { data: string; livres: number }[]) mapa[d.data] = d.livres;
        setDiasMes(mapa);
        setEstadoMes("ok");
      })
      .catch((e) => {
        if (ctrl.signal.aborted) return;
        setDiasMes(null);
        setEstadoMes("erro");
        setAviso(
          e instanceof TypeError || !(e instanceof Error) || !e.message
            ? "Não foi possível carregar o calendário. Verifique sua conexão e tente novamente."
            : e.message,
        );
      });
    return () => ctrl.abort();
  }, [etapa, servicoId, mes, recarregar]);

  // Horários do dia escolhido
  useEffect(() => {
    if (etapa !== 2 || !servicoId || !data) return;
    const ctrl = new AbortController();
    setEstadoHorarios("carregando");
    fetch(`/api/disponibilidade?servico=${encodeURIComponent(servicoId)}&data=${data}`, { signal: ctrl.signal })
      .then(async (r) => {
        const corpo = await r.json();
        if (!r.ok || !corpo.ok) throw new Error((corpo as RespostaErro).mensagem);
        setHorarios(corpo.horarios as string[]);
        setEstadoHorarios("ok");
        // se o horário escolhido deixou de existir, limpa a escolha
        setInicio((atual) => (atual && !(corpo.horarios as string[]).includes(atual) ? null : atual));
      })
      .catch(() => {
        if (ctrl.signal.aborted) return;
        setHorarios(null);
        setEstadoHorarios("erro");
      });
    return () => ctrl.abort();
  }, [etapa, servicoId, data, recarregar]);

  const escolherServico = (id: string) => {
    if (id !== servicoId) {
      setData(null);
      setHorarios(null);
      setInicio(null);
      setDiasMes(null);
    }
    setServicoId(id);
    setAviso(null);
  };

  const validarDados = useCallback(() => {
    const r = dadosClienteSchema.safeParse(dados);
    if (r.success) {
      setErros({});
      return true;
    }
    const e = errosPorCampo(r.error);
    setErros(e);
    const primeiro = ["nome", "telefone", "observacoes", "consentimento"].find((c) => e[c]);
    if (primeiro) document.getElementById(`campo-${primeiro}`)?.focus();
    return false;
  }, [dados]);

  const enviar = async () => {
    if (!servicoId || !inicio) return;
    setEnvio("carregando");
    setErroEnvio(null);
    try {
      const r = await fetch("/api/agendamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          servicoId,
          inicio,
          nome: dados.nome,
          telefone: dados.telefone,
          observacoes: dados.observacoes,
          consentimento: dados.consentimento,
          site: armadilha.current?.value ?? "",
          iniciadoEm: iniciadoEm.current,
        }),
      });
      const corpo = await r.json().catch(() => null);
      if (r.ok && corpo?.ok) {
        setReserva(corpo.reserva as Reserva);
        setEnvio("ok");
        setEtapa(5);
        return;
      }
      const falha = (corpo ?? { codigo: "INTERNAL", mensagem: "Não foi possível concluir agora." }) as RespostaErro;
      setEnvio("erro");
      if (falha.codigo === "SLOT_UNAVAILABLE") {
        setInicio(null);
        setAviso(falha.mensagem);
        setRecarregar((n) => n + 1);
        setEtapa(2);
      } else if (falha.codigo === "VALIDATION" && falha.campos) {
        setErros(falha.campos);
        if (falha.campos.inicio || falha.campos.servicoId) {
          setAviso("Revise o serviço e o horário escolhidos.");
          setEtapa(2);
        } else setEtapa(3);
      } else {
        setErroEnvio(falha.mensagem);
      }
    } catch {
      setEnvio("erro");
      setErroEnvio("Sem conexão no momento. Verifique sua internet e tente novamente.");
    }
  };

  const recomecar = () => {
    setEtapa(1);
    setServicoId(null);
    setData(null);
    setHorarios(null);
    setInicio(null);
    setReserva(null);
    setEnvio("ocioso");
    setAviso(null);
    setDados((d) => ({ ...d, observacoes: "", consentimento: false }));
    iniciadoEm.current = Date.now();
  };

  const linkWhatsAppResumo = (r: Reserva) => {
    if (!whatsappNumero) return null;
    const msg = [
      `Olá, ${nomeProfissional.split(" ")[0]}! Acabei de solicitar um agendamento pelo site.`,
      "",
      `Nome: ${dados.nome.trim()}`,
      `Serviço: ${r.servico}`,
      `Data: ${formatarDataLonga(dataLocalDeTimestamp(r.inicio))}`,
      `Horário: ${formatarHora(r.inicio)}`,
      `Código: ${r.codigo}`,
    ].join("\n");
    return `https://wa.me/${whatsappNumero}?text=${encodeURIComponent(msg)}`;
  };

  // --------------------------------------------------------------------------
  return (
    <div ref={topo} className="scroll-mt-28">
      {etapa < 5 && <IndicadorEtapas atual={etapa} />}

      {/* Campo-armadilha anti-spam: invisível para pessoas */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Não preencha este campo
          <input ref={armadilha} type="text" name="site" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="mt-10">
        {/* ETAPA 1 — SERVIÇO */}
        {etapa === 1 && (
          <Etapa titulo="Qual serviço você deseja?" tituloRef={tituloEtapa}>
            <fieldset>
              <legend className="sr-only">Serviços disponíveis</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {servicos.map((s) => {
                  const marcado = servicoId === s.id;
                  return (
                    <label
                      key={s.id}
                      className={cx(
                        "relative flex min-h-[4.75rem] cursor-pointer items-center justify-between gap-4 border px-5 py-4 transition-colors duration-200",
                        marcado ? "border-ink bg-paper" : "border-ink/12 bg-paper/50 hover:border-ink/40",
                        "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-bronze",
                      )}
                    >
                      <input
                        type="radio"
                        name="servico"
                        value={s.id}
                        checked={marcado}
                        onChange={() => escolherServico(s.id)}
                        className="sr-only"
                      />
                      <span>
                        <span className="block font-medium">{s.nome}</span>
                        <span className="text-sm text-taupe">
                          {s.categoria}
                          {s.duracao && ` · ${s.duracao}`} · {s.preco}
                        </span>
                      </span>
                      <span
                        className={cx(
                          "flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors",
                          marcado ? "border-ink bg-ink text-paper" : "border-ink/25",
                        )}
                        aria-hidden
                      >
                        {marcado && <Check className="size-3.5" strokeWidth={2.5} />}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <Navegacao>
              <span />
              <Botao type="button" disabled={!servicoId} onClick={() => setEtapa(2)}>
                Continuar <SetaAnimada />
              </Botao>
            </Navegacao>
          </Etapa>
        )}

        {/* ETAPA 2 — DATA E HORÁRIO */}
        {etapa === 2 && servico && (
          <Etapa titulo="Escolha a data e o horário" subtitulo={servico.nome} tituloRef={tituloEtapa}>
            {aviso && <Alerta>{aviso}</Alerta>}
            <div className="grid gap-10 md:grid-cols-[1.1fr_1fr] md:gap-12">
              <div>
                <Calendario
                  mes={mes}
                  mesMinimo={mesAtual}
                  mesMaximo={somarMeses(mesAtual, 2)}
                  hoje={hoje}
                  disponibilidade={diasMes}
                  carregando={estadoMes === "carregando"}
                  selecionada={data}
                  aoMudarMes={(m) => {
                    setMes(m);
                    setAviso(null);
                  }}
                  aoSelecionar={(d) => {
                    setData(d);
                    setInicio(null);
                    setAviso(null);
                  }}
                />
                {estadoMes === "erro" && (
                  <Botao type="button" variante="texto" className="mt-4" onClick={() => setRecarregar((n) => n + 1)}>
                    Tentar novamente
                  </Botao>
                )}
                {estadoMes === "ok" && diasMes && !Object.entries(diasMes).some(([d, n]) => d >= hoje && n > 0) && (
                  <p className="mt-5 text-sm leading-relaxed text-taupe" role="status">
                    Não há horários livres neste mês. Veja o próximo mês ou fale pelo WhatsApp.
                  </p>
                )}
              </div>

              <div aria-live="polite">
                {!data ? (
                  <p className="border-l border-ink/15 py-2 pl-5 text-taupe">
                    Selecione um dia disponível no calendário para ver os horários livres.
                  </p>
                ) : estadoHorarios === "carregando" ? (
                  <div>
                    <p className="mb-4 font-medium">{formatarDataLonga(data)}</p>
                    <div className="grid grid-cols-3 gap-2" aria-label="Carregando horários">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <span key={i} className="h-12 animate-pulse bg-sand/70" />
                      ))}
                    </div>
                  </div>
                ) : estadoHorarios === "erro" ? (
                  <Alerta>
                    Não foi possível carregar os horários.{" "}
                    <button type="button" className="underline" onClick={() => setRecarregar((n) => n + 1)}>
                      Tentar novamente
                    </button>
                  </Alerta>
                ) : horarios && horarios.length === 0 ? (
                  <div>
                    <p className="mb-2 font-medium">{formatarDataLonga(data)}</p>
                    <p className="text-taupe">Não há horários livres nesta data. Escolha outro dia, por favor.</p>
                  </div>
                ) : (
                  horarios && (
                    <fieldset>
                      <legend className="mb-4 font-medium">{formatarDataLonga(data)}</legend>
                      <GruposHorarios horarios={horarios} selecionado={inicio} aoSelecionar={setInicio} />
                    </fieldset>
                  )
                )}
              </div>
            </div>
            <Navegacao>
              <Botao type="button" variante="secundario" onClick={() => setEtapa(1)}>
                Voltar
              </Botao>
              <Botao type="button" disabled={!inicio} onClick={() => setEtapa(3)}>
                Continuar <SetaAnimada />
              </Botao>
            </Navegacao>
          </Etapa>
        )}

        {/* ETAPA 3 — DADOS */}
        {etapa === 3 && (
          <Etapa titulo="Seus dados para contato" tituloRef={tituloEtapa}>
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                if (validarDados()) setEtapa(4);
              }}
              className="space-y-6"
            >
              <Campo id="nome" rotulo="Nome completo" erro={erros.nome}>
                <input
                  id="campo-nome"
                  type="text"
                  autoComplete="name"
                  value={dados.nome}
                  onChange={(e) => setDados({ ...dados, nome: e.target.value })}
                  aria-invalid={Boolean(erros.nome)}
                  aria-describedby={erros.nome ? "erro-nome" : undefined}
                  className={classeCampo(Boolean(erros.nome))}
                  maxLength={120}
                  required
                />
              </Campo>

              <Campo id="telefone" rotulo="Celular com WhatsApp" dica="Com DDD. Usado apenas para falar sobre o seu agendamento." erro={erros.telefone}>
                <input
                  id="campo-telefone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  placeholder="(51) 98765-4321"
                  value={dados.telefone}
                  onChange={(e) => setDados({ ...dados, telefone: mascararTelefone(e.target.value) })}
                  aria-invalid={Boolean(erros.telefone)}
                  aria-describedby={["dica-telefone", erros.telefone && "erro-telefone"].filter(Boolean).join(" ")}
                  className={classeCampo(Boolean(erros.telefone))}
                  required
                />
              </Campo>

              <Campo id="observacoes" rotulo="Observações (opcional)" dica="Algo que a Kimiélly deva saber antes do atendimento?" erro={erros.observacoes}>
                <textarea
                  id="campo-observacoes"
                  rows={3}
                  value={dados.observacoes}
                  onChange={(e) => setDados({ ...dados, observacoes: e.target.value })}
                  aria-invalid={Boolean(erros.observacoes)}
                  aria-describedby={["dica-observacoes", erros.observacoes && "erro-observacoes"].filter(Boolean).join(" ")}
                  className={cx(classeCampo(Boolean(erros.observacoes)), "min-h-28 resize-y py-3")}
                  maxLength={500}
                />
              </Campo>

              <div>
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    id="campo-consentimento"
                    type="checkbox"
                    checked={dados.consentimento}
                    onChange={(e) => setDados({ ...dados, consentimento: e.target.checked })}
                    aria-invalid={Boolean(erros.consentimento)}
                    aria-describedby={erros.consentimento ? "erro-consentimento" : undefined}
                    className="mt-0.5 size-5 shrink-0 accent-ink"
                  />
                  <span className="text-sm leading-relaxed text-taupe">
                    Autorizo o uso do meu nome e telefone para o agendamento e o contato sobre este atendimento,
                    conforme a{" "}
                    <Link href="/privacidade" target="_blank" className="text-ink underline underline-offset-2">
                      política de privacidade
                    </Link>
                    .
                  </span>
                </label>
                {erros.consentimento && <MensagemErro id="erro-consentimento">{erros.consentimento}</MensagemErro>}
              </div>

              <Navegacao>
                <Botao type="button" variante="secundario" onClick={() => setEtapa(2)}>
                  Voltar
                </Botao>
                <Botao type="submit">
                  Revisar <SetaAnimada />
                </Botao>
              </Navegacao>
            </form>
          </Etapa>
        )}

        {/* ETAPA 4 — REVISÃO */}
        {etapa === 4 && servico && inicio && (
          <Etapa titulo="Confira antes de confirmar" tituloRef={tituloEtapa}>
            <dl className="divide-y divide-ink/10 border-y border-ink/10">
              <LinhaRevisao rotulo="Serviço" valor={servico.nome} aoEditar={() => setEtapa(1)} />
              <LinhaRevisao
                rotulo="Data e horário"
                valor={`${formatarDataLonga(dataLocalDeTimestamp(inicio))}, às ${formatarHora(inicio)}`}
                aoEditar={() => setEtapa(2)}
              />
              <LinhaRevisao rotulo="Nome" valor={dados.nome.trim()} aoEditar={() => setEtapa(3)} />
              <LinhaRevisao rotulo="WhatsApp" valor={dados.telefone} aoEditar={() => setEtapa(3)} />
              {dados.observacoes.trim() && (
                <LinhaRevisao rotulo="Observações" valor={dados.observacoes.trim()} aoEditar={() => setEtapa(3)} />
              )}
              <LinhaRevisao rotulo="Valor" valor={servico.preco} />
            </dl>

            {exigeConfirmacao && (
              <p className="mt-6 text-sm leading-relaxed text-taupe">
                Ao enviar, o horário fica reservado para você com status <strong className="text-ink">aguardando confirmação</strong>.
                A Kimiélly confirma o atendimento pelo WhatsApp.
              </p>
            )}

            {erroEnvio && (
              <Alerta className="mt-6">
                {erroEnvio}
                {whatsappNumero && (
                  <>
                    {" "}
                    <a href={`https://wa.me/${whatsappNumero}`} target="_blank" rel="noopener noreferrer" className="underline">
                      Falar pelo WhatsApp
                    </a>
                  </>
                )}
              </Alerta>
            )}

            <Navegacao>
              <Botao type="button" variante="secundario" onClick={() => setEtapa(3)} disabled={envio === "carregando"}>
                Voltar
              </Botao>
              <Botao type="button" onClick={enviar} disabled={envio === "carregando"} aria-busy={envio === "carregando"}>
                {envio === "carregando" ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden /> Enviando…
                  </>
                ) : (
                  <>
                    Confirmar solicitação <SetaAnimada />
                  </>
                )}
              </Botao>
            </Navegacao>
          </Etapa>
        )}

        {/* ETAPA 5 — CONFIRMAÇÃO */}
        {etapa === 5 && reserva && (
          <div className="animar-surgir border border-ink/12 bg-paper p-7 sm:p-12" role="status">
            <span
              className={cx(
                "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-[0.08em] uppercase",
                reserva.status === "confirmed" ? "bg-success/12 text-success" : "bg-gold/20 text-bronze",
              )}
            >
              <span className={cx("size-1.5 rounded-full", reserva.status === "confirmed" ? "bg-success" : "bg-bronze")} />
              {reserva.status === "confirmed" ? "Confirmado" : "Aguardando confirmação"}
            </span>
            <h2 ref={tituloEtapa} tabIndex={-1} className="titulo-display mt-6 text-[2.2rem] outline-none sm:text-5xl">
              Solicitação recebida, {dados.nome.trim().split(" ")[0]}!
            </h2>
            <p className="mt-4 max-w-lg leading-relaxed text-taupe">
              {reserva.status === "confirmed"
                ? "Seu horário está reservado. Guarde o código abaixo."
                : "Seu horário ficou reservado enquanto a Kimiélly confirma o atendimento com você pelo WhatsApp. Guarde o código abaixo."}
            </p>

            <dl className="mt-8 grid gap-x-8 gap-y-5 border-y border-ink/10 py-6 sm:grid-cols-2">
              <ItemResumo rotulo="Código" valor={<span className="font-mono tracking-wider">{reserva.codigo}</span>} />
              <ItemResumo rotulo="Serviço" valor={reserva.servico} />
              <ItemResumo rotulo="Data" valor={formatarDataLonga(dataLocalDeTimestamp(reserva.inicio))} />
              <ItemResumo rotulo="Horário" valor={formatarHora(reserva.inicio)} />
            </dl>

            {(() => {
              const link = linkWhatsAppResumo(reserva);
              return (
                link && (
                  <div className="mt-8">
                    <BotaoExterno href={link} variante="primario">
                      <IconeWhatsApp className="size-4" /> Enviar resumo pelo WhatsApp
                    </BotaoExterno>
                    <p className="mt-3 text-xs leading-relaxed text-taupe">
                      O WhatsApp abrirá com a mensagem pronta — ela só é enviada quando você tocar em enviar.
                    </p>
                  </div>
                )
              );
            })()}

            <div className="mt-10 flex flex-col gap-3 text-sm sm:flex-row sm:gap-8">
              <Link href="/agendamento/status" className="underline decoration-ink/25 underline-offset-4 hover:decoration-bronze">
                Consultar status depois
              </Link>
              <button type="button" onClick={recomecar} className="text-left underline decoration-ink/25 underline-offset-4 hover:decoration-bronze">
                Fazer outro agendamento
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------ */

function IndicadorEtapas({ atual }: { atual: number }) {
  return (
    <nav aria-label="Etapas do agendamento">
      <ol className="grid grid-cols-4 gap-2">
        {ETAPAS.map((nome, i) => {
          const n = i + 1;
          const estado = n < atual ? "feita" : n === atual ? "atual" : "proxima";
          return (
            <li key={nome} aria-current={estado === "atual" ? "step" : undefined}>
              <span
                className={cx(
                  "block h-0.5 transition-colors duration-500",
                  estado === "proxima" ? "bg-ink/12" : "bg-ink",
                )}
              />
              <span className={cx("mt-3 block text-xs sm:text-sm", estado === "proxima" ? "text-taupe/70" : "text-ink")}>
                <span className="tabular-nums">{n}.</span> <span className={cx(estado !== "atual" && "hidden sm:inline")}>{nome}</span>
                <span className="sr-only">{estado === "feita" ? " (concluída)" : estado === "atual" ? " (etapa atual)" : ""}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function Etapa({
  titulo,
  subtitulo,
  tituloRef,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  tituloRef: RefObject<HTMLHeadingElement | null>;
  children: ReactNode;
}) {
  return (
    <section className="animar-surgir">
      {subtitulo && <p className="rotulo mb-3 text-bronze">{subtitulo}</p>}
      <h2 ref={tituloRef} tabIndex={-1} className="titulo-display mb-8 text-[2rem] outline-none sm:text-[2.6rem]">
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function Navegacao({ children }: { children: ReactNode }) {
  return (
    <div className="mt-10 flex flex-col-reverse gap-3 border-t border-ink/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
      {children}
    </div>
  );
}

function GruposHorarios({
  horarios,
  selecionado,
  aoSelecionar,
}: {
  horarios: string[];
  selecionado: string | null;
  aoSelecionar: (h: string) => void;
}) {
  const grupos: [string, string[]][] = [
    ["Manhã", []],
    ["Tarde", []],
    ["Noite", []],
  ];
  for (const h of horarios) {
    const hora = Number(formatarHora(h).slice(0, 2));
    grupos[hora < 12 ? 0 : hora < 18 ? 1 : 2][1].push(h);
  }
  return (
    <div className="space-y-5">
      {grupos
        .filter(([, lista]) => lista.length)
        .map(([nome, lista]) => (
          <div key={nome}>
            <p className="mb-2 text-xs font-semibold tracking-[0.12em] text-taupe uppercase">{nome}</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-3">
              {lista.map((h) => {
                const ativo = selecionado === h;
                return (
                  <label
                    key={h}
                    className={cx(
                      "flex h-12 cursor-pointer items-center justify-center border text-[0.95rem] tabular-nums transition-colors duration-200",
                      ativo ? "border-ink bg-ink text-paper" : "border-ink/15 hover:border-ink",
                      "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-bronze",
                    )}
                  >
                    <input
                      type="radio"
                      name="horario"
                      value={h}
                      checked={ativo}
                      onChange={() => aoSelecionar(h)}
                      className="sr-only"
                    />
                    {formatarHora(h)}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
    </div>
  );
}

function classeCampo(comErro: boolean) {
  return cx(
    "block min-h-13 w-full border bg-paper px-4 text-ink transition-colors duration-200 placeholder:text-stone",
    "focus:border-ink focus:outline-none focus-visible:outline-none",
    comErro ? "border-danger" : "border-ink/20",
  );
}

function Campo({
  id,
  rotulo,
  dica,
  erro,
  children,
}: {
  id: string;
  rotulo: string;
  dica?: string;
  erro?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={`campo-${id}`} className="mb-2 block text-sm font-medium">
        {rotulo}
      </label>
      {children}
      {dica && (
        <p id={`dica-${id}`} className="mt-1.5 text-xs text-taupe">
          {dica}
        </p>
      )}
      {erro && <MensagemErro id={`erro-${id}`}>{erro}</MensagemErro>}
    </div>
  );
}

function MensagemErro({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="mt-1.5 flex items-center gap-1.5 text-sm text-danger" role="alert">
      <AlertCircle className="size-4 shrink-0" strokeWidth={1.6} aria-hidden /> {children}
    </p>
  );
}

function Alerta({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div role="alert" className={cx("mb-8 flex items-start gap-3 border-l-2 border-danger bg-danger/6 px-4 py-3 text-sm", className)}>
      <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" strokeWidth={1.6} aria-hidden />
      <div>{children}</div>
    </div>
  );
}

function LinhaRevisao({ rotulo, valor, aoEditar }: { rotulo: string; valor: string; aoEditar?: () => void }) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 py-4 sm:grid-cols-[10rem_1fr_auto]">
      <dt className="text-sm text-taupe">{rotulo}</dt>
      <dd className="col-span-2 row-start-2 break-words sm:col-span-1 sm:row-start-auto">{valor}</dd>
      {aoEditar ? (
        <button
          type="button"
          onClick={aoEditar}
          className="row-start-1 col-start-2 inline-flex items-center gap-1.5 self-start text-sm text-bronze underline-offset-4 hover:underline sm:col-start-3"
          aria-label={`Editar ${rotulo.toLowerCase()}`}
        >
          <Pencil className="size-3.5" strokeWidth={1.6} aria-hidden /> Editar
        </button>
      ) : (
        <span className="hidden sm:block" />
      )}
    </div>
  );
}

function ItemResumo({ rotulo, valor }: { rotulo: string; valor: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold tracking-[0.12em] text-taupe uppercase">{rotulo}</dt>
      <dd className="mt-1 text-lg">{valor}</dd>
    </div>
  );
}
