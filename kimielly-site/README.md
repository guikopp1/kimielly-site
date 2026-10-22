# Site — Kimiélly Wegner · Maquiagem & Estética

Site multipágina com agendamento online real para **Kimiélly Wegner** (estética, cosmetologia e maquiagem — Vera Cruz/RS).

- **Stack:** Next.js (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Postgres) · Zod · Lucide
- **Páginas:** `/` Início · `/sobre` · `/servicos` · `/portfolio` · `/agendamento` · `/agendamento/status` · `/privacidade`
- **Tudo que é editável fica em um arquivo:** [`src/config/site.ts`](src/config/site.ts)

---

## 1. O que foi confirmado e o que falta

Fontes consultadas em 21/10/2026: perfil [@kimielly.maquiadora_estetica](https://www.instagram.com/kimielly.maquiadora_estetica/) e o link da bio (`bio.site/kimiellywegner.estetica`).

| Informação | Situação | Onde editar |
|---|---|---|
| Nome, assinatura “Maquiagem & Estética”, frase “Realçando sua beleza natural com amor” | ✅ confirmado | `profissional` |
| Cidade: Vera Cruz – RS · “Atendimento com horário marcado” | ✅ confirmado | `endereco`, `atendimento` |
| WhatsApp (51) 98460-1929 | ✅ publicado no bio.site | `contato.whatsapp` |
| Serviços: maquiagem, design de sobrancelhas, brow lamination, cílios, lash lifting, Hidragloss, limpeza de pele, massagens, drenagem | ✅ destaques do Instagram + bio.site | `servicos` |
| Identidade visual (preto, dourado, monograma KW, fundo linho) | ✅ referência do perfil | `src/app/globals.css` |
| **Preços** | ❌ não públicos → site mostra “Consulte valores” | `servicos[].preco` |
| **Durações** | ❌ provisórias (só usadas pela agenda, não aparecem no site) | `servicos[].duracaoMinutos` + `duracaoConfirmada` |
| **Horários de funcionamento** | ❌ provisórios no banco (ter–sex 9h–12h/13h30–19h, sáb 8h–14h) | tabela `business_hours` + `atendimento.horarios` |
| **Endereço completo** | ❌ não público → mapa mostra a cidade; botão “Pedir endereço” | `endereco` |
| **Biografia, formação, fotos (retrato, espaço, portfólio, serviços)** | ❌ blocos “A preencher” | `profissional`, `portfolio` |
| Técnica do serviço “Cílios” (extensão? volume?) | ⚠️ confirmar nome oficial | `servicos` |

**Observações para a profissional**
- O bio.site aponta para outros perfis (`@kimielly.estetica`, `@kimiellywegner.estetica`). O site usa o perfil oficial informado no briefing; ajuste se necessário.
- Várias produções foram marcadas com o **Espaço Rosy Roesch (Vera Cruz)**. Se for o local de atendimento, informe o endereço em `endereco` e o nome em `endereco.espaco`.
- As descrições dos serviços são textos gerais sobre cada procedimento. Revise-as com a Kimiélly.
- **Fotos:** o Instagram só entrega versões de até ~640 px e muitas mostram clientes. Por isso nenhuma foto foi copiada: peça os arquivos originais e use **apenas fotos com autorização da cliente** (`autorizada: true`). O site nunca usa banco de imagens no lugar dos trabalhos dela.

Quando tudo estiver preenchido, mude `mostrarPendencias` para `false` — os blocos tracejados “A preencher” somem.

---

## 2. Rodar localmente

Requisitos: **Node 22.6+** e uma conta gratuita no [Supabase](https://supabase.com).

```bash
npm install
cp .env.example .env.local    # preencha as variáveis (ver seção 3)
npm run dev                   # http://localhost:3000
```

Sem o Supabase configurado, o site funciona normalmente e a página de agendamento mostra “Agenda online em configuração” com o botão do WhatsApp. **Nenhuma reserva é simulada.**

---

## 3. Configurar o Supabase (agendamento)

1. Crie um projeto em supabase.com (região **South America — São Paulo**).
2. Abra **SQL Editor** e execute, nesta ordem:
   - `supabase/migrations/20261021000000_agendamento.sql` (tabelas, regras, funções, RLS)
   - `supabase/seed.sql` (serviços e horários **provisórios**)
   
   Ou, com a CLI: `supabase link --project-ref SEU_REF && supabase db push && supabase db reset --linked` (o reset aplica o seed — use só em projeto novo).
3. Em **Project Settings → API**, copie para o `.env.local`:
   - `SUPABASE_URL` → Project URL
   - `SUPABASE_SERVICE_ROLE_KEY` → chave **service_role / secret** (fica só no servidor)
   - `BOOKING_HASH_SALT` → qualquer texto aleatório longo (`openssl rand -hex 32`)
   - `NEXT_PUBLIC_SITE_URL` → o domínio final do site
4. Ajuste os horários reais (SQL Editor):
   ```sql
   delete from business_hours;
   insert into business_hours (weekday, opens_at, closes_at) values
     (2,'09:00','18:00'), (3,'09:00','18:00');   -- 0=dom … 6=sáb; vários intervalos por dia são permitidos
   update booking_settings set slot_interval_minutes = 30, min_notice_minutes = 120, max_days_ahead = 60;
   ```
5. Depois de editar serviços em `src/config/site.ts`: `npm run sync:services`.

### Como a Kimiélly gerencia a agenda (painel do Supabase)

- **Ver solicitações:** Table Editor → visão `agenda_proxima` (código, data, horário, cliente, telefone, status).
- **Confirmar:** tabela `bookings` → mude `status` para `confirmed`. A cliente vê “Confirmado” em `/agendamento/status`.
- **Recusar / cancelar:** `declined` ou `cancelled` — o horário volta a ficar livre na hora.
- **Bloquear um período (folga, feriado, curso):** tabela `time_off` → `starts_at`, `ends_at`, `reason`.
- **Confirmação automática:** `update booking_settings set requires_approval = false;` e `exigeConfirmacao: false` em `site.ts`.
- **Retenção (LGPD):** a função `purge_old_bookings(12)` apaga solicitações com mais de 12 meses. Para automatizar, ative a extensão `pg_cron` e rode:
  `select cron.schedule('limpar-agendamentos', '0 4 1 * *', 'select public.purge_old_bookings(12)');`

---

## 4. Arquitetura do agendamento

```
Navegador ──► /api/disponibilidade/mes   ─┐
          ──► /api/disponibilidade       ─┤  rotas do Next.js (servidor)
          ──► /api/agendamentos (POST)   ─┤  • validação Zod  • anti-spam
          ──► /api/agendamentos/status   ─┘  • service role key (env do servidor)
                                              │
                                              ▼
                      Supabase / Postgres: funções SECURITY DEFINER
                      get_available_slots · get_month_availability
                      create_booking · get_booking_status
```

- **Sem conflito de horário, nem com cliques simultâneos:** a tabela `bookings` tem uma restrição `EXCLUDE USING gist` que impede dois atendimentos ativos sobrepostos. Mesmo que duas pessoas confirmem o mesmo horário ao mesmo tempo, o banco aceita uma e recusa a outra (a segunda recebe “Este horário acabou de ser reservado”).
- **Validação no servidor:** `create_booking` recalcula os horários livres na hora e recusa datas passadas, fora do expediente, fora da grade de horários, além da janela de dias ou dentro de bloqueios.
- **RLS:** ligado em todas as tabelas, sem nenhuma política pública. O navegador não lê nem grava o banco diretamente; as funções só podem ser executadas pelo `service_role`.
- **Chaves:** a service role key só existe em variável de ambiente do servidor. O módulo `src/lib/supabase/server.ts` importa `server-only`, então o build falha se algum componente do navegador tentar usá-lo.
- **Anti-spam:** campo-armadilha invisível, tempo mínimo de preenchimento, limite por IP nas rotas, limite de 3 solicitações pendentes por telefone no banco. O IP é guardado apenas como hash com sal.
- **WhatsApp:** após a solicitação, o botão abre o WhatsApp com nome, serviço, data, horário e código preenchidos. O envio é sempre feito pela cliente.

---

## 5. Publicar (Vercel)

1. Suba o projeto para um repositório no GitHub.
2. Em [vercel.com](https://vercel.com) → **Add New Project** → importe o repositório (framework detectado: Next.js).
3. Em **Environment Variables**, cadastre as quatro variáveis do `.env.example`.
4. **Deploy.** Depois, em **Domains**, conecte o domínio e atualize `NEXT_PUBLIC_SITE_URL`.

Funciona também em qualquer hospedagem com Node (`npm run build && npm start`).

## 5b. Publicar na Cloudflare (Workers)

O projeto já vem com `wrangler.jsonc` e `open-next.config.ts` (adaptador [OpenNext](https://opennext.js.org/cloudflare)).

1. Suba o código para o GitHub.
2. Cloudflare → **Workers & Pages → Create → Import a repository** → escolha o repositório.
3. Build command: `npx @opennextjs/cloudflare build` · Deploy command: `npx @opennextjs/cloudflare deploy`.
4. Variáveis: em **Settings → Variables and Secrets**, cadastre `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (tipo *Secret*), `BOOKING_HASH_SALT` (*Secret*) e `NEXT_PUBLIC_SITE_URL`. Cadastre também `NEXT_PUBLIC_SITE_URL` em **Build → Variables**, porque ela é usada durante o build.
5. Domínio: **Settings → Domains & Routes → Add → Custom domain**.

Pelo terminal (alternativa): `npx wrangler login`, `npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY` (repita para as outras) e `npm run deploy:cf`.

---

## 6. Como editar o conteúdo

Tudo em `src/config/site.ts`:

- **Serviço novo:** copie um item de `servicos`, dê um `id` novo (letras minúsculas e hífens) e rode `npm run sync:services`.
- **Preço:** `preco: 120` (e opcional `precoPrefixo: "a partir de"`).
- **Fotos do portfólio:** salve em `public/images/portfolio/` e registre `{ src: "/images/portfolio/arquivo.jpg", alt: "...", categoria: "maquiagem", autorizada: true }`. Os filtros da galeria mostram só as categorias que têm fotos.
- **Endereço e mapa:** preencha `endereco.logradouro`, `bairro`, `cep` e, se quiser, `linkMapa` (Google Maps → Compartilhar → Copiar link).
- **Logo original:** salve em `public/brand/` e informe `profissional.logo`.

---

## 7. Testes realizados nesta entrega

O ambiente de desenvolvimento não tinha acesso ao registro do npm, então `npm install`/`next build` **não puderam ser executados aqui** — rode-os na primeira instalação. O que foi verificado:

- **Banco (Postgres 16, emulando os papéis do Supabase):** migration + seed aplicadas sem erro; `anon`/`authenticated` sem acesso a tabelas, funções e visão; horários corretos por dia; domingo, datas passadas, além de 60 dias e serviço inexistente sem horários; reserva duplicada, sobreposta, fora da grade e que ultrapassa o fechamento recusadas; bloqueios de agenda respeitados; limite de pendentes por telefone; consulta de status exige telefone correto; cancelar libera o horário; **duas reservas simultâneas do mesmo horário → uma aceita, a outra recusada pelo banco**.
- **Rotas de API** (executadas contra o banco real): disponibilidade, criação (201), conflito (409), armadilha e envio rápido (400), validação (422 em português), JSON inválido, limite por IP (429), consulta de status (200/404) e Supabase ausente (503).
- **Fluxo completo no navegador (Chromium, 390 px, toque):** escolher serviço → data (dias passados desabilitados) → horário → erros de validação com foco no primeiro campo → máscara do celular → revisão → editar e voltar mantendo dados → outra pessoa reserva o mesmo horário antes da confirmação → aviso e retorno ao calendário sem o horário ocupado → nova escolha → sucesso com código e “Aguardando confirmação” → mensagem do WhatsApp → consulta de status → “Confirmado” após a profissional confirmar no banco.
- **Validações Zod** testadas com a versão 4 real.
- **Layout:** todas as páginas renderizadas a 1366 px e 390 px sem rolagem horizontal; CSS compilado com Tailwind v4 real.
- **Segredos:** nenhuma chave no código; nenhum componente de navegador importa módulos de servidor.

### Checklist ao instalar

- [ ] `npm install && npm run typecheck && npm run build`
- [ ] Aplicar migration e seed no Supabase; configurar `.env.local`
- [ ] Fazer um agendamento de teste e confirmá-lo no painel
- [ ] Ajustar horários, durações e preços reais com a Kimiélly
- [ ] Adicionar fotos autorizadas e mudar `mostrarPendencias` para `false`
- [ ] Revisar a política de privacidade (prazo de retenção e textos)
