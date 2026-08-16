import { useNavigate, useParams } from 'react-router-dom'
import styles from './AnomalyDetail.module.css'

const DETAIL_DATA = {
  1: {
    category: 'fall', level: 'danger',
    worker: '박민수', zone: 'A구역 3층', helmet: 'H-001', time: '10:28',
    bpm: 118, fatigue: 2,
    cctv: 'CCTV-A03', cctvDate: '2025.09.09 10:28:14',
    fallResult: [
      { label: '충격 감지', value: '높음',       danger: true  },
      { label: '자세 변화', value: '감지됨',      danger: true  },
      { label: '움직임',   value: '없음',         danger: false },
      { label: '최종 판단', value: '추락 가능성 높음', danger: true },
    ],
    causes: [
      { rank: 1, label: '물웅덩이로 인한 미끄러짐', pct: 78 },
      { rank: 2, label: '난간 없는 구간 접근',      pct: 45 },
    ],
    auxFactors: ['피로도 2단계', '작업 중 빠른 이동', '고온 작업 환경'],
    finalCause: '바닥 물웅덩이에 미끄러지며\n난간 없는 구간 방향으로 추락',
    finalMeta: { external: '물웅덩이', posture: '불안정', fatigue: '2단계 동반' },
    relatedExternal: [
      { icon: '💧', label: '물웅덩이',    time: '3분 전' },
      { icon: '△',  label: '난간 없는 구간', time: '2분 전' },
    ],
  },
  2: {
    category: 'external', level: 'danger',
    worker: '박민수', zone: 'A구역 3층', time: '10:26',
    hazardType: '난간 없는 구간', hazardDesc: '추락',
    riskNote: '고층 작업 구간에 난간이 설치되어 있지 않음. 즉각 접근 금지 필요.',
    aiStatus: 'AI ACTIVE · UNGUARDED EDGE · FALL RISK HIGH',
    cctv: 'CCTV-A03', cctvDate: '08.09 10:26',
    overlayType: 'unguarded',
    actionType: 'danger',
    actionMsg: '즉각 접근 금지 조치가 필요합니다.',
  },
  3: {
    category: 'health', level: 'warn',
    worker: '김현석', zone: 'B구역', helmet: 'H-002', time: '10:27',
    bpm: 92, fatigue: 2,
    fatigueLabel: '2단계', fatigueDesc: '주의 수준',
    bpmDesc: '주의 수준',
    heatLabel: '주의', heatDesc: '체온 32°C',
    actionSent: true,
    showManagerAlert: true,
    managerMsg: '상태 개선이 확인되지 않았습니다. 관리자 직접 확인이 필요합니다.',
  },
  4: {
    category: 'external', level: 'warn',
    worker: '이수진', zone: 'C구역', time: '10:24',
    hazardType: '물웅덩이', hazardDesc: '미끄럼 및 낙상',
    riskNote: '바닥에 물웅덩이 형성. 미끄럼으로 인한 낙상 및 추락 위험.',
    aiStatus: 'AI ACTIVE · PUDDLE DETECTED · SLIP RISK',
    cctv: 'CCTV-C02', cctvDate: '08.09 10:24',
    overlayType: 'puddle',
    actionType: 'warn',
    actionMsg: '작업자에게 위험 구역 경고가 필요합니다.',
  },
  5: {
    category: 'external', level: 'warn',
    worker: '김현석', zone: 'B구역', time: '10:21',
    hazardType: '장애물(적재물)', hazardDesc: '충돌 및 전도',
    riskNote: '작업 통로에 적재물이 위치. 통로 폭 협소. 작업자 충돌 위험 높음.',
    aiStatus: 'AI ACTIVE · OBSTACLE DETECTED · COLLISION RISK',
    cctv: 'CCTV-B01', cctvDate: '08.09 10:21',
    overlayType: 'obstacle',
    actionType: 'warn',
    actionMsg: '작업자에게 위험 구역 경고가 필요합니다.',
  },
  6: {
    category: 'health', level: 'warn',
    worker: '정유진', zone: 'B구역 1층', helmet: 'H-005', time: '09:55',
    bpm: 88, fatigue: 1,
    fatigueLabel: '1단계', fatigueDesc: '정상',
    bpmDesc: '주의 수준',
    heatLabel: '높음', heatDesc: '체온 38.1°C',
    actionSent: false,
    showManagerAlert: false,
  },
}

