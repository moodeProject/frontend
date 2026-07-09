import { useState, useMemo, useEffect } from 'react'
import { getHelmetStatusList } from '../api/monitoring'
import styles from './MonitoringStatus.module.css'

const HELMET_IDS = ['HELMET-001','HELMET-002','HELMET-003','HELMET-004','HELMET-005','HELMET-006']
const STATE_TO_STATUS = { NORMAL: 'normal', FALLING: 'caution', FALLEN: 'emergency' }

const MOCK_DETAIL = {
  'HELMET-001': { name: '이준호', team: '건설1팀', id: 'W-1024', zone: 'B구역 3층 계단', bpm: null, risk: '매우 높음', riskLevel: 'very-high', wearing: '착용 중' },
  'HELMET-002': { name: '김민수', team: '건설2팀', id: 'W-1915', zone: 'A구역 2층',      bpm: 72,   risk: '낮음',     riskLevel: 'low',       wearing: '착용 중' },
  'HELMET-003': { name: '박재현', team: '안전팀',  id: 'W-1008', zone: 'C구역 옥상',     bpm: 98,   risk: '보통',     riskLevel: 'medium',    wearing: '착용 중' },
  'HELMET-004': { name: '최성훈', team: '건설1팀', id: 'W-1031', zone: 'A구역 1층',      bpm: 68,   risk: '낮음',     riskLevel: 'low',       wearing: '착용 중' },
  'HELMET-005': { name: '정대호', team: '건설3팀', id: 'W-1042', zone: 'D구역 4층',      bpm: 105,  risk: '높음',     riskLevel: 'high',      wearing: '착용 중' },
  'HELMET-006': { name: '한상민', team: '시설팀',  id: 'W-1058', zone: '-',              bpm: null, risk: '낮음',     riskLevel: 'low',       wearing: '미착용' },
}

const RISK_COLOR = { 'very-high': '#e53935', high: '#ff9800', medium: '#f59e0b', low: '#43a047' }
const RISK_BG    = { 'very-high': '#ffe0e0', high: '#fff0d0', medium: '#fffbe6', low: '#e8f5e9' }
const STATUS_LABEL = { emergency: '추락 감지', caution: '주의', normal: '정상' }
const STATUS_COLOR = { emergency: '#e53935',   caution: '#ff9800', normal: '#43a047' }

const RECENT_CHANGES = [
  { name: '이준호', to: '추락 감지', time: '10:24', toColor: '#e53935' },
  { name: '정대호', to: '주의',      time: '09:47', toColor: '#ff9800' },
  { name: '박재현', to: '정상',      time: '09:12', toColor: '#43a047' },
  { name: '한상민', to: '오프라인',  time: '08:59', toColor: '#888' },
]

function DonutChart({ normal, caution, emergency, total }) {
  const r = 60, stroke = 24, circumference = 2 * Math.PI * r
  const np = total ? normal    / total : 0
  const cp = total ? caution   / total : 0
  const ep = total ? emergency / total : 0
  const rest = Math.max(0, 1 - np - cp - ep)
  const segments = [
    { color: '#43a047', pct: np,   offset: 0 },
    { color: '#ff9800', pct: cp,   offset: np },
    { color: '#e53935', pct: ep,   offset: np + cp },
    { color: '#e0e0e0', pct: rest, offset: np + cp + ep },
  ]
  return (
    <svg width={160} height={160} viewBox="0 0 160 160">
      {segments.map((s, i) => (
        <circle key={i} cx={80} cy={80} r={r} fill="none" stroke={s.color} strokeWidth={stroke}
          strokeDasharray={`${s.pct * circumference} ${circumference}`}
          strokeDashoffset={-s.offset * circumference}
          transform="rotate(-90 80 80)" />
      ))}
      <text x={80} y={74} textAnchor="middle" fontSize={11} fill="#888">전체</text>
      <text x={80} y={94} textAnchor="middle" fontSize={20} fontWeight={800} fill="#1a2340">{total}명</text>
    </svg>
  )
}

