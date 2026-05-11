# castdown — markitdown-svc local runner.
# Assumes you've already set up the Python venv (see docs/local-setup.md).
#
# Usage from repo root:
#   pwsh -File scripts/dev-markitdown.ps1

$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path "$PSScriptRoot\..").Path
$SvcDir = Join-Path $RepoRoot "services/markitdown"
$Venv = Join-Path $SvcDir ".venv"

if (-not (Test-Path (Join-Path $Venv "Scripts/Activate.ps1"))) {
    Write-Error "Python venv missing at $Venv. Run scripts/setup-markitdown.ps1 first."
}

Set-Location $SvcDir
& (Join-Path $Venv "Scripts/Activate.ps1")
$env:LOG_LEVEL = "INFO"
$env:MAX_FILE_SIZE_MB = "50"
Write-Host "== markitdown :8001 ==" -ForegroundColor Cyan
uvicorn main:app --host 127.0.0.1 --port 8001 --reload
