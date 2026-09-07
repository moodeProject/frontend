import { api } from './client'

function unwrapData(response) {
  return response?.data ?? response
}

function unwrapList(response) {
  const data = unwrapData(response)
  return Array.isArray(data) ? data : []
}

/**
 * 전체 작업자 최신 센서 상태 조회
 * GET /api/workers/status
 */
export async function getAllWorkerStatuses() {
  return unwrapList(await api.get('/api/workers/status'))
}

/**
 * 특정 헬멧/디바이스 최신 상태 조회
 * GET /api/workers/{deviceId}
 */
export async function getWorkerStatus(deviceId) {
  return unwrapData(
    await api.get(`/api/workers/${encodeURIComponent(deviceId)}`)
  )
}

/**
 * 전체 작업자 온열질환/피로도 현황 조회
 * GET /api/workers/heat-risk
 */
export async function getAllWorkerHeatRisk() {
  return unwrapList(await api.get('/api/workers/heat-risk'))
}

/**
 * 특정 작업자 온열질환/피로도 상세 조회
 * GET /api/workers/{deviceId}/heat-risk
 */
export async function getWorkerHeatRisk(deviceId) {
  return unwrapData(
    await api.get(
      `/api/workers/${encodeURIComponent(deviceId)}/heat-risk`
    )
  )
}

/**
 * 추락 감지 이력 조회
 * GET /api/workers/alerts
 */
export async function getWorkerAlerts() {
  return unwrapList(await api.get('/api/workers/alerts'))
}
