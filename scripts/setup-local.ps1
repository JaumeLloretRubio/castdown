# castdown — one-shot local setup verifier (no Docker).
# Checks that all binaries the stack needs are available, prints actionable hints.

$ErrorActionPreference = "Continue"
$ok = $true

function Check-Cmd {
    param([string]$Cmd, [string]$Why, [string]$Install)
    $found = Get-Command $Cmd -ErrorAction SilentlyContinue
    if ($found) {
        $ver = ""
        try { $ver = (& $Cmd --version 2>&1 | Select-Object -First 1) } catch {}
        Write-Host ("  OK    {0,-12} {1}" -f $Cmd, $ver) -ForegroundColor Green
    } else {
        Write-Host ("  MISS  {0,-12} {1}" -f $Cmd, $Why) -ForegroundColor Red
        Write-Host ("        install: {0}" -f $Install) -ForegroundColor DarkGray
        $script:ok = $false
    }
}

Write-Host ""
Write-Host "== Required for ALL local services ==" -ForegroundColor Cyan
Check-Cmd "node"   "TS services runtime"          "winget install OpenJS.NodeJS.LTS"
Check-Cmd "pnpm"   "workspace manager"            "npm install -g pnpm@9.12.0"
Check-Cmd "python" "markitdown-svc only"          "winget install Python.Python.3.12"

Write-Host ""
Write-Host "== Required for pandoc-svc (MD -> PDF/DOCX/HTML/PPTX/EPUB) ==" -ForegroundColor Cyan
Check-Cmd "pandoc" "format conversion"            "winget install JohnMacFarlane.Pandoc"
Check-Cmd "typst"  "PDF rendering (default path)" "winget install Typst.Typst"

$marp = Get-Command marp -ErrorAction SilentlyContinue
if ($marp) {
    Write-Host ("  OK    {0,-12} {1}" -f "marp", "@marp-team/marp-cli installed") -ForegroundColor Green
} else {
    Write-Host ("  MISS  {0,-12} {1}" -f "marp", "PPTX rendering") -ForegroundColor Red
    Write-Host "        install: npm install -g @marp-team/marp-cli@4.0.4" -ForegroundColor DarkGray
    $ok = $false
}

Write-Host ""
Write-Host "== Required for crawler-svc (URL -> tree of .md) ==" -ForegroundColor Cyan
$chromium = Join-Path $env:LOCALAPPDATA "ms-playwright"
if (Test-Path $chromium) {
    Write-Host ("  OK    {0,-12} {1}" -f "playwright", "browsers found at $chromium") -ForegroundColor Green
} else {
    Write-Host ("  MISS  {0,-12} {1}" -f "playwright", "Chromium for crawler") -ForegroundColor Red
    Write-Host "        install: pnpm --filter @castdown/crawler-svc exec playwright install chromium" -ForegroundColor DarkGray
    $ok = $false
}

Write-Host ""
Write-Host "== Optional ==" -ForegroundColor Cyan
$redis = Get-Command redis-cli -ErrorAction SilentlyContinue
if ($redis) {
    Write-Host ("  OK    {0,-12} {1}" -f "redis-cli", "rate-limit will be enforced") -ForegroundColor Green
} else {
    Write-Host ("  SKIP  {0,-12} {1}" -f "redis", "fail-open ratelimit (OK for local)") -ForegroundColor Yellow
    Write-Host "        install: winget install Memurai.MemuraiDeveloper" -ForegroundColor DarkGray
}

Write-Host ""
if ($ok) {
    Write-Host "All required tools present. Next:" -ForegroundColor Green
    Write-Host "  pnpm install -r --ignore-scripts" -ForegroundColor DarkGray
    Write-Host "  powershell -File scripts/setup-markitdown.ps1   # one-time" -ForegroundColor DarkGray
    Write-Host "  powershell -File scripts/dev-local.ps1" -ForegroundColor DarkGray
} else {
    Write-Host "Some tools are missing. See hints above and re-run this script." -ForegroundColor Yellow
}
