import { api } from './client'

function unwrap(response) {
  return response?.data ?? response
}

function unwrapList(response) {
  const data = unwrap(response)

  if (Array.isArray(data)) return data
  if (Array.isArray(data?.content)) return data.content
  if (Array.isArray(data?.items)) return data.items

  return []
}

export async function getAttendanceHistory(workerId, month) {
  if (!workerId) return []

  const qs = month
    ? `?month=${encodeURIComponent(month)}`
    : ''

  return unwrapList(
    await api.get(
      `/api/workers/${encodeURIComponent(workerId)}/attendance${qs}`
    )
  )
}

function attendanceIdentityBody(identifier) {
  const workerId = Number(identifier)
  if (!Number.isSafeInteger(workerId) || workerId <= 0) {
    throw new Error('작업자 정보를 확인할 수 없습니다. 다시 로그인해주세요.')
  }
  return { workerId }
}

export async function checkIn(identifier) {
  return unwrap(
    await api.post(
      '/api/attendance/check-in',
      attendanceIdentityBody(identifier)
    )
  )
}

export async function checkOut(identifier) {
  return unwrap(
    await api.post(
      '/api/attendance/check-out',
      attendanceIdentityBody(identifier)
    )
  )
}

export async function getAttendanceRequests(workerId) {
  if (!workerId) return []

  return unwrapList(
    await api.get(
      `/api/workers/${encodeURIComponent(workerId)}/attendance-requests`
    )
  )
}

export async function createAttendanceRequest(data) {
  return unwrap(
    await api.post('/api/attendance-requests', data)
  )
}

export async function updateAttendanceRequest(requestId, data) {
  return unwrap(
    await api.patch(
      `/api/attendance-requests/${encodeURIComponent(requestId)}`,
      data
    )
  )
}
