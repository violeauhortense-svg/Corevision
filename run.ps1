param([switch]$SkipPocketBase)

Write-Host "CoreVision Backend Setup" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host ""

# Download PocketBase if needed
$pbDir = Join-Path $PSScriptRoot "pocketbase"
$pbExe = Join-Path $pbDir "pocketbase.exe"

if (-not (Test-Path $pbExe) -and -not $SkipPocketBase) {
    Write-Host "Downloading PocketBase..." -ForegroundColor Yellow
    if (-not (Test-Path $pbDir)) {
        New-Item -ItemType Directory -Path $pbDir | Out-Null
    }

    $pbZip = Join-Path $pbDir "pb.zip"

    try {
        $releases = Invoke-WebRequest -Uri "https://api.github.com/repos/pocketbase/pocketbase/releases/latest" -UseBasicParsing
        $data = ConvertFrom-Json $releases.Content
        $asset = $data.assets | Where-Object { $_.name -match "windows_amd64" } | Select-Object -First 1

        if ($asset) {
            Write-Host "Downloading from: $($asset.browser_download_url)" -ForegroundColor Gray
            Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $pbZip -UseBasicParsing
            Expand-Archive -Path $pbZip -DestinationPath $pbDir -Force
            Remove-Item $pbZip -Force
            Write-Host "Done." -ForegroundColor Green
        }
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
    }
}

# Launch PocketBase
if (Test-Path $pbExe) {
    Write-Host ""
    Write-Host "Launching PocketBase..." -ForegroundColor Yellow
    Start-Process -FilePath $pbExe -ArgumentList "serve" -WindowStyle Normal
    Start-Sleep -Seconds 3
    Write-Host "OK - http://localhost:8090/_/" -ForegroundColor Green
}

# Launch Backend
Write-Host ""
Write-Host "Launching Backend..." -ForegroundColor Yellow

$env:POCKETBASE_URL = "http://localhost:8090"
$env:JWT_SECRET = "dev_secret_key_change_in_production_12345"
$env:FRONTEND_URL = "http://localhost:5173"
$env:PORT = "3000"
$env:DENO_ENV = "development"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Services Ready:" -ForegroundColor Green
Write-Host "  PocketBase:  http://localhost:8090/_/" -ForegroundColor Green
Write-Host "  Backend:     http://localhost:3000" -ForegroundColor Green
Write-Host "  Frontend:    https://corevision-main.vercel.app" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Create 'users' collection in PocketBase" -ForegroundColor Cyan
Write-Host "2. Create test user:" -ForegroundColor Cyan
Write-Host "   Email: violeau.hortense@gmail.com" -ForegroundColor Cyan
Write-Host "   Pass:  Hvguillote78" -ForegroundColor Cyan
Write-Host "3. Test on Vercel" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

deno run --allow-net --allow-env --allow-read --allow-import src/app/backend/index.ts
