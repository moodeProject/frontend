import { api } from './client'

export const AUTH_TOKEN_KEY = 'auth_token'
export const ADMIN_TOKEN_KEY = 'safehelmet_admin_token'
export const WORKER_TOKEN_KEY = 'safehelmet_worker_token'
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
    },
    { anonymous: true }
  )

  const token = extractAccessToken(response)

  if (!token) {
    throw new Error(
      '로그인 응답에서 accessToken을 찾지 못했습니다.'
    )
  }

  const role = String(userType).toUpperCase() === 'WORKER' ? 'WORKER' : 'ADMIN'
  const roleTokenKey = role === 'WORKER' ? WORKER_TOKEN_KEY : ADMIN_TOKEN_KEY
  // Only mutate the selected role's session. Never overwrite the other role.
  localStorage.setItem(roleTokenKey, token)

  let user = normalizeAuthUser(
    response,
    id
  )

  try {
    const me = await getMe(role)

    user = {
      ...user,
      ...normalizeAuthUser(me, id),
    }
  } catch {
    // 로그인 성공 후 /me 응답 형식이 달라도
    // 로그인 응답에 포함된 사용자 정보로 세션을 유지합니다.
  }

  localStorage.setItem(
    role === 'WORKER' ? 'safehelmet_worker_user' : 'safehelmet_admin_user',
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
export async function logoutApi(role = 'ADMIN') {
  try {
    await api.post('/api/auth/logout', undefined, { authRole: role })
  } finally {
    clearAuthSession(role)
  }
}

/**
 * GET /api/auth/me
 */
export async function getMe(role = 'ADMIN') {
  const response =
    await api.get('/api/auth/me', { authRole: role })

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

  localStorage.setItem(
    ADMIN_SESSION_KEY,
    JSON.stringify(normalized)
  )

  localStorage.setItem(
    'safehelmet_admin_user',
    JSON.stringify(normalized)
  )

  return normalized
}

export function saveWorkerAuthSession(user) {
  const normalized =
    normalizeAuthUser(user)

  localStorage.setItem(
    WORKER_SESSION_KEY,
    JSON.stringify({
      employeeNo:
        normalized.employeeNo ||
        normalized.loginId ||
        normalized.id,
      userId:
        normalized.userId ??
        normalized.workerId ??
        null,
      loginId:
        normalized.loginId ||
        '',
      name:
        normalized.name ||
        '작업자',
      role:
        normalized.role ||
        'WORKER',
    })
  )

  localStorage.setItem(
    'safehelmet_worker_user',
    JSON.stringify(normalized)
  )

  return normalized
}

export function clearAuthSession(role = 'ADMIN') {
  if (String(role).toUpperCase() === 'WORKER') {
    localStorage.removeItem(WORKER_TOKEN_KEY)
    localStorage.removeItem('safehelmet_worker_user')
    localStorage.removeItem(WORKER_SESSION_KEY)
    return
  }
  localStorage.removeItem(ADMIN_TOKEN_KEY)
  localStorage.removeItem('safehelmet_admin_user')
  localStorage.removeItem(ADMIN_SESSION_KEY)
}
