import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ALL_STATUS_LIST, ALL_STATS } from '../data/mockMonitoring'
import Pagination from '../components/Pagination'
import styles from './MonitoringStatus.module.css'

const STATUS_COLOR = {
  emergency: '#e53935',
  danger:    '#e53935',
  caution:   '#ff9800',
  normal:    '#43a047',
  waiting:   '#90a4ae',
  resting:   '#78909c',
}
const STATUS_LABEL = {
  emergency: '긴급',
  danger:    '위험',
  caution:   '주의',
  normal:    '정상',
  waiting:   '대기',
  resting:   '휴식',
}
const ROW_BORDER = {
  emergency: '#e53935',
  danger:    '#e53935',
  caution:   '#ff9800',
  normal:    '#43a047',
  waiting:   '#90a4ae',
  resting:   '#78909c',
}

const TEAMS    = ['전체 팀', '토목팀', '건축팀', '전기팀', '기계팀', '배관팀', '안전팀', '안전관리팀']
const STATUSES = ['전체 상태', '긴급', '주의', '정상', '대기', '휴식']

function StatCard({ icon, iconBg, label, value, accent }) {
  return (
    <div className={styles.statCard} style={accent ? { borderTop: `3px solid ${accent}` } : {}}>
      <div className={styles.statIcon} style={{ background: iconBg }}>{icon}</div>
      <div>
        <div className={styles.statLabel}>{label}</div>
        <div className={styles.statNum} style={accent ? { color: accent } : {}}>{value}</div>
      </div>
    </div>
  )
}

export default function MonitoringStatus() {
  const navigate   = useNavigate()
  const [query, setQuery]       = useState('')
  const [team, setTeam]         = useState('전체 팀')
  const [status, setStatus]     = useState('전체 상태')
  const [page, setPage]         = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filtered = useMemo(() => {
    return ALL_STATUS_LIST.filter((w) => {
      const matchQuery  = !query || w.name.includes(query) || w.employeeId.includes(query) || w.helmetId.includes(query)
      const matchTeam   = team === '전체 팀' || w.team === team
      const matchStatus = status === '전체 상태' || STATUS_LABEL[w.status] === status
      return matchQuery && matchTeam && matchStatus
    })
  }, [query, team, status])

  const totalPages  = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated   = filtered.slice((page - 1) * pageSize, page * pageSize)

  function handlePageSize(sz) { setPageSize(sz); setPage(1) }

  return (
    <div className={styles.page}>
      {/* 브레드크럼 */}
      <div className={styles.breadcrumb}>
        <span className={styles.breadLink} onClick={() => navigate('/monitoring')}>실시간 모니터링</span>
        <span className={styles.breadSep}>›</span>
        <span className={styles.breadCurrent}>작업자 상태 전체보기</span>
      </div>

      <h1 className={styles.title}>작업자 상태 전체보기</h1>

      {/* 요약 카드 5개 */}
      <div className={styles.statRow}>
        <StatCard icon="✅" iconBg="#d4f5e2" label="정상"    value={`${ALL_STATS.normal}명`}    accent="#43a047" />
        <StatCard icon="⚠️" iconBg="#fff0d0" label="위험"    value={`${ALL_STATS.danger}명`}    accent="#ff9800" />
        <StatCard icon="🚨" iconBg="#ffe0e8" label="긴급"    value={`${ALL_STATS.emergency}명`} accent="#e53935" />
        <StatCard icon="🏗️" iconBg="#e8f0fe" label="작업 중" value={`${ALL_STATS.working}명`}  />
        <StatCard icon="🔋" iconBg="#f0f4f8" label="휴식 중" value={`${ALL_STATS.resting}명`}  />
      </div>

      {/* 필터 */}
      <div className={styles.filterBar}>
        <input
          className={styles.searchInput}
          placeholder="이름, 사번, 안전모 ID 검색..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1) }}
        />
        <div className={styles.filters}>
          <select className={styles.select} value={team} onChange={(e) => { setTeam(e.target.value); setPage(1) }}>
            {TEAMS.map((t) => <option key={t}>{t}</option>)}
          </select>
          <select className={styles.select} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* 테이블 */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>팀</th>
              <th>사번</th>
              <th>이름</th>
              <th>작업 구역</th>
              <th>작업 시간</th>
              <th>안전모 ID</th>
              <th>상태</th>
              <th>평균 심박수</th>
              <th>체온</th>
              <th>작업 이벤트</th>
              <th>업데이트</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={11} className={styles.empty}>검색 결과가 없습니다.</td>
              </tr>
            ) : (
              paginated.map((w) => (
                <tr
                  key={w.id}
                  className={styles.row}
                  style={{ borderLeft: `4px solid ${ROW_BORDER[w.status] ?? '#ddd'}` }}
                >
                  <td>{w.team}</td>
                  <td className={styles.mono}>{w.employeeId}</td>
                  <td className={styles.bold}>{w.name}</td>
                  <td>{w.zone}</td>
                  <td>{w.workTime}</td>
                  <td className={styles.mono}>{w.helmetId}</td>
                  <td>
                    <span
                      className={styles.statusBadge}
                      style={{
                        background: (STATUS_COLOR[w.status] ?? '#ccc') + '22',
                        color: STATUS_COLOR[w.status] ?? '#666',
                        border: `1px solid ${(STATUS_COLOR[w.status] ?? '#ccc')}44`,
                      }}
                    >
                      {STATUS_LABEL[w.status] ?? w.status}
                    </span>
                  </td>
                  <td>{w.heartRate != null ? `${w.heartRate} bpm` : '-'}</td>
                  <td>{w.temp != null ? `${w.temp}°C` : '-'}</td>
                  <td>
                    {w.event.label !== '-' && w.event.level ? (
                      <span
                        className={styles.eventBadge}
                        style={{
                          background: w.event.level === 'danger' ? '#ffe0e0' : '#fff3e0',
                          color:      w.event.level === 'danger' ? '#e53935' : '#ff9800',
                        }}
                      >
                        {w.event.label}
                      </span>
                    ) : (
                      <span className={styles.noEvent}>{w.event.label}</span>
                    )}
                  </td>
                  <td className={styles.updatedAt}>{w.updatedAt}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        pageSize={pageSize}
        onPage={setPage}
        onPageSize={handlePageSize}
        pageSizes={[5, 10, 20]}
      />
    </div>
  )
}
