import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getHelmetStatusList, getFallAlerts } from '../api/monitoring'
import styles from './Dashboard.module.css'

const MOCK_WORKERS = [
  { name: '이준호', zone: 'B구역 3층 계단', state: 'FALLEN',  lastSeen: '10초 전',  risk: '매우 높음', riskLevel: 'very-high' },
  { name: '김민수', zone: 'A구역 2층',      state: 'NORMAL',  lastSeen: '30초 전',  risk: '낮음',     riskLevel: 'low' },
  { name: '박재현', zone: 'C구역 옥상',     state: 'FALLING', lastSeen: '1분 전',   risk: '보통',     riskLevel: 'medium' },
  { name: '최성훈', zone: 'A구역 1층',      state: 'NORMAL',  lastSeen: '45초 전',  risk: '낮음',     riskLevel: 'low' },
  { name: '정대호', zone: 'D구역 4층',      state: 'FALLING', lastSeen: '2분 전',   risk: '높음',     riskLevel: 'high' },
]

const MOCK_EVENTS = [
  { time: '10:24:15', worker: '이준호', zone: 'B구역 3층 계단', type: '추락 감지', risk: '매우 높음', riskLevel: 'very-high', status: '대응중' },
  { time: '09:47:02', worker: '정대호', zone: 'D구역 4층',      type: '심박수 이상', risk: '높음',    riskLevel: 'high',      status: '처리완료' },
  { time: '08:33:41', worker: '박재현', zone: 'C구역 옥상',     type: '경사 위험',  risk: '보통',    riskLevel: 'medium',    status: '처리완료' },
]

const RISK_COLOR = { 'very-high': '#e53935', high: '#ff9800', medium: '#f59e0b', low: '#43a047' }
const RISK_BG    = { 'very-high': '#ffe0e0', high: '#fff0d0', medium: '#fffbe6', low: '#e8f5e9' }
const STATE_LABEL = { FALLEN: '추락 감지', FALLING: '주의', NORMAL: '정상' }
const STATE_COLOR = { FALLEN: '#e53935', FALLING: '#ff9800', NORMAL: '#43a047' }

