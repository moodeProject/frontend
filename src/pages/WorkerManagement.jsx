import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { TEAMS, STATUSES } from '../data/mockWorkers'
import { useWorkers } from '../context/WorkerContext'
import styles from './WorkerManagement.module.css'

const STATUS_CLASS = {
  '작업중': styles.statusWorking,
  '휴식중': styles.statusResting,
  '작업대기': styles.statusWaiting,
  '비활성': styles.statusInactive,
}

export default function WorkerManagement() {
  const navigate = useNavigate()
  const { workers } = useWorkers()
  const [query, setQuery] = useState('')
  const [team, setTeam] = useState('전체 팀')
  const [status, setStatus] = useState('전체 상태')

  const filtered = useMemo(() => {
    return workers.filter((w) => {
      const matchQuery =
        !query ||
        w.name.includes(query) ||
        w.employeeId.includes(query) ||
        w.phone.includes(query) ||
        w.helmetId.includes(query)
      const matchTeam = team === '전체 팀' || w.team === team
      const matchStatus = status === '전체 상태' || w.status === status
      return matchQuery && matchTeam && matchStatus
    })
  }, [query, team, status])

  const now = new Date()
  const dateStr = now.toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    weekday: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit',
  })

  function handleReset() {
    setQuery('')
    setTeam('전체 팀')
    setStatus('전체 상태')
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div>
          <h1 className={styles.title}>작업자 관리</h1>
          <p className={styles.subtitle}>등록된 작업자 정보를 관리하고 검색할 수 있습니다.</p>
        </div>
        <div className={styles.dateArea}>
          <div className={styles.dateStr}>{dateStr}</div>
          <button className={styles.refresh} onClick={() => window.location.reload()}>
            ↺ 새로고침
          </button>
        </div>
      </div>

      {/* 필터 바 */}
      <div className={styles.filterBar}>
        <div className={styles.searchWrap}>
          <input
            className={styles.searchInput}
            placeholder="이름, 사번, 연락처 등 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className={styles.searchIcon}>🔍</span>
        </div>

        <select
          className={styles.select}
          value={team}
          onChange={(e) => setTeam(e.target.value)}
        >
          {TEAMS.map((t) => <option key={t}>{t}</option>)}
        </select>

        <select
          className={styles.select}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>

        <button className={styles.resetBtn} onClick={handleReset}>초기화</button>

        <button
          className={styles.addBtn}
          onClick={() => navigate('/workers/new')}
        >
          + 작업자 등록
        </button>
      </div>

      {/* 테이블 */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>사번</th>
              <th>이름</th>
              <th>팀</th>
              <th>연락처</th>
              <th>안전모 ID</th>
              <th>상태</th>
              <th>최근 작업</th>
              <th>상세보기</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.empty}>검색 결과가 없습니다.</td>
              </tr>
            ) : (
              filtered.map((w) => (
                <tr key={w.id} className={styles.row}>
                  <td>{w.employeeId}</td>
                  <td>
                    <div className={styles.nameCell}>
                      <div className={styles.avatar}>
                        {w.name[0]}
                      </div>
                      {w.name}
                    </div>
                  </td>
                  <td>{w.team}</td>
                  <td>{w.phone}</td>
                  <td>{w.helmetId}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${STATUS_CLASS[w.status]}`}>
                      {w.status}
                    </span>
                  </td>
                  <td className={styles.dateCell}>{w.lastWork}</td>
                  <td>
                    <button
                      className={styles.detailBtn}
                      onClick={() => navigate(`/workers/${w.id}`)}
                    >
                      →
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
