const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

async function parseResponse(res) {
  const text = await res.text()

  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

async function request(method, path, body) {
  const token = localStorage.getItem('auth_token')

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
  get: (path) => request('GET', path),
  post: (path, body) =>
    request('POST', path, body),
  put: (path, body) =>
    request('PUT', path, body),
  patch: (path, body) =>
    request('PATCH', path, body),
  delete: (path) =>
    request('DELETE', path),
}
