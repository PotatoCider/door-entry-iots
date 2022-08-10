import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { BaseResponse, sendBaseResponse } from '../../lib/api'
import { database, getUserFromToken, User } from '../../lib/db'
import { withSessionRoute } from '../../lib/session'
import { sendTelegramAPI } from '../../lib/telegram'


export type RequestData = z.infer<typeof RequestData>
export type ResponseData = BaseResponse

const RequestData = z.string().max(256, 'Message too long')

const sendResponse = sendBaseResponse

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  if (req.method !== 'POST') return sendResponse(res, 404, 'Not found')

  const found = req.headers.authorization?.match(/Bearer ([a-zA-Z0-9_-]{22})/)
  if (!found) return sendResponse(res, 401, 'Unauthorized')

  const body = RequestData.safeParse(req.body)
  if (!body.success) return sendResponse(res, 400, body.error.message)

  const token = found[1]

  const user = getUserFromToken(token)
  if (!user) return sendResponse(res, 200) // fail silently

  if (!user.telegram_chat_id) return sendResponse(res, 400, 'Telegram is not setup')

  const { TELEGRAM_BOT_TOKEN } = process.env
  if (!TELEGRAM_BOT_TOKEN) return sendResponse(res, 500, 'Internal Error')

  await sendTelegramAPI('sendMessage', {
    chat_id: user.telegram_chat_id,
    text: body.data,
  })

  sendResponse(res, 200)
}

export default withSessionRoute(handler)