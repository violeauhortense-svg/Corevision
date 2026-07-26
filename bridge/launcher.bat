@echo off
REM ============================================
REM Outlook Bridge Launcher (Sans droits admin)
REM ============================================

echo.
echo 🌉 Outlook Bridge - Launcher
echo ============================================
echo.

REM Vérifier Python
python --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ ERREUR: Python n'est pas installé!
    echo.
    echo Télécharge Python depuis python.org
    echo et installe avec "Add Python to PATH" coché
    echo.
    pause
    exit /b 1
)

echo ✅ Python trouvé

REM Installer les dépendances si nécessaire
echo.
echo 📦 Vérification des dépendances...
pip show flask >nul 2>&1
if %errorLevel% neq 0 (
    echo 📥 Installation des dépendances...
    pip install -r requirements.txt --quiet
)

echo.
echo 🚀 Démarrage du launcher...
echo.

REM Lancer le launcher GUI
python launcher.py

pause
