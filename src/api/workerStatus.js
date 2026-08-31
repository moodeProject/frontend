import { api } from './client'

/**
 * 전체 작업자 최신 센서 상태 조회
 * GET /api/workers/status
 */
export async function getAllWorkerStatuses() {
  const response = await api.get('/api/workers/status')
  const data = response?.data ?? response
  return Array.isArray(data) ? data : []
}

/**
 * 특정 헬멧/디바이스 최신 상태 조회
 * GET /api/workers/{deviceId}
 */
export async function getWorkerStatus(deviceId) {
  const response = await api.get(`/api/workers/${encodeURIComponent(deviceId)}`)
  return response?.data ?? response
}

/**
 * 추락 감지 이력 조회
 * GET /api/workers/alerts
 */
export async function getWorkerAlerts() {
  const response = await api.get('/api/workers/alerts')
  const data = response?.data ?? response
  return Array.isArray(data) ? data : []
}
