@echo off
REM ============================================
REM Outlook Bridge V3 - Windows Service Uninstaller
REM ============================================

echo.
echo 🌉 Outlook Bridge V3 - Désinstallation Service Windows
echo ============================================
echo.

REM Vérifier si l'utilisateur est admin
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Droits administrateur détectés
) else (
    echo ❌ ERREUR: Droits administrateur requis!
    echo.
    echo 💡 Solution:
    echo    1. Clique droit sur ce fichier (.bat)
    echo    2. Sélectionne "Exécuter en tant qu'administrateur"
    echo.
    pause
    exit /b 1
)

echo.
echo 🛑 Arrêt du service...
python bridge_service.py stop
timeout /t 2 /nobreak

echo.
echo 🗑️  Suppression du service...
python bridge_service.py remove

if %errorLevel% == 0 (
    echo.
    echo ✅ Service supprimé avec succès!
    echo.
    echo 🔥 Le Bridge Outlook V3 a été désinstallé.
    echo    Les données de configuration restent intactes.
) else (
    echo.
    echo ❌ ERREUR: La suppression du service a échoué
)

echo.
pause
