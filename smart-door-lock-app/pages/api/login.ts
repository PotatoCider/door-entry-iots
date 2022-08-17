import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { database, hashPassword, User } from '../../lib/db'
import validator from 'validator'
import crypto from 'crypto'
import { withSessionRoute } from '../../lib/session'
import { BaseResponse, fetchJSON, sendBaseResponse } from '../../lib/api'

export type RequestData = z.infer<typeof RequestData>
export type ResponseData = BaseResponse

const RequestData = z.object({
  login: z.string().max(254, 'Email / Username too long'),
  password: z.string().max(64, 'Password too long'),
})

type RetryState = {
  lastRetry: EpochTimeStamp,
  retryCount: number,
  locked: boolean,
}


const MAX_RETRIES = +(process.env.MAX_RETRIES || 3)
const RETRY_TIMEOUT = +(process.env.RETRY_TIMEOUT || 30 * 60) * 1000

const userRetryState: Map<string, RetryState> = new Map()

const sendResponse = sendBaseResponse

const sendInvalidCredsResponse = (req: NextApiRequest, res: NextApiResponse<ResponseData>) => {
  const ip = req.headers['x-real-ip'] as string
  const r = userRetryState.get(ip) || { lastRetry: 0, retryCount: 0, locked: false }

  if (Date.now() - r.lastRetry > RETRY_TIMEOUT)
    r.retryCount = 0

  r.lastRetry = Date.now()
  r.retryCount++

  let message = `Invalid credentials. ${MAX_RETRIES - r.retryCount} tries left`
  if (r.retryCount >= MAX_RETRIES) {
    r.locked = true
    message = 'Please try again later'
  }

  userRetryState.set(ip, r)
  sendResponse(res, 400, message)
}

const accountIsLocked = (req: NextApiRequest) => {
  const ip = req.headers['x-real-ip'] as string
  const r = userRetryState.get(ip)
  if (!r) return false
  return r.locked && Date.now() - r.lastRetry <= RETRY_TIMEOUT
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  if (req.method != 'POST') return sendResponse(res, 404, 'Not found')
  if (req.headers['content-type'] != 'application/json')
    return sendResponse(res, 400, 'Content-Type must be application/json')

  if (accountIsLocked(req)) return sendResponse(res, 400, 'Please try again later')

  // parse incoming JSON data
  const body = RequestData.safeParse(req.body)
  if (!body.success) return sendResponse(res, 400, body.error.message)

  let { login, password } = body.data
  login = login.toLowerCase()

  const key = validator.isEmail(login) ? 'email' : 'username'

  // fetch user from db
  const row: User = database.prepare(`
    SELECT * FROM users WHERE ${key} = ?
  `).get(login)

  if (!row) return sendInvalidCredsResponse(req, res)

  // generate hashed password + salt
  const hashedPwd = await hashPassword(password, row.salt).catch(err => console.error(err))
  if (!hashedPwd) return sendResponse(res, 500, 'Internal error')

  // compare hashed passwords
  if (!crypto.timingSafeEqual(row.password_hash, hashedPwd))
    return sendInvalidCredsResponse(req, res)

  // save session
  req.session.user = {
    username: row.username,
    email: row.email,
    name: row.name,
    device_token: row.device_token,
  }
  await req.session.save()
  sendResponse(res, 200)
}

export default withSessionRoute(handler)