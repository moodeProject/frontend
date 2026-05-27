import { api } from './client'

/**
 * 작업자 목록 조회
 * GET /users?team=&status=&query=
 * 응답: Worker[]
 */
export async function getWorkers(params = {}) {
  const qs = new URLSearchParams(params).toString()
  return api.get(`/users${qs ? `?${qs}` : ''}`)
}

/**
 * 작업자 상세 조회
 * GET /users/:id
 * 응답: Worker
 */
export async function getWorker(id) {
  return api.get(`/users/${id}`)
}

/**
 * 작업자 등록
 * POST /users  { name, team, phone, helmetId, ... }
 * 응답: Worker (생성된 작업자)
 */
export async function createWorker(data) {
  return api.post('/users', data)
}

/**
 * 작업자 정보 수정
 * PUT /users/:id  { ...변경 필드 }
 * 응답: Worker (수정된 작업자)
 */
export async function updateWorker(id, data) {
  return api.put(`/users/${id}`, data)
}

/**
 * 작업자 비활성화
 * DELETE /users/:id
 */
export async function deactivateWorker(id) {
  return api.delete(`/users/${id}`)
}

/**
 * 특정 작업자의 작업 세션 목록
 * GET /users/:id/work-sessions
 * 응답: WorkSession[]
 */
export async function getWorkerSessions(id) {
  return api.get(`/users/${id}/work-sessions`)
}
