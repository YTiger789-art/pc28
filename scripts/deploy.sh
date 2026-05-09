#!/usr/bin/env bash
set -euo pipefail

echo "[1/3] Installing dependencies..."
npm ci

echo "[2/3] Starting server with nohup..."
nohup npm start > pc28.out.log 2> pc28.err.log &

echo "[3/3] Done. PID: $!"
echo "Open: http://localhost:3000"
