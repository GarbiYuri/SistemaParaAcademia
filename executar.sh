#!/usr/bin/env bash
# ============================================================
# FATECFit — inicia MariaDB local + APIs FastAPI + frontend Vite
# Uso: ./executar.sh
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP="$ROOT/SistemaParaAcademia"
MV="$HOME/.local/mariadb"
DATA="$HOME/.local/mariadb-data"
RUN="/tmp/opencode"
mkdir -p "$RUN"

porta_aberta() {
  ss -ltn 2>/dev/null | grep -q "127.0.0.1:$1"
}

if [ ! -x "$MV/bin/mariadbd" ]; then
  echo "✖ MariaDB local não encontrado em $MV"
  echo "  Reinstale o tarball do MariaDB ou ajuste o caminho neste script."
  exit 1
fi

if [ ! -d "$DATA" ]; then
  echo "▶ Inicializando diretório de dados do MariaDB…"
  "$MV/scripts/mariadb-install-db" --basedir="$MV" --datadir="$DATA" \
    --auth-root-authentication-method=normal --skip-test-db >"$RUN/install-db.log" 2>&1
fi

if ! porta_aberta 3306; then
  echo "▶ Iniciando MariaDB (127.0.0.1:3306)…"
  nohup "$MV/bin/mariadbd" \
    --basedir="$MV" --datadir="$DATA" \
    --port=3306 --bind-address=127.0.0.1 \
    --socket="$RUN/mariadb.sock" --pid-file="$RUN/mariadb.pid" \
    --log-error="$RUN/mariadb-error.log" >"$RUN/mariadb.out" 2>&1 &
  for _ in $(seq 1 30); do
    porta_aberta 3306 && break
    sleep 1
  done
fi

if ! porta_aberta 8000; then
  echo "▶ Iniciando API FastAPI (127.0.0.1:8000)…"
  cd "$APP/backend"
  nohup "$APP/.venv/bin/python" -m uvicorn main:app --host 127.0.0.1 --port 8000 \
    >"$RUN/backend.log" 2>&1 &
  cd "$ROOT"
fi

if ! porta_aberta 8001; then
  echo "▶ Iniciando API de autenticação do portal (127.0.0.1:8001)…"
  cd "$APP/backend"
  nohup "$APP/.venv/bin/python" -m uvicorn auth_api:app --host 127.0.0.1 --port 8001 \
    >"$RUN/auth.log" 2>&1 &
  cd "$ROOT"
fi

if ! porta_aberta 5173; then
  echo "▶ Iniciando frontend Vite (127.0.0.1:5173)…"
  cd "$APP/frontend"
  nohup npm run dev >"$RUN/frontend.log" 2>&1 &
  cd "$ROOT"
fi

sleep 3
echo
echo "✅ FATECFit no ar:"
echo "   Frontend:  http://127.0.0.1:5173"
echo "   Portal:    http://127.0.0.1:5173/login"
echo "   API/docs:  http://127.0.0.1:8000/docs"
echo "   Auth/docs: http://127.0.0.1:8001/docs"
echo
echo "   Logs: $RUN/{mariadb-error.log,backend.log,auth.log,frontend.log}"
