# Installe un lancement automatique de OutlookBridge.exe à l'ouverture de
# session Windows, avec relance automatique en cas de plantage - via le
# Planificateur de tâches, PAS un Service Windows.
#
# Pourquoi pas un Service Windows (install_service.bat) : un Service
# tourne sous le compte SYSTEM, dans une session isolée du bureau
# ("Session 0"), sans accès à l'instance Outlook de l'utilisateur -
# l'automatisation COM d'Office y est connue pour être instable/non
# supportée par Microsoft. Une tâche planifiée déclenchée "à l'ouverture
# de session" tourne, elle, dans la vraie session interactive de
# l'utilisatrice, là où Outlook fonctionne normalement.
#
# Ne nécessite PAS de droits administrateur (contrairement à
# install_service.bat) : une tâche "à l'ouverture de session" pour son
# propre compte peut être créée par n'importe quel utilisateur standard.
#
# Usage : clic droit sur ce fichier > Exécuter avec PowerShell
# (ou via install_autostart.bat, qui fait ça automatiquement)

$ErrorActionPreference = 'Stop'

$TaskName = 'OutlookBridgeAutoStart'

# Le .exe est attendu à côté de ce script - c'est le cas si tu as
# extrait/copié ce script dans le même dossier que OutlookBridge.exe
# (celui téléchargé depuis le CRM).
$ExePath = Join-Path $PSScriptRoot 'OutlookBridge.exe'

if (-not (Test-Path $ExePath)) {
    Write-Host "❌ OutlookBridge.exe introuvable à côté de ce script ($ExePath)." -ForegroundColor Red
    Write-Host "   Place install_autostart.ps1 dans le même dossier que OutlookBridge.exe, puis relance." -ForegroundColor Red
    exit 1
}

# Supprime une tâche existante du même nom pour repartir propre (ex: si
# ce script est relancé après une mise à jour).
Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue

$Action = New-ScheduledTaskAction -Execute $ExePath
$Trigger = New-ScheduledTaskTrigger -AtLogOn
$Settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -MultipleInstances IgnoreNew `
    -RestartCount 999 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -ExecutionTimeLimit (New-TimeSpan -Days 0)

Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Description 'Lance OutlookBridge.exe à l''ouverture de session et le relance automatiquement s''il plante.' | Out-Null

Write-Host "✅ Tâche '$TaskName' créée : OutlookBridge.exe se lancera automatiquement à ta prochaine ouverture de session," -ForegroundColor Green
Write-Host "   et sera relancé tout seul s'il plante." -ForegroundColor Green
Write-Host ""
Write-Host "Pour le lancer maintenant sans attendre une reconnexion :" -ForegroundColor Cyan
Write-Host "   Start-ScheduledTask -TaskName '$TaskName'" -ForegroundColor Cyan
Start-ScheduledTask -TaskName $TaskName
Write-Host "✅ OutlookBridge.exe lancé." -ForegroundColor Green
