import { api } from './client'

/**
 * 작업 기록 목록
 * GET /work-sessions?from=&to=&team=&worker=
 * 응답: WorkSession[]
 */
export async function getWorkRecords(params = {}) {
  const qs = new URLSearchParams(params).toString()
  return api.get(`/work-sessions${qs ? `?${qs}` : ''}`)
}

/**
 * 작업 기록 요약 통계
 * GET /work-sessions/summary
 * 응답: { totalHours, completed, events, avgHeartRate }
 */
export async function getWorkSummary(params = {}) {
  const qs = new URLSearchParams(params).toString()
  return api.get(`/work-sessions/summary${qs ? `?${qs}` : ''}`)
}

/**
 * 작업 세션 상세
 * GET /work-sessions/:id
 */
export async function getWorkRecord(id) {
  return api.get(`/work-sessions/${id}`)
}
