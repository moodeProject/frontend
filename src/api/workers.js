import { api } from './client'

/**
 * 작업자 목록 조회
 */
export async function getWorkers(params = {}) {
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== ''
    )
  )

  const qs = new URLSearchParams(filteredParams).toString()

  return api.get(`/users${qs ? `?${qs}` : ''}`)
}

/**
 * 작업자 상세 조회
 */
export async function getWorker(id) {
  return api.get(`/users/${id}`)
}

/**
 * 작업자 등록
 */
export async function createWorker(data) {
  return api.post('/users', data)
}

/**
 * 작업자 정보 수정
 */
export async function updateWorker(id, data) {
  return api.put(`/users/${id}`, data)
}

/**
 * 작업자 삭제/비활성화
 */
export async function deactivateWorker(id) {
  return api.delete(`/users/${id}`)
}

/**
 * 작업자의 근무 기록 조회
 */
export async function getWorkerSessions(id) {
  return api.get(`/users/${id}/work-sessions`)
}