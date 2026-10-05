import { api } from './client'

/**
 * 전체 헬멧 상태 조회 (삭제된 헬멧 제외)
 * GET /api/helmets/status
 * overallRiskState: NORMAL | RECOMMEND | ACTION_REQUIRED | FALLING | FALLEN
 */
export async function getHelmetsStatus() {
  const res = await api.get('/api/helmets/status')
  return res?.data ?? res ?? []
}

/**
 * 헬멧 1개 상태 조회
 * GET /api/helmets/{helmetId}/status
 */
export async function getHelmetStatus(helmetId) {
  const res = await api.get(`/api/helmets/${helmetId}/status`)
  return res?.data ?? res
}

/**
 * 헬멧 목록 조회
 * GET /api/helmets
 */
export async function getHelmets() {
  const res = await api.get('/api/helmets')
  return res?.data ?? res ?? []
}
