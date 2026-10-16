# Deploy do DEVO na Cloudflare (Workers + OpenNext)

O DEVO sai da Vercel/v0 e passa a rodar como um **Cloudflare Worker** gerado pelo
[OpenNext](https://opennext.js.org/cloudflare). O banco continua no **Neon**. O endereço fica no
subdomínio grátis:

```
https://devo.<seu-subdominio>.workers.dev
```

Quem faz build e deploy é a própria Cloudflare (**Workers Builds**): você conecta o repositório do
GitHub no painel uma vez e cada push na branch de produção publica sozinho. Você não precisa instalar
nada no computador nem criar token de API.

---

## Resumo do que você vai fazer (uma vez)

1. Criar a conta na Cloudflare e escolher o subdomínio `workers.dev`.
2. Conectar o repositório `VopeMajor/devo-redesign` no painel (Workers Builds).
3. Cadastrar os segredos do app no Worker.
4. (Opcional) Criar o Hyperdrive para o Neon e me mandar o ID.

---

## 1. Conta e subdomínio `workers.dev`

1. Crie a conta em <https://dash.cloudflare.com/sign-up> (o plano Free serve para começar).
2. No painel, abra **Workers e Pages** (Compute → Workers). Na primeira visita a Cloudflare pede para
   escolher o **subdomínio** da conta (ex.: `vope`). O app vai ficar em `https://devo.vope.workers.dev`.

## 2. Conectar o GitHub (Workers Builds)

1. **Workers e Pages** → **Create** → aba **Workers** → **Import a repository**.
2. **Connect GitHub** → autorize o app da Cloudflare na conta **VopeMajor** e dê acesso ao repositório
   **devo-redesign**. Selecione-o.
3. Preencha a configuração:

| Campo | Valor |
| --- | --- |
| Project name | `devo` (tem que ser exatamente este; é o `name` do `wrangler.jsonc`) |
| Production branch | `redesign` (a versão nova do DEVO; troque para `main` quando o redesign for mesclado lá) |
| Build command | `pnpm exec opennextjs-cloudflare build` |
| Deploy command | `pnpm exec wrangler deploy` |
| Non-production branch deploy command | `pnpm exec wrangler versions upload` |
| Root directory | `/` (deixe em branco) |

4. Em **Advanced settings → Build variables**, acrescente `NEXT_TELEMETRY_DISABLED` = `1`.
   (Opcional: `NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN` com o token do Web Analytics, se quiser estatísticas.)
5. **Deploy**. O primeiro build leva alguns minutos. Ele vai subir, mas o jogo só funciona depois do
   passo 3 (sem banco e sem segredo de login a página dá erro).

## 3. Segredos do app (no Worker)

Painel → Workers → **devo** → **Settings** → **Variables and Secrets** → **Add**:

| Nome | Tipo | Valor |
| --- | --- | --- |
| `DATABASE_URL` | Secret | a connection string do Neon que o app usa hoje (a mesma da Vercel/v0) |
| `BETTER_AUTH_SECRET` | Secret | **o mesmo valor que está na Vercel** (se mudar, todo mundo é deslogado) |
| `CRON_SECRET` | Secret | qualquer texto longo aleatório; protege `/api/cron/pulse` |
| `DEVO_PUBLIC_URL` | Text | `https://devo.<seu-subdominio>.workers.dev` |

Para pegar os valores atuais: projeto na Vercel → **Settings** → **Environment Variables** (ou o
painel de variáveis do v0). Depois de salvar, vá em **Deployments** e faça **Retry deployment** do
último deploy (ou dê qualquer push na branch) para o Worker subir já com os segredos.

O `wrangler.jsonc` tem `keep_vars: true`, então os deploys automáticos não apagam o que você cadastrou.

## 4. Hyperdrive para o Neon (opcional, recomendado)

O Hyperdrive mantém conexões quentes com o Neon perto do Worker; sem ele cada requisição abre uma
conexão nova até o Neon (funciona, só é mais lento).

1. No **Neon** (<https://console.neon.tech>): **Connection Details** → **desmarque "Connection pooling"**
   (o Hyperdrive precisa do host direto, sem `-pooler`) e copie a connection string.
2. Na **Cloudflare**: **Storage & databases** → **Hyperdrive** → **Create configuration** → nome
   `devo-neon` → cole a connection string.
3. **Desligue o cache de consultas** ("Caching" desativado). Obrigatório: o cache guarda `SELECT` por até
   60 s e quebraria sessão, saves, salas do arcade e votos.
4. Copie o **ID** da configuração e me mande (não é segredo). Eu ligo no `wrangler.jsonc` e o próximo
   deploy já passa a usar.

## Verificação do build no GitHub

O workflow `.github/workflows/cloudflare.yml` só confere o build (tamanho do Worker, avisos,
inicialização) a cada push na branch `infra/cloudflare` ou quando disparado à mão. Ele **não publica**.
O relatório fica na branch `infra-logs/cloudflare`, arquivo `RELATORIO.md`. Último resultado: Worker
com ~10,4 MB (limite 64 MiB) e ~22 ms de CPU na inicialização.

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
- `.github/workflows/cloudflare.yml` — verificação do build e relatório (o deploy é do Workers Builds).
