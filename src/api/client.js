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
  const controller = new AbortController()
  // Reads wait for the server; writes retain a bounded wait.
  const timeout = method === 'GET' ? null : setTimeout(() => controller.abort(), 20_000)

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      signal: controller.signal,
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
      error.path = path
      error.message = `${error.message} (${res.status} · ${path.split('?')[0]})`

      throw error
    }

    return payload
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`서버 응답 시간이 초과되었습니다. (${path.split('?')[0]})`)
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

// Share an outstanding read across polling and manual refresh callers.
const pendingReads = new Map()
function get(path) {
  const key = JSON.stringify([localStorage.getItem('auth_token'), path])
  if (pendingReads.has(key)) return pendingReads.get(key)
  const pending = request('GET', path).finally(() => pendingReads.delete(key))
  pendingReads.set(key, pending)
  return pending
}

export const api = {
  get,
  post: (path, body) =>
    request('POST', path, body),
  put: (path, body) =>
    request('PUT', path, body),
  patch: (path, body) =>
    request('PATCH', path, body),
  delete: (path) =>
    request('DELETE', path),
}