export default function MonitoringStatus() {
  const [liveData, setLiveData]   = useState({})
  const [connected, setConnected] = useState(false)
  const [search, setSearch]       = useState('')
  const [filterStatus, setFilterStatus] = useState('전체 상태')

  useEffect(() => {
    async function fetchData() {
      try {
        const list = await getHelmetStatusList()
        const map = {}
        list.forEach((item) => { map[item.deviceId] = item })
        setLiveData(map)
        setConnected(true)
      } catch { setConnected(false) }
    }
    fetchData()
    const id = setInterval(fetchData, 5000)
    return () => clearInterval(id)
  }, [])

  const workers = useMemo(() => HELMET_IDS.map((hid) => {
    const live   = liveData[hid]
    const detail = MOCK_DETAIL[hid] ?? { name: '-', team: '-', id: '-', zone: '-', bpm: null, risk: '낮음', riskLevel: 'low', wearing: '-' }
    const status = live ? (STATE_TO_STATUS[live.state] ?? null) : null
    return { hid, ...detail, status, lastSeen: live ? new Date(live.recordedAt).toLocaleTimeString('ko-KR', { hour12: false }) : '-' }
  }), [liveData])

  const stats = useMemo(() => {
    let normal = 0, caution = 0, emergency = 0
    workers.forEach((w) => {
      if (w.status === 'normal') normal++
      else if (w.status === 'caution') caution++
      else if (w.status === 'emergency') emergency++
    })
    return { normal, caution, emergency }
  }, [workers])

  const filtered = workers.filter((w) => {
    const matchSearch = !search || w.name.includes(search) || w.hid.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === '전체 상태' ||
      (filterStatus === '정상' && w.status === 'normal') ||
      (filterStatus === '주의' && w.status === 'caution') ||
      (filterStatus === '위험' && w.status === 'emergency')
    return matchSearch && matchStatus
  })

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>작업자 상태 리스트</h1>
          <p className={styles.subtitle}>전체 작업자의 실시간 상태와 위험도를 확인합니다.</p>
        </div>
        <span className={styles.liveBadge} style={{ color: connected ? '#43a047' : '#aaa', background: connected ? '#d4f5e2' : '#f0f2f7' }}>
          {connected ? '🟢 실시간 연동 중' : '⚪ 서버 연결 대기'}
        </span>
      </div>

      <div className={styles.filterBar}>
        <select className={styles.select}><option>전체 구역</option><option>A구역</option><option>B구역</option><option>C구역</option></select>
        <select className={styles.select} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          {['전체 상태','정상','주의','위험'].map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className={styles.select}><option>전체 위험도</option><option>낮음</option><option>보통</option><option>높음</option><option>매우 높음</option></select>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>🔍</span>
          <input className={styles.searchInput} placeholder="작업자명 / ID 검색" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className={styles.resetBtn} onClick={() => { setSearch(''); setFilterStatus('전체 상태') }}>↺ 초기화</button>
        <button className={styles.refreshBtn} onClick={() => window.location.reload()}>↺ 새로고침</button>
      </div>

      <div className={styles.statRow}>
        {[
          { icon: '👥', bg: '#e8f0fe', label: '전체 작업자', value: 128,              unit: '명' },
          { icon: '✅', bg: '#d4f5e2', label: '정상',         value: stats.normal,    unit: '명', accent: '#43a047' },
          { icon: '⚠️', bg: '#fff0d0', label: '주의',         value: stats.caution,   unit: '명', accent: '#ff9800' },
          { icon: '🚨', bg: '#ffe0e0', label: '위험',         value: stats.emergency, unit: '명', accent: '#e53935' },
          { icon: '📴', bg: '#f0f2f7', label: '오프라인',     value: 8,               unit: '명', accent: '#888' },
        ].map((c) => (
          <div key={c.label} className={styles.statCard} style={c.accent ? { borderTop: `3px solid ${c.accent}` } : {}}>
            <div className={styles.statIcon} style={{ background: c.bg }}>{c.icon}</div>
            <div>
              <div className={styles.statLabel}>{c.label}</div>
              <div className={styles.statValue}>
                <span className={styles.statNum} style={c.accent ? { color: c.accent } : {}}>{c.value}</span>
                <span className={styles.statUnit}>{c.unit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.mainGrid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}><span className={styles.cardTitle}>작업자 상태 리스트</span></div>
          <table className={styles.table}>
            <thead><tr>{['작업자명','소속/ID','위치','현재 상태','심박수','마지막 측정','위험도','착용','상세'].map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map((w) => (
                <tr key={w.hid} className={w.status === 'emergency' ? styles.dangerRow : ''}>
                  <td>
                    <div className={styles.workerCell}>
                      <div className={styles.avatar}>{w.name[0]}</div>
                      <div>
                        <div className={styles.workerName} style={{ color: w.status === 'emergency' ? '#e53935' : '#1a2340' }}>{w.name}</div>
                        <div className={styles.workerSub}>{w.hid}</div>
                      </div>
                    </div>
                  </td>
                  <td><div className={styles.workerName}>{w.team}</div><div className={styles.workerSub}>{w.id}</div></td>
                  <td style={{ color: w.status === 'emergency' ? '#e53935' : '#333' }}>{w.zone}</td>
                  <td>
                    <span className={styles.stateBadge} style={{ background: w.status ? STATUS_COLOR[w.status] + '22' : '#f0f2f7', color: w.status ? STATUS_COLOR[w.status] : '#888' }}>
                      {w.status ? STATUS_LABEL[w.status] : '오프라인'}
                    </span>
                  </td>
                  <td>{w.bpm != null ? `${w.bpm} bpm` : '-'}</td>
                  <td className={styles.muted}>{w.lastSeen}</td>
                  <td><span className={styles.riskBadge} style={{ background: RISK_BG[w.riskLevel], color: RISK_COLOR[w.riskLevel] }}>{w.risk}</span></td>
                  <td><span className={styles.stateBadge} style={{ background: w.wearing === '착용 중' ? '#e8f5e9' : '#ffe0e0', color: w.wearing === '착용 중' ? '#2e7d32' : '#c62828' }}>{w.wearing}</span></td>
                  <td><button className={styles.viewBtn}>보기 &rsaquo;</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.rightCol}>
          <div className={styles.card} style={{ padding: '18px 20px' }}>
            <div className={styles.cardTitle} style={{ marginBottom: 16 }}>실시간 상태 분포</div>
            <div className={styles.donutWrap}>
              <DonutChart normal={stats.normal} caution={stats.caution} emergency={stats.emergency} total={workers.length} />
              <div className={styles.donutLegend}>
                {[
                  { label: '정상',     count: stats.normal,    color: '#43a047' },
                  { label: '주의',     count: stats.caution,   color: '#ff9800' },
                  { label: '위험',     count: stats.emergency, color: '#e53935' },
                  { label: '오프라인', count: 8,               color: '#ccc' },
                ].map((l) => (
                  <div key={l.label} className={styles.legendRow}>
                    <span className={styles.legendDot} style={{ background: l.color }} />
                    <span className={styles.legendLabel}>{l.label}</span>
                    <span className={styles.legendCount}>{l.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className={styles.card} style={{ padding: '18px 20px', flex: 1 }}>
            <div className={styles.cardTitle} style={{ marginBottom: 14 }}>최근 상태 변경</div>
            {RECENT_CHANGES.map((c, i) => (
              <div key={i} className={styles.changeRow}>
                <div>
                  <div className={styles.workerName}>{c.name}</div>
                  <div className={styles.changeStatus}>정상 → <span style={{ color: c.toColor, fontWeight: 700 }}>{c.to}</span></div>
                </div>
                <span className={styles.changeTime}>{c.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}