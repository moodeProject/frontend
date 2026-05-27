import { useState, useMemo } from 'react'
import { MOCK_EVENTS, EVENT_TYPES, EVENT_ZONES, EVENT_STATS } from '../data/mockEvents'
import Pagination from '../components/Pagination'
import styles from './HazardEvents.module.css'

const TABS = ['전체 이벤트', '위험 이벤트', '주의 이벤트']

function StatCard({ icon, iconBg, label, main, sub }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon} style={{ background: iconBg }}>{icon}</div>
      <div>
        <div className={styles.statLabel}>{label}</div>
        <div className={styles.statValue}>
          <span className={styles.statNum}>{main}</span>
          {sub && <><span className={styles.statUnit}>{sub.unit}</span><span className={styles.statNum2}>{sub.num}</span><span className={styles.statUnit}>{sub.unit2}</span></>}
        </div>
      </div>
    </div>
  )
}

export default function HazardEvents() {
  const [dateFrom, setDateFrom] = useState('2026-05-01')
  const [dateTo, setDateTo]     = useState('2026-05-30')
  const [eventType, setEventType] = useState('전체 유형')
  const [zone, setZone]           = useState('전체 구역')
  const [query, setQuery]         = useState('')
  const [tab, setTab]             = useState(0)
  const [page, setPage]           = useState(1)
  const [pageSize, setPageSize]   = useState(5)

  const filtered = useMemo(() => {
    return MOCK_EVENTS.filter((e) => {
      const matchType  = eventType === '전체 유형' || e.type === eventType
      const matchZone  = zone === '전체 구역' || e.zone === zone
      const matchQuery = !query || e.type.includes(query) || e.worker.name.includes(query) || e.helmetId.includes(query)
      const matchTab   = tab === 0 || (tab === 1 && e.severity === 'danger') || (tab === 2 && e.severity === 'warning')
      return matchType && matchZone && matchQuery && matchTab
    })
  }, [eventType, zone, query, tab])

  const dangerCount  = MOCK_EVENTS.filter((e) => e.severity === 'danger').length
  const warningCount = MOCK_EVENTS.filter((e) => e.severity === 'warning').length

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  function handleTabChange(i) {
    setTab(i)
    setPage(1)
  }

  function handlePageSize(s) {
    setPageSize(s)
    setPage(1)
  }

  // TODO: 실제 API 조회로 교체
  function handleSearch() { setPage(1) }
  // TODO: 실제 CSV/Excel 다운로드로 교체
  function handleDownload() { alert('다운로드 기능은 실제 API 연동 후 구현됩니다.') }

  const now = new Date().toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    weekday: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit',
  })

  return (
    <div className={styles.page}>
      {/* 상단 */}
      <div className={styles.topBar}>
        <div>
          <h1 className={styles.title}>위험 이벤트</h1>
          <p className={styles.subtitle}>발생한 위험 이벤트를 확인하고 대응할 수 있습니다.</p>
        </div>
        <div className={styles.topRight}>
          <div className={styles.dateStr}>{now}</div>
          <button className={styles.downloadBtn} onClick={handleDownload}>⬇ 다운로드</button>
        </div>
      </div>

      {/* 필터 */}
      <div className={styles.filterBar}>
        <input type="date" className={styles.dateInput} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <span className={styles.dateSep}>~</span>
        <input type="date" className={styles.dateInput} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />

        <select className={styles.select} value={eventType} onChange={(e) => setEventType(e.target.value)}>
          {EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>

        <select className={styles.select} value={zone} onChange={(e) => setZone(e.target.value)}>
          {EVENT_ZONES.map((z) => <option key={z}>{z}</option>)}
        </select>

        <div className={styles.searchWrap}>
          <input
            className={styles.searchInput}
            placeholder="검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className={styles.searchIcon}>🔍</span>
        </div>

        <button className={styles.searchBtn} onClick={handleSearch}>조회</button>
      </div>

      {/* 통계 카드 */}
      <div className={styles.statRow}>
        <StatCard icon="👥" iconBg="#ddeeff" label="전체 이벤트" main={`${EVENT_STATS.total}명`} />
        <StatCard icon="✅" iconBg="#ffe0e0" label="미확인" main={`${EVENT_STATS.unconfirmed}명`} />
        <StatCard icon="✅" iconBg="#d4f5e2" label="확인 완료" main={`${EVENT_STATS.confirmed}명`} />
        <StatCard
          icon="🕐" iconBg="#ddeeff"
          label="평균 처리 시간"
          main={`${EVENT_STATS.avgMinutes}`}
          sub={{ unit: '분', num: EVENT_STATS.avgSeconds, unit2: '초' }}
        />
      </div>

      {/* 탭 + 테이블 */}
      <div className={styles.tableWrap}>
        <div className={styles.tabs}>
          {[`전체 이벤트 (${MOCK_EVENTS.length})`, `위험 이벤트 (${dangerCount})`, `주의 이벤트 (${warningCount})`].map((label, i) => (
            <button
              key={i}
              className={`${styles.tab} ${tab === i ? styles.tabActive : ''}`}
              onClick={() => handleTabChange(i)}
            >
              {label}
            </button>
          ))}
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              {['이벤트 유형','이벤트 상세','위치/구역','작업자','안전모ID','발생시간','상태','대응'].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr><td colSpan={8} className={styles.empty}>검색 결과가 없습니다.</td></tr>
            ) : paged.map((e) => (
              <tr key={e.id} className={styles.row}>
                <td>
                  <div className={styles.typeCell}>
                    <span className={`${styles.dot} ${e.severity === 'danger' ? styles.dotDanger : styles.dotWarning}`} />
                    {e.type}
                  </div>
                </td>
                <td className={styles.detailCell}>{e.detail}</td>
                <td>{e.zone}</td>
                <td>
                  <div className={styles.workerCell}>
                    <div className={styles.workerAvatar}>{e.worker.name[0]}</div>
                    <div>
                      <div className={styles.workerName}>{e.worker.name}</div>
                      <div className={styles.workerId}>{e.worker.employeeId}</div>
                    </div>
                  </div>
                </td>
                <td>{e.helmetId}</td>
                <td>{e.time}</td>
                <td>
                  <span className={`${styles.statusBadge} ${e.status === '미확인' ? styles.statusUnconfirmed : styles.statusConfirmed}`}>
                    {e.status}
                  </span>
                </td>
                <td>
                  <button className={styles.detailBtn}>상세보기</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <Pagination
          page={page}
          totalPages={totalPages}
          pageSize={pageSize}
          onPage={setPage}
          onPageSize={handlePageSize}
        />
      </div>
    </div>
  )
}
