// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'


type Data = {
  ok: boolean
  error?: string
  door?: boolean
  timestamp?: number
}

const RequestBody = z.object({
  timeout: z.number().optional()
}).optional()

type RequestBody = z.infer<typeof RequestBody>

const state = {
  door: false,
}

export type DoorState = typeof state

const openDoor = (timeout = 5000) => {
  state.door = true
  setTimeout(() => state.door = false, timeout)
}

const sendResponse = (
  res: NextApiResponse<Data>,
  status: number,
  error?: string
) => res.status(status).json({
  ok: status === 200,
  error,
  door: state.door,
  timestamp: Date.now(),
})

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  switch (req.method) {
    case 'GET':
      break
    case 'POST':
      if (req.headers['content-type'] !== 'application/json')
        return sendResponse(res, 400, 'Content-Type must be application/json')

      const body = RequestBody.safeParse(req.body)
      if (!body.success) return sendResponse(res, 400, body.error.toString())

      openDoor(body.data?.timeout)
      break
    default:
      return sendResponse(res, 404, 'Not found')
  }
  sendResponse(res, 200)
}
