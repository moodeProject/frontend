export const ZONE_TYPES = ['전체 구역', '출입제한', '중장비', '적치장', '위험시설', '안전통로']
export const ZONE_STATUSES = ['전체 상태', '활성', '비활성']

export const ZONE_COLORS = {
  '출입제한': { bg: '#ffebee', text: '#c62828' },
  '중장비':   { bg: '#fff3e0', text: '#e65100' },
  '적치장':   { bg: '#e3f2fd', text: '#1565c0' },
  '위험시설': { bg: '#f3e5f5', text: '#6a1b9a' },
  '안전통로': { bg: '#e8f5e9', text: '#2e7d32' },
}

// Map SVG polygon coordinates (viewBox 360x280)
export const ZONE_POLYGONS = [
  { type: '출입제한', points: '210,10 320,10 355,55 345,140 280,155 205,90',  fill: 'rgba(229,57,53,0.25)',  stroke: '#e53935', labelX: 285, labelY: 85  },
  { type: '적치장',   points: '90,25 195,20 215,95 175,155 105,145 75,90',    fill: 'rgba(33,150,243,0.25)', stroke: '#1976d2', labelX: 148, labelY: 90  },
  { type: '안전통로', points: '270,160 345,148 362,235 325,268 262,245 255,188', fill: 'rgba(76,175,80,0.25)', stroke: '#388e3c', labelX: 308, labelY: 210 },
  { type: '중장비',   points: '50,195 175,192 195,262 175,285 50,285 38,260',  fill: 'rgba(255,152,0,0.25)', stroke: '#f57c00', labelX: 115, labelY: 242 },
]

export const MOCK_ZONES = [
  { id: 1, type: '출입제한', name: 'A-01', memo: '출입 제한구역 A', area: 5200,  registeredAt: '2024.05.30', status: '활성' },
  { id: 2, type: '중장비',   name: 'A-02', memo: '중장비 작업 구역', area: 12800, registeredAt: '2024.06.14', status: '활성' },
  { id: 3, type: '적치장',   name: 'A-03', memo: '자재 적치장',      area: 3450,  registeredAt: '2024.06.14', status: '활성' },
  { id: 4, type: '위험시설', name: 'B-01', memo: '위험 시설 구역',   area: 2100,  registeredAt: '2024.07.20', status: '비활성' },
  { id: 5, type: '안전통로', name: 'B-02', memo: '안전 통로',        area: 4900,  registeredAt: '2024.07.28', status: '활성' },
  { id: 6, type: '출입제한', name: 'C-01', memo: '위험물 보관 구역', area: 3200,  registeredAt: '2024.08.05', status: '활성' },
  { id: 7, type: '중장비',   name: 'C-02', memo: '크레인 작업 구역', area: 8500,  registeredAt: '2024.08.10', status: '활성' },
  { id: 8, type: '적치장',   name: 'C-03', memo: '폐기물 적치장',    area: 2700,  registeredAt: '2024.09.01', status: '비활성' },
  { id: 9, type: '안전통로', name: 'D-01', memo: '비상 대피로',      area: 1800,  registeredAt: '2024.09.15', status: '활성' },
  { id: 10, type: '위험시설', name: 'D-02', memo: '전기실 구역',     area: 1200,  registeredAt: '2024.10.01', status: '활성' },
]

export const ZONE_STATS = {
  total: 5,
  active: 4,
  inactive: 1,
  totalArea: 28450,
}
