import { api } from './client'

/**
 * 안전 구역 목록
 * GET /zones
 */
export async function getZones() {
  return api.get('/zones')
}

/**
 * 구역 등록
 * POST /zones
 */
export async function createZone(data) {
  return api.post('/zones', data)
}

/**
 * 구역 수정
 * PUT /zones/:id
 */
export async function updateZone(id, data) {
  return api.put(`/zones/${id}`, data)
}

/**
 * 구역 삭제
 * DELETE /zones/:id
 */
export async function deleteZone(id) {
  return api.delete(`/zones/${id}`)
}
