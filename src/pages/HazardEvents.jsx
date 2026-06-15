import { useState, useMemo, useEffect } from 'react'
import { getFallAlerts } from '../api/monitoring'
import Pagination from '../components/Pagination'
import EmptyState from '../components/EmptyState'
import styles from './HazardEvents.module.css'

// 백엔드(/api/workers/alerts)는 낙상(FALLEN) 이력만 제공
const EVENT_TYPES = ['전체 유형', '낙상 감지']

function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  })
}

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

// ── 상세 모달 ──
// ── 상세 모달 ──
function EventDetailModal({ event, onClose }) {
  if (!event) return null

  const confidence = Number(event.confidence ?? 0)
  const confidencePercent = Math.round(confidence * 100)

  const riskLevel =
    confidencePercent >= 70
      ? '위험'
      : confidencePercent >= 40
      ? '주의'
      : '낮음'

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalLarge} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalCloseLarge} onClick={onClose}>
          ✕
        </button>

        <section className={styles.alertModalHeader}>
          <div className={styles.alertChip}>⚠ 긴급</div>

          <div className={styles.alertModalContent}>
            <div className={styles.alertTriangle}>!</div>

            <div className={styles.alertModalText}>
              <h2>추락이 감지되었습니다</h2>
              <p>즉시 작업자 상태를 확인해주세요.</p>
            </div>

            <div className={styles.alertModalConfidence}>
              <span>AI 신뢰도</span>
              <strong>{confidencePercent}%</strong>
            </div>
          </div>
        </section>

        <div className={styles.modalDetailGrid}>
          <section className={styles.modalDetailCard}>
            <h3>감지 결과</h3>

            <ModalInfoRow label="fallDetected">
              <span className={styles.trueBadge}>
                {event.fallDetected ? 'TRUE' : 'FALSE'}
              </span>
            </ModalInfoRow>

            <ModalInfoRow label="confidence">
              {confidence} ({confidencePercent}%)
            </ModalInfoRow>

            <ModalInfoRow label="발생 시간">{event.time}</ModalInfoRow>
            <ModalInfoRow label="이벤트 유형">{event.type}</ModalInfoRow>
            <ModalInfoRow label="위치 / 구역">{event.zone}</ModalInfoRow>
            <ModalInfoRow label="작업자">
              {event.worker?.name} ({event.worker?.employeeId})
            </ModalInfoRow>
            <ModalInfoRow label="안전모 ID">{event.helmetId}</ModalInfoRow>
          </section>

          <section className={styles.modalDetailCard}>
            <h3>위험도 (Confidence)</h3>

            <div className={styles.modalRiskPercent}>
              {confidencePercent}%
            </div>

            <div className={styles.modalRiskBar}>
              <div
                className={styles.modalRiskFill}
                style={{ width: `${confidencePercent}%` }}
              />
              <div
                className={styles.modalRiskDot}
                style={{ left: `calc(${confidencePercent}% - 10px)` }}
              />
            </div>

            <div className={styles.modalRiskScale}>
              <span>0%</span>
              <span>40%</span>
              <span>70%</span>
              <span>100%</span>
            </div>

            <div className={styles.modalRiskLabels}>
              <div className={riskLevel === '낮음' ? styles.riskSelected : ''}>
                낮음
                <small>0~39%</small>
              </div>
              <div className={riskLevel === '주의' ? styles.riskSelected : ''}>
                주의
                <small>40~69%</small>
              </div>
              <div className={riskLevel === '위험' ? styles.riskSelected : ''}>
                위험
                <small>70~100%</small>
              </div>
            </div>
          </section>
        </div>

        <section className={styles.sensorModalCard}>
          <h3>센서 입력값</h3>

          <div className={styles.sensorModalGrid}>
            <div className={styles.sensorModalLabel}>가속도 (m/s²)</div>
            <SensorValue label="ax" value={event.sensor?.ax} />
            <SensorValue label="ay" value={event.sensor?.ay} />
            <SensorValue label="az" value={event.sensor?.az} />

            <div className={styles.sensorModalLabel}>자이로 (°/s)</div>
            <SensorValue label="gx" value={event.sensor?.gx} />
            <SensorValue label="gy" value={event.sensor?.gy} />
            <SensorValue label="gz" value={event.sensor?.gz} />
          </div>

          <p className={styles.sensorModalWarning}>
            ⚠ 비정상적인 충격 및 자세 변화가 감지되었습니다.
          </p>
        </section>

        <div className={styles.modalActionRow}>
          <button className={styles.modalCallBtn}>긴급 연락하기</button>
          <button className={styles.modalCheckBtn}>작업자 확인 완료</button>
          <button className={styles.modalFalseBtn}>오탐으로 기록</button>
        </div>
      </div>
    </div>
  )
}

function ModalInfoRow({ label, children }) {
  return (
    <div className={styles.modalInfoRow}>
      <span>{label}</span>
      <strong>{children}</strong>
    </div>
  )
}

