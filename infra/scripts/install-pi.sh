#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# castdown — installer idempotente para Raspberry Pi (Ubuntu 22.04+ / Raspberry Pi OS 64-bit)
#
# Uso:
#   curl -fsSL https://raw.githubusercontent.com/<USUARIO>/castdown/main/infra/scripts/install-pi.sh | bash
#   o:
#   git clone https://github.com/<USUARIO>/castdown ~/castdown
#   bash ~/castdown/infra/scripts/install-pi.sh
#
# Idempotente: re-ejecutable sin daños. Cada paso comprueba estado antes de actuar.
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

REPO_URL="${CASTDOWN_REPO_URL:-https://github.com/JaumeLloretRubio/castdown.git}"
INSTALL_DIR="${CASTDOWN_DIR:-$HOME/castdown}"
BRANCH="${CASTDOWN_BRANCH:-main}"

# Colores
C_BLUE="\033[1;34m"; C_GREEN="\033[1;32m"; C_YELLOW="\033[1;33m"; C_RED="\033[1;31m"; C_DIM="\033[2m"; C_END="\033[0m"
log()  { echo -e "${C_BLUE}==>${C_END} $*"; }
ok()   { echo -e "${C_GREEN}✓${C_END} $*"; }
warn() { echo -e "${C_YELLOW}!${C_END} $*"; }
die()  { echo -e "${C_RED}✗${C_END} $*" >&2; exit 1; }
sudo_() { if [[ $EUID -eq 0 ]]; then "$@"; else sudo "$@"; fi; }

# ─── Pre-checks ────────────────────────────────────────────────────────────────
[[ $EUID -eq 0 ]] && warn "Ejecutándose como root. Mejor un usuario normal con sudo."

arch=$(uname -m)
case "$arch" in
  aarch64|arm64) ok "Arquitectura ARM64 detectada" ;;
  x86_64) ok "Arquitectura x86_64 detectada" ;;
  *) die "Arquitectura no soportada: $arch (esperado aarch64 o x86_64)" ;;
esac

if ! command -v lsb_release >/dev/null 2>&1; then
  sudo_ apt-get update -qq && sudo_ apt-get install -y lsb-release
fi
distro=$(lsb_release -si 2>/dev/null || echo "Unknown")
log "Distro: $distro $(lsb_release -sr 2>/dev/null)"

# ─── 1. Paquetes base ──────────────────────────────────────────────────────────
log "Instalando paquetes base"
sudo_ apt-get update -qq
sudo_ apt-get install -y --no-install-recommends \
  ca-certificates curl gnupg git jq lsb-release openssl
ok "Paquetes base listos"

# ─── 2. Docker + Compose plugin ────────────────────────────────────────────────
if command -v docker >/dev/null 2>&1; then
  ok "Docker ya instalado: $(docker --version)"
else
  log "Instalando Docker Engine"
  curl -fsSL https://get.docker.com | sudo_ sh
  ok "Docker instalado"
fi

if docker compose version >/dev/null 2>&1; then
  ok "docker compose plugin presente"
else
  log "Instalando docker-compose-plugin"
  sudo_ apt-get install -y docker-compose-plugin
fi

if ! id -nG "$USER" | grep -qw docker; then
  log "Añadiendo $USER al grupo docker (requiere logout/login o newgrp)"
  sudo_ usermod -aG docker "$USER"
  warn "Re-loguea o ejecuta: newgrp docker"
fi

# ─── 3. Tailscale ──────────────────────────────────────────────────────────────
if command -v tailscale >/dev/null 2>&1; then
  ok "Tailscale ya instalado: $(tailscale version | head -1)"
else
  log "Instalando Tailscale"
  curl -fsSL https://tailscale.com/install.sh | sudo_ sh
  ok "Tailscale instalado"
fi

# ─── 4. GitHub CLI + auth (repo es privado → necesario para clonar) ────────────
if command -v gh >/dev/null 2>&1; then
  ok "GitHub CLI ya instalado: $(gh --version | head -1)"
else
  log "Instalando GitHub CLI desde repo oficial"
  sudo_ mkdir -p -m 755 /etc/apt/keyrings
  curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
    | sudo_ dd of=/etc/apt/keyrings/githubcli-archive-keyring.gpg status=none
  sudo_ chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
    | sudo_ tee /etc/apt/sources.list.d/github-cli.list > /dev/null
  sudo_ apt-get update -qq
  sudo_ apt-get install -y gh
fi

# Auth — 3 caminos
if gh auth status >/dev/null 2>&1; then
  ok "gh ya autenticado como $(gh api user --jq .login 2>/dev/null || echo '?')"
elif [[ -n "${GH_TOKEN:-}" ]]; then
  log "Autenticando con GH_TOKEN (PAT desde env)"
  echo "$GH_TOKEN" | gh auth login --with-token
  ok "gh autenticado vía PAT"
