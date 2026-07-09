import { useState, useEffect } from 'react'
import { getFallAlerts } from '../api/monitoring'
import styles from './AccidentDetail.module.css'

function Sparkline({ color, points }) {
  const w = 260, h = 64
  const xs = points.map((_, i) => (i / (points.length - 1)) * w)
  const min = Math.min(...points), max = Math.max(...points)
  const range = max - min || 1
  const ys = points.map((v) => h - ((v - min) / range) * (h - 10) - 5)
  const path = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x},${ys[i]}`).join(' ')
  const fillPath = `${path} L${w},${h} L0,${h} Z`
  const gId = `g${color.replace('#', '')}`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={gId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#${gId})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

function formatDateTime(isoString) {
  if (!isoString) return '-'
  return new Date(isoString).toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  })
}

export default function AccidentDetail() {
  const [alerts, setAlerts] = useState([])
  const [selected, setSelected] = useState(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    async function fetch() {
      try {
        const list = await getFallAlerts()
        const sorted = [...list].sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt))
        setAlerts(sorted)
        if (sorted.length > 0 && !selected) setSelected(sorted[0])
        setConnected(true)
      } catch {
        setConnected(false)
      }
    }
    fetch()
    const id = setInterval(fetch, 5000)
    return () => clearInterval(id)
  }, [])

  const accelPts  = [1.0, 1.1, 0.9, 1.2, 1.0, 2.1, 4.8, 9.2, 12.8, 10.1, 6.3, 3.2, 1.8, 1.1, 0.9]
  const gyroPts   = [5, 8, 6, 10, 7, 25, 80, 155, 215, 190, 130, 70, 30, 12, 8]
  const impactPts = [0.2, 0.3, 0.2, 0.4, 0.3, 0.9, 2.1, 3.6, 3.4, 2.2, 1.1, 0.5, 0.3, 0.2, 0.2]
  const stillPts  = [1.2, 0.9, 1.1, 0.8, 0.7, 0.4, 0.2, 0.1, 0.05, 0.04, 0.03, 0.03, 0.02, 0.02, 0.02]

  const baseTime = selected?.recordedAt ? new Date(selected.recordedAt) : new Date('2024-06-01T10:24:15')
  function tOffset(secOffset) {
    const d = new Date(baseTime.getTime() - (15 - secOffset) * 1000)
    return d.toTimeString().slice(0, 8)
  }

  const timeline = [
    { dot: '#43a047', time: tOffset(0),  label: '정상 상태' },
    { dot: '#ff9800', time: tOffset(12), label: '낙하 감지' },
    { dot: '#e53935', time: tOffset(14), label: '충격 발생' },
    { dot: '#e53935', time: tOffset(17), label: '움직임 없음 감지' },
    { dot: '#4a7cdc', time: tOffset(20), label: '알림 발송 완료' },
  ]

  const checklist = [
    { item: '사고 접수 및 확인',    assignee: '시스템',  completedAt: tOffset(1),  status: '완료' },
    { item: '관리자 긴급 알림',      assignee: 'admin01', completedAt: tOffset(3),  status: '완료' },
    { item: '주변 작업자 대피 알림', assignee: 'admin01', completedAt: tOffset(5),  status: '완료' },
    { item: '119 신고 전송',         assignee: 'admin01', completedAt: tOffset(10), status: '완료' },
    { item: '현장 안전요원 파견',    assignee: '김현장',  completedAt: '-',          status: '대기' },
    { item: '사고 경위서 작성',      assignee: '-',        completedAt: '-',          status: '대기' },
  ]

  const confidence = Number(selected?.confidence ?? 0)
  const confidencePercent = Math.round(confidence * 100)

  if (!connected || alerts.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>📋</div>
        <div className={styles.emptyTitle}>사고 기록이 없습니다</div>
        <div className={styles.emptySub}>
          {connected ? '낙상 감지 이력이 없습니다.' : '⚪ 서버 연결 대기 중...'}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      {/* 헤더 */}
      <div className={styles.detailHeader}>
        <div>
          <h2 className={styles.detailTitle}>사고 상세 정보</h2>
          <p className={styles.detailSub}>
            이준호 (W-1024) · B구역 3층 계단 · {formatDateTime(selected?.recordedAt)}
          </p>
        </div>
        <div className={styles.detailHeaderRight}>
          <span className={styles.badgeDanger}>위험 감지</span>
          <span className={styles.badgeActive}>대응 중</span>
          {alerts.length > 1 && (
            <select
              className={styles.alertSelect}
              value={selected?.recordedAt ?? ''}
              onChange={(e) => setSelected(alerts.find((a) => a.recordedAt === e.target.value))}
            >
              {alerts.map((a, i) => (
                <option key={i} value={a.recordedAt}>
                  {a.deviceId} · {formatDateTime(a.recordedAt)}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* 메인 2컬럼 */}
      <div className={styles.detailMain}>

        {/* 왼쪽: 센서 차트 4개 + AI 분석 4개 */}
        <div className={styles.leftCol}>
          <div className={styles.chartGrid} style={{ flex: 1 }}>
            {[
              { label: '가속도 변화', peak: '12.8 m/s²', sub: '최고 감지값', color: '#e53935', pts: accelPts },
              { label: '자이로 변화', peak: '215 °/s',   sub: '최전 속도',   color: '#d4a017', pts: gyroPts },
              { label: '충격량',      peak: '3.6 g',     sub: '충격 강도',   color: '#7c3aed', pts: impactPts },
              { label: '움직임 없음', peak: '18.3초',    sub: '정지 감지',   color: '#6b7280', pts: stillPts },
            ].map((c) => (
              <div key={c.label} className={styles.chartCard}>
                <div className={styles.chartMeta}>
                  <span className={styles.chartLabel}>{c.label}</span>
                  <span className={styles.chartPeak} style={{ color: c.color }}>{c.peak}</span>
                  <span className={styles.chartSub}>{c.sub}</span>
                </div>
                <Sparkline color={c.color} points={c.pts} />
              </div>
            ))}
          </div>

          <div className={styles.aiGrid}>
            <div className={styles.aiCard}>
              <div className={styles.aiIcon} style={{ color: '#ff9800' }}>⚠</div>
              <div className={styles.aiCardLabel}>추락 원인 분류</div>
              <div className={styles.aiCardVal} style={{ color: '#e53935' }}>계단 미끄러짐</div>
              <div className={styles.aiCardSub}>신뢰도 94.2%</div>
            </div>
            <div className={styles.aiCard}>
              <div className={styles.aiIcon} style={{ color: '#e53935' }}>📈</div>
              <div className={styles.aiCardLabel}>위험도 예측</div>
              <div className={styles.aiCardVal} style={{ color: '#e53935' }}>매우 높음</div>
              <div className={styles.aiCardSub}>즉각 대응 필요</div>
            </div>
            <div className={styles.aiCard}>
              <div className={styles.aiIcon} style={{ color: '#7c3aed' }}>💓</div>
              <div className={styles.aiCardLabel}>의식불명 가능성</div>
              <div className={styles.aiCardVal} style={{ color: '#7c3aed' }}>87.3%</div>
              <div className={styles.aiCardSub}>AI 분석 결과</div>
            </div>
            <div className={styles.aiCard}>
              <div className={styles.aiIcon} style={{ color: '#4a7cdc' }}>🛡</div>
              <div className={styles.aiCardLabel}>대응 가이드</div>
              <div className={styles.aiCardVal} style={{ color: '#4a7cdc' }}>119 즉시 연락</div>
              <div className={styles.aiCardSub}>CPR 준비 권고</div>
            </div>
          </div>
        </div>

        {/* 오른쪽: 영상 (크게) + 타임라인 + 체크리스트 */}
        <div className={styles.rightCol}>

          {/* 영상 — 가장 큰 비율 */}
          <div className={styles.videoCard}>
            <div className={styles.videoHeader}>
              <span className={styles.recBadge}>● REC</span>
              <span className={styles.videoTime}>{formatDateTime(selected?.recordedAt)}</span>
            </div>
            <div className={styles.videoArea}>
              <div className={styles.playBtn}>▶</div>
              <div className={styles.camLabel}>계단 CCTV · CAM-B3-02</div>
              <div className={styles.videoProgressInner}><div className={styles.videoProgressFill} /></div>
            </div>
          </div>

          {/* 이벤트 타임라인 */}
          <div className={styles.timelineCard}>
            <h4 className={styles.timelineTitle}>이벤트 타임라인</h4>
            {timeline.map((t, i) => (
              <div key={i} className={styles.timelineRow}>
                <span className={styles.timelineDot} style={{ background: t.dot }} />
                <span className={styles.timelineTime}>{t.time}</span>
                <span className={styles.timelineLabel}>{t.label}</span>
              </div>
            ))}
          </div>

          {/* 대응 체크리스트 */}
          <div className={styles.checklistCard}>
            <h4 className={styles.checklistTitle}>대응 체크리스트</h4>
            <table className={styles.checkTable}>
              <thead>
                <tr>
                  <th>항목</th>
                  <th>담당자</th>
                  <th>완료 시간</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {checklist.map((c, i) => (
                  <tr key={i}>
                    <td>{c.item}</td>
                    <td>{c.assignee}</td>
                    <td className={styles.muted}>{c.completedAt}</td>
                    <td>
                      <span className={
                        c.status === '완료' ? styles.statusDone : styles.statusWait
                      }>{c.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  )
}
