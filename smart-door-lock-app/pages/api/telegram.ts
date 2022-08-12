
import { NextApiRequest, NextApiResponse } from 'next'
import { withSessionRoute } from '../../lib/session'
import { Update } from '@grammyjs/types'
import { database, getUserFromToken, User } from '../../lib/db'
import { BaseResponse, sendBaseResponse } from '../../lib/api'
import { sendTelegramMessage } from '../../lib/telegram'
import { _openDoor } from './door'

export type ResponseData = BaseResponse

const sendResponse = sendBaseResponse

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  const { TELEGRAM_WEBHOOK_SECRET } = process.env
  const secret = req.headers['x-telegram-bot-api-secret-token']
  if (!TELEGRAM_WEBHOOK_SECRET || secret !== TELEGRAM_WEBHOOK_SECRET) return sendResponse(res, 401)

  const { message }: Update = req.body

  const text = message?.text
  if (!text || message.chat.type !== 'private') return sendResponse(res, 200)

  const params = text.trim().split(/ +/)

  console.log(params[0])

  let user: User | undefined
  switch (params[0]) {
    case '/start':
      await sendTelegramMessage(message.chat.id, 'Please key in your device token using\n`/device <insert token here>`')
      return sendResponse(res, 200)

    case '/open':
      const users: User[] = database.prepare(`
      SELECT * FROM users WHERE telegram_chat_id = ?
      `).all(message.chat.id)

      if (users.length == 0) {
        await sendTelegramMessage(message.chat.id, 'Please setup a token first.')
        return sendResponse(res, 200)
      }

      const index = +params[1] - 1

      if (index < 0 || isNaN(index)) {
        await sendTelegramMessage(message.chat.id, `Please choose a device to open.\n${users.map((user, i) => `${i + 1}. ${user.device_token}`).join('\n')}`)
        return sendResponse(res, 200)
      }

      const timeout = +(params[2] || '5000')
      _openDoor(users[index].device_token, timeout)

      return sendResponse(res, 200)
    case '/device':
      const token = params[1]
      if (!token) {
        await sendTelegramMessage(message.chat.id, 'Please key in a token.')
        return sendResponse(res, 200)
      }

      user = getUserFromToken(token)
      if (!user) {
        await sendTelegramMessage(message.chat.id, 'Token not found.')
        return sendResponse(res, 200)
      }

      database.prepare(`
        UPDATE users SET telegram_chat_id = ? WHERE device_token = ?
      `).run(message.chat.id, token)

      await sendTelegramMessage(message.chat.id, 'Device is linked.')

      return sendResponse(res, 200)
  }

  return sendResponse(res, 200)
}

export default withSessionRoute(handler)
