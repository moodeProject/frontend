import { useNavigate } from 'react-router-dom'
import {
  MONITORING_STATS, MONITOR_PINS, MONITOR_STATUS_LIST,
} from '../data/mockMonitoring'
import styles from './Monitoring.module.css'

const STATUS_COLOR = {
  emergency: '#e53935',
  danger:    '#ff9800',
  normal:    '#43a047',
  waiting:   '#90a4ae',
  resting:   '#78909c',
}
const STATUS_LABEL = {
  emergency: '긴급',
  danger:    '주의',
  normal:    '정상',
  waiting:   '대기',
  resting:   '휴식',
}
const EVENT_DOT = { danger: '#e53935', warning: '#ff9800' }

function StatCard({ icon, iconBg, label, value, unit, accent }) {
  return (
    <div className={styles.statCard} style={accent ? { borderLeft: `4px solid ${accent}` } : {}}>
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

export default function Monitoring() {
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      {/* 상단 */}
      <div className={styles.topBar}>
        <div>
          <h1 className={styles.title}>실시간 모니터링</h1>
          <p className={styles.subtitle}>현장 작업자의 실시간 상태를 모니터링합니다.</p>
        </div>
        <button className={styles.refresh} onClick={() => window.location.reload()}>↺ 새로고침</button>
      </div>

      {/* 요약 카드 */}
      <div className={styles.statRow}>
        <StatCard icon="👥" iconBg="#ddeeff" label="전체 작업자"  value={MONITORING_STATS.total}     unit="명" />
        <StatCard icon="✅" iconBg="#d4f5e2" label="정상 작업자"  value={MONITORING_STATS.normal}    unit="명" accent="#43a047" />
        <StatCard icon="⚠️" iconBg="#fff0d0" label="주의 작업자"  value={MONITORING_STATS.danger}    unit="명" accent="#ff9800" />
        <StatCard icon="🚨" iconBg="#ffe0e8" label="긴급 작업자"  value={MONITORING_STATS.emergency} unit="명" accent="#e53935" />
      </div>

      {/* 지도 + 상태 목록 */}
      <div className={styles.mainRow}>
        {/* 작업자 위치 지도 */}
        <div className={styles.mapCard}>
          <div className={styles.cardHeader}>
            <span>📍 작업자 위치 지도</span>
            <div className={styles.headerRight}>
              <div className={styles.legend}>
                <span className={styles.legendItem}><span className={styles.dot} style={{ background: '#e53935' }} />긴급</span>
                <span className={styles.legendItem}><span className={styles.dot} style={{ background: '#ff9800' }} />주의</span>
                <span className={styles.legendItem}><span className={styles.dot} style={{ background: '#43a047' }} />정상</span>
              </div>
              <button className={styles.viewAll} onClick={() => navigate('/monitoring/map')}>전체보기 →</button>
            </div>
          </div>

          <div className={styles.mapArea}>
            {/* SVG 현장 구역 */}
            <svg className={styles.mapSvg} viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* 구역 폴리곤 */}
              <polygon points="10,10 45,10 45,50 10,50" fill="rgba(74,124,220,0.12)" stroke="rgba(74,124,220,0.4)" strokeWidth="0.5" />
              <polygon points="50,10 90,10 90,45 50,45" fill="rgba(74,124,220,0.12)" stroke="rgba(74,124,220,0.4)" strokeWidth="0.5" />
              <polygon points="10,55 45,55 45,90 10,90" fill="rgba(74,124,220,0.12)" stroke="rgba(74,124,220,0.4)" strokeWidth="0.5" />
              <polygon points="50,50 90,50 90,90 50,90" fill="rgba(74,124,220,0.12)" stroke="rgba(74,124,220,0.4)" strokeWidth="0.5" />
              <text x="27" y="30" textAnchor="middle" fontSize="4" fill="rgba(150,180,255,0.6)">A구역</text>
              <text x="70" y="28" textAnchor="middle" fontSize="4" fill="rgba(150,180,255,0.6)">B구역</text>
              <text x="27" y="72" textAnchor="middle" fontSize="4" fill="rgba(150,180,255,0.6)">C구역</text>
              <text x="70" y="70" textAnchor="middle" fontSize="4" fill="rgba(150,180,255,0.6)">D구역</text>
            </svg>

            {/* 작업자 핀 */}
            {MONITOR_PINS.map((pin) => (
              <div
                key={pin.id}
                className={styles.pin}
                style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                title={`${pin.name} (${pin.employeeId})`}
              >
                <div className={styles.pinLabel}>{pin.name}</div>
                <div
                  className={styles.pinMarker}
                  style={{
                    background: STATUS_COLOR[pin.status],
                    boxShadow: pin.status === 'emergency'
                      ? `0 0 0 3px rgba(229,57,53,0.35), 0 0 10px rgba(229,57,53,0.5)`
                      : `0 0 0 2px ${STATUS_COLOR[pin.status]}55`,
                  }}
                >
                  {pin.name[0]}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 작업자 상태 목록 */}
        <div className={styles.statusCard}>
          <div className={styles.cardHeader}>
            <span>👷 작업자 상태</span>
            <button className={styles.viewAll} onClick={() => navigate('/monitoring/status')}>전체보기 →</button>
          </div>
          <div className={styles.statusList}>
            {MONITOR_STATUS_LIST.map((w) => (
              <div
                key={w.id}
                className={styles.workerRow}
                style={{ borderLeft: `4px solid ${STATUS_COLOR[w.status] ?? '#ccc'}` }}
              >
                <div className={styles.workerAvatar} style={{ background: STATUS_COLOR[w.status] + '33' }}>
                  {w.name[0]}
                </div>
                <div className={styles.workerInfo}>
                  <div className={styles.workerName}>
                    {w.name}
                    <span className={styles.workerZone}>{w.zone}</span>
                  </div>
                  <div className={styles.workerSub}>
                    <span className={styles.heartRate}>❤️ {w.heartRate} bpm</span>
                    {w.eventLevel && (
                      <span className={styles.eventDot} style={{ background: EVENT_DOT[w.eventLevel] }} />
                    )}
                    <span className={styles.eventText}>{w.event}</span>
                  </div>
                </div>
                <div className={styles.workerRight}>
                  <span
                    className={styles.statusBadge}
                    style={{
                      background: STATUS_COLOR[w.status] + '22',
                      color: STATUS_COLOR[w.status],
                      border: `1px solid ${STATUS_COLOR[w.status]}44`,
                    }}
                  >
                    {STATUS_LABEL[w.status]}
                  </span>
                  <span className={styles.workerTime}>{w.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
