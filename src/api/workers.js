import { api } from './client'

// 백엔드 status enum → 프론트 status 변환
const STATUS_MAP = { NORMAL: 'normal', CAUTION: 'warning', DANGER: 'danger' }

function mapWorker(w) {
  return {
    id: w.workerId || String(w.id),
    workerCode: w.workerId || String(w.id),
    employeeNumber: w.workerId || String(w.id),
    name: w.name,
    zone: w.zoneName || '',
    detailLocation: w.zoneName || '',
    helmetId: w.helmetNo || '',
    status: STATUS_MAP[w.status] || 'normal',
    heartRate: w.heartRate ?? null,
    fatigue: w.fatigue ?? null,
    issue: w.issue || '',
    phone: w.phone || '',
    sensorConnected: w.sensorConnected ?? true,
    profileImage: w.profileImage || '',
  }
}

/**
 * 작업자 목록 조회
 * GET /api/workers?q=&status=&page=&size=
 * status: NORMAL | CAUTION | DANGER
 */
export async function getWorkers(params = {}) {
  const qs = new URLSearchParams(params).toString()
  const res = await api.get(`/api/workers${qs ? `?${qs}` : ''}`)
  const list = res?.data ?? res ?? []
  return Array.isArray(list) ? list.map(mapWorker) : []
}

/**
 * 작업자 상세 조회
 * GET /api/workers/{workerId}
 */
export async function getWorker(workerId) {
  const res = await api.get(`/api/workers/${workerId}`)
  const data = res?.data ?? res
  return data ? mapWorker(data) : null
}

/**
 * 작업자 등록
 * POST /api/workers  { name, zoneName, detailLocation?, helmetNo? }
 */
export async function createWorker(data) {
  const body = {
    name: data.name,
    zoneName: data.zone || data.zoneName,
    helmetNo: data.helmetId || data.helmetNo || undefined,
  }
  const res = await api.post('/api/workers', body)
  const created = res?.data ?? res
  return created ? mapWorker(created) : null
}

/**
 * 작업자 정보 수정
 * PUT /api/workers/{workerId}  { name, zoneName }
 */
export async function updateWorker(workerId, data) {
  const body = {
    name: data.name,
    zoneName: data.zone || data.zoneName,
  }
  const res = await api.put(`/api/workers/${workerId}`, body)
  const updated = res?.data ?? res
  return updated ? mapWorker(updated) : null
}

/**
 * 작업자 삭제 (소프트 삭제)
 * DELETE /api/workers/{workerId}
 */
export async function deactivateWorker(workerId) {
  return api.delete(`/api/workers/${workerId}`)
}
