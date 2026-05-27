import { DASHBOARD_STATS, WORKER_PINS, ALERTS, WORKER_STATUS_LIST, CHART_DATA, CHART_SUMMARY } from '../data/mockDashboard'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import styles from './Dashboard.module.css'

const STATUS_COLOR = { danger: '#e53935', caution: '#ff9800', normal: '#4caf50' }
const STATUS_LABEL = { danger: '위험', caution: '주의', normal: '정상' }

const ALERT_STYLE = {
  emergency: { bg: '#ffeaea', dot: '#e53935', badge: styles.alertBadgeEmergency },
  caution:   { bg: '#fff7e6', dot: '#ff9800', badge: styles.alertBadgeCaution   },
  normal:    { bg: '#f0faf2', dot: '#4caf50', badge: styles.alertBadgeNormal    },
}

export default function Dashboard() {
  const now = new Date().toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    weekday: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit',
  })

  return (
    <div className={styles.page}>
      {/* 상단 */}
      <div className={styles.topBar}>
        <div>
          <h1 className={styles.title}>실시간 현장 현황</h1>
          <p className={styles.subtitle}>작업자 상태와 위험 상황을 한 눈에 확인하세요.</p>
        </div>
        <div className={styles.dateArea}>
          <div className={styles.dateStr}>{now}</div>
          <button className={styles.refresh} onClick={() => window.location.reload()}>↺ 새로고침</button>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className={styles.statRow}>
        <StatCard icon="👥" iconBg="#ddeeff" label="전체 작업자" value={DASHBOARD_STATS.totalWorkers} unit="명" />
        <StatCard icon="✅" iconBg="#d4f5e2" label="정상 작업자" value={DASHBOARD_STATS.normalWorkers} unit="명" />
        <StatCard icon="⚠️" iconBg="#fff0d0" label="위험 작업자" value={DASHBOARD_STATS.dangerWorkers} unit="명" />
        <StatCard icon="🚨" iconBg="#ffe0e8" label="긴급 이벤트" value={DASHBOARD_STATS.emergencyEvents} unit="건" />
      </div>

      {/* 지도 + 알림 */}
      <div className={styles.midRow}>
        {/* 현장 작업자 위치 */}
        <div className={styles.mapCard}>
          <div className={styles.cardHeader}>
            <span>📍 현장 작업자 위치</span>
            <div className={styles.legend}>
              {Object.entries(STATUS_COLOR).map(([k, c]) => (
                <span key={k} className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: c }} />
                  {STATUS_LABEL[k]}
                </span>
              ))}
            </div>
          </div>
          <div className={styles.mapArea}>
            {WORKER_PINS.map((pin) => (
              <div
                key={pin.id}
                className={styles.pin}
                style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
              >
                <div className={styles.pinLabel}>{pin.name}</div>
                <div
                  className={styles.pinMarker}
                  style={{ borderColor: STATUS_COLOR[pin.status] }}
                >
                  {pin.name[0]}
                </div>
                <div
                  className={styles.pinArrow}
                  style={{ borderTopColor: STATUS_COLOR[pin.status] }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* 실시간 알림 */}
        <div className={styles.alertCard}>
          <div className={styles.cardHeader}>
            <span>🔔 실시간 알림</span>
            <button className={styles.viewAll}>전체보기 &rsaquo;</button>
          </div>
          <div className={styles.alertList}>
            {ALERTS.map((a) => {
              const s = ALERT_STYLE[a.level]
              return (
                <div key={a.id} className={styles.alertItem} style={{ background: s.bg }}>
                  <div className={styles.alertLeft}>
                    <span className={`${styles.alertBadge} ${s.badge}`}>{a.label}</span>
                    <div>
                      <div className={styles.alertText}>{a.text}</div>
                      <div className={styles.alertMeta}>{a.zone} · {a.time}</div>
                    </div>
                  </div>
                  <button className={styles.confirmBtn}>확인</button>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 작업자 상태 목록 + 위험 이벤트 통계 */}
      <div className={styles.botRow}>
        {/* 작업자 상태 목록 */}
        <div className={styles.statusCard}>
          <div className={styles.cardHeader}>🔔 작업자 상태 목록</div>
          <table className={styles.statusTable}>
            <thead>
              <tr>
                {['작업자','구역','심박수','온도','상태','최종 업데이트'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {WORKER_STATUS_LIST.map((w) => (
                <tr key={w.id} className={styles.statusRow}>
                  <td>
                    <div className={styles.workerCell}>
                      <span className={styles.statusDot} style={{ background: STATUS_COLOR[w.status] }} />
                      {w.name}
                    </div>
                  </td>
                  <td>{w.zone}</td>
                  <td className={w.heartRate >= 100 ? styles.heartWarn : ''}>{w.heartRate} bpm</td>
                  <td>{w.temp}</td>
                  <td>{STATUS_LABEL[w.status]}</td>
                  <td>{w.lastUpdate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 위험 이벤트 통계 차트 */}
        <div className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <span>🔔 위험 이벤트 통계</span>
            <span className={styles.chartDate}>2026.05.02</span>
          </div>

          <div className={styles.chartLegend}>
            <span className={styles.legendDot} style={{ background: '#e53935' }} /> 사고 및 낙상
            <span className={styles.legendDot} style={{ background: '#ff9800', marginLeft: 12 }} /> 건강 이상
            <span className={styles.legendDot} style={{ background: '#2196f3', marginLeft: 12 }} /> 충돌 위험
          </div>

          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={CHART_DATA} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f7" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#999' }} />
              <YAxis tick={{ fontSize: 11, fill: '#999' }} />
              <Tooltip />
              <Line type="monotone" dataKey="accident" stroke="#e53935" strokeWidth={2} dot={{ r: 3 }} name="사고 및 낙상" />
              <Line type="monotone" dataKey="health"   stroke="#ff9800" strokeWidth={2} dot={{ r: 3 }} name="건강 이상" />
              <Line type="monotone" dataKey="collision" stroke="#2196f3" strokeWidth={2} dot={{ r: 3 }} name="충돌 위험" />
            </LineChart>
          </ResponsiveContainer>

          <div className={styles.chartSummary}>
            <div className={styles.summaryBox} style={{ background: '#fff5f5' }}>
              <div className={styles.summaryLabel}>사고 및 낙상</div>
              <div className={styles.summaryNum}>{CHART_SUMMARY.accident} 건</div>
            </div>
            <div className={styles.summaryBox} style={{ background: '#fffbf0' }}>
              <div className={styles.summaryLabel}>건강 이상</div>
              <div className={styles.summaryNum}>{CHART_SUMMARY.health} 건</div>
            </div>
            <div className={styles.summaryBox} style={{ background: '#f0f7ff' }}>
              <div className={styles.summaryLabel}>충돌 위험</div>
              <div className={styles.summaryNum}>{CHART_SUMMARY.collision} 건</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, iconBg, label, value, unit }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon} style={{ background: iconBg }}>{icon}</div>
      <div>
        <div className={styles.statLabel}>{label}</div>
        <div className={styles.statValue}>
          <span className={styles.statNum}>{value}</span>
          <span className={styles.statUnit}>{unit}</span>
        </div>
      </div>
    </div>
  )
}
