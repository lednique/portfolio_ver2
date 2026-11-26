@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ==============================================
echo   LEDNIQUE — Локальные настройки сайта
echo   Все правки сохраняются в content\site-data.json
echo   и assets\uploads\ (готово к загрузке на GitHub)
echo ==============================================
where node >nul 2>nul
if errorlevel 1 (
  echo Ошибка: установите Node.js (https://nodejs.org) и запустите файл снова.
  pause
  exit /b 1
)
node scripts/serve-root.mjs --open-admin
pause
