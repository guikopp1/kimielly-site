import type { Metadata } from "next";
import { exigirAdmin } from "@/lib/admin/sessao";
import { listarAgendamentos, type AgendamentoAdmin } from "@/lib/admin/agendamentos";
import { supabaseConfigurado } from "@/lib/supabase/server";
import { PainelAgenda } from "@/components/admin/PainelAgenda";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Agenda",
  robots: { index: false, follow: false },
};

export default async function PainelAdmin() {
  await exigirAdmin();

  let agendamentos: AgendamentoAdmin[] = [];
  let falha: string | null = null;
  if (!supabaseConfigurado()) {
    falha = "O banco de agendamentos não está configurado. Verifique SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY na Cloudflare.";
  } else {
    try {
      agendamentos = await listarAgendamentos();
    } catch (e) {
      console.error("[admin]", e);
      falha = "Não foi possível carregar os agendamentos agora. Recarregue a página em instantes.";
    }
  }

  return <PainelAgenda agendamentosIniciais={agendamentos} falha={falha} geradoEm={new Date().toISOString()} />;
}
