# CoreVision Backend Launcher - Windows PowerShell
# Lance le backend Deno/Hono avec PocketBase

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        🚀 CoreVision Backend - Local Development         ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 1. Vérifier que PocketBase est lancé
Write-Host "📋 Vérification des prérequis..." -ForegroundColor Yellow
$pbCheck = try {
    Invoke-WebRequest -Uri "http://localhost:8090/api/health" -ErrorAction SilentlyContinue
    $true
} catch {
    $false
}

if (-not $pbCheck) {
    Write-Host "❌ PocketBase n'est pas lancé!" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Pour lancer PocketBase:" -ForegroundColor Yellow
    Write-Host "   1. Ouvre une nouvelle fenêtre PowerShell" -ForegroundColor White
    Write-Host "   2. cd C:\pocketbase" -ForegroundColor White
    Write-Host "   3. .\pocketbase.exe serve" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✅ PocketBase est actif" -ForegroundColor Green

# 2. Vérifier Tailscale
Write-Host "📋 Vérification Tailscale..." -ForegroundColor Yellow
$tsCheck = try {
    ping -n 1 "pc1.tailscale" -ErrorAction SilentlyContinue | Select-String "Reply" | Measure-Object | ForEach-Object { $_.Count -gt 0 }
} catch {
    $false
}

if ($tsCheck) {
    Write-Host "✅ Tailscale est connecté" -ForegroundColor Green
} else {
    Write-Host "⚠️  Tailscale non accessible (but you can continue)" -ForegroundColor Yellow
}

# 3. Lancer Deno backend
Write-Host ""
Write-Host "🚀 Démarrage du backend..." -ForegroundColor Green
Write-Host ""

# Set env vars
$env:POCKETBASE_URL = "http://pc1.tailscale:8090"
$env:JWT_SECRET = "dev_secret_key_change_in_production_12345"
$env:FRONTEND_URL = "http://localhost:5173"
$env:PORT = "3000"
$env:DENO_ENV = "development"

# Launch Deno
Write-Host "Lancement: deno run --allow-net --allow-env --allow-read src/app/backend/index.ts" -ForegroundColor Cyan
Write-Host ""

deno run `
    --allow-net `
    --allow-env `
    --allow-read `
    --allow-import `
    "src/app/backend/index.ts"

# Si on arrive ici, il y a eu une erreur
Write-Host ""
Write-Host "❌ Backend arrêté!" -ForegroundColor Red
