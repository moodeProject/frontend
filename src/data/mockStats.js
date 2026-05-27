export const STAT_CARDS = [
  { label: '총 작업 시간', value: '1,248', unit: '시간', trend: 'up',   pct: '5.2%',  icon: '🕐', iconBg: '#ddeeff' },
  { label: '평균 심박수',  value: '78',    unit: 'bpm',  trend: 'up',   pct: '2.6%',  icon: '💗', iconBg: '#ffe0e8' },
  { label: '위험 이벤트', value: '24',    unit: '명',   trend: 'down', pct: '22.3%', icon: '⚠️', iconBg: '#fff0d0' },
  { label: '사고 발생',   value: '2',     unit: '건',   trend: 'down', pct: '60.1%', icon: '🚨', iconBg: '#ffe0e8' },
  { label: '안전 수칙 준수율', value: '94.2', unit: '%', trend: 'up', pct: '2.4%',  icon: '🦺', iconBg: '#d4f5e2' },
]

export const DAILY_WORK_HOURS = [
  { date: '06/01', hours: 45 },
  { date: '06/05', hours: 38 },
  { date: '06/10', hours: 62 },
  { date: '06/15', hours: 65 },
  { date: '06/20', hours: 86 },
  { date: '06/25', hours: 48 },
  { date: '06/30', hours: 70 },
]

export const EVENT_TREND = [
  { time: '00:00', accident: 1, health: 1, collision: 1 },
  { time: '04:00', accident: 2, health: 1, collision: 2 },
  { time: '08:00', accident: 3, health: 3, collision: 3 },
  { time: '12:00', accident: 8, health: 9, collision: 4 },
  { time: '16:00', accident: 4, health: 5, collision: 3 },
  { time: '20:00', accident: 2, health: 2, collision: 1 },
  { time: '24:00', accident: 1, health: 2, collision: 2 },
]

export const ZONE_EVENTS_PIE = [
  { name: 'A구역', value: 12, pct: '50%', color: '#e53935' },
  { name: 'B구역', value: 6,  pct: '25%', color: '#ff9800' },
  { name: 'C구역', value: 4,  pct: '17%', color: '#2196f3' },
  { name: 'D구역', value: 2,  pct: '8%',  color: '#4caf50' },
]

export const HOURLY_HEART_RATE = [
  { time: '00:00', bpm: 78 },
  { time: '02:00', bpm: 75 },
  { time: '04:00', bpm: 73 },
  { time: '06:00', bpm: 76 },
  { time: '08:00', bpm: 82 },
  { time: '10:00', bpm: 85 },
  { time: '10:30', bpm: 68 },
  { time: '12:00', bpm: 104 },
  { time: '14:00', bpm: 95 },
  { time: '16:00', bpm: 88 },
  { time: '18:00', bpm: 83 },
  { time: '20:00', bpm: 79 },
  { time: '22:00', bpm: 76 },
  { time: '24:00', bpm: 74 },
]

export const MONTHLY_LEFT = [
  { label: '총 작업 시간', current: '1,248시간', prev: '1,186시간', trend: 'up',   pct: '5.2%' },
  { label: '평균 심박수',  current: '78bpm',     prev: '76bpm',     trend: 'up',   pct: '2.6%' },
]

export const MONTHLY_RIGHT = [
  { label: '위험 이벤트',      current: '24건',   prev: '31건',   trend: 'down', pct: '22.6%' },
  { label: '사고 발생',        current: '2건',    prev: '5건',    trend: 'down', pct: '60.0%' },
  { label: '안전 수칙 준수율', current: '94.2%',  prev: '91.8%',  trend: 'up',   pct: '2.4%' },
]
