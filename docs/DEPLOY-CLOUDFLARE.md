# Deploy do DEVO na Cloudflare (Workers + OpenNext)

O DEVO sai da Vercel/v0 e passa a rodar como um **Cloudflare Worker** gerado pelo
[OpenNext](https://opennext.js.org/cloudflare). O banco continua no **Neon**; a Cloudflare só muda a
forma de conectar (de preferência pelo **Hyperdrive**). O endereço fica no subdomínio grátis:

```
https://devo.<seu-subdominio>.workers.dev
```

Quem faz build e deploy é o GitHub Actions (`.github/workflows/cloudflare.yml`). Você não precisa
instalar nada no computador.

---

## Resumo do que você vai fazer (uma vez)

1. Criar a conta na Cloudflare e escolher o subdomínio `workers.dev`.
2. Criar um **token de API** e copiar o **Account ID**.
3. (Recomendado) Criar o **Hyperdrive** apontando para o Neon, **com cache desligado**.
4. Cadastrar os **segredos** no GitHub.
5. Disparar o workflow **Cloudflare** (ou dar merge em `main`).

---

## 1. Conta e subdomínio `workers.dev`

1. Crie a conta em <https://dash.cloudflare.com/sign-up> (plano Free serve para começar).
2. No painel, abra **Workers e Pages** (Compute → Workers). Na primeira visita a Cloudflare pede para
   escolher o **subdomínio** da conta (ex.: `vope`). O app vai ficar em `https://devo.vope.workers.dev`.
   Sem esse subdomínio o deploy sobe, mas não fica acessível.

## 2. Token de API e Account ID

**Account ID**: no painel, menu da conta (canto superior) → **Account home** → os três pontinhos ao
lado do nome da conta → **Copy account ID**. (Também aparece na barra lateral da página do Workers.)

**Token** (o GitHub usa para publicar):

1. Painel → **Manage account** → **Account API tokens** → **Create Token**.
2. Use o modelo **Edit Cloudflare Workers**.
3. Em **Account Resources**, deixe só a sua conta. Em **Zone Resources**, pode deixar
   "All zones" (não há domínio próprio) ou restringir.
4. Se for usar o Hyperdrive (passo 3), acrescente a permissão **Account · Hyperdrive · Edit**
   (para o deploy conseguir ligar o Worker ao Hyperdrive).
5. **Continue to summary** → **Create Token** → copie o token (ele só aparece uma vez).

## 3. Hyperdrive para o Neon (recomendado)

O Hyperdrive mantém conexões quentes com o Neon perto do Worker; sem ele cada requisição abre uma
conexão TLS nova até o Neon. O app funciona nos dois casos: se `HYPERDRIVE_ID` não estiver
configurado, ele usa `DATABASE_URL` direto.

1. No **Neon** (<https://console.neon.tech>): projeto do DEVO → **Roles** → **New Role**
   (ex.: `hyperdrive-user`), copie a senha. Dê a ela as mesmas permissões do usuário atual no banco
   (ou use o usuário dono do banco, se preferir). Em **Connection Details**, escolha esse role e
   **desmarque "Connection pooling"** (o Hyperdrive precisa do host direto, sem `-pooler`).
   Copie a connection string (`postgres://hyperdrive-user:SENHA@ep-....neon.tech/neondb?sslmode=require`).
2. Na **Cloudflare**: painel → **Storage & databases** → **Hyperdrive** → **Create configuration**.
   Nome `devo-neon`, cole a connection string.
3. **Desligue o cache de consultas** ("Caching" → desativado). Isso é obrigatório para o DEVO: o
   Hyperdrive guarda resultados de `SELECT` por até 60 s e não invalida quando há escrita, o que
   quebraria sessão, saves, salas do arcade e votos.
   - Pelo terminal (alternativa): `npx wrangler hyperdrive create devo-neon --connection-string="postgres://..." --caching-disabled`
4. Copie o **ID** da configuração (aparece na página dela). Ele vai para o GitHub como `HYPERDRIVE_ID`.

## 4. Segredos e variáveis no GitHub

Repositório → **Settings** → **Secrets and variables** → **Actions**.

**Secrets** (aba "Secrets" → **New repository secret**):

| Nome | Obrigatório | Valor |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | sim | token do passo 2 |
| `CLOUDFLARE_ACCOUNT_ID` | sim | Account ID do passo 2 |
| `DATABASE_URL` | sim | connection string do Neon que o app usa hoje (a mesma da Vercel). É o caminho usado quando não há Hyperdrive. |
| `BETTER_AUTH_SECRET` | sim | **o mesmo valor da Vercel** (se mudar, todo mundo é deslogado) |
| `CRON_SECRET` | recomendado | qualquer texto longo aleatório; protege `/api/cron/pulse` |
| `HYPERDRIVE_ID` | recomendado | ID do passo 3 (pode ser *variable* também; não é sigiloso) |

**Variables** (aba "Variables", todas opcionais):

| Nome | Para quê |
| --- | --- |
| `DEVO_PUBLIC_URL` | endereço público, ex. `https://devo.vope.workers.dev`. Se ficar vazio, o workflow descobre sozinho pelo subdomínio da conta. |
| `CF_WEB_ANALYTICS_TOKEN` | liga o Cloudflare Web Analytics (painel → Analytics & Logs → Web Analytics → Add a site → copie o token do snippet). Vazio = desligado. |

O workflow envia `DATABASE_URL`, `BETTER_AUTH_SECRET` e `CRON_SECRET` para o Worker como *secrets*
a cada deploy (`wrangler deploy --secrets-file`) e `DEVO_PUBLIC_URL` como variável. Nada disso fica no
repositório.

Para pegar os valores atuais da Vercel: projeto na Vercel → **Settings** → **Environment Variables**.

## 5. Publicar

- **Automático**: todo push/merge em `main` faz build + deploy de produção.
- **Manual**: GitHub → **Actions** → **Cloudflare** → **Run workflow** → escolha a branch e
  `producao` (publica) ou `somente-build` (só confere o build e mede o tamanho).

Sem os segredos obrigatórios o workflow não falha: ele só faz o build e a medição.

Cada execução publica um relatório (tamanho do Worker, avisos, log do deploy, teste rápido das
páginas) na branch **`infra-logs/cloudflare`**, arquivo `RELATORIO.md`.

Depois do primeiro deploy, abra `https://devo.<subdominio>.workers.dev`, faça login com uma conta
existente e confira o jogo. As chaves de notificação (VAPID) continuam as do banco, então as
inscrições de push que já existem seguem valendo.

## Cron (lembrete diário do pulso)

O cron da Vercel virou um **Cron Trigger** da Cloudflare (`wrangler.jsonc` → `triggers.crons`):
todo dia às **21:00 UTC (18:00 de Brasília)** o Worker chama `/api/cron/pulse` com
`Authorization: Bearer <CRON_SECRET>`. Para conferir: painel → Workers → `devo` → **Settings →
Triggers** (o cron aparece lá) e **Observability → Logs** (linha `[cron] ...`).

## Desenvolvimento local

Nada muda: `pnpm dev` (Next normal, usa `DATABASE_URL` do `.env.local`). Para testar no runtime da
Cloudflare: `pnpm preview` (builda com OpenNext e roda com `wrangler dev`; precisa de `DATABASE_URL`
no `.env.local`).

## Como reverter

- **Voltar uma versão na Cloudflare**: painel → Workers → `devo` → **Deployments** → escolha a versão
  anterior → **Rollback**. (Ou `npx wrangler rollback` com o token.)
- **Voltar para a Vercel**: o banco é o mesmo, então basta religar o projeto na Vercel (ele continua
  existindo enquanto você não apagar). Para a Vercel buildar este código de novo seria preciso reverter o
  merge desta migração (o `vercel.json` do cron e o `@vercel/analytics` foram removidos).
- **Desligar o Worker**: painel → `devo` → Settings → Domains & Routes → desative o `workers.dev`.

## Custos

| | Workers Free | Workers Paid (US$ 5/mês por conta) |
| --- | --- | --- |
| Requisições | 100.000/dia | 10 milhões/mês inclusos, depois US$ 0,30 por milhão |
| CPU por requisição | **10 ms** | até 5 min (padrão 30 s); 30 milhões de ms/mês inclusos |
| CPU por cron | 10 ms | 15 min |
| Subrequisições por requisição (fetch, push) | 50 | 10.000 |
| Tamanho do Worker | 64 MiB sem compressão | 64 MiB sem compressão |
| Hyperdrive | 100.000 consultas/dia | ilimitado |
| Cron Triggers | 5 por conta | 250 por conta |
| `workers.dev` e Web Analytics | grátis | grátis |

(Fonte: developers.cloudflare.com/workers/platform/limits e /pricing, outubro de 2026.)

O limite que mais pesa para um app Next.js no plano Free é o de **10 ms de CPU por requisição**:
renderizar páginas do Next (e a primeira requisição de um Worker "frio") costuma passar disso. A
Cloudflare tolera estouros ocasionais, mas se aparecer o erro **1102 "Worker exceeded resource
limits"** (painel → `devo` → Metrics → Errors), o caminho é o plano Paid. O cron também tem 10 ms no
Free e no máximo 50 envios de push por execução; com poucos jogadores isso basta.

O Neon continua com o plano dele, cobrado à parte como hoje.

## Arquivos envolvidos

- `wrangler.jsonc` — nome `devo`, `nodejs_compat`, `workers.dev`, assets, cron.
- `open-next.config.ts` — cache só leitura nos Static Assets (o app não usa ISR).
- `cloudflare/worker.ts` — entrada do Worker: `fetch` do OpenNext + `scheduled` do cron.
- `lib/db/index.ts` — conexão por requisição no Worker (Hyperdrive ou `DATABASE_URL`), pool global no Node.
- `lib/webpush.ts` — Web Push com Web Crypto (substitui o pacote `web-push`).
- `.github/workflows/cloudflare.yml` — build, medição, deploy e relatório.
