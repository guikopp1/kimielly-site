import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase usado SOMENTE no servidor (rotas /api).
 * A service role key nunca é enviada ao navegador: o import "server-only"
 * faz o build falhar se este arquivo for importado por um componente cliente.
 */
let cliente: SupabaseClient | null = null;

export function supabaseConfigurado(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function supabaseServidor(): SupabaseClient {
  if (!supabaseConfigurado()) {
    throw new AgendaNaoConfigurada();
  }
  if (!cliente) {
    cliente = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { "x-application-name": "site-kimielly" } },
    });
  }
  return cliente;
}

export class AgendaNaoConfigurada extends Error {
  constructor() {
    super("Supabase não configurado (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ausentes).");
    this.name = "AgendaNaoConfigurada";
  }
}
