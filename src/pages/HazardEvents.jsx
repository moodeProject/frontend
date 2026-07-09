import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getFallAlerts } from '../api/monitoring'
import styles from './HazardEvents.module.css'

const MOCK_HISTORY = [
  { time: '09:47:02', worker: '정대호', type: '심박수 이상', assignee: '김관리', duration: '02:15', result: '처리완료' },
  { time: '08:33:41', worker: '박재현', type: '경사 위험',   assignee: '이안전', duration: '03:42', result: '처리완료' },
  { time: '07:55:20', worker: '김태영', type: '충격 감지',   assignee: '박담당', duration: '01:58', result: '처리완료' },
]

export default function HazardEvents() {
  const navigate = useNavigate()
  const [alerts, setAlerts]       = useState([])
  const [connected, setConnected] = useState(false)
  const [page, setPage]           = useState(1)
  const [histPage, setHistPage]   = useState(1)
  const PAGE_SIZE = 10

  useEffect(() => {
    async function fetchData() {
      try {
        const list = await getFallAlerts()
        setAlerts([...list].sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt)))
        setConnected(true)
      } catch { setConnected(false) }
    }
    fetchData()
    const id = setInterval(fetchData, 5000)
    return () => clearInterval(id)
  }, [])

  const latestAlert = alerts[0]

  const totalPages     = Math.max(1, Math.ceil(alerts.length / PAGE_SIZE))
  const pagedAlerts    = alerts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const histTotalPages = Math.max(1, Math.ceil(MOCK_HISTORY.length / PAGE_SIZE))
  const pagedHistory   = MOCK_HISTORY.slice((histPage - 1) * PAGE_SIZE, histPage * PAGE_SIZE)

  function fmt(iso) {
    return iso ? new Date(iso).toLocaleString('ko-KR', { hour12: false }) : '-'
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>추락 사고 알림</h1>
          <p className={styles.subtitle}>추락 사고 알림 현황과 처리 이력을 확인합니다.</p>
        </div>
        <span className={styles.liveBadge} style={{ color: connected ? '#43a047' : '#aaa', background: connected ? '#d4f5e2' : '#f0f2f7' }}>
          {connected ? '🟢 실시간 연동 중' : '⚪ 서버 연결 대기'}
        </span>
      </div>

      <div className={styles.statRow}>
        {[
          { icon: '🚨', bg: '#ffe0e0', label: '긴급 알림',      value: alerts.length > 0 ? 1 : 0, unit: '건', accent: '#e53935' },
          { icon: '⚠️', bg: '#fff0d0', label: '오늘 추락 사고', value: alerts.length,              unit: '건', accent: '#ff9800' },
          { icon: '🔔', bg: '#f0f0ff', label: '미확인 알림',    value: 3,                          unit: '건', accent: '#7c3aed' },
          { icon: '🕐', bg: '#e0edff', label: '평균 대응 시간', value: '02:38',                    unit: '분초', accent: '#4a7cdc' },
        ].map((c) => (
          <div key={c.label} className={styles.statCard} style={{ borderTop: `3px solid ${c.accent}` }}>
            <div className={styles.statIcon} style={{ background: c.bg }}>{c.icon}</div>
            <div>
              <div className={styles.statLabel}>{c.label}</div>
              <div className={styles.statValue}>
                <span className={styles.statNum} style={{ color: c.accent }}>{c.value}</span>
                <span className={styles.statUnit}>{c.unit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.mainGrid}>
        <div className={styles.leftCol}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>실시간 알림 목록</span>
              {alerts.length > 0 && <span className={styles.urgentTag}>● 긴급 {alerts.length}건</span>}
            </div>
            <table className={styles.table}>
              <thead><tr>{['발생 시간','작업자','위치','사고 유형','위험도','상태'].map((h) => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {alerts.length === 0 ? (
                  <tr><td colSpan={6} className={styles.empty}>낙상 감지 이력이 없습니다.</td></tr>
                ) : pagedAlerts.map((a, i) => {
                  const isFirst = page === 1 && i === 0
                  return (
                    <tr key={i} className={isFirst ? styles.dangerRow : ''}>
                      <td className={styles.muted} style={{ color: isFirst ? '#e53935' : '#555', fontWeight: isFirst ? 700 : 400 }}>{fmt(a.recordedAt)}</td>
                      <td className={styles.workerName} style={{ color: isFirst ? '#e53935' : '#1a2340' }}>이준호</td>
                      <td style={{ color: isFirst ? '#e53935' : '#333' }}>B구역 3층 계단</td>
                      <td style={{ color: isFirst ? '#e53935' : '#333', fontWeight: isFirst ? 700 : 400 }}>추락 감지</td>
                      <td><span className={styles.riskBadge} style={{ background: '#ffe0e0', color: '#e53935' }}>매우 높음</span></td>
                      <td><span className={styles.statusBadge} style={{ background: '#ffe0e0', color: '#c62828' }}>대응중</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button className={styles.pageBtn} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>‹ 이전</button>
                <span className={styles.pageInfo}>{page} / {totalPages}</span>
                <button className={styles.pageBtn} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>다음 ›</button>
              </div>
            )}
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}><span className={styles.cardTitle}>알림 처리 이력</span></div>
            <table className={styles.table}>
              <thead><tr>{['접수 시간','작업자','유형','처리 담당','대응 시간','결과'].map((h) => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {pagedHistory.map((h, i) => (
                  <tr key={i}>
                    <td className={styles.muted}>{h.time}</td>
                    <td className={styles.workerName}>{h.worker}</td>
                    <td>{h.type}</td>
                    <td>{h.assignee}</td>
                    <td>{h.duration}</td>
                    <td><span className={styles.statusBadge} style={{ background: '#e8f5e9', color: '#2e7d32' }}>{h.result}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {histTotalPages > 1 && (
              <div className={styles.pagination}>
                <button className={styles.pageBtn} onClick={() => setHistPage((p) => Math.max(1, p - 1))} disabled={histPage === 1}>‹ 이전</button>
                <span className={styles.pageInfo}>{histPage} / {histTotalPages}</span>
                <button className={styles.pageBtn} onClick={() => setHistPage((p) => Math.min(histTotalPages, p + 1))} disabled={histPage === histTotalPages}>다음 ›</button>
              </div>
            )}
          </div>
        </div>

        <div className={styles.rightCol}>
          <div className={styles.emergencyCard}>
            <div className={styles.emergencyHeader}>
              <span className={styles.emergencyDot} />
              긴급 추락 사고 알림
            </div>
            {latestAlert ? (
              <>
                <div className={styles.emergencyGrid}>
                  {[
                    ['작업자', '이준호'],
                    ['ID', 'W-1024'],
                    ['위치', 'B구역 3층 계단'],
                    ['사고 유형', '추락 감지'],
                    ['위험도', '매우 높음'],
                    ['마지막 측정 위치', 'B-3F-12'],
                    ['발생 시간', fmt(latestAlert.recordedAt)],
                    ['주변 작업자', '3명 알림 발송'],
                  ].map(([k, v]) => (
                    <div key={k} className={styles.emergencyRow}>
                      <span className={styles.emergencyKey}>{k}</span>
                      <span className={styles.emergencyVal}>{v}</span>
                    </div>
                  ))}
                </div>
                <button className={styles.emergencyBtn} onClick={() => navigate('/accident')}>사고 상세 보기</button>
                <button className={styles.emergencyBtn2}>119 신고 전송</button>
                <button className={styles.emergencyBtn2}>주변 작업자 알림</button>
              </>
            ) : (
              <div className={styles.noAlert}>현재 긴급 알림이 없습니다</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}