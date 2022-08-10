
import { NextApiRequest, NextApiResponse } from 'next'
import { withSessionRoute } from '../../lib/session'
import { Update } from '@grammyjs/types'
import { database, getUserFromToken } from '../../lib/db'

// TODO: implement telegram webhook

async function handler(req: NextApiRequest, res: NextApiResponse<never>) {
  const { TELEGRAM_WEBHOOK_SECRET } = process.env
  const secret = req.headers['x-telegram-bot-api-secret-token']
  if (!TELEGRAM_WEBHOOK_SECRET || secret !== TELEGRAM_WEBHOOK_SECRET) return res.end()

  const { message }: Update = JSON.parse(req.body)
  const text = message?.text
  if (!text || message.chat.type !== 'private') return res.end()

  const params = text.trim().split(' ')

  switch (params[0]) {
    case '/device':
      const token = params[1]
      if (!token) break

      const user = getUserFromToken(token)
      if (!user) break

      database.prepare(`
        UPDATE users SET telegram_chat_id = ? WHERE device_token = ?
      `).run(message.chat.id, token)
      break
  }

  return res.end()
}

export default withSessionRoute(handler)
