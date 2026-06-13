import { api } from './client'

/**
 * 모니터링 요약 통계
 * GET /monitoring/summary
 * 응답: { total, normal, danger, emergency }
 */
export async function getMonitoringStats() {
  return api.get('/monitoring/summary')
}

/**
 * 작업자 위치 목록 (지도 핀)
 * GET /monitoring/locations
 * 응답: { id, name, employeeId, x, y, status }[]
 */
export async function getWorkerLocations() {
  return api.get('/monitoring/locations')
}

/**
 * 작업자 실시간 상태 목록
 * GET /monitoring/status
 * 응답: { id, name, zone, heartRate, status, event, eventLevel, time }[]
 */
export async function getWorkerStatuses() {
  return api.get('/monitoring/status')
}

/**
 * 상태별 작업자 그룹 (아코디언용)
 * GET /monitoring/groups
 */
export async function getStatusGroups() {
  return api.get('/monitoring/groups')
}

/**
 * 헬멧(센서) 실시간 상태 목록 — 실제 백엔드 연동
 * GET /api/workers/status
 * 응답: { success, message, data: [{ deviceId, state, recordedAt }] }
 * state: 'NORMAL' | 'FALLING' | 'FALLEN'
 */
export async function getHelmetStatusList() {
  const res = await api.get('/api/workers/status')
  return res.data
}

/**
 * 낙상(FALLEN) 이력 전체 조회 — 실제 백엔드 연동
 * GET /api/workers/alerts
 * 응답: { success, message, data: [{ deviceId, state, recordedAt }] }
 */
export async function getFallAlerts() {
  const res = await api.get('/api/workers/alerts')
  return res.data
}

/**
 * 특정 헬멧 최근 상태 조회 — 실제 백엔드 연동
 * GET /api/workers/{deviceId}
 * 응답: { success, message, data: { deviceId, state, recordedAt } }
 * 해당 deviceId가 한 번도 데이터를 보낸 적이 없으면 404 (Error throw)
 */
export async function getHelmetStatus(deviceId) {
  const res = await api.get(`/api/workers/${deviceId}`)
  return res.data
}
