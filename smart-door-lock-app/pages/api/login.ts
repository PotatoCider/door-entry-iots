import { NextApiRequest, NextApiResponse } from "next"

type Data = {
  username: string
  password: string
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {

}
