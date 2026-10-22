import "server-only";
import { createHash } from "node:crypto";
import { supabaseServidor } from "@/lib/supabase/server";

export type StatusReserva = "pending" | "confirmed" | "declined" | "cancelled";

export type ReservaCriada = {
  id: string;
  codigo: string;
  status: StatusReserva;
  inicio: string;
  servico: string;
};

/** Erros de negócio levantados pelas funções do banco. */
export const ERROS_AGENDA = {
  SLOT_UNAVAILABLE: "Este horário acabou de ser reservado. Escolha outro horário, por favor.",
  SERVICE_UNAVAILABLE: "Este serviço não está disponível para agendamento online no momento.",
  TOO_MANY_PENDING:
    "Você já tem solicitações aguardando confirmação. Fale com a Kimiélly pelo WhatsApp para ajustar sua agenda.",
  INVALID_PHONE: "Telefone inválido.",
} as const;

export type CodigoErroAgenda = keyof typeof ERROS_AGENDA;

export class ErroAgenda extends Error {
  constructor(public codigo: CodigoErroAgenda) {
    super(ERROS_AGENDA[codigo]);
    this.name = "ErroAgenda";
  }
}

function traduzirErro(mensagem: string | undefined): never {
  const codigo = (Object.keys(ERROS_AGENDA) as CodigoErroAgenda[]).find((c) => mensagem?.includes(c));
  if (codigo) throw new ErroAgenda(codigo);
  throw new Error(`Falha no banco de agendamentos: ${mensagem ?? "erro desconhecido"}`);
}

export async function listarHorarios(servicoId: string, data: string): Promise<string[]> {
  const { data: linhas, error } = await supabaseServidor().rpc("get_available_slots", {
    p_service_id: servicoId,
    p_date: data,
  });
  if (error) traduzirErro(error.message);
  // Funções com uma única coluna de saída podem vir como escalares ou objetos,
  // conforme a versão do PostgREST — aceitamos os dois formatos.
  return ((linhas ?? []) as (string | { slot_start: string })[]).map((l) =>
    new Date(typeof l === "string" ? l : l.slot_start).toISOString(),
  );
}

export async function resumoDoMes(servicoId: string, mes: string): Promise<{ data: string; livres: number }[]> {
  const { data: linhas, error } = await supabaseServidor().rpc("get_month_availability", {
    p_service_id: servicoId,
    p_month: `${mes}-01`,
  });
  if (error) traduzirErro(error.message);
  return ((linhas ?? []) as { day: string; free_slots: number }[]).map((l) => ({ data: l.day, livres: l.free_slots }));
}

export async function criarReserva(entrada: {
  servicoId: string;
  inicio: string;
  nome: string;
  telefone: string;
  observacoes: string;
  ip: string | null;
}): Promise<ReservaCriada> {
  const { data, error } = await supabaseServidor()
    .rpc("create_booking", {
      p_service_id: entrada.servicoId,
      p_starts_at: entrada.inicio,
      p_name: entrada.nome,
      p_phone: entrada.telefone,
      p_notes: entrada.observacoes,
      p_ip_hash: entrada.ip ? hashIp(entrada.ip) : null,
    })
    .single();
  if (error) traduzirErro(error.message);
  const r = data as { id: string; code: string; status: StatusReserva; starts_at: string; service_name: string };
  return { id: r.id, codigo: r.code, status: r.status, inicio: new Date(r.starts_at).toISOString(), servico: r.service_name };
}

export async function consultarReserva(codigo: string, telefone: string) {
  const { data, error } = await supabaseServidor().rpc("get_booking_status", {
    p_code: codigo,
    p_phone: telefone,
  });
  if (error) traduzirErro(error.message);
  const r = ((data ?? []) as { code: string; status: StatusReserva; starts_at: string; service_name: string; client_first_name: string }[])[0];
  if (!r) return null;
  return {
    codigo: r.code,
    status: r.status,
    inicio: new Date(r.starts_at).toISOString(),
    servico: r.service_name,
    primeiroNome: r.client_first_name,
  };
}

function hashIp(ip: string): string {
  const sal = process.env.BOOKING_HASH_SALT ?? "";
  return createHash("sha256").update(`${sal}:${ip}`).digest("hex").slice(0, 32);
}
