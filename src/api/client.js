/**
 * API 클라이언트 기본 설정
 *
 * 백엔드 연동 시 VITE_API_URL 환경 변수만 설정하면 됩니다.
 * .env 파일에 아래 내용 추가:
 *   VITE_API_URL=http://localhost:8080
 */
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

async function request(method, path, body) {
  const token = localStorage.getItem('auth_token')

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.message ?? `${res.status} ${res.statusText}`)
  }

  // 204 No Content 등 body 없는 응답 처리
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

export const api = {
  get:    (path)       => request('GET',    path),
  post:   (path, body) => request('POST',   path, body),
  put:    (path, body) => request('PUT',    path, body),
  patch:  (path, body) => request('PATCH',  path, body),
  delete: (path)       => request('DELETE', path),
}
