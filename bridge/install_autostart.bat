@echo off
REM ============================================
REM Outlook Bridge - Lancement automatique
REM (sans droits administrateur)
REM ============================================

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install_autostart.ps1"
pause
