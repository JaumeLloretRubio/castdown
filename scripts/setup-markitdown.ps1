# One-shot Python venv setup for services/markitdown.
# Idempotent — safe to re-run.

$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path "$PSScriptRoot\..").Path
$SvcDir = Join-Path $RepoRoot "services/markitdown"
$Venv = Join-Path $SvcDir ".venv"

$pyCmd = Get-Command python -ErrorAction SilentlyContinue
if (-not $pyCmd) { $pyCmd = Get-Command python3 -ErrorAction SilentlyContinue }
if (-not $pyCmd) { $pyCmd = Get-Command py -ErrorAction SilentlyContinue }
if (-not $pyCmd) {
    Write-Error "Python 3.12 not on PATH. Install via: winget install Python.Python.3.12"
}

if (-not (Test-Path $Venv)) {
    Write-Host "creating venv at $Venv" -ForegroundColor Cyan
    & $pyCmd.Source -m venv $Venv
}

& (Join-Path $Venv "Scripts/python.exe") -m pip install --upgrade pip
& (Join-Path $Venv "Scripts/python.exe") -m pip install -r (Join-Path $SvcDir "requirements.txt")

Write-Host ""
Write-Host "venv ready. Start the service with:" -ForegroundColor Green
Write-Host "  powershell -File scripts/dev-markitdown.ps1" -ForegroundColor DarkGray
