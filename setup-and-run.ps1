# CoreVision - Complete Setup & Run Script
# Downloads PocketBase + Launches Backend

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     CoreVision - Complete Setup & Auto-Start              ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$projectRoot = $PSScriptRoot
$pbDir = Join-Path $projectRoot "pocketbase"

# ─── Step 1: Download PocketBase ───────────────────────────────────────
Write-Host "📥 Téléchargement de PocketBase..." -ForegroundColor Yellow

# Create directory
if (-not (Test-Path $pbDir)) {
    New-Item -ItemType Directory -Path $pbDir | Out-Null
}

# Download PocketBase (latest Windows amd64)
$pbZip = Join-Path $pbDir "pocketbase.zip"
$pbExe = Join-Path $pbDir "pocketbase.exe"

if (-not (Test-Path $pbExe)) {
    Write-Host "   Téléchargement en cours..." -ForegroundColor Cyan

    try {
        # Get latest release download URL
        $releases = Invoke-WebRequest -Uri "https://api.github.com/repos/pocketbase/pocketbase/releases/latest" -UseBasicParsing
        $releaseData = ConvertFrom-Json $releases.Content

        # Find Windows amd64 asset
        $asset = $releaseData.assets | Where-Object { $_.name -match "windows_amd64" } | Select-Object -First 1

        if ($asset) {
            Write-Host "   URL: $($asset.browser_download_url)" -ForegroundColor Gray
            Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $pbZip -UseBasicParsing

            # Extract
            Write-Host "   Extraction..." -ForegroundColor Cyan
            Expand-Archive -Path $pbZip -DestinationPath $pbDir -Force
            Remove-Item $pbZip

            Write-Host "✅ PocketBase téléchargé" -ForegroundColor Green
        } else {
            Write-Host "❌ Asset Windows introuvable" -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Host "❌ Erreur téléchargement: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ PocketBase déjà présent" -ForegroundColor Green
}

# ─── Step 2: Launch PocketBase ─────────────────────────────────────────
Write-Host ""
Write-Host "🚀 Lancement de PocketBase..." -ForegroundColor Yellow

$pbProcess = Start-Process -FilePath $pbExe -ArgumentList "serve" -WindowStyle Normal -PassThru
Write-Host "✅ PocketBase lancé (PID: $($pbProcess.Id))" -ForegroundColor Green
Start-Sleep -Seconds 3

# ─── Step 3: Launch Backend ───────────────────────────────────────────
Write-Host ""
Write-Host "🚀 Lancement du Backend Deno..." -ForegroundColor Yellow

$env:POCKETBASE_URL = "http://localhost:8090"
$env:JWT_SECRET = "dev_secret_key_change_in_production_12345"
$env:FRONTEND_URL = "http://localhost:5173"
$env:PORT = "3000"
$env:DENO_ENV = "development"

$backendProcess = Start-Process -FilePath "powershell.exe" -ArgumentList `
    "-NoExit", `
    "-Command", `
    "cd '$projectRoot'; deno run --allow-net --allow-env --allow-read --allow-import src/app/backend/index.ts" `
    -WindowStyle Normal -PassThru

Write-Host "✅ Backend lancé (PID: $($backendProcess.Id))" -ForegroundColor Green

# ─── Summary ───────────────────────────────────────────────────────────
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              ✅ Stack Complètement Actif                  ║" -ForegroundColor Green
Write-Host "╠════════════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║                                                            ║" -ForegroundColor Green
Write-Host "║  Services:                                                 ║" -ForegroundColor Green
Write-Host "║    🎯 PocketBase Admin:  http://localhost:8090/_/         ║" -ForegroundColor Green
Write-Host "║    🎯 Backend API:       http://localhost:3000            ║" -ForegroundColor Green
Write-Host "║    🎯 Frontend:          https://corevision-main.vercel   ║" -ForegroundColor Green
Write-Host "║                                                            ║" -ForegroundColor Green
Write-Host "║  PROCHAINES ÉTAPES:                                        ║" -ForegroundColor Cyan
Write-Host "║    1. Va sur: http://localhost:8090/_/                    ║" -ForegroundColor Cyan
Write-Host "║    2. Crée collection 'users':                            ║" -ForegroundColor Cyan
Write-Host "║       - email (TEXT, unique)                              ║" -ForegroundColor Cyan
Write-Host "║       - password (TEXT)                                   ║" -ForegroundColor Cyan
Write-Host "║       - name (TEXT)                                       ║" -ForegroundColor Cyan
Write-Host "║       - role (TEXT, default: consultant)                  ║" -ForegroundColor Cyan
Write-Host "║    3. Crée utilisateur test:                              ║" -ForegroundColor Cyan
Write-Host "║       Email: violeau.hortense@gmail.com                   ║" -ForegroundColor Cyan
Write-Host "║       Pass:  Hvguillote78                                 ║" -ForegroundColor Cyan
Write-Host "║    4. Test: https://corevision-main.vercel.app           ║" -ForegroundColor Cyan
Write-Host "║                                                            ║" -ForegroundColor Green
Write-Host "║  COMMANDES UTILES:                                         ║" -ForegroundColor White
Write-Host "║    curl http://localhost:3000/health                      ║" -ForegroundColor White
Write-Host "║    curl http://localhost:3000/api/clients                 ║" -ForegroundColor White
Write-Host "║                                                            ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "✨ Prêt! Attends 5 secondes..." -ForegroundColor Green
Start-Sleep -Seconds 5

Write-Host "Ouvre le navigateur..." -ForegroundColor Yellow
Start-Process "https://corevision-main.vercel.app"

Write-Host ""
Write-Host "Les deux fenêtres de services doivent rester actives." -ForegroundColor Yellow
Write-Host "Ne ferme pas cette fenêtre!" -ForegroundColor Yellow
Write-Host ""

# Keep script running
while ($true) {
    # Check if processes are still running
    if (-not (Get-Process -Id $pbProcess.Id -ErrorAction SilentlyContinue)) {
        Write-Host "[WARNING] PocketBase stopped" -ForegroundColor Yellow
    }
    if (-not (Get-Process -Id $backendProcess.Id -ErrorAction SilentlyContinue)) {
        Write-Host "[WARNING] Backend stopped" -ForegroundColor Yellow
    }
    Start-Sleep -Seconds 10
}