function SensorValue({ label, value }) {
  return (
    <div className={styles.sensorModalValue}>
      <span>{label}</span>
      <strong>{value ?? '-'}</strong>
    </div>
  )
}

function ModalField({ label, value }) {
  return (
    <div className={styles.modalField}>
      <span className={styles.modalFieldLabel}>{label}</span>
      <span className={styles.modalFieldValue}>{value}</span>
    </div>
  )
}

export default function HazardEvents() {
  const [dateFrom, setDateFrom] = useState('2026-05-01')
  const [dateTo, setDateTo]     = useState('2026-05-30')
  const [eventType, setEventType] = useState('전체 유형')
  const [query, setQuery]         = useState('')
  const [tab, setTab]             = useState(0)
  const [page, setPage]           = useState(1)
  const [pageSize, setPageSize]   = useState(5)

  // 모달 상태
  const [selectedEvent, setSelectedEvent] = useState(null)

  // 실제 백엔드(/api/workers/alerts)에서 받아온 낙상 이력
  const [liveAlerts, setLiveAlerts] = useState([])
  const [liveConnected, setLiveConnected] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function fetchLive() {
      try {
        const list = await getFallAlerts()
        if (cancelled) return
        setLiveAlerts(list)
        setLiveConnected(true)
      } catch {
        if (!cancelled) setLiveConnected(false)
      }
    }

    fetchLive()
    const interval = setInterval(fetchLive, 5000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  // 백엔드 낙상(FALLEN) 기록을 화면에 표시할 이벤트 형태로 변환
const events = useMemo(() => {
  return [...liveAlerts]
    .sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt))
    .map((a, i) => ({
      id: `${a.deviceId}-${a.recordedAt}-${i}`,
      type: '낙상 감지',
      severity: 'danger',
      detail: '비정상적인 충격 및 자세 변화 감지',
      zone: '-',
      worker: { name: '-', employeeId: '-' },
      helmetId: a.deviceId,
      time: formatDateTime(a.recordedAt),
      status: '미확인',

      fallDetected: a.state === 'FALLEN',
      confidence: a.confidence ?? null,

      sensor: {
        ax: a.ax ?? '-',
        ay: a.ay ?? '-',
        az: a.az ?? '-',
        gx: a.gx ?? '-',
        gy: a.gy ?? '-',
        gz: a.gz ?? '-',
      },
    }))
}, [liveAlerts])

  const filtered = useMemo(() => {
    return events.filter((e) => {
      const matchType  = eventType === '전체 유형' || e.type === eventType
      const matchQuery = !query || e.type.includes(query) || e.helmetId.toLowerCase().includes(query.toLowerCase())
      const matchTab   = tab === 0 || (tab === 1 && e.severity === 'danger') || (tab === 2 && e.severity === 'warning')
      return matchType && matchQuery && matchTab
    })
  }, [events, eventType, query, tab])

  const dangerCount  = events.filter((e) => e.severity === 'danger').length
  const warningCount = events.filter((e) => e.severity === 'warning').length

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  function handleTabChange(i) { setTab(i); setPage(1) }
  function handlePageSize(s)  { setPageSize(s); setPage(1) }
  function handleSearch()     { setPage(1) }
  // TODO: 실제 CSV/Excel 다운로드로 교체
  function handleDownload() { alert('다운로드 기능은 실제 API 연동 후 구현됩니다.') }

  const now = new Date().toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    weekday: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit',
  })

  return (
    <div className={styles.page}>
      {/* 상세 모달 */}
      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />

      {/* 상단 */}
      <div className={styles.topBar}>
        <div>
          <h1 className={styles.title}>
            위험 이벤트
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
        <StatCard icon="📋" iconBg="#ddeeff" label="전체 이벤트"   main={`${events.length}건`} />
        <StatCard icon="🔴" iconBg="#ffe0e0" label="미확인"        main="-" />
        <StatCard icon="✅" iconBg="#d4f5e2" label="확인 완료"     main="-" />
        <StatCard icon="🕐" iconBg="#ddeeff" label="평균 처리 시간" main="-" />
      </div>

      {/* 탭 + 테이블 */}
      <div className={styles.tableWrap}>
        <div className={styles.tabs}>
          {[`전체 이벤트 (${events.length})`, `위험 이벤트 (${dangerCount})`, `주의 이벤트 (${warningCount})`].map((label, i) => (
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
              <tr>
                <td colSpan={8}>
                  <EmptyState
                    icon="🔍"
                    title="검색 결과가 없습니다."
                    desc="조건을 변경하거나 필터를 초기화해 보세요."
                  />
                </td>
              </tr>
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
                  <span className={styles.statusBadge} style={{ background: '#f0f2f7', color: '#888' }}>
                    {e.status}
                  </span>
                </td>
                <td>
                  <button className={styles.detailBtn} onClick={() => setSelectedEvent(e)}>
                    상세보기
                  </button>
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
