import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getHelmetStatusList, getFallAlerts } from '../api/monitoring'
import styles from './Dashboard.module.css'

const MOCK_ALERTS = [
  { id:1, level:'danger', type:'추락 감지',    icon:'📉', worker:'박민수', zone:'A구역 3층', time:'10:28', desc:'추락 감지 — 충격·자세 변화·움직임 없음 동시 감지.' },
  { id:2, level:'danger', type:'난간 없는 구간', icon:'⚠', worker:'박민수', zone:'A구역 3층', time:'10:26', desc:'난간 없는 구간 접근 감지 — 추락 고위험 구역.' },
  { id:3, level:'warn',   type:'피로도 이상',   icon:'💓', worker:'김현석', zone:'B구역',     time:'10:27', desc:'피로도 2단계 감지 — 휴식 권고 필요.' },
  { id:4, level:'warn',   type:'물웅덩이 감지', icon:'💧', worker:'이수진', zone:'C구역',     time:'10:24', desc:'작업 구역 내 물웅덩이 감지 — 미끄럼 위험.' },
  { id:5, level:'warn',   type:'장애물 감지',   icon:'📦', worker:'김현석', zone:'B구역',     time:'10:21', desc:'장애물(적재물) 감지 — 통로 협소, 충돌 위험.' },
  { id:6, level:'warn',   type:'열사병 위험',   icon:'🌡', worker:'정유진', zone:'B구역 1층', time:'09:55', desc:'열사병 주의 — 체온 38.1°C, 지속 관찰 필요.' },
]

const ZONES = [
  { name: 'A구역', normal: 8, warn: 1, danger: 0 },
  { name: 'B구역', normal: 5, warn: 0, danger: 1 },
  { name: 'C구역', normal: 6, warn: 2, danger: 0 },
]

const RISK_WORKERS = [
  { name: '박민수', level: 'danger', bpm: 118, zone: 'A구역 3층' },
  { name: '김현석', level: 'warn',   bpm: 92,  zone: 'B구역' },
  { name: '이수진', level: 'warn',   bpm: 78,  zone: 'C구역' },
  { name: '정유진', level: 'warn',   bpm: 88,  zone: 'B구역 1층' },
]

