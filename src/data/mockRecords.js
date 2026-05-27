const ZONES = ['A-01', 'A-02', 'B-01', 'B-03', 'C-02']
const WORKERS = [
  { employeeId: '20240001', name: '김철수' },
  { employeeId: '20240002', name: '이영희' },
  { employeeId: '20240003', name: '박민준' },
  { employeeId: '20240005', name: '정대호' },
]
const EVENTS = [
  { label: '낙상 1회', color: 'danger' },
  { label: '건강 이상 1회', color: 'warning' },
  { label: '충돌 위험 1회', color: 'warning' },
  { label: '-', color: null },
  { label: '-', color: null },
]

function makeRecord(id, dateOffset = 0) {
  const d = new Date('2026-05-30')
  d.setDate(d.getDate() - dateOffset)
  const dateStr = d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace('.', '.')
  const worker = WORKERS[id % WORKERS.length]
  const isEarly = id % 7 === 0
  const heartRate = id % 5 === 1 ? 120 : 72 + (id % 15)
  return {
    id,
    date: dateStr,
    employeeId: worker.employeeId,
    name: worker.name,
    zone: ZONES[id % ZONES.length],
    workTime: isEarly ? '4시간 10분' : '8시간 30분',
    startTime: '08:00:00',
    endTime: isEarly ? '12:10:00' : '17:30:48' ,
    status: isEarly ? '조기종료' : '완료',
    heartRate,
    event: EVENTS[id % EVENTS.length],
  }
}

export const MOCK_RECORDS = Array.from({ length: 35 }, (_, i) => makeRecord(i + 1, Math.floor(i / 5)))

export const RECORD_STATS = {
  totalHours: 176,
  totalMinutes: 39,
  completed: 22,
  events: 8,
  avgHeartRate: 78,
}
