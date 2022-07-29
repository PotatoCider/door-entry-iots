import { NextApiRequest, NextApiResponse } from "next"
import { z } from "zod"
import { database, User } from "../../lib/db"
import validator from 'validator'
import crypto from 'crypto'
import { withIronSessionApiRoute } from "iron-session/next"
import { sessionOptions } from "../../lib/session"

export type ResponseData = {
  ok: boolean
  error?: string
}

export type RequestData = z.infer<typeof RequestData>

const RequestData = z.object({
  username: z.string(),
  password: z.string(),
})

const sendResponse = (
  res: NextApiResponse<ResponseData>,
  status: number,
  error?: string
) => res.status(status).json({
  ok: status === 200,
  error,
})

export default withIronSessionApiRoute(
  async function loginRoute(req, res: NextApiResponse<ResponseData>) {
    if (req.method != 'POST') return sendResponse(res, 404, 'Not found')
  if (req.headers['content-type'] != 'application/json')
    return sendResponse(res, 400, 'Content-Type must be application/json')

  const body: RequestData = JSON.parse(req.body)

  const key = validator.isEmail(body.username ? 'email' : 'username')

  const row: User = database.prepare(`SELECT * FROM users WHERE ${key} = ?`).get(body.username)
  if (!row) return sendResponse(res, 400, 'Invalid username/password')

  crypto.pbkdf2(body.password, row.salt, 310000, 32, 'sha256', async (err, hashedPwd) => {
    if (err) return sendResponse(res, 500, err.toString());
    if (!crypto.timingSafeEqual(row.password_hash, hashedPwd))
      return sendResponse(res, 400, 'Invalid username/password');
      
      req.session.user = {
        username: row.username,
      };
      await req.session.save();
    return sendResponse(res, 200, 'Success');
  });
    // get user from database then:
  },
  sessionOptions,
);

// export default function handler(
//   req: NextApiRequest,
//   res: NextApiResponse<ResponseData>
// ) {
  
// }
