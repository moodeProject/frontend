import { api } from './client'

export const AUTH_TOKEN_KEY = 'auth_token'
export const AUTH_USER_KEY = 'auth_user'
export const ADMIN_SESSION_KEY =
  'safehelmet_current_admin'
export const WORKER_SESSION_KEY =
  'safehelmet_worker_session'

function unwrap(response) {
  return response?.data ?? response
}

function firstValue(...values) {
  return values.find(
    (value) =>
      value !== undefined &&
      value !== null &&
      value !== ''
  )
}

export function normalizeAuthUser(
  payload,
  fallbackId = ''
) {
  const data = unwrap(payload) || {}
  const raw =
    data.user ??
    data.account ??
    data.member ??
    data.profile ??
    data

  const role = String(
    firstValue(
      raw?.role,
      raw?.authority,
      raw?.userRole,
      data?.role,
      ''
    )
  )
    .replace(/^ROLE_/i, '')
    .toUpperCase()

  return {
    ...raw,
    id: firstValue(
      raw?.id,
      raw?.loginId,
      raw?.username,
      raw?.employeeNo,
      fallbackId
    ),
    loginId: firstValue(
      raw?.loginId,
      raw?.id,
      raw?.username,
      fallbackId
    ),
    employeeNo: firstValue(
      raw?.employeeNo,
      raw?.employeeNumber,
      raw?.workerCode,
      ''
    ),
    name: firstValue(
      raw?.name,
      raw?.userName,
      raw?.workerName,
      ''
    ),
    role,
  }
}

function extractAccessToken(response) {
  const data = unwrap(response) || {}

  return firstValue(
    data?.accessToken,
    data?.token,
    data?.access_token,
    data?.jwt,
    response?.accessToken,
    response?.token
  )
}

export function isAdminUser(user) {
  const role = String(user?.role || '').toUpperCase()

  return (
    !role ||
    role === 'ADMIN' ||
    role === 'SUPER_ADMIN' ||
    role.includes('ADMIN')
  )
}

export function isWorkerUser(user) {
  const role = String(user?.role || '').toUpperCase()

  return (
    role === 'WORKER' ||
    role.includes('WORKER')
  )
}

/**
 * POST /api/auth/login
 *
 * Notion 문서에 request body 상세가 없으므로
 * 기존 프론트 명세와 동일하게 { id, password }를 사용합니다.
 */
export async function loginApi(id, password, userType) {
  const response = await api.post(
    '/api/auth/login',
    {
      loginId: id,
      password,
      userType,
    }
  )

  const token = extractAccessToken(response)

  if (!token) {
    throw new Error(
      '로그인 응답에서 accessToken을 찾지 못했습니다.'
    )
  }

  localStorage.setItem(
    AUTH_TOKEN_KEY,
    token
  )

  let user = normalizeAuthUser(
    response,
    id
  )

  try {
    const me = await getMe()

    user = {
      ...user,
      ...normalizeAuthUser(me, id),
    }
  } catch {
    // 로그인 성공 후 /me 응답 형식이 달라도
    // 로그인 응답에 포함된 사용자 정보로 세션을 유지합니다.
  }

  localStorage.setItem(
    AUTH_USER_KEY,
    JSON.stringify(user)
  )

  return {
    token,
    user,
    raw: unwrap(response),
  }
}

/**
 * POST /api/auth/logout
 */
export async function logoutApi() {
  try {
    await api.post('/api/auth/logout')
  } finally {
    clearAuthSession()
  }
}

/**
 * GET /api/auth/me
 */
export async function getMe() {
  const response =
    await api.get('/api/auth/me')

  return normalizeAuthUser(response)
}

/**
 * POST /api/auth/signup
 * 관리자 전용 API.
 */
export async function signupApi(payload) {
  const body = {
    loginId:
      payload.loginId ??
      payload.id,
    password:
      payload.password,
    passwordConfirm:
      payload.passwordConfirm,
    employeeNumber:
      payload.employeeNumber ??
      payload.employeeNo ??
      '',
    name:
      payload.name ?? '',
    email:
      payload.email ?? '',
    phone:
      payload.phone ?? '',
    department:
      payload.department ?? '',
  }

  const response = await api.post(
    '/api/auth/signup',
    body
  )

  return unwrap(response)
}

export function saveAdminSession(user) {
  const normalized =
    normalizeAuthUser(user)

  localStorage.removeItem(
    WORKER_SESSION_KEY
  )

  localStorage.setItem(
    ADMIN_SESSION_KEY,
    JSON.stringify(normalized)
  )

  localStorage.setItem(
    AUTH_USER_KEY,
    JSON.stringify(normalized)
  )

  return normalized
}

export function saveWorkerAuthSession(user) {
  const normalized =
    normalizeAuthUser(user)

  localStorage.removeItem(
    ADMIN_SESSION_KEY
  )

  localStorage.setItem(
    WORKER_SESSION_KEY,
    JSON.stringify({
      employeeNo:
        normalized.employeeNo ||
        normalized.id ||
        normalized.loginId,
      name:
        normalized.name ||
        '작업자',
      role:
        normalized.role ||
        'WORKER',
    })
  )

  localStorage.setItem(
    AUTH_USER_KEY,
    JSON.stringify(normalized)
  )

  return normalized
}

export function clearAuthSession() {
  localStorage.removeItem(
    AUTH_TOKEN_KEY
  )
  localStorage.removeItem(
    AUTH_USER_KEY
  )
  localStorage.removeItem(
    ADMIN_SESSION_KEY
  )
  localStorage.removeItem(
    WORKER_SESSION_KEY
  )
}
