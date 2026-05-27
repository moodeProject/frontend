export const DASHBOARD_STATS = {
  totalWorkers: 24,
  normalWorkers: 20,
  dangerWorkers: 3,
  emergencyEvents: 1,
}

// x, y: percentage positions on the map
export const WORKER_PINS = [
  { id: 1, name: '박성호', x: 28, y: 68, status: 'danger' },
  { id: 2, name: '최현우', x: 46, y: 36, status: 'caution' },
  { id: 3, name: '이민수', x: 54, y: 46, status: 'caution' },
  { id: 4, name: '김철수', x: 64, y: 20, status: 'normal' },
  { id: 5, name: '박성호', x: 72, y: 60, status: 'normal' },
]

export const ALERTS = [
  { id: 1, level: 'emergency', label: '긴급', text: '낙상 감지 - 정지훈', zone: 'A구역', time: '14:29:38' },
  { id: 2, level: 'caution',   label: '주의', text: '건강 이상 - 최현우',   zone: 'A구역', time: '14:29:38' },
  { id: 3, level: 'caution',   label: '주의', text: '충돌 위험 경고 - 김철수,이민수', zone: 'A구역', time: '14:29:38' },
  { id: 4, level: 'caution',   label: '주의', text: '위험구역 진입 - 곽두철', zone: 'C구역', time: '14:29:38' },
  { id: 5, level: 'normal',    label: '정상', text: '작업 시작 - 이민수',   zone: 'A구역', time: '14:29:38' },
]

export const WORKER_STATUS_LIST = [
  { id: 1, name: '정지훈', zone: 'A-01', heartRate: 98,  temp: 38.2, status: 'danger',  lastUpdate: '14:29:38' },
  { id: 2, name: '최현우', zone: 'B-03', heartRate: 120, temp: 37.9, status: 'caution', lastUpdate: '14:28:55' },
  { id: 3, name: '김철수', zone: 'A-02', heartRate: 75,  temp: 36.6, status: 'normal',  lastUpdate: '14:27:33' },
  { id: 4, name: '박영희', zone: 'C-02', heartRate: 72,  temp: 36.5, status: 'normal',  lastUpdate: '14:27:33' },
  { id: 5, name: '이민수', zone: 'B-01', heartRate: 78,  temp: 36.6, status: 'normal',  lastUpdate: '14:27:33' },
  { id: 6, name: '정지훈', zone: 'A-01', heartRate: 98,  temp: 36.6, status: 'normal',  lastUpdate: '14:27:33' },
  { id: 7, name: '정지훈', zone: 'A-01', heartRate: 98,  temp: 36.6, status: 'normal',  lastUpdate: '14:27:33' },
  { id: 8, name: '정지훈', zone: 'A-01', heartRate: 98,  temp: 36.6, status: 'normal',  lastUpdate: '14:27:33' },
]

export const CHART_DATA = [
  { time: '00:00', accident: 1, health: 1, collision: 1 },
  { time: '04:00', accident: 2, health: 1, collision: 2 },
  { time: '08:00', accident: 3, health: 3, collision: 3 },
  { time: '12:00', accident: 8, health: 9, collision: 4 },
  { time: '16:00', accident: 4, health: 5, collision: 3 },
  { time: '20:00', accident: 2, health: 2, collision: 1 },
  { time: '24:00', accident: 1, health: 2, collision: 2 },
]

export const CHART_SUMMARY = {
  accident: 2,
  health: 5,
  collision: 8,
}
