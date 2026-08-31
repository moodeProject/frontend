import { api } from './client'

function unwrap(response) {
  return response?.data ?? response
}

/**
 * 이상 감지 목록
 * GET /api/v1/hazard-events
 *
 * params:
 * category: EXTERNAL | HEALTH | FALL
 * severity: WARNING | DANGER
 * status: UNHANDLED | IN_PROGRESS | RESOLVED
 * workerId, from, to, page, size
 */
export async function getHazardEvents(params = {}) {
  const query = {
    page: 0,
    size: 100,
    ...params,
  }

  const filtered = Object.fromEntries(
    Object.entries(query).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
  )

  const qs = new URLSearchParams(filtered).toString()
  const response = await api.get(
    `/api/v1/hazard-events${qs ? `?${qs}` : ''}`
  )

  const data = unwrap(response)

  return {
    content: Array.isArray(data)
      ? data
      : Array.isArray(data?.content)
        ? data.content
        : [],
    page: data?.page ?? 0,
    size: data?.size ?? 0,
    totalElements: data?.totalElements ?? 0,
    totalPages: data?.totalPages ?? 0,
    summary: data?.summary ?? null,
  }
}

/**
 * 이상 감지 상세
 * GET /api/v1/hazard-events/{eventId}
 *
 * 주의:
 * clip.playbackUrl은 요청 시점에 발급되는 임시 URL이므로
 * localStorage 등에 저장하지 않고 상세 화면에서만 사용합니다.
 */
export async function getHazardEvent(eventId) {
  const response = await api.get(
    `/api/v1/hazard-events/${encodeURIComponent(eventId)}`
  )

  return unwrap(response)
}

/**
 * 이상 감지 조치 실행
 * POST /api/v1/hazard-events/{eventId}/actions
 *
 * actionType:
 * SEND_WARNING | BLOCK_ZONE | RESOLVE
 */
export async function runHazardEventAction(
  eventId,
  { actionType, adminId, memo = '' }
) {
  const response = await api.post(
    `/api/v1/hazard-events/${encodeURIComponent(eventId)}/actions`,
    {
      actionType,
      adminId,
      memo,
    }
  )

  return unwrap(response)
}

/**
 * 실시간 이상 감지 SSE 연결
 * GET /api/v1/hazard-events/stream
 *
 * event:
 * - hazard
 * - clip-ready
 * - heartbeat
 */
export function openHazardEventStream({
  onOpen,
  onHazard,
  onClipReady,
  onHeartbeat,
  onError,
} = {}) {
  const baseUrl = import.meta.env.VITE_API_URL || ''
  const source = new EventSource(
    `${baseUrl}/api/v1/hazard-events/stream`
  )

  source.onopen = () => {
    onOpen?.()
  }

  source.addEventListener('hazard', (event) => {
    try {
      onHazard?.(JSON.parse(event.data))
    } catch {
      onHazard?.(event.data)
    }
  })

  source.addEventListener('clip-ready', (event) => {
    try {
      onClipReady?.(JSON.parse(event.data))
    } catch {
      onClipReady?.(event.data)
    }
  })

  source.addEventListener('heartbeat', (event) => {
    onHeartbeat?.(event.data)
  })

  source.onerror = (error) => {
    onError?.(error)
  }

  return source
}