function PersonFigure() {
  return (
    <svg viewBox="0 0 44 80" className={styles.personSvg}>
      <circle cx="22" cy="12" r="10" fill="#3b5285"/>
      <rect x="10" y="24" width="24" height="30" rx="4" fill="#3b5285"/>
      <rect x="8"  y="55" width="11" height="20" rx="3" fill="#3b5285"/>
      <rect x="25" y="55" width="11" height="20" rx="3" fill="#3b5285"/>
      <rect x="8"  y="24" width="8"  height="22" rx="3" fill="#4a6494"/>
      <rect x="28" y="24" width="8"  height="22" rx="3" fill="#4a6494"/>
    </svg>
  )
}

function CctvBox({ item, children }) {
  return (
    <div className={styles.cctvBox}>
      <div className={styles.cctvTop}>
        <span className={styles.cctvId}><span className={styles.cctvDot}></span>{item.cctv}</span>
        <span className={styles.cctvDate}>{item.cctvDate}</span>
        <span className={styles.recBadge}>RC●</span>
      </div>
      <div className={styles.cctvScene}>
        {children}
      </div>
      <div className={styles.cctvAiStatus}>{item.aiStatus}</div>
      <div className={styles.cctvControls}>
        <div className={styles.progressBar}><div className={styles.progressFill} style={{ width:'30%' }}></div></div>
        <div className={styles.cctvFooter}>
          <div className={styles.ctrlBtns}>
            <button className={styles.ctrlBtn}>⏮</button>
            <button className={`${styles.ctrlBtn} ${styles.playBtn}`}>▶</button>
          </div>
          <span className={styles.timeCode}>00:09 / 00:30</span>
        </div>
      </div>
    </div>
  )
}

function PuddleOverlay() {
  return (
    <div className={styles.overlayRoot}>
      <div className={styles.workerBoxWrap} style={{ left:150, top:80 }}>
        <div className={styles.workerBoxLabel}>WORKER 94%</div>
        <div className={styles.hatDot} style={{ background:'#f97316' }}></div>
        <div className={styles.workerBox}><PersonFigure /></div>
      </div>
      <div className={styles.puddleWrap} style={{ left:240, top:200 }}>
        <div className={styles.puddleLabel}>PUDDLE · 미끄럼 위험</div>
        <div className={styles.puddle}><span className={styles.puddleTag}>PUDDLE</span></div>
      </div>
    </div>
  )
}

function ObstacleOverlay() {
  return (
    <div className={styles.overlayRoot}>
      <div className={styles.workerBoxWrap} style={{ left:120, top:80 }}>
        <div className={styles.workerBoxLabel}>WORKER 94%</div>
        <div className={styles.hatDot} style={{ background:'#f97316' }}></div>
        <div className={styles.workerBox}><PersonFigure /></div>
      </div>
      <div className={styles.obstacleWrap} style={{ left:260, top:120 }}>
        <div className={styles.obstacleLabel}>OBSTACLE 91%</div>
        <div className={styles.obstacleDanger}>▲ 충돌 위험</div>
        <div className={styles.obstacleBox}></div>
      </div>
    </div>
  )
}

function UnguardedOverlay() {
  return (
    <div className={styles.overlayRoot}>
      <div className={styles.workerBoxWrap} style={{ left:120, top:80 }}>
        <div className={styles.workerBoxLabel}>WORKER 94%</div>
        <div className={styles.hatDot} style={{ background:'#ef4444' }}></div>
        <div className={styles.workerBox}><PersonFigure /></div>
      </div>
      <div className={styles.unguardedZone}>
        <div className={styles.unguardedBanner}>▲ UNGUARDED EDGE</div>
        <div className={styles.unguardedStripe}></div>
      </div>
      <div className={styles.approachLabel} style={{ left:200, top:180 }}>접근 감지 →</div>
    </div>
  )
}

function FallOverlay() {
  return (
    <div className={styles.overlayRoot}>
      <div className={styles.fallBoxWrap} style={{ left:200, top:130 }}>
        <div className={styles.fallLabel}>▲ FALL DETECTED 97%</div>
        <div className={styles.fallBox}>
          <div style={{ display:'flex', gap:20, padding:'8px 12px' }}>
            <span className={styles.fallTag}>IMPACT</span>
            <span className={styles.fallTag}>HOLE</span>
          </div>
          <div className={styles.fallenFigure}></div>
        </div>
      </div>
    </div>
  )
}

function VideoClips() {
  return (
    <div className={styles.clipSection}>
      <p className={styles.clipTitle}>저장된 영상 클립</p>
      <div className={styles.clipRow}>
        <button className={styles.clipBtn}><span>▶</span> 감지 전 30초</button>
        <button className={styles.clipBtn}><span>▶</span> 감지 후 30초</button>
      </div>
    </div>
  )
}

