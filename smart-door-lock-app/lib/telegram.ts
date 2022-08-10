

export async function sendTelegramAPI(method: string, params: Record<string, string>) {
  const TELEGRAM_BOT_TOKEN = process.env
  if (!TELEGRAM_BOT_TOKEN) return

  const query = new URLSearchParams(params)
  return fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}?${query}`)
}

export async function telegramSetup(url: string) {
  if (!process.env.TELEGRAM_WEBHOOK_SECRET) return console.error('TELEGRAM_WEBHOOK_SECRET not in .env')
  if (!url) return console.error('no url')
  await sendTelegramAPI('setMyCommands', {
    commands: JSON.stringify({
      command: '/device',
      description: 'Set device token. Usage: /device <token>',
    })
  })
  await sendTelegramAPI('setWebhook', {
    url,
    allowed_updates: JSON.stringify(['message']),
    secret_token: process.env.TELEGRAM_WEBHOOK_SECRET,
  })
}