export default function Dashboard() {
  const navigate = useNavigate()
  const [liveData, setLiveData]     = useState({})
  const [alerts, setAlerts]         = useState([])
  const [connected, setConnected]   = useState(false)

  useEffect(() => {
    async function fetch() {
      try {
        const [list, alertList] = await Promise.all([getHelmetStatusList(), getFallAlerts()])
        const map = {}
        list.forEach((item) => { map[item.deviceId] = item })
        setLiveData(map)
        setAlerts([...alertList].sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt)))
        setConnected(true)
      } catch { setConnected(false) }
    }
    fetch()
    const id = setInterval(fetch, 5000)
    return () => clearInterval(id)
  }, [])

  const latestAlert = alerts[0]

  const totalWorkers  = 128
  const normalCount   = 102
  const cautionCount  = 17
  const fallenCount   = alerts.length > 0 ? 1 : 0
  const unconfirmed   = 8

  return (
    <div className={styles.page}>
      {/* 헤더 */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>관리자 대시보드</h1>
          <p className={styles.subtitle}>현장의 작업자 안전 상태를 실시간으로 모니터링하고 관리합니다.</p>
        </div>
        <span className={styles.liveBadge} style={{ color: connected ? '#43a047' : '#aaa', background: connected ? '#d4f5e2' : '#f0f2f7' }}>
          {connected ? '🟢 실시간 연동 중' : '⚪ 서버 연결 대기'}
        </span>
      </div>

      {/* 통계 카드 5개 */}
      <div className={styles.statRow}>
        <StatCard icon="👥" iconBg="#e8f0fe" label="전체 작업자"  value={totalWorkers} unit="명" />
        <StatCard icon="✅" iconBg="#d4f5e2" label="정상 상태"    value={normalCount}  unit="명" accent="#43a047" />
        <StatCard icon="⚠️" iconBg="#fff0d0" label="주의 필요"    value={cautionCount} unit="명" accent="#ff9800" />
        <StatCard icon="🚨" iconBg="#ffe0e0" label="추락 사고"    value={fallenCount}  unit="명" accent="#e53935" />
        <StatCard icon="🔔" iconBg="#f0f0ff" label="미확인 알림"  value={unconfirmed}  unit="건" accent="#7c3aed" />
      </div>

      {/* 메인 레이아웃 */}
      <div className={styles.mainGrid}>
        {/* 왼쪽 */}
        <div className={styles.leftCol}>
          {/* 실시간 작업자 현황 */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>실시간 작업자 현황</span>
              <span className={styles.liveTag}>● 실시간</span>
            </div>
            <table className={styles.table}>
              <colgroup>
                <col style={{ width: '13%' }} /><col style={{ width: '22%' }} />
                <col style={{ width: '14%' }} /><col style={{ width: '14%' }} />
                <col style={{ width: '14%' }} /><col style={{ width: '10%' }} />
              </colgroup>
              <thead>
                <tr>{['작업자명','위치','안전 상태','마지막 통신','위험도','상세보기'].map((h) => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {MOCK_WORKERS.map((w, i) => (
                  <tr key={i} className={w.state === 'FALLEN' ? styles.dangerRow : ''}>
                    <td className={styles.workerName} style={{ color: w.state === 'FALLEN' ? '#e53935' : '#1a2340' }}>{w.name}</td>
                    <td style={{ color: w.state === 'FALLEN' ? '#e53935' : '#333' }}>{w.zone}</td>
                    <td><span className={styles.stateBadge} style={{ background: STATE_COLOR[w.state] + '22', color: STATE_COLOR[w.state] }}>{STATE_LABEL[w.state]}</span></td>
                    <td className={styles.muted}>{w.lastSeen}</td>
                    <td><span className={styles.riskBadge} style={{ background: RISK_BG[w.riskLevel], color: RISK_COLOR[w.riskLevel] }}>{w.risk}</span></td>
                    <td><button className={styles.viewBtn} onClick={() => navigate('/monitoring/status')}>보기 &rsaquo;</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 최근 위험 이벤트 */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>최근 위험 이벤트</span>
            </div>
            <table className={styles.table}>
              <colgroup>
                <col style={{ width: '13%' }} /><col style={{ width: '10%' }} />
                <col style={{ width: '22%' }} /><col style={{ width: '15%' }} />
                <col style={{ width: '14%' }} /><col style={{ width: '12%' }} />
              </colgroup>
              <thead>
                <tr>{['발생 시간','작업자','위치','유형','위험도','상태'].map((h) => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {MOCK_EVENTS.map((e, i) => (
                  <tr key={i}>
                    <td className={styles.muted} style={{ color: i === 0 ? '#e53935' : '#555', fontWeight: i === 0 ? 700 : 400 }}>{e.time}</td>
                    <td className={styles.workerName} style={{ color: i === 0 ? '#e53935' : '#1a2340' }}>{e.worker}</td>
                    <td style={{ color: i === 0 ? '#e53935' : '#333' }}>{e.zone}</td>
                    <td style={{ color: i === 0 ? '#e53935' : '#333', fontWeight: i === 0 ? 700 : 400 }}>{e.type}</td>
                    <td><span className={styles.riskBadge} style={{ background: RISK_BG[e.riskLevel], color: RISK_COLOR[e.riskLevel] }}>{e.risk}</span></td>
                    <td><span className={styles.statusBadge} style={{ background: e.status === '대응중' ? '#ffe0e0' : '#e8f5e9', color: e.status === '대응중' ? '#c62828' : '#2e7d32' }}>{e.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 오른쪽 */}
        <div className={styles.rightCol}>
          {/* 긴급 추락 사고 알림 */}
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
                    ['발생 시간', new Date(latestAlert.recordedAt).toLocaleString('ko-KR')],
                  ].map(([k, v]) => (
                    <div key={k} className={styles.emergencyRow}>
                      <span className={styles.emergencyKey}>{k}</span>
                      <span className={styles.emergencyVal}>{v}</span>
                    </div>
                  ))}
                </div>
                <button className={styles.emergencyBtn} onClick={() => navigate('/accident')}>사고 상세 보기</button>
                <button className={styles.emergencyBtn2}>주변 작업자 알림</button>
              </>
            ) : (
              <div className={styles.noAlert}>현재 긴급 알림이 없습니다</div>
            )}
          </div>

          {/* AI 안전 분석 요약 */}
          <div className={styles.aiCard}>
            <div className={styles.aiHeader}>
              <span className={styles.aiIcon}>🔵</span>
              AI 안전 분석 요약
            </div>
            <div className={styles.aiRow}>
              <span className={styles.aiLabel}>전체 위험 점수</span>
              <span className={styles.aiVal}>86/100</span>
            </div>
            <div className={styles.aiBar}><div className={styles.aiBarFill} style={{ width: '86%' }} /></div>
            <div className={styles.aiRow}>
              <span className={styles.aiLabel}>안전 준수율</span>
              <span className={styles.aiVal} style={{ color: '#43a047' }}>91.8%</span>
            </div>
            <div className={styles.aiBar} style={{ background: '#e8f5e9' }}><div className={styles.aiBarFill} style={{ width: '91.8%', background: '#43a047' }} /></div>
            <div className={styles.aiRow}>
              <span className={styles.aiLabel}>평균 대응 시간</span>
              <span className={styles.aiVal} style={{ color: '#4a7cdc' }}>02:38</span>
            </div>
            <div className={styles.aiBar} style={{ background: '#e0edff' }}><div className={styles.aiBarFill} style={{ width: '44%', background: '#4a7cdc' }} /></div>
            <div className={styles.aiNotice}>
              ⚠ AI 권고 사항<br />
              <span>B구역 3층 계단 즉시 접근 통제 및 추가 안전 점검이 필요합니다.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, iconBg, label, value, unit, accent }) {
  return (
    <div className={styles.statCard} style={accent ? { borderTop: `3px solid ${accent}` } : {}}>
      <div className={styles.statIcon} style={{ background: iconBg }}>{icon}</div>
      <div>
        <div className={styles.statLabel}>{label}</div>
        <div className={styles.statValue}>
          <span className={styles.statNum} style={accent ? { color: accent } : {}}>{value}</span>
          <span className={styles.statUnit}>{unit}</span>
        </div>
      </div>
    </div>
  )
}