function renderExternalOverlay(type) {
  if (type === 'puddle')    return <PuddleOverlay />
  if (type === 'obstacle')  return <ObstacleOverlay />
  if (type === 'unguarded') return <UnguardedOverlay />
  return null
}

/* ── External hazard detail layout ── */
function ExternalDetail({ item }) {
  const levelColor = item.level === 'danger' ? '#ef4444' : '#f97316'
  const levelLabel = item.level === 'danger' ? '위험' : '주의'

  return (
    <div className={styles.extBody}>
      <div className={styles.extLeft}>
        <div className={styles.videoCard}>
          <div className={styles.videoCardHeader}>현장 영상 · AI 감지</div>
          <CctvBox item={item}>
            {renderExternalOverlay(item.overlayType)}
          </CctvBox>
          <p className={styles.videoNote}>AI가 영상을 실시간 분석하여 위험요인과 작업자를 감지합니다.</p>
        </div>
        <VideoClips />
      </div>

      <div className={styles.extRight}>
        <div className={styles.aiResultCard}>
          <p className={styles.aiResultTitle}>AI 감지 결과</p>
          <div
            className={styles.hazardTypeBadge}
            style={{ borderColor: levelColor, background: item.level === 'danger' ? '#fff1f2' : '#fff7ed' }}
          >
            <span className={styles.hazardTypeSmall} style={{ color: levelColor }}>감지 유형</span>
            <span className={styles.hazardTypeBig} style={{ color: levelColor }}>{item.hazardType}</span>
          </div>
          <div className={styles.aiMeta}>
            <div className={styles.aiMetaRow}><span>위험 설명</span><strong>{item.hazardDesc}</strong></div>
            <div className={styles.aiMetaRow}><span>관련 작업자</span><strong>{item.worker}</strong></div>
            <div className={styles.aiMetaRow}><span>위치</span><strong>{item.zone}</strong></div>
            <div className={styles.aiMetaRow}><span>발생 시각</span><strong>{item.time}</strong></div>
          </div>
          <p className={styles.riskNote}>{item.riskNote}</p>
        </div>

        <div className={styles.actionCard} style={{ borderColor: levelColor }}>
          <p className={styles.actionMsg} style={{ color: levelColor }}>{item.actionMsg}</p>
          <button className={styles.actionBtn} style={{ background: levelColor }}>경고 알림 전송</button>
          {item.actionType === 'danger' && (
            <button className={styles.actionBtnOutline} style={{ color: levelColor, borderColor: levelColor }}>구역 접근 금지</button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Fall detail layout ── */
function FallDetail({ item }) {
  return (
    <>
      <div className={styles.fallBanner}>
        <div className={styles.fallBannerLeft}>
          <span className={styles.fallBannerIcon}>⚠</span>
          <div>
            <div className={styles.fallBannerTitle}>추락 사고가 감지되었습니다.</div>
            <div className={styles.fallBannerSub}>{item.worker} · {item.zone} · {item.time}</div>
          </div>
        </div>
        <span className={styles.processingBadge}>● 처리중</span>
      </div>

      <div className={styles.fallBody}>
        <div className={styles.fallLeft}>
          <div className={styles.videoCard}>
            <div className={styles.videoCardHeaderRow}>
              <span className={styles.videoCardHeader}>사고 영상 확인</span>
              <span className={styles.markingTag}>사고 시점 마킹됨</span>
            </div>
            <div className={styles.cctvBox}>
              <div className={styles.cctvTop}>
                <span className={styles.cctvId}><span className={styles.cctvDot}></span>{item.cctv}</span>
                <span className={styles.cctvDate}>{item.cctvDate}</span>
                <span className={styles.recBadge}>RF●</span>
              </div>
              <div className={styles.cctvScene}>
                <FallOverlay />
              </div>
              <div className={styles.cctvAiStatus}>AI ACTIVE · FALL DETECTED · MOTION: NONE · IMPACT: HIGH</div>
              <div className={styles.fallTimeline}>
                <span className={styles.tlLabel}>사고 전 10초</span>
                <span className={styles.tlMarker}>▼ 사고 시점 (00:14)</span>
                <span className={styles.tlLabel}>사고 후 10초</span>
              </div>
              <div className={styles.cctvControls}>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width:'40%' }}></div>
                  <div className={styles.progressMarker} style={{ left:'40%' }}></div>
                </div>
                <div className={styles.cctvFooter}>
                  <div className={styles.ctrlBtns}>
                    <button className={styles.ctrlBtn}>⏮</button>
                    <button className={`${styles.ctrlBtn} ${styles.playBtn}`}>▶</button>
                    <button className={styles.jumpBtn}>사고 시점</button>
                  </div>
                  <span className={styles.timeCode}>00:12 / 00:30</span>
                </div>
              </div>
            </div>
            <div className={styles.tlTabs}>
              <button className={styles.tlTab}>사고 전 10초</button>
              <button className={`${styles.tlTab} ${styles.tlTabActive}`}>▶ 사고 시점</button>
              <button className={styles.tlTab}>사고 후 10초</button>
            </div>
          </div>

          <div className={styles.causesCard}>
            <p className={styles.causesTitle}>추락 원인 분석</p>
            {item.causes.map(c => (
              <div
                key={c.rank}
                className={styles.causeRow}
                style={{ background: c.rank === 1 ? '#fff1f2' : '#fff7ed', borderColor: c.rank === 1 ? '#fca5a5' : '#fed7aa' }}
              >
                <span className={styles.causeRank} style={{ color: c.rank === 1 ? '#ef4444' : '#f97316' }}>{c.rank}순위</span>
                <span className={styles.causeLabel}>{c.label}</span>
                <span className={styles.causePct} style={{ color: c.rank === 1 ? '#ef4444' : '#f97316' }}>{c.pct}%</span>
              </div>
            ))}
            <div className={styles.auxRow}>
              <span className={styles.auxTitle}>보조 요인</span>
              {item.auxFactors.map(f => <span key={f} className={styles.auxTag}>{f}</span>)}
            </div>
            <div className={styles.finalCause}>
              <p className={styles.finalCauseTitle}>최종 추정 원인</p>
              <p className={styles.finalCauseText}>{item.finalCause}</p>
              <div className={styles.finalMeta}>
                <div><span>외부요인</span><strong>{item.finalMeta.external}</strong></div>
                <div><span>자세 상태</span><strong>{item.finalMeta.posture}</strong></div>
                <div><span>피로도</span><strong>{item.finalMeta.fatigue}</strong></div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.fallRight}>
          <div className={styles.workerInfoCard}>
            <div className={styles.wiAvatar}>{item.worker[0]}</div>
            <div>
              <div className={styles.wiName}>{item.worker}</div>
              <div className={styles.wiSub}>{item.zone} · {item.helmet}</div>
            </div>
            <div className={styles.wiStats}>
              <div className={styles.wiStat}><span>발생 시각</span><strong>{item.time}</strong></div>
              <div className={styles.wiStat}><span>심박수</span><strong>{item.bpm} bpm</strong></div>
              <div className={styles.wiStat}><span>피로도</span><strong>{item.fatigue}단계</strong></div>
            </div>
          </div>

          <div className={styles.resultCard}>
            <p className={styles.resultTitle}>추락 감지 결과</p>
            {item.fallResult.map(r => (
              <div key={r.label} className={styles.resultRow}>
                <span className={styles.resultLabel}>{r.label}</span>
                <span className={styles.resultValue} style={{ color: r.danger ? '#ef4444' : '#111827' }}>{r.value}</span>
              </div>
            ))}
          </div>

          <div className={styles.relatedCard}>
            <p className={styles.relatedTitle}>연관 외부요인</p>
            {item.relatedExternal.map(r => (
              <div key={r.label} className={styles.relatedRow}>
                <span>{r.icon} {r.label}</span>
                <span className={styles.relatedTime}>{r.time}</span>
              </div>
            ))}
          </div>

          <div className={styles.fallActions}>
            <button className={styles.emergencyBtn}>📞 긴급 구조 요청</button>
            <button className={styles.locationBtn}>📍 작업자 위치 확인</button>
          </div>
        </div>
      </div>
    </>
  )
}

/* ── Health detail layout ── */
function HealthDetail({ item }) {
  const fatigueBars = Array.from({ length: 3 }, (_, i) => i < item.fatigue)
  const fatigueStages = [
    { label: '1단계', desc: '정상 활동 가능',  active: item.fatigue === 1 },
    { label: '2단계', desc: '휴식 권고 필요',  active: item.fatigue === 2 },
    { label: '3단계', desc: '즉각 업무 중단',  active: item.fatigue === 3 },
  ]

  return (
    <div className={styles.healthLayout}>
      <div className={styles.healthMain}>
        <div className={styles.healthWorkerCard}>
          <div className={styles.hwAvatar}>{item.worker[0]}</div>
          <div className={styles.hwInfo}>
            <div className={styles.hwName}>
              {item.worker}
              <span className={styles.warnBadge}>● 주의</span>
            </div>
            <div className={styles.hwZone}>📍 {item.zone}</div>
          </div>
          <div className={styles.hwRight}>
            <div className={styles.hwBpm}>♡ {item.bpm} bpm</div>
            <div className={styles.hwFatigue}>
              {fatigueBars.map((on, i) => (
                <span key={i} className={`${styles.fBar} ${on ? styles.fBarOn : ''}`}></span>
              ))}
              <span className={styles.fLabel}>{item.fatigueLabel}</span>
            </div>
          </div>
        </div>

        <div className={styles.metricsRow}>
          <div className={`${styles.metricCard} ${styles.metricGreen}`}>
            <div className={styles.metricHeader}><span>↗</span> 피로도</div>
            <div className={styles.metricValue} style={{ color:'#16a34a' }}>{item.fatigueLabel}</div>
            <div className={styles.metricDesc}>{item.fatigueDesc}</div>
          </div>
          <div className={`${styles.metricCard} ${styles.metricOrange}`}>
            <div className={styles.metricHeader}><span>♡</span> 심박수</div>
            <div className={styles.metricValue} style={{ color:'#ea580c' }}>{item.bpm} bpm</div>
            <div className={styles.metricDesc}>{item.bpmDesc}</div>
          </div>
          <div className={`${styles.metricCard} ${styles.metricOrange}`}>
            <div className={styles.metricHeader}><span>🌡</span> 열사병 위험</div>
            <div className={styles.metricValue} style={{ color:'#ea580c' }}>{item.heatLabel}</div>
            <div className={styles.metricDesc}>{item.heatDesc}</div>
          </div>
        </div>

        <div className={styles.fatigueCard}>
          <p className={styles.fatigueTitle}>피로도 단계</p>
          <div className={styles.fatigueStages}>
            {fatigueStages.map(s => (
              <div
                key={s.label}
                className={`${styles.fatigueStage} ${s.active ? styles.fatigueStageActive : ''}`}
              >
                <div className={styles.fsLabel}>
                  {s.active && <span className={styles.fsDot}></span>}
                  {s.label}
                </div>
                <div className={styles.fsDesc}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.healthRight}>
        <div className={styles.actionPanel}>
          <p className={styles.apTitle}>권장 조치</p>
          <p className={styles.apDesc}>현재 작업자에게 휴식이 권장됩니다.</p>
          {item.actionSent ? (
            <button className={styles.sentBtn}>✓ 휴식 권고 전송됨</button>
          ) : (
            <button className={styles.actionBtn} style={{ background:'#f97316' }}>휴식 권고 전송</button>
          )}
          {item.showManagerAlert && (
            <div className={styles.alertBox}>
              <p className={styles.alertMsg}><span>⚠</span> {item.managerMsg}</p>
              <button className={styles.managerBtn}>관리자 알림</button>
            </div>
          )}
        </div>

        <div className={styles.metaPanel}>
          <div className={styles.metaPanelRow}><span>감지 시각</span><strong>{item.time}</strong></div>
          <div className={styles.metaPanelRow}><span>위치</span><strong>{item.zone}</strong></div>
          <div className={styles.metaPanelRow}><span>헬멧</span><strong>{item.helmet}</strong></div>
        </div>
      </div>
    </div>
  )
}

/* ── Main component ── */
export default function AnomalyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const item = DETAIL_DATA[Number(id)]

  if (!item) {
    navigate('/anomaly')
    return null
  }

  const TYPE_LABEL = { fall:'추락 감지', external:'외부 위험요인 감지', health:'건강 이상 감지' }
  const levelLabel = item.level === 'danger' ? '위험' : '주의'
  const levelColor = item.level === 'danger' ? '#ef4444' : '#f97316'

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={() => navigate('/anomaly')}>
        ← 이상 감지 목록
      </button>

      {item.category !== 'fall' && (
        <div className={styles.itemHeader}>
          <div className={styles.itemHeaderIcon} style={{ background: item.level === 'danger' ? '#fee2e2' : '#fff7ed', color: levelColor }}>
            {item.category === 'external' ? '△' : '♡'}
          </div>
          <div>
            <div className={styles.itemHeaderTitle}>{TYPE_LABEL[item.category]}</div>
            <div className={styles.itemHeaderSub}>{item.worker} · {item.zone} · {item.time}</div>
          </div>
          <span
            className={styles.levelBadge}
            style={{ background: item.level === 'danger' ? '#fee2e2' : '#fff7ed', color: levelColor }}
          >● {levelLabel}</span>
        </div>
      )}

      {item.category === 'external' && <ExternalDetail item={item} />}
      {item.category === 'fall'     && <FallDetail     item={item} />}
      {item.category === 'health'   && <HealthDetail   item={item} />}
    </div>
  )
}
