import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { withSessionRoute } from '../../lib/session'
import validator from 'validator'
import { database, hashPassword } from '../../lib/db'
import crypto from 'crypto'
import { BaseResponse } from '../../lib/api'

export type RequestData = z.infer<typeof RequestData>
export type ResponseData = BaseResponse & {
  errorField?: ResponseErrorField
}

export type ResponseErrorField = keyof RequestData | null

const RequestData = z.object({
  name: z.string().max(128, 'Name too long'),
  username: z.string().max(64, 'Username too long')
    .refine(
      u => validator.isAlphanumeric(u, 'en-US', { ignore: '-_' }),
      'Username must be alphanumeric (with dots/dashes)',
    ),
  email: z.string().email(),
  newPassword: z.string().min(8, 'Too short').max(64, 'Too long'),
  confirmPassword: z.string().min(8, 'Too short').max(64, 'Too long'),
})

function sendResponse(res: NextApiResponse<ResponseData>, status: number, errorField?: ResponseErrorField, error?: string) {
  res.status(status).json({
    ok: !error,
    errorField,
    error,
  })
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  if (req.method != 'POST') return sendResponse(res, 404, null, 'Not found')
  if (req.headers['content-type'] != 'application/json')
    return sendResponse(res, 400, null, 'Content-Type must be application/json')

  // parse incoming JSON data
  const body = RequestData.safeParse(req.body)
  if (!body.success) {
    const { message, path } = body.error.issues[0]
    return sendResponse(res, 400, path[0] as any, message)
  }

  let { name, username, email, newPassword, confirmPassword } = body.data
  username = username.toLowerCase()
  email = email.toLowerCase()

  if (newPassword !== confirmPassword)
    return sendResponse(res, 400, 'confirmPassword', 'New Password does not match')

  let count: number = database
    .prepare('SELECT COUNT(1) FROM users WHERE username = ?').pluck().get(username)
  if (count > 0) return sendResponse(res, 400, 'username', 'Username already taken')

  count = database
    .prepare('SELECT COUNT(1) FROM users WHERE email = ?').pluck().get(email)
  if (count > 0) return sendResponse(res, 400, 'email', 'Email already taken')

  // generate hashed password + salt
  const salt = crypto.randomBytes(16)
  const device_token = crypto.randomBytes(16).toString('base64url')

  const hashedPwd = await hashPassword(newPassword, salt).catch(err => console.error(err))
  if (!hashedPwd) return sendResponse(res, 500, null, 'Internal error')

  // insert new user
  database.prepare(`
    INSERT OR IGNORE INTO users (email, username, name, password_hash, salt, device_token, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(email, username, name, hashedPwd, salt, device_token, Date.now())

  // save session
  req.session.user = {
    username,
    email,
    name,
    device_token,
  }
  await req.session.save()
  return sendResponse(res, 200)
}

export default withSessionRoute(handler)