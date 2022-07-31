import { NextApiRequest, NextApiResponse } from "next"
import { z } from "zod"
import { withSessionRoute } from "../../lib/session"
import validator from 'validator'
import { database, hashPassword } from "../../lib/db"
import crypto from 'crypto'

export type ResponseErrorType = keyof RequestData | null

export type ResponseData = {
  ok: boolean
  errorType?: ResponseErrorType
  error?: string
}

export type RequestData = z.infer<typeof RequestData>

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

const sendResponse = (
  res: NextApiResponse<ResponseData>,
  status: number,
  errorType?: ResponseErrorType,
  error?: string
) => res.status(status).json({
  ok: status === 200,
  errorType,
  error,
})

export default withSessionRoute(loginRoute)

async function loginRoute(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method != 'POST') return sendResponse(res, 404, null, 'Not found')
  if (req.headers['content-type'] != 'application/json')
    return sendResponse(res, 400, null, 'Content-Type must be application/json')

  // parse incoming JSON data
  const body = RequestData.safeParse(req.body)
  if (!body.success) {
    const { message, path } = body.error.issues[0]
    return sendResponse(res, 400, path[0] as any, message)
  }

  const { name, username, email, newPassword, confirmPassword } = body.data

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
  const hashedPwd = await hashPassword(newPassword, salt).catch(err => console.error(err))
  if (!hashedPwd) return sendResponse(res, 500, null, 'Internal error')

  // insert new user
  database.prepare(`
    INSERT OR IGNORE INTO users (email, username, name, password_hash, salt, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(email, username, name, hashedPwd, salt, Date.now())

  // save session
  req.session.user = {
    username,
    email,
    name,
    message: 'Sucessfully registered',
  }
  await req.session.save()
  return sendResponse(res, 200)
}