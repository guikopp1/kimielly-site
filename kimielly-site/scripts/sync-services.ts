/**
 * Sincroniza os serviços de src/config/site.ts com a tabela `services` do Supabase.
 *   npm run sync:services
 * Requer Node 22.6+ (suporte a TypeScript nativo) e o arquivo .env.local preenchido.
 * Serviços removidos do arquivo são DESATIVADOS no banco (não apagados), para
 * preservar o histórico de reservas.
 */
import { readFileSync, existsSync } from "node:fs";
import { site } from "../src/config/site.ts";

for (const arquivo of [".env.local", ".env"]) {
  if (!existsSync(arquivo)) continue;
  for (const linha of readFileSync(arquivo, "utf8").split("\n")) {
    const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const url = process.env.SUPABASE_URL;
const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !chave) {
  console.error("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local");
  process.exit(1);
}

const cabecalhos = {
  apikey: chave,
  Authorization: `Bearer ${chave}`,
  "Content-Type": "application/json",
};

const linhas = site.servicos.map((s, i) => ({
  id: s.id,
  name: s.nome,
  duration_minutes: s.duracaoMinutos,
  buffer_minutes: s.intervaloAposMinutos,
  active: s.agendavel,
  sort_order: i + 1,
}));

const upsert = await fetch(`${url}/rest/v1/services?on_conflict=id`, {
  method: "POST",
  headers: { ...cabecalhos, Prefer: "resolution=merge-duplicates,return=minimal" },
  body: JSON.stringify(linhas),
});
if (!upsert.ok) {
  console.error("Falha ao gravar serviços:", upsert.status, await upsert.text());
  process.exit(1);
}

const ids = linhas.map((l) => `"${l.id}"`).join(",");
const desativar = await fetch(`${url}/rest/v1/services?id=not.in.(${ids})`, {
  method: "PATCH",
  headers: { ...cabecalhos, Prefer: "return=representation" },
  body: JSON.stringify({ active: false }),
});
const removidos = desativar.ok ? ((await desativar.json()) as { id: string }[]) : [];

console.log(`✓ ${linhas.length} serviços sincronizados.`);
if (removidos.length) console.log(`  Desativados: ${removidos.map((r) => r.id).join(", ")}`);