else
  warn "Repo privado — necesitas autenticar GitHub primero."
  echo ""
  echo "  Opción A (rápida, headless):"
  echo "    1. Genera un PAT en https://github.com/settings/tokens"
  echo "       Scopes mínimos: repo  (read access es suficiente)"
  echo "    2. Re-ejecuta:  GH_TOKEN=ghp_xxx bash $0"
  echo ""
  echo "  Opción B (interactiva, requiere navegador):"
  echo "    gh auth login --web --hostname github.com"
  echo "    Luego re-ejecuta este script."
  echo ""
  die "Sin auth gh no puedo clonar repo privado"
fi

# ─── 5. Repo ───────────────────────────────────────────────────────────────────
if [[ -d "$INSTALL_DIR/.git" ]]; then
  log "Repo ya clonado en $INSTALL_DIR — pulling $BRANCH"
  git -C "$INSTALL_DIR" fetch --quiet
  git -C "$INSTALL_DIR" checkout --quiet "$BRANCH"
  git -C "$INSTALL_DIR" pull --quiet --ff-only
else
  # gh repo clone usa las credenciales almacenadas → funciona con repos privados.
  # El REPO_URL del top es informativo; aquí extraemos owner/name del URL.
  repo_slug=$(echo "$REPO_URL" | sed -E 's|^https?://github\.com/||; s|\.git$||')
  log "Clonando $repo_slug → $INSTALL_DIR (vía gh, repo privado OK)"
  gh repo clone "$repo_slug" "$INSTALL_DIR" -- --branch "$BRANCH" --depth 1
fi
cd "$INSTALL_DIR"
ok "Repo en $INSTALL_DIR"

# ─── 5. .env ───────────────────────────────────────────────────────────────────
if [[ ! -f .env ]]; then
  log "Generando .env desde .env.example con API key aleatoria"
  cp .env.example .env
  api_key="cd_$(openssl rand -hex 24)"
  # API_KEYS = lista (gateway) — WEB_API_KEY = la única que usa el web container.
  # Tienen que coincidir para que el web hable con el api.
  sed -i "s|^API_KEYS=.*|API_KEYS=$api_key|" .env
  sed -i "s|^WEB_API_KEY=.*|WEB_API_KEY=$api_key|" .env
  ok ".env creado. Tu API key:"
  echo -e "${C_DIM}     $api_key${C_END}"
  echo -e "${C_DIM}     (guárdala — la necesitas en Vercel como CASTDOWN_API_KEY)${C_END}"
else
  ok ".env ya existe — sin tocar"
fi

# ─── 6. Build + up ─────────────────────────────────────────────────────────────
log "Levantando stack (api + microservicios + redis)"
if id -nG "$USER" | grep -qw docker || [[ $EUID -eq 0 ]]; then
  docker compose up -d --build
else
  warn "Sin permisos docker todavía. Re-ejecuta tras 'newgrp docker' o relog:"
  echo "    cd $INSTALL_DIR && docker compose up -d --build"
  exit 0
fi

# ─── 7. Health probe ───────────────────────────────────────────────────────────
# Aceptamos 200 (todo OK) o 503 (gateway up, microservicios aún calentando).
# Conexión rechazada = gateway todavía arrancando → seguir esperando.
log "Esperando readiness (max 60s)"
for i in $(seq 1 30); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health 2>/dev/null || echo "000")
  case "$code" in
    200) ok "API gateway healthy en :3001"; break ;;
    503) ok "API gateway up en :3001 (microservicios aún arrancando — normal)"; break ;;
  esac
  sleep 2
  [[ $i -eq 30 ]] && warn "Timeout — revisa: docker compose logs"
done

# ─── 8. Siguientes pasos ───────────────────────────────────────────────────────
cat <<EOF

${C_GREEN}── Stack arriba ──${C_END}

Siguientes pasos manuales:

  1. Login Tailscale (abrirá URL en navegador):
       sudo tailscale up

  2. Habilita Funnel en el admin panel (una vez):
       https://login.tailscale.com/admin/dns
       DNS → MagicDNS ON
       Settings → HTTPS Certificates → Enable
       Settings → Funnel → añade este device

  3. Expón el gateway al mundo (HTTPS gratis):
       sudo tailscale funnel --bg 3001
       sudo tailscale funnel status
     → Verás algo tipo: https://$(hostname)-XXXX.tailXXXX.ts.net

  4. En Vercel (apps/web), añade env vars:
       CASTDOWN_API_URL=https://<tu-url-funnel>
       CASTDOWN_API_KEY=$(grep ^API_KEYS .env | cut -d= -f2- | cut -d, -f1)

  5. Tras 1er deploy Vercel, vuelve aquí y añade el dominio Vercel al CORS:
       nano .env   # WEB_ORIGIN=http://localhost:3000,https://<tu-app>.vercel.app
       docker compose restart api

Logs en vivo:
  docker compose logs -f
EOF
