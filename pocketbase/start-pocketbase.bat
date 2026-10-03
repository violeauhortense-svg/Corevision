@echo off
REM Lance PocketBase avec ses données HORS du dossier OneDrive
REM (C:\Users\conta\pocketbase-data) - PocketBase 0.40.2 echoue
REM silencieusement ("Failed to create record", sans detail) des qu'un
REM champ fichier est televerse si pb_data vit dans un dossier synchronise
REM OneDrive. Verifie et reproduit le 2026-10-03 : le meme upload
REM reussit instantanement une fois pb_data deplace hors de OneDrive.
cd /d "%~dp0"
pocketbase.exe serve --http=127.0.0.1:8090 --dir="C:\Users\conta\pocketbase-data"
