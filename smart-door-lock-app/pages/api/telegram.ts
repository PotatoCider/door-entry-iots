
import { NextApiRequest, NextApiResponse } from 'next'
import { withSessionRoute } from '../../lib/session'
import { Update } from '@grammyjs/types'
import { database, getUserFromToken } from '../../lib/db'
import { BaseResponse, sendBaseResponse } from '../../lib/api'
import { sendTelegramMessage } from '../../lib/telegram'

export type ResponseData = BaseResponse

const sendResponse = sendBaseResponse

// TODO: implement telegram webhook

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  const { TELEGRAM_WEBHOOK_SECRET } = process.env
  const secret = req.headers['x-telegram-bot-api-secret-token']
  if (!TELEGRAM_WEBHOOK_SECRET || secret !== TELEGRAM_WEBHOOK_SECRET) return sendResponse(res, 401)

  console.log(req.body)
  const { message }: Update = JSON.parse(req.body)
  const text = message?.text
  if (!text || message.chat.type !== 'private') return sendResponse(res, 200)

  const params = text.trim().split(' ')

  switch (params[0]) {
    case '/device':
      const token = params[1]
      if (!token) {
        sendTelegramMessage(message.chat.id, 'Please key in a token.')
        return sendResponse(res, 200)
      }

      const user = getUserFromToken(token)
      if (!user) {
        sendTelegramMessage(message.chat.id, 'Token not found.')
        return sendResponse(res, 200)
      }

      database.prepare(`
        UPDATE users SET telegram_chat_id = ? WHERE device_token = ?
      `).run(message.chat.id, token)

      sendTelegramMessage(message.chat.id, 'Device is linked.')
      break
  }

  return sendResponse(res, 200)
}

export default withSessionRoute(handler)