const WARN_CARDS = [
  { name: '김현석', zone: 'B구역', bpm: 92, fatigue: 2, status: '피로도 2단계', level: 'warn' },
  { name: '이수진', zone: 'C구역', bpm: 78, fatigue: 1, status: '물웅덩이 감지', level: 'warn' },
  { name: '정유진', zone: 'B구역 1층', bpm: 88, fatigue: 1, status: '열사병 주의', level: 'warn' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [alerts, setAlerts]         = useState([])
  const [connected, setConnected]   = useState(false)
  const [showWarnCards, setShowWarnCards] = useState(false)

  useEffect(() => {
    async function fetch() {
      try {
        const list = await getFallAlerts()
        setAlerts(list)
        setConnected(true)
      } catch { setConnected(false) }
    }
    fetch()
    const id = setInterval(fetch, 5000)
    return () => clearInterval(id)
  }, [])

  const dangerCount = alerts.length > 0 ? 1 : 0

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>통합 모니터링</h1>
          <p className={styles.subtitle}>현장 전체 실시간 현황</p>
        </div>
      </div>

      {/* 통계 카드 4개 */}
      <div className={styles.statRow}>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>👥</span>
          <div>
            <div className={styles.statLabel}>현재 작업자</div>
            <div className={styles.statNum}>10<span className={styles.statUnit}>명</span></div>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon} style={{ color: '#22c55e' }}>✓</span>
          <div>
            <div className={styles.statLabel}>정상</div>
            <div className={styles.statNum} style={{ color: '#22c55e' }}>6<span className={styles.statUnit}>명</span></div>
          </div>
        </div>
        <div className={`${styles.statCard} ${showWarnCards ? styles.statCardActive : ''}`}
          onClick={() => setShowWarnCards(v => !v)} style={{ cursor: 'pointer' }}>
          <span className={styles.statIcon} style={{ color: '#f97316' }}>⚠</span>
          <div>
            <div className={styles.statLabel}>주의</div>
            <div className={styles.statNum} style={{ color: '#f97316' }}>3<span className={styles.statUnit}>명</span></div>
            {showWarnCards && <div className={styles.statSub}>목록 보기 ▲</div>}
          </div>
        </div>
        <div className={styles.statCard} style={{ border: '1.5px solid #fee2e2' }}>
          <span className={styles.statIcon} style={{ color: '#ef4444' }}>⊘</span>
          <div>
            <div className={styles.statLabel}>위험</div>
            <div className={styles.statNum} style={{ color: '#ef4444' }}>{dangerCount}<span className={styles.statUnit}>명</span></div>
          </div>
        </div>
      </div>

      {/* 주의 작업자 카드 펼치기 */}
      {showWarnCards && (
        <div className={styles.warnCardSection}>
          <div className={styles.warnCardHeader}>
            <span className={styles.warnCardTitle}>주의 작업자 3명</span>
            <button className={styles.warnCardLink} onClick={() => navigate('/workers')}>작업자 페이지로</button>
            <button className={styles.warnCardClose} onClick={() => setShowWarnCards(false)}>✕</button>
          </div>
          <div className={styles.warnCardGrid}>
            {WARN_CARDS.map((w) => (
              <div key={w.name} className={styles.warnCard}>
                <div className={styles.warnCardAvatar} />
                <div className={styles.warnCardName}>{w.name} <span className={styles.warnBadge}>● 주의</span></div>
                <div className={styles.warnCardZone}>@ {w.zone}</div>
                <div className={styles.warnCardRow}><span>심박수</span><span>♡ {w.bpm} bpm</span></div>
                <div className={styles.warnCardRow}>
                  <span>피로도</span>
                  <span>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} style={{ display:'inline-block', width:14, height:6, borderRadius:3, background: i < w.fatigue ? '#f97316' : '#e5e7eb', marginRight:2 }} />
                    ))}
                    {w.fatigue}단계
                  </span>
                </div>
                <div className={styles.warnCardStatus}>{w.status}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 메인 그리드 */}
      <div className={styles.mainGrid}>
        {/* 실시간 이상 감지 목록 */}
        <div className={styles.alertSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.liveDot} />
            <span className={styles.sectionTitle}>실시간 이상 감지</span>
            <span className={styles.sectionSub}>최신순</span>
            <button className={styles.moreBtn} onClick={() => navigate('/logs')}>전체 보기 ›</button>
          </div>
          <div className={styles.alertList}>
            {MOCK_ALERTS.map((a) => (
              <div key={a.id} className={styles.alertItem}>
                <div className={styles.alertIconWrap} style={{ background: a.level === 'danger' ? '#fee2e2' : '#fff7ed' }}>
                  <span className={styles.alertIcon}>{a.icon}</span>
                </div>
                <div className={styles.alertBody}>
                  <div className={styles.alertTop}>
                    <span className={a.level === 'danger' ? styles.badgeDanger : styles.badgeWarn}>
                      ● {a.level === 'danger' ? '위험' : '주의'}
                    </span>
                    <span className={styles.alertType} style={{ color: a.level === 'danger' ? '#ef4444' : '#f97316' }}>
                      {a.type}
                    </span>
                    <span className={styles.alertDot}>·</span>
                    <span className={styles.alertWorker}>{a.worker}</span>
                    <span className={styles.alertZone}>@ {a.zone}</span>
                  </div>
                  <div className={styles.alertDesc}>{a.desc}</div>
                </div>
                <span className={styles.alertTime}>{a.time}</span>
                <button className={styles.detailBtn} onClick={() => navigate('/anomaly')}>👁 상세보기</button>
              </div>
            ))}
          </div>
        </div>

        {/* 오른쪽 패널 */}
        <div className={styles.rightPanel}>
          <div className={styles.panelCard}>
            <div className={styles.panelTitle}>현장 상태</div>
            {ZONES.map((z) => (
              <div key={z.name} className={styles.zoneRow}>
                <span className={styles.zoneName}>● {z.name}</span>
                <span className={styles.zoneNormal}>정상 {z.normal}</span>
                {z.warn > 0 && <span className={styles.zoneWarn}>주의 {z.warn}</span>}
                {z.danger > 0 && <span className={styles.zoneDanger}>위험 {z.danger}</span>}
              </div>
            ))}
          </div>

          <div className={styles.panelCard}>
            <div className={styles.panelTitleRow}>
              <span className={styles.panelTitle}>주의·위험 작업자</span>
              <button className={styles.allBtn} onClick={() => navigate('/workers')}>전체</button>
            </div>
            {RISK_WORKERS.map((w) => (
              <div key={w.name} className={styles.riskWorkerRow}>
                <div className={styles.riskAvatar} />
                <div className={styles.riskInfo}>
                  <div className={styles.riskName}>{w.name}
                    <span className={w.level === 'danger' ? styles.badgeDanger : styles.badgeWarn} style={{ marginLeft: 6 }}>
                      ● {w.level === 'danger' ? '위험' : '주의'}
                    </span>
                  </div>
                  <div className={styles.riskSub}>♡ {w.bpm} bpm {w.zone}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
