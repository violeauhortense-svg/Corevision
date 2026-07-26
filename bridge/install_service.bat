@echo off
REM ============================================
REM Outlook Bridge V3 - Windows Service Installer
REM ============================================

echo.
echo 🌉 Outlook Bridge V3 - Installation Service Windows
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
echo 📦 Vérification des dépendances Python...

python --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ ERREUR: Python n'est pas installé ou non accessible!
    echo.
    echo 💡 Installation:
    echo    1. Télécharge Python 3.8+ depuis python.org
    echo    2. Installe avec "Add Python to PATH" coché
    echo    3. Relance ce script
    echo.
    pause
    exit /b 1
)

echo ✅ Python trouvé
python --version

echo.
echo 📥 Installation des dépendances Python...
pip install pywin32 --quiet
if %errorLevel% neq 0 (
    echo ❌ ERREUR lors de l'installation de pywin32
    pause
    exit /b 1
)

echo ✅ Dépendances installées

echo.
echo 🔧 Post-installation pywin32...
python -m Scripts.pywin32_postinstall -install >nul 2>&1
if %errorLevel% neq 0 (
    echo ⚠️  Attention lors de la post-installation (non-critique)
)

echo.
echo 🚀 Installation du service Windows...
python bridge_service.py install
if %errorLevel% neq 0 (
    echo ❌ ERREUR: Installation du service échouée
    pause
    exit /b 1
)

echo ✅ Service installé avec succès!

echo.
echo ⏱️  Démarrage du service...
python bridge_service.py start
if %errorLevel% neq 0 (
    echo ⚠️  Le service a été installé mais n'a pas pu démarrer
    echo   Vérifiez que Outlook est installé et configuré
    pause
    exit /b 1
)

echo.
echo ✅ Service démarré avec succès!
echo.
echo ============================================
echo 🎉 Installation terminée!
echo ============================================
echo.
echo 📋 Prochaines étapes:
echo    1. Vérifie que le Bridge est online dans l'app
echo    2. Clique sur "Sync Now" pour tester
echo    3. Les mails arrivent automatiquement toutes les 30s
echo.
echo 🔧 Commandes de gestion:
echo    - Démarrer:     python bridge_service.py start
echo    - Arrêter:      python bridge_service.py stop
echo    - Redémarrer:   python bridge_service.py restart
echo    - Désinstaller: python bridge_service.py remove
echo.
pause
