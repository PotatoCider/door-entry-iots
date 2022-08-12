#!/bin/bash

set -a
source .env.local
set +a

curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "'"${TELEGRAM_WEBHOOK_URL}"'",
    "allowed_updates": ["message"],
    "secret_token": "'"${TELEGRAM_WEBHOOK_SECRET}"'"
  }'
echo