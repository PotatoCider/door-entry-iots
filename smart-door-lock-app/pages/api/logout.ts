import { NextApiRequest, NextApiResponse } from 'next'
import { BaseResponse, fetchJSON, sendBaseResponse } from '../../lib/api'
import { withSessionRoute } from '../../lib/session'

export type ResponseData = BaseResponse

const sendResponse = sendBaseResponse

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  if (!req.session.user) return sendResponse(res, 400, 'You are not logged in')
  req.session.destroy()

  return sendResponse(res, 200)
}

export default withSessionRoute(handler)