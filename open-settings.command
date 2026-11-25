#!/bin/bash
cd "$(dirname "$0")" || exit 1
echo "=============================================="
echo "  LEDNIQUE — Локальные настройки сайта"
echo "  Папка: $(pwd)"
echo "  Все правки сохраняются в content/site-data.json"
echo "  и assets/uploads/ (готово к загрузке на GitHub)"
echo "=============================================="
if ! command -v node >/dev/null 2>&1; then
  echo "Ошибка: установите Node.js (https://nodejs.org) и запустите файл снова."
  read -r -p "Нажмите Enter для выхода..."
  exit 1
fi
node scripts/serve-root.mjs --open-admin
