@echo off
title Iniciar Recordar Mobile

set "BASE=%~dp0"
set "BACK=%BASE%..\backend-recordar-novo"

if not exist "%BACK%\package.json" (
    echo Backend nao encontrado em:
    echo %BACK%
    pause
    exit /b 1
)

powershell -NoProfile -Command "Start-Process -FilePath 'node' -WorkingDirectory '%BACK%' -ArgumentList 'scripts/start-ai-local.cjs' -WindowStyle Hidden"
start "Recordar Backend" cmd /k "cd /d ""%BACK%"" && npm run demo"

start "Recordar Frontend" cmd /k "cd /d ""%BASE%"" && npx expo start --clear"

echo Backend e frontend iniciados.
echo No terminal do Expo, pressione W para abrir no PC.
pause
