const crypto = require('crypto')
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
})

readline.question(`Enter Webhook URL: `, url => {
  readline.question(`Telegram Bot Token: `, async (token) => {
    const webhookSecret = crypto.randomBytes(16).toString('hex')
    console.log('Put this after TELEGRAM_WEBHOOK_SECRET= in your .env.local file')
    console.log(webhookSecret)

    let query = new URLSearchParams({
      commands: JSON.stringify({
        command: '/device',
        description: 'Set device token. Usage: /device <token>',
      }),
    })

    await fetch(`https://api.telegram.org/bot${token}/setMyCommands?${query}}`)

    query = new URLSearchParams({
      url,
      allowed_updates: JSON.stringify(['message']),
      secret_token: webhookSecret,
    })
    await fetch(`https://api.telegram.org/bot${token}/setWebhook?${query}}`)
    readline.close()
  })
})


