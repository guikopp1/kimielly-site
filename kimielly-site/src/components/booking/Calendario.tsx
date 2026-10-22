"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cx } from "@/components/ui/primitives";
import { dataDeISO, formatarDataLonga, isoDeData } from "@/lib/format";

const DIAS_SEMANA = [
  ["D", "Domingo"],
  ["S", "Segunda"],
  ["T", "Terça"],
  ["Q", "Quarta"],
  ["Q", "Quinta"],
  ["S", "Sexta"],
  ["S", "Sábado"],
] as const;

export function somarMeses(mes: string, n: number): string {
  const [a, m] = mes.split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function nomeDoMes(mes: string) {
  const t = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", month: "long", year: "numeric" }).format(
    dataDeISO(`${mes}-01`),
  );
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function Calendario({
  mes,
  mesMinimo,
  mesMaximo,
  hoje,
  disponibilidade,
  carregando,
  selecionada,
  aoMudarMes,
  aoSelecionar,
}: {
  mes: string;
  mesMinimo: string;
  mesMaximo: string;
  hoje: string;
  /** data → quantidade de horários livres (ausente = sem informação ainda) */
  disponibilidade: Record<string, number> | null;
  carregando: boolean;
  selecionada: string | null;
  aoMudarMes: (mes: string) => void;
  aoSelecionar: (data: string) => void;
}) {
  const primeiro = dataDeISO(`${mes}-01`);
  const deslocamento = primeiro.getUTCDay();
  const totalDias = new Date(Date.UTC(primeiro.getUTCFullYear(), primeiro.getUTCMonth() + 1, 0)).getUTCDate();

  const celulas: (string | null)[] = [
    ...Array.from({ length: deslocamento }, () => null),
    ...Array.from({ length: totalDias }, (_, i) =>
      isoDeData(new Date(Date.UTC(primeiro.getUTCFullYear(), primeiro.getUTCMonth(), i + 1, 12))),
    ),
  ];

  return (
    <div className="select-none">
      <div className="mb-5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => aoMudarMes(somarMeses(mes, -1))}
          disabled={mes <= mesMinimo}
          className="inline-flex size-11 items-center justify-center rounded-full border border-ink/15 transition-colors hover:border-ink disabled:pointer-events-none disabled:opacity-30"
          aria-label="Mês anterior"
        >
          <ChevronLeft className="size-5" strokeWidth={1.4} />
        </button>
        <p className="font-display text-2xl" aria-live="polite">
          {nomeDoMes(mes)}
        </p>
        <button
          type="button"
          onClick={() => aoMudarMes(somarMeses(mes, 1))}
          disabled={mes >= mesMaximo}
          className="inline-flex size-11 items-center justify-center rounded-full border border-ink/15 transition-colors hover:border-ink disabled:pointer-events-none disabled:opacity-30"
          aria-label="Próximo mês"
        >
          <ChevronRight className="size-5" strokeWidth={1.4} />
        </button>
      </div>

      <div role="group" aria-label={`Dias de ${nomeDoMes(mes)}`} aria-busy={carregando}>
        <div className="grid grid-cols-7 text-center" aria-hidden>
          {DIAS_SEMANA.map(([abrev, nome]) => (
            <span key={nome} className="pb-3 text-xs font-semibold tracking-[0.1em] text-taupe">
              {abrev}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {celulas.map((data, i) => {
            if (!data) return <span key={`vazio-${i}`} aria-hidden />;
            const livres = disponibilidade?.[data];
            const passado = data < hoje;
            const disponivel = !passado && !carregando && (livres ?? 0) > 0;
            const ativo = selecionada === data;
            const rotulo = `${formatarDataLonga(data)} — ${
              passado ? "data passada" : carregando ? "carregando" : livres ? `${livres} ${livres === 1 ? "horário livre" : "horários livres"}` : "sem horários livres"
            }`;
            return (
              <span key={data}>
                <button
                  type="button"
                  disabled={!disponivel}
                  aria-pressed={ativo}
                  aria-label={rotulo}
                  onClick={() => aoSelecionar(data)}
                  className={cx(
                    "relative flex aspect-square w-full flex-col items-center justify-center rounded-full text-[0.95rem] tabular-nums transition-colors duration-200",
                    ativo && "bg-ink text-paper",
                    !ativo && disponivel && "hover:bg-sand",
                    !disponivel && "text-ink/25",
                    carregando && !passado && "animate-pulse",
                  )}
                >
                  {Number(data.slice(8))}
                  {disponivel && !ativo && (
                    <span className="absolute bottom-[18%] size-1 rounded-full bg-bronze" aria-hidden />
                  )}
                </button>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
