const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

async function parseResponse(res) {
  const text = await res.text()

  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

async function request(method, path, body, options = {}) {
  const workerPage = window.location.pathname.startsWith('/worker');
  const tokenKey = options.authRole === 'WORKER' ? 'safehelmet_worker_token' : options.authRole === 'ADMIN' ? 'safehelmet_admin_token' : workerPage ? 'safehelmet_worker_token' : 'safehelmet_admin_token';
  const token = options.anonymous ? null : localStorage.getItem(tokenKey)

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {}),
    },
    ...(body !== undefined
      ? { body: JSON.stringify(body) }
      : {}),
  })

  const payload = await parseResponse(res)

  if (!res.ok) {
    const error = new Error(
      payload?.message ??
        payload?.error ??
        `${res.status} ${res.statusText}`
    )

    error.status = res.status
    error.code =
      payload?.code ??
      payload?.errorCode ??
      null
    error.data = payload

    throw error
  }

  return payload
}

export const api = {
  get: (path, options) => request('GET', path, undefined, options),
  post: (path, body, options) =>
    request('POST', path, body, options),
  put: (path, body) =>
    request('PUT', path, body),
  patch: (path, body) =>
    request('PATCH', path, body),
  delete: (path) =>
    request('DELETE', path),
}
