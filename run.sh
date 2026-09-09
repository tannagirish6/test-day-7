#!/usr/bin/env bash
set -euo pipefail

# Resolve the project root from the location of this script so it works from any directory.
ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$ROOT_DIR"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
FRONTEND_URL="http://127.0.0.1:${FRONTEND_PORT}/"
BACKEND_DIR="$ROOT_DIR/backend"
BACKEND_PORT="${BACKEND_PORT:-8000}"
LOG_DIR="$ROOT_DIR/logs"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"

FRONTEND_PID=""
BACKEND_PID=""
SHUTDOWN_DONE=false

# Stop child processes when the user presses Ctrl+C or the launcher is terminated.
shutdown() {
  if [[ "$SHUTDOWN_DONE" == true ]]; then
    return
  fi
  SHUTDOWN_DONE=true
  trap - EXIT INT TERM

  echo "Stopping CA Buddy..."
  if [[ -n "$FRONTEND_PID" ]] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
  if [[ -n "$BACKEND_PID" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi

  if [[ -n "$FRONTEND_PID" ]]; then
    wait "$FRONTEND_PID" 2>/dev/null || true
  fi
  if [[ -n "$BACKEND_PID" ]]; then
    wait "$BACKEND_PID" 2>/dev/null || true
  fi
}

trap shutdown EXIT INT TERM

# Create log files before starting either process. This project has no backend entry point.
mkdir -p "$LOG_DIR"
: > "$BACKEND_LOG"
: > "$FRONTEND_LOG"
printf '%s\n' 'No backend entry point detected; CA Buddy runs as a frontend-only Vite app.' > "$BACKEND_LOG"

echo "Backend: not applicable (frontend-only project)"

# Install frontend dependencies only when node_modules is absent.
if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
  echo "Installing frontend dependencies..."
  (
    cd "$FRONTEND_DIR"
    npm ci >> "$FRONTEND_LOG" 2>&1
  )
else
  echo "Frontend dependencies: already installed"
fi

# Start the Vite development server in the background and keep its output in a log file.
echo "Starting frontend on port $FRONTEND_PORT..."
(
  cd "$FRONTEND_DIR"
  npm run dev -- --host 127.0.0.1 --port "$FRONTEND_PORT" --strictPort >> "$FRONTEND_LOG" 2>&1
) &
FRONTEND_PID=$!

# Poll a URL for up to 30 seconds and fail with the relevant log tail if it never responds.
wait_for_frontend() {
  local deadline=$((SECONDS + 30))

  while ! curl --fail --silent --show-error --max-time 2 "$FRONTEND_URL" >/dev/null; do
    if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
      echo "Frontend exited before becoming reachable. See $FRONTEND_LOG" >&2
      tail -n 20 "$FRONTEND_LOG" >&2 || true
      exit 1
    fi
    if (( SECONDS >= deadline )); then
      echo "Frontend did not become reachable within 30 seconds. See $FRONTEND_LOG" >&2
      tail -n 20 "$FRONTEND_LOG" >&2 || true
      exit 1
    fi
    sleep 1
  done
}

wait_for_frontend
echo "Frontend is ready at $FRONTEND_URL"

# Open the URL with Chrome when available, then fall back to the platform's default opener.
open_browser() {
  echo "Opening browser..."

  if command -v google-chrome >/dev/null 2>&1; then
    google-chrome "$FRONTEND_URL" >/dev/null 2>&1 &
  elif command -v google-chrome-stable >/dev/null 2>&1; then
    google-chrome-stable "$FRONTEND_URL" >/dev/null 2>&1 &
  elif [[ "$OSTYPE" == darwin* ]] && command -v open >/dev/null 2>&1; then
    open -a "Google Chrome" "$FRONTEND_URL" >/dev/null 2>&1 &
  elif [[ "${OS:-}" == Windows_NT ]] && command -v start >/dev/null 2>&1; then
    start chrome "$FRONTEND_URL" >/dev/null 2>&1 &
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$FRONTEND_URL" >/dev/null 2>&1 &
    echo "Chrome was not found; opened the default browser instead."
  else
    echo "No browser opener was found. Open this URL manually: $FRONTEND_URL"
  fi

  echo "URL: $FRONTEND_URL"
}

open_browser

# Keep the launcher alive so Ctrl+C reaches the child server through the trap above.
wait "$FRONTEND_PID"
