import { api } from './client'

/**
 * SOS 요청 (로그인 불필요)
 * POST /api/sos  { requesterId: 작업자ID }
 */
export async function createSOS(requesterId) {
  const res = await api.post('/api/sos', { requesterId })
  return res?.data ?? res
}

/**
 * SOS 목록 조회 (로그인 불필요)
 * GET /api/sos?status=REQUESTED  (미처리만)
 * status: REQUESTED | RESOLVED
 */
export async function getSOSList(status) {
  const qs = status ? `?status=${status}` : ''
  const res = await api.get(`/api/sos${qs}`)
  return res?.data ?? res ?? []
}

/**
 * SOS 처리 완료
 * PATCH /api/sos/{sosId}
 */
export async function resolveSOSRequest(sosId) {
  const res = await api.patch(`/api/sos/${sosId}`)
  return res?.data ?? res
}
