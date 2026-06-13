import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkers } from '../context/WorkerContext'
import { getHelmetStatusList } from '../api/monitoring'
import styles from './WorkerManagement.module.css'

// 백엔드 센서 상태 → 화면 상태 매핑
const STATE_TO_STATUS = {
  NORMAL:  'normal',
  FALLING: 'caution',
  FALLEN:  'emergency',
}
const HELMET_STATUS_LABEL = {
  emergency: '긴급',
  caution:   '주의',
  normal:    '정상',
}
const HELMET_STATUS_COLOR = {
  emergency: '#e53935',
  caution:   '#ff9800',
  normal:    '#43a047',
}

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString('ko-KR', { hour12: false })
}

export default function WorkerManagement() {
  const navigate = useNavigate()
  const { workers } = useWorkers()
  const [query, setQuery] = useState('')

  // 실제 백엔드(/api/workers/status)에서 받아온 헬멧 실시간 상태
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

  const filtered = useMemo(() => {
    return workers.filter((w) => {
      return !query || w.helmetId.toLowerCase().includes(query.toLowerCase())
    })
  }, [query, workers])

  const now = new Date()
  const dateStr = now.toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    weekday: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit',
  })

  function handleReset() {
    setQuery('')
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div>
          <h1 className={styles.title}>
            작업자 관리
            <span
              className={styles.liveBadge}
              style={{
                color: liveConnected ? '#43a047' : '#aaa',
                background: liveConnected ? '#d4f5e2' : '#f0f2f7',
              }}
            >
              {liveConnected ? '🟢 안전모 연동 중' : '⚪ 서버 연결 대기'}
            </span>
          </h1>
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
            placeholder="안전모 ID 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className={styles.searchIcon}>🔍</span>
        </div>

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
              <th>안전모 상태</th>
              <th>상태 업데이트</th>
              <th>최근 작업</th>
              <th>상세보기</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className={styles.empty}>검색 결과가 없습니다.</td>
              </tr>
            ) : (
              filtered.map((w) => {
                const live = liveData[w.helmetId]
                const helmetStatus    = live ? (STATE_TO_STATUS[live.state] ?? null) : null
                const helmetUpdatedAt = live ? formatTime(live.recordedAt) : '-'

                return (
                  <tr key={w.id} className={styles.row}>
                    <td>-</td>
                    <td>
                      <div className={styles.nameCell}>
                        <div className={styles.avatar}>-</div>
                        -
                      </div>
                    </td>
                    <td>-</td>
                    <td>-</td>
                    <td>{w.helmetId}</td>
                    <td>
                      {helmetStatus
                        ? (
                          <span
                            className={styles.statusBadge}
                            style={{
                              background: (HELMET_STATUS_COLOR[helmetStatus] ?? '#ccc') + '22',
                              color: HELMET_STATUS_COLOR[helmetStatus] ?? '#666',
                            }}
                          >
                            {HELMET_STATUS_LABEL[helmetStatus] ?? '-'}
                          </span>
                        )
                        : '-'
                      }
                    </td>
                    <td className={styles.dateCell}>{helmetUpdatedAt}</td>
                    <td className={styles.dateCell}>-</td>
                    <td>
                      <button
                        className={styles.detailBtn}
                        onClick={() => navigate(`/workers/${w.id}`)}
                      >
                        →
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
