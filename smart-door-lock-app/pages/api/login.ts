import { NextApiRequest, NextApiResponse } from "next"

type Data = {
  username: string
  password: string
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method != 'POST') return res.status(404).end()
  if (req.headers['content-type'] != 'application/json') return res.status(400).end()
  const body = JSON.parse(req.body)
  if (!body.username || !body.password) return res.status(400).end()

  if (body.username == 'admin' && body.password == 'admin') {
    return res.status(200).json({
      username: body.username,
      password: body.password,
    })
  }
  return res.status(401).end()
}
