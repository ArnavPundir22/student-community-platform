#!/usr/bin/env bash

# Exit on error in setup steps
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=================================================="
echo "   🚀 Starting Student Community Platform"
echo "=================================================="
echo "Root directory: ${ROOT_DIR}"

# 1. Backend Database Migrations
echo ""
echo "[1/3] Checking backend & running database migrations..."
cd "${ROOT_DIR}/backend"
if [ ! -d "node_modules" ]; then
  echo "Installing backend dependencies..."
  npm install
fi
node ace migration:run

# 2. Frontend Dependencies Check
echo ""
echo "[2/3] Checking frontend setup..."
cd "${ROOT_DIR}/frontend"
if [ ! -d "node_modules" ]; then
  echo "Installing frontend dependencies..."
  npm install
fi

# 3. Trap signal handler for graceful shutdown
cleanup() {
  echo ""
  echo "🛑 Stopping servers..."
  kill 0 2>/dev/null || true
  exit 0
}

trap cleanup SIGINT SIGTERM EXIT

echo ""
echo "[3/3] Launching servers..."
echo "  • Backend:  http://localhost:3333"
echo "  • Frontend: http://localhost:5173"
echo "=================================================="
echo "Press Ctrl+C to stop all servers."
echo ""

# Start backend dev server
cd "${ROOT_DIR}/backend"
npm run dev &

# Start frontend dev server
cd "${ROOT_DIR}/frontend"
npm run dev &

# Wait for child processes
wait
