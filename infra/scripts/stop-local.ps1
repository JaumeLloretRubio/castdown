<#
.SYNOPSIS
  Para el stack castdown local lanzado por start-local.ps1.

.DESCRIPTION
  Lee .local-pids/*.pid, mata cada proceso + sus hijos. Despues barre
  puertos 3000-3001 y 8001-8003 por orphans.

.PARAMETER Reset
  Ademas borra: .local-pids/, .local-logs/, data/ (SQLite + outputs).

.EXAMPLE
  .\infra\scripts\stop-local.ps1
  .\infra\scripts\stop-local.ps1 -Reset
#>
param([switch]$Reset)

$ErrorActionPreference = "Continue"
$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $root

$pidsDir = Join-Path $root ".local-pids"
$logsDir = Join-Path $root ".local-logs"
$dataDir = Join-Path $root "data"

function Log($msg) { Write-Host "==> $msg" -ForegroundColor Cyan }
function Ok($msg)  { Write-Host "OK  $msg" -ForegroundColor Green }

# === 1. Kill por PID files ===
if (Test-Path $pidsDir) {
  Get-ChildItem $pidsDir -Filter "*.pid" -ErrorAction SilentlyContinue | ForEach-Object {
    $name = $_.BaseName
    $procIdRaw = (Get-Content $_.FullName -Raw).Trim()
    $procIdInt = 0
    if (-not [int]::TryParse($procIdRaw, [ref]$procIdInt)) {
      Remove-Item $_.FullName -Force
      return
    }
    $proc = Get-Process -Id $procIdInt -ErrorAction SilentlyContinue
    if ($proc) {
      Log "Stopping $name (pid $procIdInt)"
      Get-CimInstance Win32_Process -Filter "ParentProcessId=$procIdInt" -ErrorAction SilentlyContinue | ForEach-Object {
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
      }
      Stop-Process -Id $procIdInt -Force -ErrorAction SilentlyContinue
    }
    Remove-Item $_.FullName -Force
  }
}

# === 2. Barrido orphans por puerto ===
foreach ($port in @(3000, 3001, 8001, 8002, 8003)) {
  $conn = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue
  if ($conn) {
    $opid = $conn[0].OwningProcess
    $proc = Get-Process -Id $opid -ErrorAction SilentlyContinue
    if ($proc -and $proc.Name -match "^(node|python|uvicorn|pnpm)$") {
      Log "Orphan port $port (pid $opid, $($proc.Name)) - killing"
      Stop-Process -Id $opid -Force -ErrorAction SilentlyContinue
    }
  }
}

# === 3. Reset opcional ===
if ($Reset) {
  foreach ($d in @($pidsDir, $logsDir, $dataDir)) {
    if (Test-Path $d) {
      Log "Borrando $d"
      Remove-Item $d -Recurse -Force -ErrorAction SilentlyContinue
    }
  }
  Ok "Reset completo"
} else {
  Ok "Stack parado (logs preservados en .local-logs)"
}
