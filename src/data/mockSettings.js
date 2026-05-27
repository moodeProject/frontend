export const ADMIN_ROLES = [
  { role: '슈퍼',   label: '슈퍼 관리자',   desc: '모든 기능을 관리할 수 있는 최고 권한' },
  { role: '일반',   label: '일반 관리자',   desc: '대부분의 기능을 관리할 수 있는 권한' },
  { role: '모니터링', label: '모니터링 관리자', desc: '실시간 모니터링 및 알림 확인 권한' },
  { role: '작업기록', label: '작업기록 관리자', desc: '작업 기록 조회 및 관리 권한' },
]

export const MOCK_ADMINS = [
  { id: 1, name: '김철수', userId: 'admin01', email: 'ad01@gmail.com', position: '부장', role: '슈퍼',    lastLogin: '2026.05.08 14:40' },
  { id: 2, name: '김철수', userId: 'admin01', email: 'ad01@gmail.com', position: '과장', role: '슈퍼',    lastLogin: '2026.05.08 14:40' },
  { id: 3, name: '김철수', userId: 'admin01', email: 'ad01@gmail.com', position: '사원', role: '일반',    lastLogin: '2026.05.08 14:40' },
  { id: 4, name: '김철수', userId: 'admin01', email: 'ad01@gmail.com', position: '사원', role: '일반',    lastLogin: '2026.05.08 14:40' },
  { id: 5, name: '김철수', userId: 'admin01', email: 'ad01@gmail.com', position: '사원', role: '모니터링', lastLogin: '2026.05.08 14:40' },
  { id: 6, name: '김철수', userId: 'admin01', email: 'ad01@gmail.com', position: '대리', role: '작업기록', lastLogin: '2026.05.08 14:40' },
  { id: 7, name: '이영희', userId: 'admin02', email: 'ad02@gmail.com', position: '부장', role: '슈퍼',    lastLogin: '2026.05.07 09:12' },
  { id: 8, name: '박민준', userId: 'admin03', email: 'ad03@gmail.com', position: '과장', role: '일반',    lastLogin: '2026.05.06 17:30' },
  { id: 9, name: '최수진', userId: 'admin04', email: 'ad04@gmail.com', position: '사원', role: '모니터링', lastLogin: '2026.05.06 11:00' },
  { id: 10, name: '정대호', userId: 'admin05', email: 'ad05@gmail.com', position: '대리', role: '작업기록', lastLogin: '2026.05.05 16:45' },
  { id: 11, name: '강지원', userId: 'admin06', email: 'ad06@gmail.com', position: '사원', role: '일반',    lastLogin: '2026.05.05 10:20' },
  { id: 12, name: '윤서연', userId: 'admin07', email: 'ad07@gmail.com', position: '사원', role: '일반',    lastLogin: '2026.05.04 14:10' },
]

export const MOCK_HELMETS = [
  { id: 1,  name: '김철수', helmetId: 'HM-1001', model: 'SM-2000', battery: '87%', signal: '강', status: '활성', connected: '2026.05.08 14:40' },
  { id: 2,  name: '이영희', helmetId: 'HM-1002', model: 'SM-2000', battery: '62%', signal: '중', status: '활성', connected: '2026.05.08 13:20' },
  { id: 3,  name: '박민준', helmetId: 'HM-1003', model: 'SM-3000', battery: '95%', signal: '강', status: '활성', connected: '2026.05.08 09:00' },
  { id: 4,  name: '최수진', helmetId: 'HM-1004', model: 'SM-3000', battery: '15%', signal: '약', status: '비활성', connected: '2026.05.01 17:00' },
  { id: 5,  name: '정대호', helmetId: 'HM-1005', model: 'SM-2000', battery: '73%', signal: '강', status: '활성', connected: '2026.05.08 14:10' },
  { id: 6,  name: '강지원', helmetId: 'HM-1006', model: 'SM-3000', battery: '88%', signal: '강', status: '활성', connected: '2026.05.08 14:25' },
  { id: 7,  name: '윤서연', helmetId: 'HM-1007', model: 'SM-2000', battery: '54%', signal: '중', status: '활성', connected: '2026.05.08 12:00' },
  { id: 8,  name: '임재현', helmetId: 'HM-1008', model: 'SM-3000', battery: '91%', signal: '강', status: '활성', connected: '2026.05.08 14:30' },
  { id: 9,  name: '한지민', helmetId: 'HM-1009', model: 'SM-2000', battery: '44%', signal: '중', status: '비활성', connected: '2026.05.02 08:00' },
  { id: 10, name: '오성훈', helmetId: 'HM-1010', model: 'SM-3000', battery: '79%', signal: '강', status: '활성', connected: '2026.05.08 08:45' },
  { id: 11, name: '문지영', helmetId: 'HM-1011', model: 'SM-2000', battery: '33%', signal: '약', status: '비활성', connected: '2026.04.30 16:00' },
  { id: 12, name: '서동현', helmetId: 'HM-1012', model: 'SM-3000', battery: '66%', signal: '중', status: '활성', connected: '2026.05.08 10:00' },
]

export const MOCK_TEAMS = [
  { id: 1, name: '토목팀',   leader: '김철수', memberCount: 8,  createdAt: '2024.01.01' },
  { id: 2, name: '전기팀',   leader: '이영희', memberCount: 5,  createdAt: '2024.01.01' },
  { id: 3, name: '기계팀',   leader: '박민준', memberCount: 6,  createdAt: '2024.02.10' },
  { id: 4, name: '안전팀',   leader: '최수진', memberCount: 3,  createdAt: '2024.01.15' },
  { id: 5, name: '설계팀',   leader: '정대호', memberCount: 4,  createdAt: '2024.03.01' },
]
