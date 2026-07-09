import styles from './Statistics.module.css'

const RISK_FACTORS = [
  { label: 'B구역 3층 계단 고위험', value: 94, color: '#e53935' },
  { label: '고온 환경 (38도 이상)',  value: 76, color: '#ff5722' },
  { label: '피로 누적 지수 상승',    value: 68, color: '#ff9800' },
  { label: '강풍 주의보 (풍속 9m/s)', value: 55, color: '#ffc107' },
  { label: '작업 집중도 저하',       value: 42, color: '#4a7cdc' },
]

const WORKER_RANK = [
  { rank: 1, name: '이준호', zone: 'B구역 3층', score: 98, risk: '매우 높음', riskColor: '#e53935' },
  { rank: 2, name: '정대호', zone: 'D구역 4층', score: 72, risk: '높음',     riskColor: '#ff9800' },
  { rank: 3, name: '박재현', zone: 'C구역 옥상', score: 54, risk: '보통',    riskColor: '#f59e0b' },
  { rank: 4, name: '최성훈', zone: 'B구역 2층', score: 48, risk: '보통',     riskColor: '#f59e0b' },
  { rank: 5, name: '김태영', zone: 'A구역 3층', score: 33, risk: '낮음',     riskColor: '#43a047' },
]

const AI_ACTIONS = [
  { color: '#e53935', title: '고위험 구역 즉시 점검', desc: 'B구역 3층 계단 즉각 접근 통제 및 안전 점검 실시' },
  { color: '#ff9800', title: '작업자 안전 교육 강화', desc: '고위험 작업자 15명 대상 즉시 안전 교육 시행' },
  { color: '#43a047', title: '안전 장비 착용 확인',   desc: '전 작업자 안전모·안전벨트 착용 상태 전수 점검' },
]

const ZONES = ['A구역','B구역','C구역','D구역','E구역','F구역']
const ZONE_VALS = [30, 94, 52, 68, 35, 58]
const ZONE_MAX = 100

const TREND_PTS = [22,28,35,42,50,60,72,80,86]
const TREND_TIMES = ['06:00','07:00','08:00','09:00','09:30','09:47','10:00','10:12','10:24']

function BarChart() {
  const w = 320, h = 120, barW = 32, gap = (w - ZONES.length * barW) / (ZONES.length + 1)
  const colors = ZONE_VALS.map((v) => v >= 80 ? '#e53935' : v >= 60 ? '#ff9800' : '#43a047')
  return (
    <svg viewBox={`0 0 ${w} ${h + 24}`} width="100%" height={h + 24}>
      {ZONES.map((z, i) => {
        const x = gap + i * (barW + gap)
        const barH = (ZONE_VALS[i] / ZONE_MAX) * h
        return (
          <g key={z}>
            <rect x={x} y={h - barH} width={barW} height={barH} fill={colors[i]} rx={4} />
            <text x={x + barW / 2} y={h + 16} textAnchor="middle" fontSize={11} fill="#888">{z}</text>
          </g>
        )
      })}
    </svg>
  )
}

