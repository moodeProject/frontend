import { api } from './client'

/**
 * 위험 이벤트 목록 조회
 * GET /events?from=&to=&type=&zone=&query=&severity=
 * 응답: Event[]
 */
export async function getEvents(params = {}) {
  const qs = new URLSearchParams(params).toString()
  return api.get(`/events${qs ? `?${qs}` : ''}`)
}

/**
 * 이벤트 상세 조회
 * GET /events/:id
 */
export async function getEvent(id) {
  return api.get(`/events/${id}`)
}

/**
 * 이벤트 확인 처리
 * PATCH /events/:id/confirm
 */
export async function confirmEvent(id) {
  return api.patch(`/events/${id}/confirm`)
}

/**
 * 이벤트 통계
 * GET /events/stats
 */
export async function getEventStats() {
  return api.get('/events/stats')
}
