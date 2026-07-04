# =============================================================
# COREVISION - Deploiement backend vers le VPS OVH
# Usage : depuis la racine du projet dans PowerShell
#   .\deploy\deploy.ps1
# =============================================================

$VPS_USER   = "ubuntu"
$VPS_IP     = "54.38.176.9"
$SSH_KEY    = "C:\Users\conta\.ssh\id_ed25519"
$REMOTE_APP = "/opt/corevision-api"
$LOCAL_SRC  = "src\app\supabase\functions\server"
$ARCHIVE    = "$env:TEMP\corevision-server.tar.gz"

$ErrorActionPreference = "Stop"

function Step($msg) { Write-Host "" ; Write-Host $msg -ForegroundColor Cyan }
function OK($msg)   { Write-Host "  OK : $msg" -ForegroundColor Green }
function Fail($msg) { Write-Host "  ERREUR : $msg" -ForegroundColor Red ; exit 1 }

Step "==> Deploiement Corevision Backend -> ${VPS_USER}@${VPS_IP}"

# -- 1. Verifications -----------------------------------------------------------
if (-not (Test-Path $LOCAL_SRC)) { Fail "Dossier source introuvable : $LOCAL_SRC" }
if (-not (Test-Path $SSH_KEY))   { Fail "Cle SSH introuvable : $SSH_KEY" }

# -- 2. Archive du code serveur ------------------------------------------------
Step "Etape 1/4 - Creation de l'archive..."
Remove-Item $ARCHIVE -ErrorAction SilentlyContinue
tar -czf $ARCHIVE -C "src\app\supabase\functions" server
if ($LASTEXITCODE -ne 0) { Fail "Erreur creation archive tar" }
$sizeKB = [math]::Round((Get-Item $ARCHIVE).Length / 1KB, 0)
OK "Archive creee ($sizeKB KB) -> $ARCHIVE"

# -- 3. Envoi sur le VPS -------------------------------------------------------
Step "Etape 2/4 - Envoi vers le VPS via SCP..."
& scp -i $SSH_KEY -o StrictHostKeyChecking=no `
    $ARCHIVE `
    "${VPS_USER}@${VPS_IP}:/tmp/corevision-server.tar.gz"
if ($LASTEXITCODE -ne 0) { Fail "Erreur SCP - verifiez votre connexion et l'IP du VPS" }
OK "Archive transferee sur le VPS"

# -- 4. Extraction + redemarrage -----------------------------------------------
Step "Etape 3/4 - Extraction et redemarrage du service..."
$remoteCmd = "sudo tar -xzf /tmp/corevision-server.tar.gz -C $REMOTE_APP/ --overwrite && sudo systemctl daemon-reload && sudo systemctl restart corevision-api && sleep 2 && sudo systemctl status corevision-api --no-pager && rm -f /tmp/corevision-server.tar.gz"

& ssh -i $SSH_KEY -o StrictHostKeyChecking=no "${VPS_USER}@${VPS_IP}" $remoteCmd
if ($LASTEXITCODE -ne 0) { Fail "Erreur SSH - voir logs ci-dessus" }

# -- 5. Nettoyage local --------------------------------------------------------
Remove-Item $ARCHIVE -ErrorAction SilentlyContinue

# -- 6. Test de sante ----------------------------------------------------------
Step "Etape 4/4 - Test de sante de l'API (attente 3s)..."
Start-Sleep -Seconds 3
try {
    $health = Invoke-RestMethod "https://api.corevision-cgp.org/make-server-cac859af/health" -TimeoutSec 10
    OK "API operationnelle - $($health | ConvertTo-Json -Compress)"
} catch {
    Write-Host "  AVERTISSEMENT : le test de sante n'a pas repondu." -ForegroundColor Yellow
    Write-Host "  Verifiez manuellement : https://api.corevision-cgp.org/make-server-cac859af/health" -ForegroundColor Gray
}

Write-Host ""
Write-Host "==> Deploiement termine !" -ForegroundColor Green
Write-Host ""
