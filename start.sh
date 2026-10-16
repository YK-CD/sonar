#!/data/data/com.termux/files/usr/bin/bash
# sonar — servidor local
PORT="${1:-8080}"
echo "sonar rodando em http://localhost:${PORT}"
exec python3 -m http.server "$PORT"
