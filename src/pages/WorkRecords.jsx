import { useState, useMemo } from 'react'
import { MOCK_RECORDS, RECORD_STATS } from '../data/mockRecords'
import { TEAMS } from '../data/mockWorkers'
import Pagination from '../components/Pagination'
import styles from './WorkRecords.module.css'

const STATUSES = ['전체 상태', '완료', '조기종료']

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

export default function WorkRecords() {
  const [dateFrom, setDateFrom] = useState('2026-05-01')
  const [dateTo, setDateTo]     = useState('2026-05-30')
  const [team, setTeam]         = useState('전체 팀')
  const [status, setStatus]     = useState('전체 상태')
  const [page, setPage]         = useState(1)
  const [pageSize, setPageSize] = useState(5)

  const filtered = useMemo(() =>
    MOCK_RECORDS.filter((r) => {
      const matchTeam   = team === '전체 팀' || true   // TODO: records don't have team field yet
      const matchStatus = status === '전체 상태' || r.status === status
      return matchTeam && matchStatus
    }),
    [team, status]
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  function handlePageSize(s) {
    setPageSize(s)
    setPage(1)
  }

  // TODO: 실제 API 조회로 교체
  function handleSearch() {
    setPage(1)
  }

  // TODO: 실제 CSV/Excel 다운로드로 교체
  function handleDownload() {
    alert('다운로드 기능은 실제 API 연동 후 구현됩니다.')
  }

  const now = new Date().toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    weekday: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit',
  })

  return (
    <div className={styles.page}>
      {/* 상단 */}
      <div className={styles.topBar}>
        <div>
          <h1 className={styles.title}>작업 기록</h1>
          <p className={styles.subtitle}>작업자의 작업 이력과 안전 모니터링 기록을 확인할 수 있습니다.</p>
        </div>
        <div className={styles.dateArea}>
          <div className={styles.dateStr}>{now}</div>
          <button className={styles.refresh} onClick={() => window.location.reload()}>↺ 새로고침</button>
        </div>
      </div>

      {/* 필터 */}
      <div className={styles.filterBar}>
        <input type="date" className={styles.dateInput} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <span className={styles.dateSep}>~</span>
        <input type="date" className={styles.dateInput} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />

        <select className={styles.select} value={team} onChange={(e) => setTeam(e.target.value)}>
          {TEAMS.map((t) => <option key={t}>{t}</option>)}
        </select>

        <select className={styles.select} value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>

        <button className={styles.searchBtn} onClick={handleSearch}>조회</button>
        <button className={styles.downloadBtn} onClick={handleDownload}>⬇ 다운로드</button>
      </div>

      {/* 통계 카드 */}
      <div className={styles.statRow}>
        <StatCard
          icon="🕐" iconBg="#ddeeff"
          label="총 작업 시간"
          main={`${RECORD_STATS.totalHours}`}
          sub={{ unit: '시간', num: RECORD_STATS.totalMinutes, unit2: '분' }}
        />
        <StatCard icon="✅" iconBg="#d4f5e2" label="작업 완료" main={`${RECORD_STATS.completed}`} />
        <StatCard icon="⚠️" iconBg="#fff0d0" label="위험 이벤트" main={`${RECORD_STATS.events}`} />
        <StatCard icon="💗" iconBg="#ffe0e8" label="평균 심박수" main={`${RECORD_STATS.avgHeartRate}`} />
      </div>

      {/* 테이블 */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {['작업 날짜','사번','이름','구역','작업시간','시작 시간','종료 시간','상태','평균 심박수','작업 이벤트'].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((r) => (
              <tr key={r.id} className={styles.row}>
                <td>{r.date}</td>
                <td>{r.employeeId}</td>
                <td>{r.name}</td>
                <td>{r.zone}</td>
                <td>{r.workTime}</td>
                <td>{r.startTime}</td>
                <td>{r.endTime}</td>
                <td>
                  <span className={`${styles.badge} ${r.status === '완료' ? styles.badgeDone : styles.badgeEarly}`}>
                    {r.status}
                  </span>
                </td>
                <td className={r.heartRate >= 100 ? styles.heartWarn : ''}>
                  {r.heartRate} bpm
                </td>
                <td className={r.event.color === 'danger' ? styles.eventDanger : r.event.color === 'warning' ? styles.eventWarn : styles.eventNone}>
                  {r.event.label}
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
