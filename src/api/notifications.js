import { api } from './client'

function unwrap(response) {
  return response?.data ?? response
}

function unwrapList(response) {
  const data = unwrap(response)

  if (Array.isArray(data)) return data
  if (Array.isArray(data?.content)) return data.content
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.notifications)) return data.notifications

  return []
}

export async function getNotifications({
  recipientType = 'MANAGER',
  recipientId,
  isRead,
  page = 0,
  size = 100,
} = {}) {
  const params = { recipientType, page, size }

  if (
    recipientId !== undefined &&
    recipientId !== null &&
    recipientId !== ''
  ) {
    params.recipientId = recipientId
  }

  if (isRead !== undefined) {
    params.isRead = isRead
  }

  const qs = new URLSearchParams(params).toString()

  return unwrapList(
    await api.get(`/api/notifications?${qs}`)
  )
}

export async function markNotificationRead(id) {
  return unwrap(
    await api.patch(
      `/api/notifications/${encodeURIComponent(id)}/read`
    )
  )
}

export async function markAllNotificationsRead(
  recipientType = 'MANAGER',
  recipientId
) {
  const params = { recipientType }

  if (
    recipientId !== undefined &&
    recipientId !== null &&
    recipientId !== ''
  ) {
    params.recipientId = recipientId
  }

  const qs = new URLSearchParams(params).toString()

  return unwrap(
    await api.patch(`/api/notifications/read-all?${qs}`)
  )
}
