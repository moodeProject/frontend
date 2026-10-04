import { api } from './client'

/**
 * 로그인
 * TODO: 현재 AuthContext에서 mock 처리 중 → 실제 연동 시 아래 함수 사용
 * POST /auth/login  { id, password }
 * 응답: { token, user: { id, name, role } }
 */
export async function loginApi(id, password) {
  const data = await api.post('/api/auth/login', { id, password })
  localStorage.setItem('auth_token', data.token)
  return data.user
}

/**
 * 로그아웃
 * POST /api/auth/logout
 */
export async function logoutApi() {
  await api.post('/api/auth/logout')
  localStorage.removeItem('auth_token')
}

/**
 * 현재 로그인한 사용자 정보 조회
 * GET /api/auth/me
 * 응답: { id, name, role }
 */
export async function getMe() {
  return api.get('/api/auth/me')
}
