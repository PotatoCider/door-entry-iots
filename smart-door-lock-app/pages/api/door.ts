// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { BaseResponse, fetchJSON } from '../../lib/api'
import { withSessionRoute } from '../../lib/session'

export type RequestData = z.infer<typeof RequestData>
export type ResponseData = BaseResponse & {
  is_open: boolean
  timestamp: number
}

const RequestData = z.object({
  timeout: z.number().optional()
}).optional()

// this object stores the global state of the door
const state = {
  door: false,
}

const _openDoor = (timeout = 5000) => {
  state.door = true
  setTimeout(() => state.door = false, timeout)
}

function sendResponse(res: NextApiResponse<ResponseData>, status: number, error?: string) {
  res.status(status).json({
    ok: !!error,
    error,
    is_open: state.door,
    timestamp: Date.now(),
  })
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  if (req.method === 'GET') return sendResponse(res, 200)
  if (req.method !== 'POST') return sendResponse(res, 404, 'Not found')

  if (req.headers['content-type'] !== 'application/json')
    return sendResponse(res, 400, 'Content-Type must be application/json')
  Request
  // parse incoming JSON data
  const body = RequestData.safeParse(req.body)
  if (!body.success) return sendResponse(res, 400, body.error.issues[0].message)

  _openDoor(body.data?.timeout)
  sendResponse(res, 200)
}

export default withSessionRoute(handler)