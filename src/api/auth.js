import { api } from './client'

/**
 * 로그인
 */
export async function loginApi(id, password) {
  const response = await api.post('/auth/login', {
    id,
    password,
  })

  // 백엔드가 ApiResponse 형식으로 감싸서 반환하는 경우 대응
  const data = response?.data ?? response

  if (!data?.token) {
    throw new Error('로그인 응답에 토큰이 없습니다.')
  }

  localStorage.setItem('auth_token', data.token)

  return data.user ?? data
}

/**
 * 로그아웃
 */
export async function logoutApi() {
  try {
    await api.post('/auth/logout')
  } finally {
    // 서버 로그아웃 요청이 실패하더라도 로컬 토큰은 제거
    localStorage.removeItem('auth_token')
  }
}

/**
 * 현재 로그인한 사용자 정보 조회
 */
export async function getMe() {
  const response = await api.get('/auth/me')

  return response?.data ?? response
}