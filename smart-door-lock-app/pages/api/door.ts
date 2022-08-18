import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { BaseResponse } from '../../lib/api'
import { database, getUserFromToken } from '../../lib/db'
import { withSessionRoute } from '../../lib/session'

export type RequestData = z.infer<typeof RequestData>
export type ResponseData = BaseResponse & DeviceState & {
  timestamp: number
}

const RequestData = z.object({
  timeout: z.number().optional()
}).optional()

type DeviceState = {
  door_open: boolean,
  cur_timeout?: NodeJS.Timeout,
}

// this object stores the global state of the door
const deviceStates: Map<string, DeviceState> = new Map()

export const _toggleDoor = (token: string) => {
  const prevState = deviceStates.get(token) ?? { door_open: false }
  if (prevState.cur_timeout) clearTimeout(prevState.cur_timeout)
  let i: NodeJS.Timeout | undefined = undefined
  if (!prevState.door_open) {
    i = setTimeout(() => deviceStates.set(token, { door_open: false, cur_timeout: undefined }))
  }
  deviceStates.set(token, { door_open: !prevState.door_open, cur_timeout: i })
}

// if device token is not provided, door_open would be false by default.
// this is to prevent brute force attackers from gaining information
// about the device id.
function sendResponse(res: NextApiResponse<ResponseData>, status: number, token?: string, error?: string) {
  res.status(status).json({
    ok: !error,
    error,
    door_open: deviceStates.get(token ?? '')?.door_open ?? false,
    timestamp: Date.now(),
  })
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  if (req.method !== 'GET' && req.method !== 'POST') return sendResponse(res, 404, undefined, 'Not found')
  if (req.method === 'POST' && req.headers['content-type'] !== 'application/json')
    return sendResponse(res, 400, 'Content-Type must be application/json')

  const found = req.headers.authorization?.match(/Bearer ([a-zA-Z0-9_-]{22})/)
  if (!found) return sendResponse(res, 401, 'Unauthorized')

  const token = found[1]

  const user = getUserFromToken(token)
  if (!user) return sendResponse(res, 200) // fail silently

  if (req.method === 'GET') return sendResponse(res, 200, token)

  // parse incoming JSON data
  const body = RequestData.safeParse(req.body)
  if (!body.success) return sendResponse(res, 400, body.error.issues[0].message)

  _toggleDoor(token)
  sendResponse(res, 200, token)
}


export default withSessionRoute(handler)