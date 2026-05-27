import { api } from './client'

/**
 * 대시보드 요약 통계
 * GET /dashboard/summary
 * 응답: { totalWorkers, normalWorkers, dangerWorkers, emergencyEvents }
 */
export async function getDashboardStats() {
  return api.get('/dashboard/summary')
}

/**
 * 대시보드 작업자 상태 테이블
 * GET /dashboard/worker-status
 * 응답: WorkerStatus[]
 */
export async function getDashboardWorkerStatus() {
  return api.get('/dashboard/worker-status')
}

/**
 * 위험 이벤트 시간대별 통계 (꺾은선 그래프)
 * GET /dashboard/event-status
 * 응답: { time, accident, health, collision }[]
 */
export async function getDashboardEventChart() {
  return api.get('/dashboard/event-status')
}
