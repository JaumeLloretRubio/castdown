# castdown — local dev runner (no Docker).
# Spawns each service in its own PowerShell window so you see live logs.
#
# Usage from repo root:
#   pwsh -File scripts/dev-local.ps1
#   pwsh -File scripts/dev-local.ps1 -Services api,web,crawler   # subset
#
# Markitdown (Python) is NOT spawned here — run `scripts/dev-markitdown.ps1`
# in a separate terminal after you've set up the Python venv. See
# `docs/local-setup.md` for prereqs (pandoc, typst, marp, Python, Playwright).

param(
    [string[]]$Services = @("api", "pandoc", "crawler", "web")
)

$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path "$PSScriptRoot\..").Path
$EnvFile = Join-Path $RepoRoot ".env.local"

if (-not (Test-Path $EnvFile)) {
    Write-Error "Missing $EnvFile. Copy .env.local.example to .env.local first."
}

function Start-Service {
    param(
        [string]$Name,
        [string]$Cwd,
        [string]$Command,
        [hashtable]$ExtraEnv = @{}
    )
    $envSetters = ($ExtraEnv.GetEnumerator() | ForEach-Object { "`$env:$($_.Key) = '$($_.Value)'" }) -join "; "
    $full = "Set-Location '$Cwd'; $envSetters; Write-Host '== $Name ==' -ForegroundColor Cyan; $Command"
    Start-Process powershell -ArgumentList "-NoExit", "-NoProfile", "-Command", $full -WorkingDirectory $Cwd | Out-Null
    Write-Host "spawned $Name" -ForegroundColor Green
}

# `--import tsx/esm` resolves `tsx` from the cwd's node_modules.
# pnpm doesn't hoist tsx to the repo root, so each Node service must boot
# from its own service directory.
$nodeFlags = "--env-file=`"$EnvFile`" --import tsx/esm"

foreach ($svc in $Services) {
    switch ($svc.ToLower()) {
        "api" {
            Start-Service -Name "api :3001" -Cwd (Join-Path $RepoRoot "services/api") `
                -Command "node $nodeFlags src/index.ts"
        }
        "pandoc" {
            Start-Service -Name "pandoc :8002" -Cwd (Join-Path $RepoRoot "services/pandoc") `
                -ExtraEnv @{ PORT = "8002" } `
                -Command "node $nodeFlags src/index.ts"
        }
        "crawler" {
            Start-Service -Name "crawler :8003" -Cwd (Join-Path $RepoRoot "services/crawler") `
                -ExtraEnv @{ PORT = "8003" } `
                -Command "node $nodeFlags src/index.ts"
        }
        "web" {
            Start-Service -Name "web :3000" -Cwd (Join-Path $RepoRoot "apps/web") `
                -Command "pnpm dev"
        }
        default {
            Write-Warning "unknown service: $svc (expected api|pandoc|crawler|web)"
        }
    }
    Start-Sleep -Milliseconds 250
}

Write-Host ""
Write-Host "All requested services spawned. Open windows show live logs." -ForegroundColor Yellow
Write-Host ""
Write-Host "Health: curl http://localhost:3001/health" -ForegroundColor DarkGray
Write-Host "Web:    http://localhost:3000" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Markitdown (Python) is separate — see docs/local-setup.md or run:" -ForegroundColor DarkGray
Write-Host "  powershell -File scripts/dev-markitdown.ps1" -ForegroundColor DarkGray
