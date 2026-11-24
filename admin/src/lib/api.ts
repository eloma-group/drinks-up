const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || ''
const KEY = 'du_admin_token'

export const token = {
  get: () => { try { return localStorage.getItem(KEY) } catch { return null } },
  set: (t: string) => { try { localStorage.setItem(KEY, t) } catch { /* ignore */ } },
  clear: () => { try { localStorage.removeItem(KEY) } catch { /* ignore */ } },
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}

let onUnauthorized: () => void = () => {}
export const setUnauthorizedHandler = (fn: () => void) => { onUnauthorized = fn }

export async function api<T>(path: string, opts: { method?: string; body?: unknown; form?: FormData; auth?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = {}
  const t = token.get()
  if (t && opts.auth !== false) headers.Authorization = 'Bearer ' + t
  let body: BodyInit | undefined
  if (opts.form) body = opts.form
  else if (opts.body !== undefined) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(opts.body) }
  let res: Response
  try {
    res = await fetch(BASE + '/api' + path, { method: opts.method || (body ? 'POST' : 'GET'), headers, body })
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.')
  }
  let data: unknown = null
  const text = await res.text()
  if (text) { try { data = JSON.parse(text) } catch { data = null } }
  if (!res.ok) {
    if (res.status === 401 && opts.auth !== false) { token.clear(); onUnauthorized() }
    const msg = (data && typeof data === 'object' && 'error' in data ? String((data as { error: unknown }).error) : '') || res.statusText || 'Request failed'
    throw new ApiError(res.status, msg)
  }
  return data as T
}

/** Order ids look like '#10981'; the API path uses the number only. */
export const oid = (id: string) => encodeURIComponent(id.replace('#', ''))
