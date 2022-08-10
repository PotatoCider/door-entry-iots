import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { BaseResponse, sendBaseResponse } from '../../lib/api'
import { database, getUserFromToken, User } from '../../lib/db'
import { withSessionRoute } from '../../lib/session'
import { sendTelegramAPI } from '../../lib/telegram'

export type ResponseData = BaseResponse

const sendResponse = sendBaseResponse

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  if (req.method !== 'POST') return sendResponse(res, 404, 'Not found')

  let { token, message } = req.query

  if (!message || message instanceof Array) return sendResponse(res, 400, 'Invalid message')

  // Note that we do not want to provide any info if the token is invalid.
  if (!token || token instanceof Array) return sendResponse(res, 200)

  const user = getUserFromToken(token)
  if (!user) return sendResponse(res, 200) // fail silently

  if (!user.telegram_chat_id) return sendResponse(res, 400, 'Telegram is not setup')

  const { TELEGRAM_BOT_TOKEN } = process.env
  if (!TELEGRAM_BOT_TOKEN) return sendResponse(res, 500)

  await sendTelegramAPI('sendMessage', {
    chat_id: user.telegram_chat_id,
    text: message,
  })

  sendResponse(res, 200)
}

export default withSessionRoute(handler)