function TrendLine() {
  const w = 320, h = 100
  const xs = TREND_PTS.map((_, i) => (i / (TREND_PTS.length - 1)) * w)
  const min = Math.min(...TREND_PTS), max = Math.max(...TREND_PTS)
  const ys = TREND_PTS.map((v) => h - ((v - min) / (max - min)) * (h - 12) - 6)
  const path = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x},${ys[i]}`).join(' ')
  const fill = `${path} L${w},${h} L0,${h} Z`
  return (
    <svg viewBox={`0 0 ${w} ${h + 24}`} width="100%" height={h + 24}>
      <defs>
        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e53935" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#e53935" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={fill} fill="url(#trendGrad)" />
      <path d={path} fill="none" stroke="#e53935" strokeWidth="2" strokeLinejoin="round" />
      {xs.map((x, i) => (
        <g key={i}>
          <circle cx={x} cy={ys[i]} r={3} fill="#e53935" />
          <text x={x} y={h + 16} textAnchor="middle" fontSize={9} fill="#aaa">{TREND_TIMES[i]}</text>
        </g>
      ))}
    </svg>
  )
}

function DonutChart() {
  const r = 56, stroke = 22, c = 2 * Math.PI * r
  const segs = [
    { color: '#43a047', pct: 0.695 },
    { color: '#ff9800', pct: 0.109 },
    { color: '#e53935', pct: 0.016 },
    { color: '#ccc',    pct: 0.18  },
  ]
  let offset = 0
  return (
    <svg width={148} height={148} viewBox="0 0 148 148">
      {segs.map((s, i) => {
        const el = (
          <circle key={i} cx={74} cy={74} r={r} fill="none" stroke={s.color} strokeWidth={stroke}
            strokeDasharray={`${s.pct * c} ${c}`}
            strokeDashoffset={-offset * c}
            transform="rotate(-90 74 74)" />
        )
        offset += s.pct
        return el
      })}
      <text x={74} y={70} textAnchor="middle" fontSize={10} fill="#888">전체 위험</text>
      <text x={74} y={88} textAnchor="middle" fontSize={18} fontWeight={800} fill="#1a2340">86/100</text>
    </svg>
  )
}

export default function Statistics() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>위험도 현황</h1>
          <p className={styles.subtitle}>현장 전반의 위험도 분석 및 AI 예측 결과를 확인합니다.</p>
        </div>
      </div>

      <div className={styles.statRow}>
        {[
          { icon: '⚠️', bg: '#ffe0e0', label: '전체 위험 점수',  value: '86/100', accent: '#e53935' },
          { icon: '👷', bg: '#fff0d0', label: '고위험 작업자',    value: '15명',   accent: '#ff9800' },
          { icon: '📍', bg: '#e0edff', label: '위험 구역 수',     value: '8개',    accent: '#4a7cdc' },
          { icon: '🔔', bg: '#f0f0ff', label: '오늘 위험 경고',   value: '23건',   accent: '#7c3aed' },
          { icon: '✅', bg: '#d4f5e2', label: '안전 준수율',      value: '91.8%',  accent: '#43a047' },
        ].map((c) => (
          <div key={c.label} className={styles.statCard} style={{ borderTop: `3px solid ${c.accent}` }}>
            <div className={styles.statIcon} style={{ background: c.bg }}>{c.icon}</div>
            <div>
              <div className={styles.statLabel}>{c.label}</div>
              <div className={styles.statNum} style={{ color: c.accent }}>{c.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.threeGrid}>
        <div className={styles.card} style={{ padding: '18px 20px' }}>
          <div className={styles.cardTitle}>실시간 위험도 분포</div>
          <div className={styles.donutWrap}>
            <DonutChart />
            <div className={styles.donutLegend}>
              {[
                { label: '낮음',   count: 89, color: '#43a047' },
                { label: '보통',   count: 23, color: '#ff9800' },
                { label: '높음',   count: 14, color: '#e53935' },
                { label: '매우 높음', count: 2, color: '#b71c1c' },
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

        <div className={styles.card} style={{ padding: '18px 20px' }}>
          <div className={styles.cardTitle}>구역별 위험도</div>
          <BarChart />
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}><span className={styles.cardTitle}>작업자 위험도 순위</span></div>
          <table className={styles.table}>
            <thead><tr>{['순위','작업자','구역','점수','위험도'].map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {WORKER_RANK.map((w) => (
                <tr key={w.rank}>
                  <td className={w.rank === 1 ? styles.rank1 : styles.rankNum}>#{w.rank}</td>
                  <td className={styles.workerName} style={{ color: w.rank === 1 ? '#e53935' : '#1a2340' }}>{w.name}</td>
                  <td className={styles.muted}>{w.zone}</td>
                  <td className={styles.scoreNum} style={{ color: w.rank === 1 ? '#e53935' : '#1a2340' }}>{w.score}</td>
                  <td><span className={styles.riskBadge} style={{ background: w.riskColor + '22', color: w.riskColor }}>{w.risk}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.threeGrid}>
        <div className={styles.card} style={{ padding: '18px 20px' }}>
          <div className={styles.cardTitle}>AI 예측 위험 분석 (오늘)</div>
          <TrendLine />
        </div>

        <div className={styles.card} style={{ padding: '18px 20px' }}>
          <div className={styles.cardTitle} style={{ marginBottom: 14 }}>주요 위험 예측 요인</div>
          {RISK_FACTORS.map((f) => (
            <div key={f.label} className={styles.factorRow}>
              <div className={styles.factorLabel}>{f.label}</div>
              <div className={styles.factorBarWrap}>
                <div className={styles.factorBarFill} style={{ width: `${f.value}%`, background: f.color }} />
              </div>
              <span className={styles.factorVal} style={{ color: f.color }}>{f.value}</span>
            </div>
          ))}
        </div>

        <div className={styles.card} style={{ padding: '18px 20px' }}>
          <div className={styles.cardTitle} style={{ marginBottom: 14 }}>AI 추천 조치 사항</div>
          {AI_ACTIONS.map((a, i) => (
            <div key={i} className={styles.actionItem}>
              <div className={styles.actionDot} style={{ background: a.color }} />
              <div>
                <div className={styles.actionTitle} style={{ color: a.color }}>{a.title}</div>
                <div className={styles.actionDesc}>{a.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}