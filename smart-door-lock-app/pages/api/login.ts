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

const sendResponse = sendBaseResponse

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  if (req.method != 'POST') return sendResponse(res, 404, 'Not found')
  if (req.headers['content-type'] != 'application/json')
    return sendResponse(res, 400, 'Content-Type must be application/json')

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

  if (!row) return sendResponse(res, 400, `Invalid ${key} or password`)

  // generate hashed password + salt
  const hashedPwd = await hashPassword(password, row.salt).catch(err => console.error(err))
  if (!hashedPwd) return sendResponse(res, 500, 'Internal error')

  // compare hashed passwords
  if (!crypto.timingSafeEqual(row.password_hash, hashedPwd))
    return sendResponse(res, 400, `Invalid ${key} or password`)

  // save session
  req.session.user = {
    username: row.username,
    email: row.email,
    name: row.name,
  }
  await req.session.save()
  sendResponse(res, 200)
}

export default withSessionRoute(handler)