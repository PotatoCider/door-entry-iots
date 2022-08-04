import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { BaseResponse, fetchJSON, sendBaseResponse } from '../../lib/api'
import { withSessionRoute } from '../../lib/session'

export type ResponseData = BaseResponse
export type RequestData = z.infer<typeof RequestData>

const RequestData = z.object({
  login: z.string().max(254, 'Email / Username too long'),
  password: z.string().max(64, 'Password too long'),
})

const sendResponse = sendBaseResponse

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  if (!req.session.user) return sendResponse(res, 400, 'You are not logged in')
  req.session.destroy()

  return sendResponse(res, 200)
}

export default withSessionRoute(handler)