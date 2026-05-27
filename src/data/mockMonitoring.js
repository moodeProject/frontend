export const MONITORING_STATS = {
  total: 24, normal: 20, danger: 3, emergency: 1,
}

// x, y: 지도 위 퍼센트 좌표
export const MONITOR_PINS = [
  { id: 1, name: '박성호', employeeId: '20251208', x: 33, y: 64, status: 'emergency' },
  { id: 2, name: '최현우', employeeId: '20240902', x: 46, y: 40, status: 'danger'    },
  { id: 3, name: '이민수', employeeId: '20240003', x: 55, y: 48, status: 'danger'    },
  { id: 4, name: '김철수', employeeId: '20240001', x: 65, y: 20, status: 'normal'    },
  { id: 5, name: '박성호', employeeId: '20251208', x: 73, y: 60, status: 'normal'    },
  { id: 6, name: '최현우', employeeId: '20240902', x: 43, y: 70, status: 'emergency' },
]

export const MONITOR_STATUS_LIST = [
  { id: 1, name: '박성호', employeeId: '20251208', zone: 'A-01', heartRate: 125, status: 'emergency', event: '충돌 위험 2.8m',    eventLevel: 'danger',  time: '14:29:39' },
  { id: 2, name: '최현우', employeeId: '20240902', zone: 'B-02', heartRate: 101, status: 'danger',    event: '체온 상승 37.8°C', eventLevel: 'warning', time: '14:29:39' },
  { id: 3, name: '정지훈', employeeId: '20251234', zone: 'A-02', heartRate: 99,  status: 'danger',    event: '수분부족 외 2건',  eventLevel: 'warning', time: '14:29:39' },
  { id: 4, name: '박성호', employeeId: '20251208', zone: 'A-01', heartRate: 82,  status: 'normal',    event: '작업중 진행중',    eventLevel: null,      time: '14:29:39' },
  { id: 5, name: '박성호', employeeId: '20251208', zone: 'A-01', heartRate: 79,  status: 'normal',    event: '-',               eventLevel: null,      time: '14:29:39' },
  { id: 6, name: '박성호', employeeId: '20251208', zone: 'A-01', heartRate: 88,  status: 'normal',    event: '-',               eventLevel: null,      time: '14:29:39' },
  { id: 7, name: '박성호', employeeId: '20251208', zone: 'A-01', heartRate: 81,  status: 'normal',    event: '-',               eventLevel: null,      time: '14:29:39' },
]

export const STATUS_GROUPS = [
  {
    key: 'emergency', label: '긴급',    icon: '🚨', color: '#e53935', count: 2,
    workers: [
      { name: '박성호', zone: 'B-01', heartRate: 125 },
      { name: '최현우', zone: 'A-02', heartRate: 101 },
    ],
  },
  { key: 'danger',   label: '주의',    icon: '⚠️', color: '#ff9800', count: 3,  workers: [] },
  { key: 'normal',   label: '정상',    icon: '✅', color: '#43a047', count: 19, workers: [] },
  { key: 'waiting',  label: '작업 대기', icon: '🏗️', color: '#90a4ae', count: 1,  workers: [] },
  { key: 'resting',  label: '휴식 중',  icon: '🔋', color: '#78909c', count: 4,  workers: [] },
]

// 전체보기 페이지용 상세 목록
export const ALL_STATUS_LIST = [
  { id: 1,  team: '토목팀',    employeeId: '20240814', name: '정지훈', zone: 'A-01', workTime: '8시간 30분', helmetId: 'HM-1001', status: 'danger',    heartRate: 82,  temp: 36.4, event: { label: '낙상 1회',     level: 'danger'  }, updatedAt: '14:30:20' },
  { id: 2,  team: '토목팀',    employeeId: '20240814', name: '정지훈', zone: 'B-01', workTime: '8시간 30분', helmetId: 'HM-1001', status: 'caution',   heartRate: 120, temp: 39.1, event: { label: '건강 이상 1회', level: 'warning' }, updatedAt: '14:30:06' },
  { id: 3,  team: '건축팀',    employeeId: '20240814', name: '정지훈', zone: 'C-01', workTime: '8시간 30분', helmetId: 'HM-1001', status: 'caution',   heartRate: 76,  temp: 37.0, event: { label: '충돌 위험 1회', level: 'warning' }, updatedAt: '14:30:20' },
  { id: 4,  team: '안전관리팀', employeeId: '20240814', name: '정지훈', zone: 'A-02', workTime: '8시간 30분', helmetId: 'HM-1001', status: 'normal',    heartRate: 82,  temp: 36.4, event: { label: '-',           level: null      }, updatedAt: '14:00:00' },
  { id: 5,  team: '배관팀',    employeeId: '20240814', name: '정지훈', zone: 'A-03', workTime: '8시간 30분', helmetId: 'HM-1001', status: 'waiting',   heartRate: null, temp: null, event: { label: '-',           level: null      }, updatedAt: '-' },
  { id: 6,  team: '전기팀',    employeeId: '20240001', name: '김철수', zone: 'B-02', workTime: '7시간 00분', helmetId: 'HM-1002', status: 'normal',    heartRate: 74,  temp: 36.2, event: { label: '-',           level: null      }, updatedAt: '14:28:10' },
  { id: 7,  team: '기계팀',    employeeId: '20240005', name: '정대호', zone: 'A-01', workTime: '8시간 10분', helmetId: 'HM-1005', status: 'emergency', heartRate: 130, temp: 38.9, event: { label: '낙상 감지',    level: 'danger'  }, updatedAt: '14:30:41' },
  { id: 8,  team: '토목팀',    employeeId: '20240003', name: '박민준', zone: 'C-03', workTime: '6시간 50분', helmetId: 'HM-1003', status: 'normal',    heartRate: 77,  temp: 36.5, event: { label: '-',           level: null      }, updatedAt: '14:22:05' },
  { id: 9,  team: '안전팀',    employeeId: '20240004', name: '최수진', zone: 'A-02', workTime: '8시간 00분', helmetId: 'HM-1004', status: 'resting',   heartRate: null, temp: null, event: { label: '-',           level: null      }, updatedAt: '13:50:00' },
  { id: 10, team: '전기팀',    employeeId: '20240006', name: '강지원', zone: 'B-01', workTime: '8시간 20분', helmetId: 'HM-1006', status: 'normal',    heartRate: 80,  temp: 36.7, event: { label: '-',           level: null      }, updatedAt: '14:29:58' },
]

export const ALL_STATS = {
  normal: 18, danger: 4, emergency: 2, working: 20, resting: 4,
}
