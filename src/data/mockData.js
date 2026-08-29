export const workers = [
  { id: 'H-001', name: '박민수', zone: 'A구역 3층', status: 'danger', heartRate: 118, fatigue: 2, issue: '추락 감지됨' },
  { id: 'H-002', name: '김현석', zone: 'B구역', status: 'warning', heartRate: 92, fatigue: 2, issue: '피로도 2단계' },
  { id: 'H-003', name: '이수진', zone: 'C구역', status: 'warning', heartRate: 78, fatigue: 1, issue: '물웅덩이 감지' },
  { id: 'H-004', name: '최동훈', zone: 'A구역 1층', status: 'normal', heartRate: 72, fatigue: 1, issue: '정상 작업 중' },
  { id: 'H-005', name: '정유진', zone: 'B구역 1층', status: 'warning', heartRate: 88, fatigue: 1, issue: '열사병 주의' },
  { id: 'H-006', name: '한재원', zone: 'C구역 2층', status: 'normal', heartRate: 71, fatigue: 1, issue: '정상 작업 중' },
  { id: 'H-007', name: '오서연', zone: 'A구역 1층', status: 'normal', heartRate: 68, fatigue: 1, issue: '정상 작업 중' },
  { id: 'H-008', name: '강민철', zone: 'B구역 2층', status: 'normal', heartRate: 74, fatigue: 1, issue: '정상 작업 중' },
  { id: 'H-009', name: '윤지호', zone: 'A구역 2층', status: 'normal', heartRate: 76, fatigue: 1, issue: '정상 작업 중' },
  { id: 'H-010', name: '서예린', zone: 'C구역 1층', status: 'normal', heartRate: 70, fatigue: 1, issue: '정상 작업 중' },
];

export const alerts = [
  { id: 1, level: 'danger', type: '추락 감지', name: '박민수', zone: 'A구역 3층', time: '10:28', description: '추락 감지 — 충격·자세 변화·움직임 없음 동시 감지.' },
  { id: 2, level: 'danger', type: '난간 없는 구간', name: '박민수', zone: 'A구역 3층', time: '10:26', description: '난간 없는 구간 접근 감지 — 추락 고위험 구역.' },
  { id: 3, level: 'warning', type: '피로도 이상', name: '김현석', zone: 'B구역', time: '10:27', description: '피로도 2단계 감지 — 휴식 권고 필요.' },
  { id: 4, level: 'warning', type: '물웅덩이 감지', name: '이수진', zone: 'C구역', time: '10:24', description: '작업 구역 내 물웅덩이 감지 — 미끄럼 위험.' },
  { id: 5, level: 'warning', type: '장애물 감지', name: '김현석', zone: 'B구역', time: '10:21', description: '장애물(적재물) 감지 — 통로 협소, 충돌 위험.' },
  { id: 6, level: 'warning', type: '열사병 위험', name: '정유진', zone: 'B구역 1층', time: '09:55', description: '열사병 주의 — 체온 38.1℃, 지속 관찰 필요.' },
];

export const zones = [
  { name: 'A구역', normal: 8, warning: 1, danger: 0, level: 'warning' },
  { name: 'B구역', normal: 5, warning: 0, danger: 1, level: 'danger' },
  { name: 'C구역', normal: 6, warning: 2, danger: 0, level: 'warning' },
];


export const detections = [
  { id: 1, category: 'fall', kind: 'fall', level: 'danger', type: '추락 감지', name: '박민수', zone: 'A구역 3층', time: '10:28', process: '처리중', processClass: 'processing' },
  { id: 2, category: 'external', kind: 'unguarded', level: 'danger', type: '난간 없는 구간', name: '박민수', zone: 'A구역 3층', time: '10:26', process: '처리중', processClass: 'processing', riskLabel: '추락', detailDescription: '고층 작업 구간에 난간이 설치되어 있지 않음. 즉각 접근 금지 필요.', actionText: '즉각 접근 금지 조치가 필요합니다.' },
  { id: 3, category: 'health', kind: 'fatigue', level: 'warning', type: '피로도 이상', name: '김현석', zone: 'B구역', time: '10:27', process: '휴식권고', processClass: 'rest' },
  { id: 4, category: 'external', kind: 'puddle', level: 'warning', type: '물웅덩이 감지', name: '이수진', zone: 'C구역', time: '10:24', process: '확인완료', processClass: 'confirmed', riskLabel: '미끄럼 및 낙상', detailDescription: '바닥에 물웅덩이 형성. 미끄러짐으로 인한 낙상 및 추락 위험.', actionText: '작업자에게 위험 구역 경고가 필요합니다.' },
  { id: 5, category: 'external', kind: 'obstacle', level: 'warning', type: '장애물 감지', name: '김현석', zone: 'B구역', time: '10:21', process: '확인완료', processClass: 'confirmed', riskLabel: '충돌 및 전도', detailDescription: '작업 통로에 적재물이 위치. 통로 폭 협소, 작업자 충돌 위험 높음.', actionText: '작업자에게 위험 구역 경고가 필요합니다.' },
  { id: 6, category: 'health', kind: 'heat', level: 'warning', type: '열사병 위험', name: '정유진', zone: 'B구역 1층', time: '09:55', process: '미처리', processClass: 'unprocessed' },
];
