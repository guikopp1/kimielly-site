"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { Botao } from "@/components/ui/primitives";

export function FormLogin() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const entrar = async (e: FormEvent) => {
    e.preventDefault();
    if (!senha) {
      setErro("Digite a senha.");
      return;
    }
    setEnviando(true);
    setErro(null);
    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha }),
      });
      const corpo = await r.json().catch(() => null);
      if (r.ok && corpo?.ok) {
        router.replace("/admin");
        router.refresh();
        return;
      }
      setErro(corpo?.mensagem ?? "Não foi possível entrar.");
    } catch {
      setErro("Sem conexão. Verifique a internet e tente de novo.");
    }
    setEnviando(false);
  };

  return (
    <form onSubmit={entrar} noValidate className="space-y-5">
      <div>
        <label htmlFor="senha" className="mb-2 block text-sm font-medium">
          Senha
        </label>
        <div className="relative">
          <input
            id="senha"
            type={mostrar ? "text" : "password"}
            autoComplete="current-password"
            autoFocus
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            aria-invalid={Boolean(erro)}
            aria-describedby={erro ? "erro-senha" : undefined}
            className="block min-h-13 w-full border border-ink/20 bg-paper px-4 pr-12 focus:border-ink focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setMostrar((v) => !v)}
            className="absolute inset-y-0 right-0 inline-flex w-12 items-center justify-center text-taupe hover:text-ink"
            aria-label={mostrar ? "Ocultar senha" : "Mostrar senha"}
          >
            {mostrar ? <EyeOff className="size-5" strokeWidth={1.5} /> : <Eye className="size-5" strokeWidth={1.5} />}
          </button>
        </div>
        {erro && (
          <p id="erro-senha" role="alert" className="mt-2 flex items-center gap-1.5 text-sm text-danger">
            <AlertCircle className="size-4 shrink-0" strokeWidth={1.6} aria-hidden /> {erro}
          </p>
        )}
      </div>
      <Botao type="submit" className="w-full" disabled={enviando} aria-busy={enviando}>
        {enviando ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        {enviando ? "Entrando…" : "Entrar"}
      </Botao>
    </form>
  );
}
