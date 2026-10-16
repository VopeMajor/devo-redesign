# Cloudflare — relatório de e9d2978 (infra/cloudflare)

```
evento=push ref=infra/cloudflare pedido=build modo=build
segredos ausentes: CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID DATABASE_URL BETTER_AUTH_SECRET
hyperdrive: não configurado (usa DATABASE_URL direto)
cron secret: não configurado (rota do cron fica aberta)
```

## Tamanho do Worker (wrangler deploy --dry-run)
```
linha=Total Upload: 10451.88 KiB / gzip: 2198.95 KiB
25316394	.wrangler-dist
total 24736
drwxr-xr-x  2 runner runner     4096 Oct 16 02:11 .
drwxr-xr-x 17 runner runner     4096 Oct 16 02:11 ..
-rw-r--r--  1 runner runner      105 Oct 16 02:11 README.md
-rw-r--r--  1 runner runner    57302 Oct 16 02:11 bundle-meta.json
-rw-r--r--  1 runner runner 10702725 Oct 16 02:11 worker.js
-rw-r--r--  1 runner runner 14556262 Oct 16 02:11 worker.js.map
```

Limite atual da Cloudflare (developers.cloudflare.com/workers/platform/limits): 64 MiB sem compressão,
nos planos Free e Paid; não há limite comprimido. (Antes eram 3 MiB/10 MiB comprimidos.)

## Maiores pacotes no bundle final
```
total   10448.8 KiB  (.wrangler-dist/bundle-meta.json)
  10278.2 KiB  .open-next/server-functions/default/handler.mjs
    124.4 KiB  .open-next/middleware/handler.mjs
     20.2 KiB  .open-next/cloudflare/images.js
     12.7 KiB  .open-next/middleware/open-next.config.mjs
      2.7 KiB  .open-next/cloudflare/init.js
      1.3 KiB  .open-next/cloudflare/skew-protection.js
      1.2 KiB  (app) cloudflare/worker.ts
      0.9 KiB  .open-next/worker.js
      0.2 KiB  .open-next/cloudflare/next-env.mjs
      0.2 KiB  (app) node-built-in-modules:node:stream/promises
      0.2 KiB  (app) node-built-in-modules:node:async_hooks
      0.2 KiB  (app) node-built-in-modules:node:timers/promises
      0.2 KiB  (app) node-built-in-modules:string_decoder
      0.2 KiB  (app) node-built-in-modules:worker_threads
      0.2 KiB  (app) node-built-in-modules:node:fs/promises
      0.2 KiB  (app) node-built-in-modules:node:inspector
      0.2 KiB  (app) node-built-in-modules:node:stream
      0.2 KiB  (app) node-built-in-modules:node:stream/web
      0.2 KiB  (app) node-built-in-modules:node:buffer
      0.2 KiB  .open-next/.build/durable-objects/sharded-tag-cache.js
      0.2 KiB  .open-next/.build/durable-objects/bucket-cache-purge.js
      0.2 KiB  (app) node-built-in-modules:node:crypto
      0.2 KiB  (app) node-built-in-modules:node:timers
      0.2 KiB  (app) node-built-in-modules:node:https
      0.2 KiB  (app) node-built-in-modules:async_hooks
      0.2 KiB  (app) node-built-in-modules:node:path
      0.2 KiB  (app) node-built-in-modules:node:zlib
      0.2 KiB  (app) node-built-in-modules:node:http
      0.2 KiB  (app) node-built-in-modules:node:util
      0.2 KiB  (app) node-built-in-modules:util/types
      0.2 KiB  (app) node-built-in-modules:node:net
      0.2 KiB  (app) node-built-in-modules:node:tls
      0.2 KiB  (app) node-built-in-modules:node:os
      0.2 KiB  (app) node-built-in-modules:node:fs
      0.2 KiB  (app) node-built-in-modules:crypto
      0.2 KiB  (app) node-built-in-modules:events
      0.2 KiB  (app) node-built-in-modules:stream
      0.2 KiB  (app) node-built-in-modules:buffer
      0.2 KiB  (app) node-built-in-modules:module
```
## Inicialização
```
│ Bundle: 10451.88 KiB / gzip: 2198.95 KiB
│   Profile window: 192.9 ms
│   Sampled time: 188.2 ms
│   Active: 34.6 ms (including 1.1 ms garbage collection)
│   Idle: 153.6 ms
│ CPU Profile has been written to worker-startup.cpuprofile. Load it into the Chrome DevTools profiler (or directly in VSCode) to view a flamegraph.
│ Note that the CPU Profile was measured on your Worker running locally on your machine, which has a different CPU than when your Worker runs on Cloudflare.
│ As such, CPU Profile can be used to understand where time is spent at startup, but the overall startup time in the profile should not be expected to exactly match what your Worker's startup time will be when deploying to Cloudflare.
```
## Avisos do build
```
⚠ No build cache found. Please configure build caching for faster rebuilds. Read more: https://nextjs.org/docs/messages/no-cache
[2m2026-10-16T02:11:23.250Z[0m [33mWARN[0m [1m[Better Auth]:[0m [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.
[Error [BetterAuthError]: You are using the default secret. Please set `BETTER_AUTH_SECRET` in your environment variables or pass `secret` in your auth config.]
[2m2026-10-16T02:11:23.327Z[0m [33mWARN[0m [1m[Better Auth]:[0m [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.
[Error [BetterAuthError]: You are using the default secret. Please set `BETTER_AUTH_SECRET` in your environment variables or pass `secret` in your auth config.]
[2m2026-10-16T02:11:23.355Z[0m [33mWARN[0m [1m[Better Auth]:[0m [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.
[Error [BetterAuthError]: You are using the default secret. Please set `BETTER_AUTH_SECRET` in your environment variables or pass `secret` in your auth config.]
[2m2026-10-16T02:11:23.530Z[0m [33mWARN[0m [1m[Better Auth]:[0m [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.
[Error [BetterAuthError]: You are using the default secret. Please set `BETTER_AUTH_SECRET` in your environment variables or pass `secret` in your auth config.]
```
## Deploy
```
sem deploy
```
