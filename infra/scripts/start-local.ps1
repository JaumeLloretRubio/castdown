<#
.SYNOPSIS
  Orquesta el stack castdown en Windows nativo, sin Docker.

.DESCRIPTION
  Levanta los procesos en background:
    - markitdown-svc (Python uvicorn)            :8001
    - pandoc-svc    (Node tsx)                   :8002
    - crawler-svc   (Node tsx + Playwright)      :8003
    - api gateway   (Node tsx + SQLite local)    :3001
    - (opcional) apps/web                        :3000

  PIDs en .local-pids/, logs en .local-logs/. stop-local.ps1 los limpia.
  Redis NO se levanta - gateway tiene fail-open (validado sesion 9).

.PARAMETER Web
  Si se pasa, lanza pnpm dev de apps/web en :3000.

.PARAMETER Skipdeps
  Salta install de pnpm + pip (mas rapido si ya estan listos).

.EXAMPLE
  .\infra\scripts\start-local.ps1
  .\infra\scripts\start-local.ps1 -Web
  .\infra\scripts\start-local.ps1 -Skipdeps
#>
param(
  [switch]$Web,
  [switch]$Skipdeps
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $root

# === Colors ===
function Log($msg)  { Write-Host "==> $msg" -ForegroundColor Cyan }
function Ok($msg)   { Write-Host "OK  $msg" -ForegroundColor Green }
function Warn($msg) { Write-Host "!!  $msg" -ForegroundColor Yellow }
function Die($msg)  { Write-Host "X   $msg" -ForegroundColor Red; exit 1 }

# === Pre-flight ===
Log "Pre-flight checks"
foreach ($c in @("node","pnpm","python","pandoc","typst")) {
  if (-not (Get-Command $c -ErrorAction SilentlyContinue)) { Die "Falta '$c' en PATH" }
}
if (-not (Test-Path "services\markitdown\.venv\Scripts\python.exe")) {
  Die "Falta services\markitdown\.venv - crea con: python -m venv services\markitdown\.venv"
}
if (-not (Test-Path "$env:USERPROFILE\AppData\Local\ms-playwright")) {
  Warn "Playwright chromium no detectado - crawler puede fallar. Instala: npx playwright install chromium"
}
Ok "Dependencias presentes"

# === Puertos libres ===
foreach ($p in @(3001, 8001, 8002, 8003)) {
  $busy = Get-NetTCPConnection -State Listen -LocalPort $p -ErrorAction SilentlyContinue
  if ($busy) { Die "Puerto $p ocupado (pid $($busy[0].OwningProcess)) - corre stop-local.ps1 primero" }
}
if ($Web) {
  $busy = Get-NetTCPConnection -State Listen -LocalPort 3000 -ErrorAction SilentlyContinue
  if ($busy) { Die "Puerto 3000 ocupado (pid $($busy[0].OwningProcess))" }
}
Ok "Puertos 3001/8001/8002/8003 libres"

# === Dirs ===
$pidsDir = Join-Path $root ".local-pids"
$logsDir = Join-Path $root ".local-logs"
$dataDir = Join-Path $root "data"
foreach ($d in @($pidsDir, $logsDir, $dataDir)) {
  if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d | Out-Null }
}

# === Install deps ===
if (-not $Skipdeps) {
  if (-not (Test-Path "node_modules")) {
    Log "pnpm install (raiz)"
    pnpm install 2>&1 | Out-Null
  }
  $pyMarker = "services\markitdown\.venv\.deps-installed"
  if (-not (Test-Path $pyMarker)) {
    Log "pip install requirements (markitdown)"
    & "services\markitdown\.venv\Scripts\python.exe" -m pip install --quiet -r "services\markitdown\requirements.txt"
    New-Item -ItemType File -Path $pyMarker -Force | Out-Null
  }
  Ok "Dependencias instaladas"
}

# === Env vars compartidas (modo localhost, sin docker) ===
$env:NODE_ENV         = "development"
# Lowercase: services/api Zod schema acepta solo lowercase.
# markitdown/main.py hace .upper() internamente (parche aplicado).
$env:LOG_LEVEL        = "info"
$env:API_KEYS         = "cd_dev_changeme"
$env:WEB_API_KEY      = "cd_dev_changeme"
$env:RATE_LIMIT_PER_MINUTE = "60"
$env:WEB_ORIGIN       = "http://localhost:3000"
$env:API_PORT         = "3001"
$env:API_HOST         = "127.0.0.1"
$env:API_PUBLIC_URL   = "http://localhost:3001"
$env:STORAGE_PATH     = "$root\data"
$env:DATABASE_URL     = "file:./data/castdown.db"
# 127.0.0.1 explicito: Windows resuelve 'localhost' a ::1 (IPv6) primero
# y uvicorn/Node se bindean a 127.0.0.1 -> probes IPv6 dan timeout.
$env:MARKITDOWN_URL   = "http://127.0.0.1:8001"
$env:PANDOC_URL       = "http://127.0.0.1:8002"
$env:CRAWLER_URL      = "http://127.0.0.1:8003"
$env:REDIS_URL        = "redis://127.0.0.1:6379"
$env:MAX_FILE_SIZE_MB = "50"
$env:RESULT_TTL_HOURS = "24"
$env:TEMPLATES_DIR    = "$root\templates"
$env:CRAWLER_MAX_CONCURRENCY = "2"
$env:CRAWLER_DEFAULT_DEPTH   = "2"
$env:CRAWLER_MAX_PAGES       = "500"
$env:CASTDOWN_API_URL = "http://127.0.0.1:3001"
$env:CASTDOWN_API_KEY = "cd_dev_changeme"

