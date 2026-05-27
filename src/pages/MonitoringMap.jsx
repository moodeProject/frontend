import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MONITOR_PINS, STATUS_GROUPS } from '../data/mockMonitoring'
import styles from './MonitoringMap.module.css'

const STATUS_COLOR = {
  emergency: '#e53935',
  danger:    '#ff9800',
  normal:    '#43a047',
  waiting:   '#90a4ae',
  resting:   '#78909c',
}

const ALL_ZONES   = ['전체 구역', 'A구역', 'B구역', 'C구역', 'D구역']
const ALL_STATUSES = ['전체 상태', '긴급', '주의', '정상', '대기', '휴식']

export default function MonitoringMap() {
  const navigate = useNavigate()
  const [zone, setZone]       = useState('전체 구역')
  const [status, setStatus]   = useState('전체 상태')
  const [scale, setScale]     = useState(1)
  const [openGroups, setOpenGroups] = useState({ emergency: true })

  function toggleGroup(key) {
    setOpenGroups((p) => ({ ...p, [key]: !p[key] }))
  }

  const visiblePins = MONITOR_PINS.filter((p) => {
    const matchStatus = status === '전체 상태' ||
      STATUS_GROUPS.find((g) => g.label === status)?.key === p.status
    return matchStatus
  })

  return (
    <div className={styles.page}>
      {/* 브레드크럼 */}
      <div className={styles.breadcrumb}>
        <span className={styles.breadLink} onClick={() => navigate('/monitoring')}>실시간 모니터링</span>
        <span className={styles.breadSep}>›</span>
        <span className={styles.breadCurrent}>작업자 위치 지도</span>
      </div>

      {/* 상단 필터 바 */}
      <div className={styles.filterBar}>
        <h1 className={styles.title}>작업자 위치 지도</h1>
        <div className={styles.filters}>
          <select className={styles.select} value={zone} onChange={(e) => setZone(e.target.value)}>
            {ALL_ZONES.map((z) => <option key={z}>{z}</option>)}
          </select>
          <select className={styles.select} value={status} onChange={(e) => setStatus(e.target.value)}>
            {ALL_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* 지도 + 사이드 패널 */}
      <div className={styles.mainRow}>
        {/* 지도 */}
        <div className={styles.mapCard}>
          {/* 줌 버튼 */}
          <div className={styles.zoomBtns}>
            <button className={styles.zoomBtn} onClick={() => setScale((s) => Math.min(s + 0.2, 2.5))}>＋</button>
            <button className={styles.zoomBtn} onClick={() => setScale((s) => Math.max(s - 0.2, 0.5))}>－</button>
          </div>

          <div className={styles.mapViewport}>
            <div className={styles.mapCanvas} style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}>
              {/* SVG 구역 */}
              <svg className={styles.mapSvg} viewBox="0 0 100 100" preserveAspectRatio="none">
                <polygon points="5,5 48,5 48,48 5,48"   fill="rgba(74,124,220,0.10)" stroke="rgba(100,150,255,0.4)" strokeWidth="0.4" />
                <polygon points="52,5 95,5 95,48 52,48"  fill="rgba(74,124,220,0.10)" stroke="rgba(100,150,255,0.4)" strokeWidth="0.4" />
                <polygon points="5,52 48,52 48,95 5,95"  fill="rgba(74,124,220,0.10)" stroke="rgba(100,150,255,0.4)" strokeWidth="0.4" />
                <polygon points="52,52 95,52 95,95 52,95" fill="rgba(74,124,220,0.10)" stroke="rgba(100,150,255,0.4)" strokeWidth="0.4" />
                {/* 구역 라벨 */}
                <text x="26" y="26" textAnchor="middle" fontSize="5" fill="rgba(140,175,255,0.7)" fontWeight="bold">A구역</text>
                <text x="73" y="26" textAnchor="middle" fontSize="5" fill="rgba(140,175,255,0.7)" fontWeight="bold">B구역</text>
                <text x="26" y="73" textAnchor="middle" fontSize="5" fill="rgba(140,175,255,0.7)" fontWeight="bold">C구역</text>
                <text x="73" y="73" textAnchor="middle" fontSize="5" fill="rgba(140,175,255,0.7)" fontWeight="bold">D구역</text>
                {/* 건물/시설물 */}
                <rect x="15" y="15" width="10" height="8" fill="rgba(100,130,200,0.2)" stroke="rgba(100,150,255,0.3)" strokeWidth="0.3" />
                <rect x="60" y="12" width="14" height="10" fill="rgba(100,130,200,0.2)" stroke="rgba(100,150,255,0.3)" strokeWidth="0.3" />
                <rect x="8"  y="60" width="12" height="14" fill="rgba(100,130,200,0.2)" stroke="rgba(100,150,255,0.3)" strokeWidth="0.3" />
                <rect x="62" y="58" width="16" height="12" fill="rgba(100,130,200,0.2)" stroke="rgba(100,150,255,0.3)" strokeWidth="0.3" />
              </svg>

              {/* 작업자 핀 */}
              {visiblePins.map((pin) => (
                <div
                  key={pin.id}
                  className={styles.pin}
                  style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                  title={`${pin.name} (${pin.employeeId})`}
                >
                  <div className={styles.pinLabel}>{pin.name}</div>
                  <div
                    className={`${styles.pinMarker} ${pin.status === 'emergency' ? styles.pinPulse : ''}`}
                    style={{ background: STATUS_COLOR[pin.status] }}
                  >
                    {pin.name[0]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 범례 */}
          <div className={styles.legend}>
            {Object.entries(STATUS_COLOR).map(([k, c]) => (
              <span key={k} className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: c }} />
                {STATUS_GROUPS.find((g) => g.key === k)?.label ?? k}
              </span>
            ))}
          </div>
        </div>

        {/* 사이드 아코디언 */}
        <div className={styles.sidePanel}>
          <div className={styles.sidePanelTitle}>작업자 현황</div>
          {STATUS_GROUPS.map((group) => (
            <div key={group.key} className={styles.accordionItem}>
              <button
                className={styles.accordionHeader}
                onClick={() => toggleGroup(group.key)}
                style={{ borderLeft: `4px solid ${group.color}` }}
              >
                <span className={styles.accordionIcon}>{group.icon}</span>
                <span className={styles.accordionLabel}>{group.label}</span>
                <span className={styles.accordionCount} style={{ color: group.color }}>{group.count}명</span>
                <span className={styles.accordionChevron}>{openGroups[group.key] ? '▲' : '▼'}</span>
              </button>

              {openGroups[group.key] && (
                <div className={styles.accordionBody}>
                  {group.workers.length === 0 ? (
                    <div className={styles.accordionEmpty}>표시할 작업자가 없습니다.</div>
                  ) : (
                    group.workers.map((w, i) => (
                      <div key={i} className={styles.accordionWorker}>
                        <div className={styles.accordionAvatar} style={{ background: group.color + '33', color: group.color }}>
                          {w.name[0]}
                        </div>
                        <div className={styles.accordionWorkerInfo}>
                          <div className={styles.accordionWorkerName}>{w.name}</div>
                          <div className={styles.accordionWorkerSub}>{w.zone} · ❤️ {w.heartRate} bpm</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
