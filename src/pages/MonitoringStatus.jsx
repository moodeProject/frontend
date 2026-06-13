import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getHelmetStatusList } from '../api/monitoring'
import Pagination from '../components/Pagination'
import styles from './MonitoringStatus.module.css'

// 백엔드에 등록된 헬멧 ID 목록
const HELMET_IDS = ['HELMET-001', 'HELMET-002', 'HELMET-003', 'HELMET-004', 'HELMET-005', 'HELMET-006']

// 백엔드 센서 상태 → 화면 상태 매핑
const STATE_TO_STATUS = {
  NORMAL:  'normal',
  FALLING: 'caution',
  FALLEN:  'emergency',
}

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString('ko-KR', { hour12: false })
}

const STATUS_COLOR = {
  emergency: '#e53935',
  caution:   '#ff9800',
  normal:    '#43a047',
}
const STATUS_LABEL = {
  emergency: '긴급',
  caution:   '주의',
  normal:    '정상',
}
const ROW_BORDER = {
  emergency: '#e53935',
  caution:   '#ff9800',
  normal:    '#43a047',
}

const STATUSES = ['전체 상태', '긴급', '주의', '정상']

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
  const [status, setStatus]     = useState('전체 상태')
  const [page, setPage]         = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // 실제 백엔드(/api/workers/status)에서 받아온 실시간 헬멧 상태
  const [liveData, setLiveData] = useState({})
  const [liveConnected, setLiveConnected] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function fetchLive() {
      try {
        const list = await getHelmetStatusList()
        if (cancelled) return
        const map = {}
        list.forEach((item) => { map[item.deviceId] = item })
        setLiveData(map)
        setLiveConnected(true)
      } catch {
        if (!cancelled) setLiveConnected(false)
      }
    }

    fetchLive()
    const interval = setInterval(fetchLive, 5000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  // 백엔드에 등록된 헬멧 6대를 기준으로, 실시간 상태를 덧입힌 목록
  const displayList = useMemo(() => {
    return HELMET_IDS.map((helmetId) => {
      const live = liveData[helmetId]
      return {
        id: helmetId,
        helmetId,
        team: '-',
        employeeId: '-',
        name: '-',
        zone: '-',
        workTime: '-',
        heartRate: null,
        temp: null,
        event: { label: '-', level: null },
        status: live ? (STATE_TO_STATUS[live.state] ?? null) : null,
        updatedAt: live ? formatTime(live.recordedAt) : '-',
      }
    })
  }, [liveData])

  // 상단 요약 카드도 displayList(실시간 반영된 목록) 기준으로 집계
  const stats = useMemo(() => {
    const result = { normal: 0, danger: 0, emergency: 0 }
    displayList.forEach((w) => {
      if (w.status === 'normal') result.normal++
      else if (w.status === 'caution') result.danger++
      else if (w.status === 'emergency') result.emergency++
    })
    return result
  }, [displayList])

  const filtered = useMemo(() => {
    return displayList.filter((w) => {
      const matchQuery  = !query || w.helmetId.toLowerCase().includes(query.toLowerCase())
      const matchStatus = status === '전체 상태' || STATUS_LABEL[w.status] === status
      return matchQuery && matchStatus
    })
  }, [displayList, query, status])

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

      <h1 className={styles.title}>
        작업자 상태 전체보기
        <span
          className={styles.liveBadge}
          style={{
            color: liveConnected ? '#43a047' : '#aaa',
            background: liveConnected ? '#d4f5e2' : '#f0f2f7',
          }}
        >
          {liveConnected ? '🟢 실시간 연동 중' : '⚪ 서버 연결 대기'}
        </span>
      </h1>

      {/* 요약 카드 5개 */}
      <div className={styles.statRow}>
        <StatCard icon="✅" iconBg="#d4f5e2" label="정상"    value={`${stats.normal}명`}    accent="#43a047" />
        <StatCard icon="⚠️" iconBg="#fff0d0" label="위험"    value={`${stats.danger}명`}    accent="#ff9800" />
        <StatCard icon="🚨" iconBg="#ffe0e8" label="긴급"    value={`${stats.emergency}명`} accent="#e53935" />
        <StatCard icon="🏗️" iconBg="#e8f0fe" label="작업 중" value="-" />
        <StatCard icon="🔋" iconBg="#f0f4f8" label="휴식 중" value="-" />
      </div>

      {/* 필터 */}
      <div className={styles.filterBar}>
        <input
          className={styles.searchInput}
          placeholder="안전모 ID 검색..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1) }}
        />
        <div className={styles.filters}>
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
                      {STATUS_LABEL[w.status] ?? '-'}
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
