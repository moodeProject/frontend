export const EVENT_TYPES = ['전체 유형', '낙상', '충돌 위험', '건강 이상']
export const EVENT_ZONES = ['전체 구역', 'A구역', 'B구역', 'C구역']

const BASE_WORKER = { name: '박성호', employeeId: '20251208' }

export const MOCK_EVENTS = [
  { id: 1, type: '낙상',    severity: 'danger',  detail: '작업자 간 거리 2.8m 접근', zone: 'HM-1001', worker: BASE_WORKER, helmetId: 'HM-1001', time: '14:29:56', status: '미확인' },
  { id: 2, type: '충돌 위험', severity: 'warning', detail: '작업자 간 거리 2.8m 접근', zone: 'HM-1001', worker: BASE_WORKER, helmetId: 'HM-1001', time: '14:29:56', status: '미확인' },
  { id: 3, type: '충돌 위험', severity: 'warning', detail: '작업자 간 거리 2.8m 접근', zone: 'HM-1001', worker: BASE_WORKER, helmetId: 'HM-1001', time: '14:29:56', status: '미확인' },
  { id: 4, type: '낙상',    severity: 'danger',  detail: '작업자 간 거리 2.8m 접근', zone: 'A구역',   worker: BASE_WORKER, helmetId: 'HM-1001', time: '14:29:56', status: '확인' },
  { id: 5, type: '건강 이상', severity: 'warning', detail: '심박수 120bpm 초과',      zone: 'B구역',   worker: BASE_WORKER, helmetId: 'HM-1002', time: '14:25:10', status: '확인' },
  { id: 6, type: '충돌 위험', severity: 'warning', detail: '중장비 3m 이내 접근',     zone: 'C구역',   worker: { name: '최현우', employeeId: '20251110' }, helmetId: 'HM-1003', time: '13:58:40', status: '미확인' },
  { id: 7, type: '낙상',    severity: 'danger',  detail: '급격한 가속도 감지',        zone: 'A구역',   worker: { name: '이민수', employeeId: '20240003' }, helmetId: 'HM-1004', time: '11:32:05', status: '확인' },
  { id: 8, type: '건강 이상', severity: 'warning', detail: '체온 38.5°C 초과',       zone: 'B구역',   worker: { name: '정대호', employeeId: '20240005' }, helmetId: 'HM-1005', time: '10:14:30', status: '미확인' },
  { id: 9, type: '충돌 위험', severity: 'warning', detail: '작업자 간 거리 1.5m 접근', zone: 'A구역', worker: BASE_WORKER, helmetId: 'HM-1001', time: '09:47:22', status: '확인' },
  { id: 10, type: '낙상',   severity: 'danger',  detail: '낙하물 충격 감지',          zone: 'C구역',   worker: { name: '강지원', employeeId: '20240006' }, helmetId: 'HM-1006', time: '09:05:11', status: '미확인' },
]

export const EVENT_STATS = {
  total: 24,
  unconfirmed: 20,
  confirmed: 3,
  avgMinutes: 3,
  avgSeconds: 28,
}
