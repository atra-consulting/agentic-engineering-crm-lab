#!/bin/bash
set -u

echo "=== CRM Application Stopper ==="

ROOT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
BACKEND_PORT=7070
FRONTEND_PORT=7200

# Stop the file watchers of THIS project first (tsx --watch, ng serve).
# Killing only the process on the port is not enough: tsx --watch restarts
# the backend it supervises, and the port is bound again a moment later.
# Only processes whose working directory lies inside this project are
# touched, so other checkouts on the same machine keep running.
stop_watchers() {
  local pids pid cwd
  pids=$(pgrep -f "tsx --watch src/index.ts|ng serve --port ${FRONTEND_PORT}" 2>/dev/null || true)
  for pid in $pids; do
    cwd=$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -1)
    case "$cwd" in
      "${ROOT_DIR}"|"${ROOT_DIR}"/*)
        echo "Watcher: stopping PID ${pid}"
        kill "$pid" 2>/dev/null || true
        ;;
    esac
  done
}

stop_port() {
  local port="$1"
  local label="$2"

  if ! command -v lsof &> /dev/null; then
    echo "ERROR: lsof is not installed; cannot find processes by port."
    return 1
  fi

  local pids
  pids=$(lsof -ti ":${port}" 2>/dev/null || true)

  if [ -z "$pids" ]; then
    echo "${label} (port ${port}): not running"
    return 0
  fi

  echo "${label} (port ${port}): stopping PID(s) ${pids}"
  # Try graceful shutdown first, then force if still running.
  echo "$pids" | xargs kill 2>/dev/null || true
  sleep 1
  pids=$(lsof -ti ":${port}" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "${label} (port ${port}): forcing kill of PID(s) ${pids}"
    echo "$pids" | xargs kill -9 2>/dev/null || true
  fi
  echo "${label} stopped"
}

if command -v lsof &> /dev/null; then
  stop_watchers
  sleep 1
fi
stop_port "${FRONTEND_PORT}" "Frontend"
stop_port "${BACKEND_PORT}"  "Backend"

echo ""
echo "=== CRM Application Stopped ==="
