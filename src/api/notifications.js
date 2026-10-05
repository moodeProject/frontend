import { api } from './client'

/**
 * 알림 목록 조회
 * GET /api/notifications?recipientType=MANAGER&isRead=&page=&size=
 * recipientType: MANAGER(기본) | WORKER (작업자는 recipientId도 필요)
 */
export async function getNotifications({ recipientType = 'MANAGER', recipientId, isRead, page = 0, size = 20 } = {}) {
  const params = { recipientType, page, size }
  if (recipientId !== undefined) params.recipientId = recipientId
  if (isRead !== undefined) params.isRead = isRead
  const qs = new URLSearchParams(params).toString()
  const res = await api.get(`/api/notifications?${qs}`)
  return res?.data ?? res ?? []
}

/**
 * 알림 1건 읽음 처리
 * PATCH /api/notifications/{id}/read
 */
export async function markNotificationRead(id) {
  return api.patch(`/api/notifications/${id}/read`)
}

/**
 * 전체 읽음 처리
 * PATCH /api/notifications/read-all
 */
export async function markAllNotificationsRead(recipientType = 'MANAGER', recipientId) {
  const params = { recipientType }
  if (recipientId !== undefined) params.recipientId = recipientId
  const qs = new URLSearchParams(params).toString()
  return api.patch(`/api/notifications/read-all?${qs}`)
}
