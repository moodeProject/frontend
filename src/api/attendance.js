import { api } from './client'

/**
 * 월별 근태 이력 조회
 * GET /api/workers/{workerId}/attendance?month=yyyy-MM
 */
export async function getAttendanceHistory(workerId, month) {
  const qs = month ? `?month=${month}` : ''
  const res = await api.get(`/api/workers/${workerId}/attendance${qs}`)
  return res?.data ?? res ?? []
}

/**
 * 출근
 * POST /api/attendance/check-in  { workerId }
 */
export async function checkIn(workerId) {
  const res = await api.post('/api/attendance/check-in', { workerId })
  return res?.data ?? res
}

/**
 * 퇴근
 * POST /api/attendance/check-out  { workerId }
 */
export async function checkOut(workerId) {
  const res = await api.post('/api/attendance/check-out', { workerId })
  return res?.data ?? res
}

/**
 * 근태 신청 이력 조회
 * GET /api/workers/{workerId}/attendance-requests
 */
export async function getAttendanceRequests(workerId) {
  const res = await api.get(`/api/workers/${workerId}/attendance-requests`)
  return res?.data ?? res ?? []
}

/**
 * 근태 신청 생성 (연차/야근/근무수정)
 * POST /api/attendance-requests
 * type: LEAVE | OVERTIME | CORRECTION
 */
export async function createAttendanceRequest(data) {
  const res = await api.post('/api/attendance-requests', data)
  return res?.data ?? res
}

/**
 * 근태 신청 승인/반려
 * PATCH /api/attendance-requests/{requestId}
 */
export async function updateAttendanceRequest(requestId, data) {
  const res = await api.patch(`/api/attendance-requests/${requestId}`, data)
  return res?.data ?? res
}
