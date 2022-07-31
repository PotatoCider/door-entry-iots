// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'


export type ResponseData = {
  ok: boolean
  error?: string
  is_open: boolean
  timestamp: number
}

export type RequestData = z.infer<typeof RequestData>

const RequestData = z.object({
  timeout: z.number().optional()
}).optional()

// this object stores the global state of the door
const state = {
  door: false,
}

const openDoor = (timeout = 5000) => {
  state.door = true
  setTimeout(() => state.door = false, timeout)
}

const sendResponse = (
  res: NextApiResponse<ResponseData>,
  status: number,
  error?: string
) => res.status(status).json({
  ok: status === 200,
  error,
  is_open: state.door,
  timestamp: Date.now(),
})

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method === 'GET') return sendResponse(res, 200)
  if (req.method !== 'POST') return sendResponse(res, 404, 'Not found')

  if (req.headers['content-type'] !== 'application/json')
    return sendResponse(res, 400, 'Content-Type must be application/json')

  // parse incoming JSON data
  const body = RequestData.safeParse(req.body)
  if (!body.success) return sendResponse(res, 400, body.error.toString())

  openDoor(body.data?.timeout)
  sendResponse(res, 200)
}
