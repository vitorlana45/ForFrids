#!/usr/bin/env sh
# Chama o endpoint de aniversários. Configurar no crontab do VPS:
#   0 11 * * * /path/to/scripts/cron-reminders.sh >> /var/log/eterno-pet-cron.log 2>&1
set -eu

APP_URL="${APP_URL:-https://eternopet.com.br}"
CRON_SECRET="${CRON_SECRET:?CRON_SECRET não definido}"

curl -sf \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  "${APP_URL}/api/cron/birthday-reminders"
