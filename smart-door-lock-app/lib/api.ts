import { NextApiResponse } from "next"

export type BaseResponseOk = { ok: true }
export type BaseResponseError = { ok: false, error?: string }

export type BaseResponse = BaseResponseOk | BaseResponseError

export function sendBaseResponse(res: NextApiResponse<BaseResponse>, status: number, error?: string) {
  res.status(status).json({ ok: !error, error })
}

export const fetchJSON = <R extends BaseResponse>(url: string, method = 'GET', body?: Record<string, any>, headers?: Record<string, string>)
  : Promise<R> =>
  fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  }).then(res => res.json())