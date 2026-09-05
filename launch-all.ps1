# CoreVision - Full Stack Launcher
# Lance PocketBase + Backend + Setup automatique
# Run as: .\launch-all.ps1

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║       🚀 CoreVision - Full Stack One-Click Launch         ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ─── Check Prerequisites ───────────────────────────────────────────────
Write-Host "📋 Vérification des prérequis..." -ForegroundColor Yellow

# Check Deno
$denoCheck = try {
    deno --version | Out-Null
    $true
} catch {
    $false
}

if (-not $denoCheck) {
    Write-Host "❌ Deno n'est pas installé!" -ForegroundColor Red
    Write-Host "   Installe Deno: https://deno.com/manual/getting_started/installation" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Deno installé" -ForegroundColor Green

# Check PocketBase exists
if (-not (Test-Path "C:\pocketbase\pocketbase.exe")) {
    Write-Host "❌ PocketBase n'a pas été trouvé!" -ForegroundColor Red
    Write-Host "   Télécharge-le: https://github.com/pocketbase/pocketbase/releases" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ PocketBase trouvé" -ForegroundColor Green

# Check Tailscale
$tsCheck = try {
    tailscale status | Out-Null
    $true
} catch {
    $false
}

if (-not $tsCheck) {
    Write-Host "⚠️  Tailscale n'est pas actif (but it's optional)" -ForegroundColor Yellow
} else {
    Write-Host "✅ Tailscale actif" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Lancement du stack complet..." -ForegroundColor Green
Write-Host ""

# ─── Launch PocketBase ─────────────────────────────────────────────────
Write-Host "1️⃣  Lancement de PocketBase..." -ForegroundColor Cyan
Start-Process -FilePath "C:\pocketbase\pocketbase.exe" -ArgumentList "serve" -WindowStyle Normal
Start-Sleep -Seconds 3

Write-Host "✅ PocketBase lancé (http://localhost:8090)" -ForegroundColor Green

# ─── Setup PocketBase Collections ─────────────────────────────────────
Write-Host ""
Write-Host "2️⃣  Configuration de PocketBase..." -ForegroundColor Cyan

$headers = @{"Content-Type" = "application/json"}

# Wait for PocketBase to be ready
$maxRetries = 10
$retries = 0
$pbReady = $false

while ($retries -lt $maxRetries -and -not $pbReady) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8090/api/health" -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $pbReady = $true
        }
    } catch {
        $retries++
        Start-Sleep -Seconds 1
    }
}

if ($pbReady) {
    Write-Host "✅ PocketBase est prêt" -ForegroundColor Green
} else {
    Write-Host "⚠️  PocketBase prend du temps à démarrer... attends 10 secondes" -ForegroundColor Yellow
    Start-Sleep -Seconds 10
}

# Create users collection
Write-Host "   Création de la collection 'users'..." -ForegroundColor White
try {
    $usersCollection = @{
        name = "users"
        type = "base"
        fields = @(
            @{ name = "id"; type = "text"; options = @{ primaryKey = $true } }
            @{ name = "email"; type = "text"; options = @{ unique = $true } }
            @{ name = "password"; type = "text" }
            @{ name = "name"; type = "text" }
            @{ name = "role"; type = "text"; options = @{ defaultValue = "consultant" } }
        )
    } | ConvertTo-Json

    # Note: PocketBase Admin API requires auth - we'll skip direct creation
    # Instead, users should create via UI or we document manual setup
    Write-Host "   ⓘ Collections créées manuellement via UI (voir instructions)" -ForegroundColor Yellow
} catch {
    Write-Host "   ⚠️  Erreur création collection (pas critique)" -ForegroundColor Yellow
}

# ─── Launch Backend ────────────────────────────────────────────────────
Write-Host ""
Write-Host "3️⃣  Lancement du Backend Deno..." -ForegroundColor Cyan

$env:POCKETBASE_URL = "http://pc1.tailscale:8090"
$env:JWT_SECRET = "dev_secret_key_change_in_production_12345"
$env:FRONTEND_URL = "http://localhost:5173"
$env:PORT = "3000"
$env:DENO_ENV = "development"

Start-Process -FilePath "powershell.exe" -ArgumentList `
    "-NoExit", `
    "-Command", `
    "cd '$PSScriptRoot'; deno run --allow-net --allow-env --allow-read --allow-import src/app/backend/index.ts" `
    -WindowStyle Normal

Write-Host "✅ Backend lancé (http://localhost:3000)" -ForegroundColor Green

# ─── Summary ───────────────────────────────────────────────────────────
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                  ✅ Stack Complet Actif                   ║" -ForegroundColor Green
Write-Host "╠════════════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║ 🎯 Services lancés:                                        ║" -ForegroundColor Green
Write-Host "║   ✅ PocketBase Admin:  http://localhost:8090/_/          ║" -ForegroundColor Green
Write-Host "║   ✅ Backend API:       http://localhost:3000             ║" -ForegroundColor Green
Write-Host "║   ✅ Frontend (Vercel): https://corevision-main.vercel  ║" -ForegroundColor Green
Write-Host "║                                                            ║" -ForegroundColor Green
Write-Host "║ 📋 SETUP MANUEL REQUIS:                                    ║" -ForegroundColor Cyan
Write-Host "║   1. Va sur: http://localhost:8090/_/                     ║" -ForegroundColor Cyan
Write-Host "║   2. Crée collection 'users' (voir guide)                 ║" -ForegroundColor Cyan
Write-Host "║   3. Crée un utilisateur de test:                         ║" -ForegroundColor Cyan
Write-Host "║      Email: violeau.hortense@gmail.com                    ║" -ForegroundColor Cyan
Write-Host "║      Password: Hvguillote78                               ║" -ForegroundColor Cyan
Write-Host "║   4. Teste sur: https://corevision-main.vercel.app       ║" -ForegroundColor Cyan
Write-Host "║                                                            ║" -ForegroundColor Green
Write-Host "║ 🧪 TEST QUICK:                                             ║" -ForegroundColor White
Write-Host "║   curl http://localhost:3000/health                       ║" -ForegroundColor White
Write-Host "║   Doit retourner: { status: 'ok', backend: 'pocketbase' } ║" -ForegroundColor White
Write-Host "║                                                            ║" -ForegroundColor Green
Write-Host "║ 📚 Docs: Voir POCKETBASE_SETUP_GUIDE.md                   ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "⏳ Attends ~5 secondes pour que tout démarre complètement..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "✅ PRÊT! Va tester sur https://corevision-main.vercel.app" -ForegroundColor Green
Write-Host ""
