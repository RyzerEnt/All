#!/bin/sh
# Resolve the project root (parent of this scripts/ directory)
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
EXPO_PORT=${PORT:-22479}

echo "Project root: $SCRIPT_DIR"
cd "$SCRIPT_DIR"

echo "Freeing port $EXPO_PORT..."
PID=$(lsof -ti :$EXPO_PORT 2>/dev/null)
if [ -n "$PID" ]; then
  kill $PID 2>/dev/null || true
  sleep 1
fi

echo "Starting Expo on port $EXPO_PORT..."
exec pnpm exec expo start . --port $EXPO_PORT
