#!/usr/bin/env bash
set -euo pipefail

cd /app/backend

API_PORT="${API_PORT:-8000}"
AUTH_PORT="${AUTH_PORT:-8001}"

echo "Verificando contas de demonstração..."
python seed_demo.py || echo "Aviso: não foi possível criar/verificar as contas de demonstração."

pids=()

cleanup() {
    if [ "${#pids[@]}" -gt 0 ]; then
        kill "${pids[@]}" 2>/dev/null || true
    fi
    wait 2>/dev/null || true
}
trap cleanup SIGTERM SIGINT

python -m uvicorn main:app --host 0.0.0.0 --port "$API_PORT" &
pids+=("$!")
echo "API principal (main:app) iniciada na porta $API_PORT"

if [ "${ENABLE_AUTH_API:-true}" = "true" ]; then
    python -m uvicorn auth_api:app --host 0.0.0.0 --port "$AUTH_PORT" &
    pids+=("$!")
    echo "API de autenticação (auth_api:app) iniciada na porta $AUTH_PORT"
fi

set +e
wait -n "${pids[@]}"
status=$?
set -e

echo "Um dos processos terminou (status=$status). Encerrando o container..."
cleanup
exit "$status"
