#!/usr/bin/env bash
# Gera scripts/devo-banco-novo.sql: TODAS as migrações em ordem, sem dados de teste, para criar um banco
# de produção do zero (Neon novo). Rodar de novo sempre que uma migração for criada ou alterada:
#
#   bash scripts/dev/gerar-banco-novo.sh            # escreve scripts/devo-banco-novo.sql
#   bash scripts/dev/gerar-banco-novo.sh /tmp/x.sql # escreve em outro lugar (o CI usa para conferir)
#
# A ordem é a mesma do .github/workflows/capturas.yml (passo "Banco de teste"), sem o 90-seed.sql.
# Migração nova: acrescente aqui E no capturas.yml (e em scripts/dev/local-db.mjs).
set -euo pipefail
cd "$(dirname "$0")/../.."
OUT="${1:-scripts/devo-banco-novo.sql}"
FILES=(
  scripts/dev/00-base.sql
  scripts/deadly-votes-migration.sql
  scripts/deadly-votes-group-migration.sql
  scripts/auth-migration.sql
  scripts/arcade-migration.sql
  scripts/arcade-points-migration.sql
  scripts/arcade-rooms-migration.sql
  scripts/test-accounts-migration.sql
  scripts/character-name-migration.sql
  scripts/fundacao-migration.sql
  scripts/poco-migration.sql
  scripts/staff-migration.sql
  scripts/torres-migration.sql
  scripts/salao-migration.sql
  scripts/cosmeticos-migration.sql
  scripts/virtudes-migration.sql
  scripts/corporacoes-migration.sql
  scripts/narrativa-migration.sql
  scripts/calendario-migration.sql
  scripts/cartas-raridade-migration.sql
  scripts/dv-recompensas-migration.sql
  scripts/casa-migration.sql
  scripts/arcanos-estagios-migration.sql
  scripts/kit-inicial-migration.sql
  scripts/dv-peso-migration.sql
  scripts/corp-brasao-migration.sql
)
{
  echo "-- DEVO — banco novo de produção (gerado; NÃO editar à mão)."
  echo "-- Gerado por scripts/dev/gerar-banco-novo.sh a partir de todas as migrações, em ordem, sem dados de teste."
  echo "-- Para gerar de novo: bash scripts/dev/gerar-banco-novo.sh"
  echo "-- Aplicar num banco vazio: psql \"\$DATABASE_URL\" -v ON_ERROR_STOP=1 -f scripts/devo-banco-novo.sql"
  echo "-- Idempotente: rodar duas vezes não quebra."
  echo "-- Depois de criar o banco, gere o primeiro convite de Owner, por exemplo:"
  echo "--   INSERT INTO invite_codes (code, role, note) VALUES ('DEVO-XXXX-XXXX', 'owner', 'primeiro owner');"
  for f in "${FILES[@]}"; do
    echo
    echo "-- ============================================================================================="
    echo "-- $f"
    echo "-- ============================================================================================="
    cat "$f"
    echo
  done
} > "$OUT"
echo "gerado: $OUT (${#FILES[@]} arquivos)"
