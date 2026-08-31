/**
 * API 클라이언트 기본 설정
 *
 * .env
 * VITE_API_URL=http://13.209.96.183:8080
 */

const BASE_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

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

  // 204 No Content
  if (res.status === 204) {
    return null
  }

  const text = await res.text()

  // 응답이 JSON인지 일반 문자열인지 안전하게 처리
  let data = null

  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!res.ok) {
    const message =
      data?.message ||
      data?.error ||
      `${res.status} ${res.statusText}`

    throw new Error(message)
  }

  return data
}

export const api = {
  get: (path) =>
    request('GET', path),

  post: (path, body) =>
    request('POST', path, body),

  put: (path, body) =>
    request('PUT', path, body),

  patch: (path, body) =>
    request('PATCH', path, body),

  delete: (path) =>
    request('DELETE', path),
}

export { BASE_URL }