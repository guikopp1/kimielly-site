import "server-only";
import { supabaseServidor } from "@/lib/supabase/server";
import type { StatusReserva } from "@/lib/booking/repository";

export type AgendamentoAdmin = {
  id: string;
  codigo: string;
  servico: string;
  cliente: string;
  telefone: string;
  observacoes: string | null;
  inicio: string;
  fim: string;
  status: StatusReserva;
  criadoEm: string;
};

type Linha = {
  id: string;
  code: string;
  service_name: string;
  client_name: string;
  client_phone: string;
  notes: string | null;
  starts_at: string;
  blocks_until: string;
  status: StatusReserva;
  created_at: string;
};

/** Agendamentos dos últimos 60 dias em diante (o painel separa em abas). */
export async function listarAgendamentos(): Promise<AgendamentoAdmin[]> {
  const desde = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabaseServidor()
    .from("bookings")
    .select("id, code, service_name, client_name, client_phone, notes, starts_at, blocks_until, status, created_at")
    .gte("starts_at", desde)
    .order("starts_at", { ascending: true })
    .limit(1000);
  if (error) throw new Error(`Falha ao listar agendamentos: ${error.message}`);
  return ((data ?? []) as Linha[]).map((l) => ({
    id: l.id,
    codigo: l.code,
    servico: l.service_name,
    cliente: l.client_name,
    telefone: l.client_phone,
    observacoes: l.notes,
    inicio: new Date(l.starts_at).toISOString(),
    fim: new Date(l.blocks_until).toISOString(),
    status: l.status,
    criadoEm: new Date(l.created_at).toISOString(),
  }));
}

/** Mudanças de status permitidas no painel. */
export const TRANSICOES: Record<StatusReserva, StatusReserva[]> = {
  pending: ["confirmed", "declined", "cancelled"],
  confirmed: ["cancelled"],
  declined: [],
  cancelled: [],
};

export class TransicaoInvalida extends Error {}
export class AgendamentoNaoEncontrado extends Error {}

export async function alterarStatus(id: string, novo: StatusReserva): Promise<AgendamentoAdmin["status"]> {
  const db = supabaseServidor();
  const { data: atual, error: erroBusca } = await db.from("bookings").select("status").eq("id", id).maybeSingle();
  if (erroBusca) throw new Error(erroBusca.message);
  if (!atual) throw new AgendamentoNaoEncontrado("Agendamento não encontrado.");
  const de = (atual as { status: StatusReserva }).status;
  if (!TRANSICOES[de].includes(novo)) {
    throw new TransicaoInvalida("Este agendamento já foi atualizado. Recarregue a página.");
  }
  // `.eq("status", de)` evita sobrescrever uma alteração feita ao mesmo tempo em outro aparelho
  const { data, error } = await db
    .from("bookings")
    .update({ status: novo })
    .eq("id", id)
    .eq("status", de)
    .select("status");
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new TransicaoInvalida("Este agendamento já foi atualizado. Recarregue a página.");
  return novo;
}
