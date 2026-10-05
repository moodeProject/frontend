import { api } from './client'

const STATUS_TO_UI = {
  NORMAL: 'normal',
  CAUTION: 'warning',
  DANGER: 'danger',
}

const UI_TO_STATUS = {
  normal: 'NORMAL',
  warning: 'CAUTION',
  danger: 'DANGER',
}

function unwrap(response) {
  return response?.data ?? response
}

function text(value) {
  return value === undefined ||
    value === null
    ? ''
    : String(value)
}

export function serverStatusToUi(
  value
) {
  const normalized =
    text(value).toUpperCase()

  return (
    STATUS_TO_UI[normalized] ||
    (['normal', 'warning', 'danger'].includes(
      text(value)
    )
      ? text(value)
      : 'normal')
  )
}

export function uiStatusToServer(
  value
) {
  if (!value || value === 'all') {
    return ''
  }

  return (
    UI_TO_STATUS[value] ||
    text(value).toUpperCase()
  )
}

function readZone(raw) {
  const zone = raw?.zone

  if (
    zone &&
    typeof zone === 'object'
  ) {
    return (
      zone.name ||
      zone.zoneName ||
      zone.label ||
      ''
    )
  }

  return (
    raw?.zoneName ||
    raw?.workZone ||
    zone ||
    raw?.detailLocation ||
    ''
  )
}

function readHelmetNo(raw) {
  const helmet = raw?.helmet

  if (
    helmet &&
    typeof helmet === 'object'
  ) {
    return (
      helmet.helmetNo ||
      helmet.helmetNumber ||
      helmet.id ||
      ''
    )
  }

  return (
    raw?.helmetNo ||
    raw?.helmetId ||
    raw?.helmetNumber ||
    ''
  )
}

export function normalizeWorkerRecord(
  raw = {}
) {
  const id =
    raw.workerId ??
    raw.id ??
    raw.userId ??
    raw.employeeNo ??
    ''

  const employeeNo =
    raw.employeeNo ??
    raw.employeeNumber ??
    raw.workerCode ??
    ''

  const status =
    serverStatusToUi(
      raw.status ??
        raw.riskStatus ??
        raw.state
    )

  return {
    ...raw,
    id: text(id),
    workerId: text(id),
    name:
      raw.name ??
      raw.workerName ??
      '이름 미등록',
    employeeNumber:
      employeeNo == null
        ? ''
        : text(employeeNo),
    workerCode:
      employeeNo == null
        ? ''
        : text(employeeNo),
    zone:
      readZone(raw) ||
      '위치 미확인',
    zoneName:
      readZone(raw) || '',
    detailLocation:
      raw.detailLocation ?? '',
    helmetId:
      text(readHelmetNo(raw)),
    helmetNo:
      text(readHelmetNo(raw)),
    deviceId:
      text(
        raw.deviceId ??
          raw.helmet?.deviceId ??
          ''
      ),
    phone:
      raw.phone ??
      raw.phoneNumber ??
      '',
    status,
    heartRate:
      raw.heartRate === null
        ? null
        : raw.heartRate,
    spo2:
      raw.spo2 === null
        ? null
        : raw.spo2,
  }
}

function normalizePage(payload) {
  const data = unwrap(payload)

  const content = Array.isArray(data)
    ? data
    : Array.isArray(data?.content)
      ? data.content
      : Array.isArray(data?.workers)
        ? data.workers
        : Array.isArray(data?.items)
          ? data.items
          : []

  return {
    content:
      content.map(
        normalizeWorkerRecord
      ),
    page:
      data?.page ??
      data?.number ??
      0,
    size:
      data?.size ??
      content.length,
    totalElements:
      data?.totalElements ??
      data?.total ??
      content.length,
    totalPages:
      data?.totalPages ??
      1,
    raw: data,
  }
}

/**
 * GET /api/workers?q=&status=&page=&size=
 */
export async function getWorkers(
  params = {}
) {
  const filteredParams =
    Object.fromEntries(
      Object.entries(params).filter(
        ([, value]) =>
          value !== undefined &&
          value !== null &&
          value !== ''
      )
    )

  const qs = new URLSearchParams(
    filteredParams
  ).toString()

  const response = await api.get(
    `/api/workers${
      qs ? `?${qs}` : ''
    }`
  )

  return normalizePage(response)
}

/**
 * GET /api/workers/{workerId}
 */
export async function getWorker(
  workerId
) {
  const response = await api.get(
    `/api/workers/${encodeURIComponent(
      workerId
    )}`
  )

  return normalizeWorkerRecord(
    unwrap(response) || {}
  )
}

/**
 * POST /api/workers
 * body: { name, zoneName, detailLocation?, helmetNo? }
 */
export async function createWorker(
  data
) {
  const body = {
    name: data.name,
    zoneName: data.zoneName,
    ...(data.detailLocation
      ? {
          detailLocation:
            data.detailLocation,
        }
      : {}),
    ...(data.helmetNo
      ? {
          helmetNo:
            data.helmetNo,
        }
      : {}),
  }

  const response = await api.post(
    '/api/workers',
    body
  )

  return normalizeWorkerRecord(
    unwrap(response) || {}
  )
}

/**
 * PUT /api/workers/{workerId}
 * body: { name, zoneName, detailLocation? }
 */
export async function updateWorkerApi(
  workerId,
  data
) {
  const body = {
    name: data.name,
    zoneName: data.zoneName,
    ...(data.detailLocation
      ? {
          detailLocation:
            data.detailLocation,
        }
      : {}),
  }

  const response = await api.put(
    `/api/workers/${encodeURIComponent(
      workerId
    )}`,
    body
  )

  return normalizeWorkerRecord(
    unwrap(response) || {}
  )
}

/**
 * DELETE /api/workers/{workerId}
 * soft delete
 */
export async function deleteWorkerApi(
  workerId
) {
  const response = await api.delete(
    `/api/workers/${encodeURIComponent(
      workerId
    )}`
  )

  return unwrap(response)
}
