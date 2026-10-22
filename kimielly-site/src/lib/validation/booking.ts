import { z } from "zod";

/** Validações compartilhadas entre o formulário (cliente) e as rotas de API (servidor). */

const somenteDigitos = (v: string) => v.replace(/\D/g, "");

export const dataISO = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.");

export const servicoId = z
  .string()
  .min(1, "Escolha um serviço.")
  .max(60)
  .regex(/^[a-z0-9-]+$/, "Serviço inválido.");

export const nomeSchema = z
  .string()
  .trim()
  .min(3, "Informe seu nome completo.")
  .max(120, "O nome pode ter no máximo 120 caracteres.")
  .refine((v) => v.split(/\s+/).filter(Boolean).length >= 2, "Informe nome e sobrenome.");

export const telefoneSchema = z
  .string()
  .trim()
  .refine((v) => {
    const d = somenteDigitos(v);
    return d.length === 11 && d[2] === "9";
  }, "Informe um celular com DDD, por exemplo (51) 98765-4321.");

export const observacoesSchema = z
  .string()
  .trim()
  .max(500, "As observações podem ter no máximo 500 caracteres.")
  .optional()
  .default("");

export const dadosClienteSchema = z.object({
  nome: nomeSchema,
  telefone: telefoneSchema,
  observacoes: observacoesSchema,
  consentimento: z
    .boolean()
    .refine((v) => v === true, "É preciso autorizar o uso dos dados para concluir o agendamento."),
});

export const criarAgendamentoSchema = dadosClienteSchema.extend({
  servicoId,
  inicio: z.string().datetime({ offset: true, message: "Horário inválido." }),
  /** Campo-armadilha anti-spam: precisa chegar vazio. */
  site: z.string().max(500).optional().default(""),
  /** Momento em que o formulário foi aberto (ms). Envios rápidos demais são bloqueados. */
  iniciadoEm: z.number().int().positive(),
});

export const consultarStatusSchema = z.object({
  codigo: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^KW-[A-Z0-9]{6}$/, "Código inválido. Use o formato KW-XXXXXX."),
  telefone: telefoneSchema,
});

export type DadosCliente = z.input<typeof dadosClienteSchema>;
export type CriarAgendamentoInput = z.output<typeof criarAgendamentoSchema>;

export function normalizarTelefone(v: string): string {
  return somenteDigitos(v);
}

/** Converte erros do Zod em { campo: mensagem } (primeira mensagem de cada campo). */
export function errosPorCampo(erro: z.ZodError): Record<string, string> {
  const saida: Record<string, string> = {};
  for (const issue of erro.issues) {
    const campo = String(issue.path[0] ?? "geral");
    if (!saida[campo]) saida[campo] = issue.message;
  }
  return saida;
}