# === Launcher generico ===
# Resuelve shims .cmd/.bat (pnpm, npm) que CreateProcess rechaza con
# "%1 no es una aplicacion Win32 valida". Los wrappea via cmd.exe /c.
function Start-Svc {
  param(
    [string]$Name,
    [string]$Cwd,
    [string]$File,
    [string[]]$ArgList
  )
  $log = Join-Path $logsDir "$Name.log"
  $err = Join-Path $logsDir "$Name.err.log"

  $resolved = $File
  if (-not [System.IO.Path]::IsPathRooted($File)) {
    $cmd = Get-Command $File -ErrorAction SilentlyContinue
    if ($cmd) { $resolved = $cmd.Source }
  }

  $ext = [System.IO.Path]::GetExtension($resolved).ToLower()
  if ($ext -eq ".cmd" -or $ext -eq ".bat" -or $ext -eq ".ps1") {
    # Quote args con espacios; cmd /c necesita la linea entera
    $quoted = $ArgList | ForEach-Object {
      if ($_ -match '\s') { '"' + $_ + '"' } else { $_ }
    }
    $cmdArgs = @("/c", "`"$resolved`"") + $quoted
    $proc = Start-Process -PassThru -NoNewWindow `
      -FilePath "cmd.exe" -ArgumentList $cmdArgs `
      -WorkingDirectory $Cwd `
      -RedirectStandardOutput $log -RedirectStandardError $err
  } else {
    $proc = Start-Process -PassThru -NoNewWindow `
      -FilePath $resolved -ArgumentList $ArgList `
      -WorkingDirectory $Cwd `
      -RedirectStandardOutput $log -RedirectStandardError $err
  }

  $proc.Id | Out-File (Join-Path $pidsDir "$Name.pid") -Encoding ascii -NoNewline
  Write-Host ("    {0,-12} pid={1}  log=.local-logs\{0}.log" -f $Name, $proc.Id)
}

Log "Lanzando servicios"
Start-Svc -Name "markitdown" -Cwd "services\markitdown" `
  -File "services\markitdown\.venv\Scripts\python.exe" `
  -ArgList @("-m","uvicorn","main:app","--host","127.0.0.1","--port","8001")

Start-Svc -Name "pandoc" -Cwd "services\pandoc" `
  -File "node" -ArgList @("--import","tsx/esm","src/index.ts")

Start-Svc -Name "crawler" -Cwd "services\crawler" `
  -File "node" -ArgList @("--import","tsx/esm","src/index.ts")

Start-Svc -Name "api" -Cwd "services\api" `
  -File "node" -ArgList @("--import","tsx/esm","src/index.ts")

if ($Web) {
  # next CLI directo con node: evita shim pnpm.cmd (problemas stdio bajo Start-Process)
  $nextBin = Join-Path $root "apps\web\node_modules\next\dist\bin\next"
  if (-not (Test-Path $nextBin)) { Die "Falta apps\web\node_modules\next - corre pnpm install" }
  Start-Svc -Name "web" -Cwd "apps\web" `
    -File "node" -ArgList @($nextBin,"dev","-p","3000")
}

# === Health probes ===
Log "Esperando readiness (max 60s)"
function Probe($url, [int]$tries = 30) {
  for ($i = 0; $i -lt $tries; $i++) {
    try {
      $r = Invoke-WebRequest $url -UseBasicParsing -TimeoutSec 2
      return [int]$r.StatusCode
    } catch [System.Net.WebException] {
      if ($_.Exception.Response) { return [int]$_.Exception.Response.StatusCode }
    } catch { }
    Start-Sleep -Milliseconds 1500
  }
  return 0
}

$probes = [ordered]@{
  markitdown = "http://127.0.0.1:8001/health"
  pandoc     = "http://127.0.0.1:8002/health"
  crawler    = "http://127.0.0.1:8003/health"
  api        = "http://127.0.0.1:3001/health"
}
foreach ($k in $probes.Keys) {
  $code = Probe $probes[$k]
  if ($code -eq 200)     { Ok "$k -> 200" }
  elseif ($code -eq 503) { Ok "$k -> 503 (gateway up, upstream calentando, OK)" }
  elseif ($code -eq 0)   { Warn "$k -> timeout - revisa .local-logs\$k.err.log" }
  else                    { Warn "$k -> $code (inesperado)" }
}

# === Resumen ===
Write-Host ""
Write-Host "=== Stack arriba ===" -ForegroundColor Green
Write-Host "  api gateway     http://localhost:3001/health"
Write-Host "  markitdown      http://localhost:8001/health   (internal)"
Write-Host "  pandoc          http://localhost:8002/health   (internal)"
Write-Host "  crawler         http://localhost:8003/health   (internal)"
if ($Web) { Write-Host "  web UI          http://localhost:3000" }
Write-Host ""
Write-Host "Test rapido:"
Write-Host '  Invoke-WebRequest http://localhost:3001/health -UseBasicParsing | Select-Object StatusCode'
Write-Host '  Invoke-WebRequest http://localhost:3001/api/whoami -Headers @{Authorization="Bearer cd_dev_changeme"} -UseBasicParsing'
Write-Host ""
Write-Host "Smoke test E2E (sesion 8):"
Write-Host "  node packages\mcp\scripts\smoke.mjs"
Write-Host ""
Write-Host "Logs:"
Write-Host "  Get-Content .local-logs\api.log -Wait -Tail 20"
Write-Host ""
Write-Host "Parar todo:"
Write-Host "  .\infra\scripts\stop-local.ps1"
Write-Host ""
