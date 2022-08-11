export async function sendTelegramAPI(method: string, params: Record<string, string>) {
  const { TELEGRAM_BOT_TOKEN } = process.env
  if (!TELEGRAM_BOT_TOKEN) return

  const query = new URLSearchParams(params)
  return fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}?${query}`)
}

export async function sendTelegramMessage(chat_id: number, text: string) {
  return sendTelegramAPI('sendMessage', { chat_id: chat_id.toString(), text })
}