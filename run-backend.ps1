# Simple backend launcher
$env:POCKETBASE_URL = "http://pc1.tailscale:8090"
$env:JWT_SECRET = "dev_secret_key_change_in_production_12345"
$env:FRONTEND_URL = "http://localhost:5173"
$env:PORT = "3000"
$env:DENO_ENV = "development"

Write-Host "Starting CoreVision Backend..." -ForegroundColor Green
Write-Host "Backend will run at: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""

deno run --allow-net --allow-env --allow-read --allow-import src/app/backend/index.ts
