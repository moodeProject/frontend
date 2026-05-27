import { useState } from 'react'
import {
  AreaChart, Area, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  STAT_CARDS, DAILY_WORK_HOURS, EVENT_TREND,
  ZONE_EVENTS_PIE, HOURLY_HEART_RATE, MONTHLY_LEFT, MONTHLY_RIGHT,
} from '../data/mockStats'
import { TEAMS } from '../data/mockWorkers'
import styles from './Statistics.module.css'

const ZONES = ['전체 구역', 'A구역', 'B구역', 'C구역', 'D구역']

// 면적 차트 커스텀 툴팁
function WorkTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipLabel}>{label}</div>
      <div className={styles.tooltipValue}>{payload[0].value}시간 작업</div>
    </div>
  )
}

// 도넛 차트 중앙 텍스트
function DonutCenter({ cx, cy }) {
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
      <tspan x={cx} dy="-6" fontSize="11" fill="#888">총</tspan>
      <tspan x={cx} dy="20" fontSize="18" fontWeight="800" fill="#1a2340">24건</tspan>
    </text>
  )
}

export default function Statistics() {
  const [dateRange] = useState('2026.05.01 ~ 2026.05.30')
  const [zone, setZone] = useState('전체 구역')
  const [team, setTeam] = useState('전체 팀')

  function handleDownload() {
    alert('다운로드 기능은 실제 API 연동 후 구현됩니다.')
  }

  return (
    <div className={styles.page}>
      {/* 상단 */}
      <div className={styles.topBar}>
        <div>
          <h1 className={styles.title}>통계 분석</h1>
          <p className={styles.subtitle}>작업 현황과 안전 데이터를 분석하여 인사이트를 제공합니다.</p>
        </div>
        <div className={styles.topRight}>
          <div className={styles.dateRange}>
            <span>{dateRange}</span>
            <span className={styles.calIcon}>📅</span>
          </div>
          <select className={styles.select} value={zone} onChange={(e) => setZone(e.target.value)}>
            {ZONES.map((z) => <option key={z}>{z}</option>)}
          </select>
          <select className={styles.select} value={team} onChange={(e) => setTeam(e.target.value)}>
            {TEAMS.map((t) => <option key={t}>{t}</option>)}
          </select>
          <button className={styles.downloadBtn} onClick={handleDownload}>⬇ 다운로드</button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className={styles.statRow}>
        {STAT_CARDS.map((c) => (
          <div key={c.label} className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: c.iconBg }}>{c.icon}</div>
            <div>
              <div className={styles.statLabel}>{c.label}</div>
              <div className={styles.statValueRow}>
                <span className={styles.statNum}>{c.value}</span>
                <span className={styles.statUnit}>{c.unit}</span>
              </div>
              <div className={`${styles.statTrend} ${c.trend === 'up' ? styles.trendUp : styles.trendDown}`}>
                {c.trend === 'up' ? '▲' : '▼'} {c.pct}
                <span className={styles.trendLabel}> 지난달 대비</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 차트 2×2 */}
      <div className={styles.chartGrid}>
        {/* 일별 작업 시간 */}
        <div className={styles.chartCard}>
          <div className={styles.chartTitle}>일별 작업 시간</div>
          <div className={styles.chartSubTitle}>(시간)</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={DAILY_WORK_HOURS} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="workGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#4a7cdc" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#4a7cdc" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f7" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#999' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#999' }} />
              <Tooltip content={<WorkTooltip />} />
              <Area type="monotone" dataKey="hours" stroke="#4a7cdc" strokeWidth={2} fill="url(#workGrad)" dot={{ r: 4, fill: '#4a7cdc' }} activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 이벤트 발생 추이 */}
        <div className={styles.chartCard}>
          <div className={styles.chartTitleRow}>
            <span className={styles.chartTitle}>이벤트 발생 추이</span>
            <div className={styles.legendRow}>
              <span className={styles.legendDot} style={{ background: '#e53935' }} /> 사고 및 낙상
              <span className={styles.legendDot} style={{ background: '#ff9800', marginLeft: 10 }} /> 건강 이상
              <span className={styles.legendDot} style={{ background: '#2196f3', marginLeft: 10 }} /> 충돌 위험
            </div>
          </div>
          <div className={styles.chartSubTitle}>(건)</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={EVENT_TREND} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f7" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#999' }} />
              <YAxis tick={{ fontSize: 11, fill: '#999' }} />
              <Tooltip />
              <Line type="monotone" dataKey="accident"  stroke="#e53935" strokeWidth={2} dot={{ r: 3 }} name="사고 및 낙상" />
              <Line type="monotone" dataKey="health"    stroke="#ff9800" strokeWidth={2} dot={{ r: 3 }} name="건강 이상" />
              <Line type="monotone" dataKey="collision" stroke="#2196f3" strokeWidth={2} dot={{ r: 3 }} name="충돌 위험" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 구역별 위험 이벤트 비율 */}
        <div className={styles.chartCard}>
          <div className={styles.chartTitle}>구역별 위험 이벤트 비율</div>
          <div className={styles.donutRow}>
            <div className={styles.donutWrap}>
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie
                    data={ZONE_EVENTS_PIE}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={82}
                    dataKey="value"
                    startAngle={90} endAngle={-270}
                    label={false}
                  >
                    {ZONE_EVENTS_PIE.map((e) => <Cell key={e.name} fill={e.color} />)}
                  </Pie>
                  <DonutCenter cx={90} cy={90} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className={styles.pieLegend}>
              {ZONE_EVENTS_PIE.map((e) => (
                <div key={e.name} className={styles.pieLegendItem}>
                  <span className={styles.pieDot} style={{ background: e.color }} />
                  <span>{e.name}</span>
                  <span className={styles.pieCount}>{e.value}건</span>
                  <span className={styles.piePct}>({e.pct})</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.insightBox}>
            <span className={styles.insightLabel}>인사이트</span>
            <span className={styles.insightText}>
              A구역에서 전체 위험 이벤트의 50%가 발생하였습니다. 해당 구역의 작업 밀도와 위험 시설 여부를 재점검 할 필요가 있습니다.
            </span>
          </div>
        </div>

        {/* 시간대별 평균 심박수 */}
        <div className={styles.chartCard}>
          <div className={styles.chartTitle}>시간대별 평균 심박수</div>
          <div className={styles.chartSubTitle}>(bpm)</div>
          <div className={styles.heartRow}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height={190}>
                <LineChart data={HOURLY_HEART_RATE} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f7" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#999' }} interval={1} />
                  <YAxis domain={[60, 115]} tick={{ fontSize: 10, fill: '#999' }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="bpm" stroke="#4a7cdc" strokeWidth={2} dot={{ r: 2 }} name="심박수" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className={styles.heartStats}>
              <div className={styles.heartStatItem} style={{ background: '#ffe0e8' }}>
                <div className={styles.heartStatLabel}>최고 심박</div>
                <div className={styles.heartStatValue}>12:00 / 104bpm</div>
              </div>
              <div className={styles.heartStatItem} style={{ background: '#e8f5e9' }}>
                <div className={styles.heartStatLabel}>최저 심박</div>
                <div className={styles.heartStatValue}>10:30 / 68bpm</div>
              </div>
              <div className={styles.heartStatItem} style={{ background: '#fff3e0' }}>
                <div className={styles.heartStatLabel}>주의 필요 시간대</div>
                <div className={styles.heartStatValue}>11:30 ~ 15:00</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 월간 안전 지표 */}
      <div className={styles.monthlyCard}>
        <div className={styles.monthlyTitle}>월간 안전 지표</div>
        <div className={styles.monthlyGrid}>
          <MonthlyTable rows={MONTHLY_LEFT} />
          <MonthlyTable rows={MONTHLY_RIGHT} />
        </div>
      </div>
    </div>
  )
}

function MonthlyTable({ rows }) {
  return (
    <table className={styles.monthlyTable}>
      <thead>
        <tr>
          {['구분','이번 달','지난 달','증감률'].map((h) => <th key={h}>{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.label} className={styles.monthlyRow}>
            <td>{r.label}</td>
            <td className={styles.bold}>{r.current}</td>
            <td>{r.prev}</td>
            <td className={r.trend === 'up' ? styles.trendUp : styles.trendDown}>
              {r.trend === 'up' ? '▲' : '▼'} {r.pct}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
