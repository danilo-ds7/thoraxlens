#!/usr/bin/env bash
# Publica ThoraxLens desde un Mac: Docker Compose + túnel rápido de Cloudflare (URL *.trycloudflare.com).
# Uso:  ./scripts/publicar-mac.sh          → levanta todo e imprime la URL pública y la clave de acceso
#       ./scripts/publicar-mac.sh detener  → apaga el túnel y los contenedores
set -euo pipefail
cd "$(dirname "$0")/.."
PUERTO=8091
LOG_TUNEL=".tunel.log"

rojo()  { printf '\033[31m%s\033[0m\n' "$*"; }
verde() { printf '\033[32m%s\033[0m\n' "$*"; }

if [[ "${1:-}" == "detener" ]]; then
  pkill -f "cloudflared tunnel --url http://localhost:$PUERTO" 2>/dev/null || true
  docker compose down
  verde "ThoraxLens detenido."
  exit 0
fi

# 1. Docker Desktop (su CLI vive dentro de la app; se agrega al PATH por si la Terminal aún no lo ve)
export PATH="$PATH:/Applications/Docker.app/Contents/Resources/bin:/usr/local/bin:/opt/homebrew/bin"
if ! command -v docker >/dev/null; then
  rojo "Falta Docker Desktop. Instálalo desde https://www.docker.com/products/docker-desktop/ (o: brew install --cask docker), ábrelo y vuelve a correr este script."
  exit 1
fi
if ! docker info >/dev/null 2>&1; then
  echo "Docker Desktop no está corriendo; abriéndolo…"
  open -a Docker
  until docker info >/dev/null 2>&1; do sleep 3; printf '.'; done; echo
fi

# 2. cloudflared (túnel)
if ! command -v cloudflared >/dev/null; then
  if command -v brew >/dev/null; then
    echo "Instalando cloudflared con Homebrew…"; brew install cloudflared
  else
    rojo "Falta cloudflared y no hay Homebrew. Instala Homebrew (https://brew.sh) o cloudflared (https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)."
    exit 1
  fi
fi

# 3. Clave de Anthropic (solo se guarda en .env, ignorado por git)
if [[ ! -f .env ]] || ! grep -q '^ANTHROPIC_API_KEY=.\+' .env; then
  read -r -s -p "Pega tu ANTHROPIC_API_KEY (no se muestra) y presiona Enter: " CLAVE_API; echo
  [[ -n "$CLAVE_API" ]] || { rojo "Clave vacía."; exit 1; }
  umask 077; printf 'ANTHROPIC_API_KEY=%s\n' "$CLAVE_API" > .env
fi

# 4. Clave de acceso a la IA generativa (rota cada vez que se ejecuta rotar-clave.sh)
CLAVE_ACCESO=$(scripts/rotar-clave.sh)

# 5. Contenedores (la primera vez compila las imágenes: 5–10 min)
echo "Construyendo y levantando contenedores…"
docker compose up -d --build
echo "Esperando al backend…"
until docker compose exec -T api python -c "import urllib.request;urllib.request.urlopen('http://localhost:7860/')" >/dev/null 2>&1; do sleep 3; printf '.'; done; echo

# 6. Túnel rápido de Cloudflare
pkill -f "cloudflared tunnel --url http://localhost:$PUERTO" 2>/dev/null || true
nohup cloudflared tunnel --url "http://localhost:$PUERTO" > "$LOG_TUNEL" 2>&1 &
URL=""
for _ in $(seq 1 40); do
  URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' "$LOG_TUNEL" | head -1 || true)
  [[ -n "$URL" ]] && break; sleep 1
done
[[ -n "$URL" ]] || { rojo "No se obtuvo la URL del túnel; revisa $LOG_TUNEL"; exit 1; }

echo
verde "ThoraxLens publicado."
echo "  URL pública:        $URL   (local: http://localhost:$PUERTO)"
echo "  Clave IA generativa: $CLAVE_ACCESO"
echo
echo "La URL dura mientras este Mac esté encendido y el túnel activo. Para apagar: ./scripts/publicar-mac.sh detener"
