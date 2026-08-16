import { useState } from 'react'
import styles from './WorkerStatus.module.css'

const WORKERS = [
  {
    name:'박민수', workerId:'W001', zone:'A구역 3층', helmet:'H-001',
    bpm:118, fatigue:2, status:'추락 감지됨', level:'danger',
    external:{ level:'normal', desc:'위험 요소 없음' },
    health:  { level:'warn',   bpm:118, fatigue:2 },
    fall:    { level:'danger', desc:'추락 감지됨' },
  },
  {
    name:'김현석', workerId:'W002', zone:'B구역',     helmet:'H-002',
    bpm:92,  fatigue:2, status:'피로도 2단계', level:'warn',
    external:{ level:'normal', desc:'위험 요소 없음' },
    health:  { level:'warn',   bpm:92,  fatigue:2 },
    fall:    { level:'normal', desc:'감지 없음' },
  },
  {
    name:'이수진', workerId:'W003', zone:'C구역',     helmet:'H-003',
    bpm:78,  fatigue:1, status:'물웅덩이 감지', level:'warn',
    external:{ level:'warn',   desc:'물웅덩이 감지' },
    health:  { level:'normal', bpm:78,  fatigue:1 },
    fall:    { level:'normal', desc:'감지 없음' },
  },
  {
    name:'최동훈', workerId:'W004', zone:'A구역 1층', helmet:'H-004',
    bpm:72,  fatigue:1, status:'정상 작업 중', level:'normal',
    external:{ level:'normal', desc:'위험 요소 없음' },
    health:  { level:'normal', bpm:72,  fatigue:1 },
    fall:    { level:'normal', desc:'감지 없음' },
  },
  {
    name:'정유진', workerId:'W005', zone:'B구역 1층', helmet:'H-005',
    bpm:88,  fatigue:1, status:'열사병 주의', level:'warn',
    external:{ level:'normal', desc:'위험 요소 없음' },
    health:  { level:'warn',   bpm:88,  fatigue:1 },
    fall:    { level:'normal', desc:'감지 없음' },
  },
  {
    name:'한재원', workerId:'W006', zone:'C구역 2층', helmet:'H-003',
    bpm:71,  fatigue:1, status:'정상 작업 중', level:'normal',
    external:{ level:'normal', desc:'위험 요소 없음' },
    health:  { level:'normal', bpm:71,  fatigue:1 },
    fall:    { level:'normal', desc:'감지 없음' },
  },
  {
    name:'오서연', workerId:'W007', zone:'A구역 1층', helmet:'H-006',
    bpm:68,  fatigue:1, status:'정상 작업 중', level:'normal',
    external:{ level:'normal', desc:'위험 요소 없음' },
    health:  { level:'normal', bpm:68,  fatigue:1 },
    fall:    { level:'normal', desc:'감지 없음' },
  },
  {
    name:'강민철', workerId:'W008', zone:'B구역 2층', helmet:'H-004',
    bpm:74,  fatigue:1, status:'정상 작업 중', level:'normal',
    external:{ level:'normal', desc:'위험 요소 없음' },
    health:  { level:'normal', bpm:74,  fatigue:1 },
    fall:    { level:'normal', desc:'감지 없음' },
  },
  {
    name:'윤지호', workerId:'W009', zone:'A구역 2층', helmet:'H-007',
    bpm:76,  fatigue:1, status:'정상 작업 중', level:'normal',
    external:{ level:'normal', desc:'위험 요소 없음' },
    health:  { level:'normal', bpm:76,  fatigue:1 },
    fall:    { level:'normal', desc:'감지 없음' },
  },
  {
    name:'서예린', workerId:'W010', zone:'C구역 1층', helmet:'H-005',
    bpm:70,  fatigue:1, status:'정상 작업 중', level:'normal',
    external:{ level:'normal', desc:'위험 요소 없음' },
    health:  { level:'normal', bpm:70,  fatigue:1 },
    fall:    { level:'normal', desc:'감지 없음' },
  },
]

const LC = { danger:'#ef4444', warn:'#f97316', normal:'#22c55e' }
const LL = { danger:'위험',    warn:'주의',    normal:'정상'    }
const LB = { danger:'#fee2e2', warn:'#fff7ed', normal:'#f0fdf4' }
const LBD= { danger:'#fca5a5', warn:'#fed7aa', normal:'#bbf7d0' }

function FatigueBars({ fatigue, color }) {
  return (
    <span className={styles.fatigueBars}>
      {Array.from({ length: 3 }).map((_, i) => (
        <span key={i} className={styles.fatigueBar}
          style={{ background: i < fatigue ? color : '#e5e7eb' }} />
      ))}
      <span className={styles.fatigueLabel}>{fatigue}단계</span>
    </span>
  )
}

/* ── Worker Detail ── */
function WorkerDetail({ worker, onBack }) {
  const dotColor = LC[worker.level]

  const categories = [
    {
      key: 'external',
      icon: '⊡',
      iconBg: '#dcfce7',
      iconColor: '#16a34a',
      title: '외부요인',
      level: worker.external.level,
      content: (
        <div className={styles.catContent}>
          <p className={styles.catDesc} style={{ color: LC[worker.external.level] }}>{worker.external.desc}</p>
        </div>
      ),
    },
    {
      key: 'health',
      icon: '♡',
      iconBg: '#fff7ed',
      iconColor: '#f97316',
      title: '건강',
      level: worker.health.level,
      content: (
        <div className={styles.catContent}>
          <p className={styles.catBpm} style={{ color: LC[worker.health.level] }}>
            {worker.health.bpm} bpm
          </p>
          <FatigueBars fatigue={worker.health.fatigue} color={LC[worker.health.level]} />
        </div>
      ),
    },
    {
      key: 'fall',
      icon: '↘',
      iconBg: '#fff1f2',
      iconColor: '#ef4444',
      title: '추락',
      level: worker.fall.level,
      content: (
        <div className={styles.catContent}>
          <p className={styles.catDesc} style={{ color: LC[worker.fall.level] }}>{worker.fall.desc}</p>
        </div>
      ),
    },
  ]

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={onBack}>← 작업자 목록</button>

      <div className={styles.detailCard}>
        <div className={styles.detailAvatarWrap}>
          <div className={styles.detailAvatar} />
          <span className={styles.detailAvatarDot} style={{ background: dotColor }} />
        </div>
        <div className={styles.detailInfo}>
          <div className={styles.detailNameRow}>
            <span className={styles.detailName}>{worker.name}</span>
            <span className={styles.detailBadge}
              style={{ background: LB[worker.level], color: LC[worker.level] }}>
              ● {LL[worker.level]}
            </span>
          </div>
          <div className={styles.detailMeta}>
            <span>🪪 {worker.workerId}</span>
            <span>📍 {worker.zone}</span>
            <span>⛑ {worker.helmet}</span>
            <span className={styles.sensorOn}>📶 센서 연결됨</span>
          </div>
        </div>
      </div>

      <div className={styles.catGrid}>
        {categories.map(cat => (
          <div
            key={cat.key}
            className={styles.catCard}
            style={{ borderColor: LBD[cat.level], background: LB[cat.level] }}
          >
            <div className={styles.catHeader}>
              <span className={styles.catIcon}
                style={{ background: cat.iconBg, color: cat.iconColor }}>
                {cat.icon}
              </span>
              <span className={styles.catTitle}>{cat.title}</span>
            </div>
            <span className={styles.catBadge}
              style={{ background: `${LC[cat.level]}22`, color: LC[cat.level] }}>
              ● {LL[cat.level]}
            </span>
            {cat.content}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Add Worker Modal ── */
function AddWorkerModal({ onClose }) {
  const [form, setForm] = useState({ name:'', zone:'', location:'', helmet:'' })

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    onClose()
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <div className={styles.modalTitle}>작업자 추가</div>
            <div className={styles.modalSub}>새 작업자를 등록합니다.</div>
          </div>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalBody}>
          <div className={styles.field}>
            <label className={styles.label}>이름 <span className={styles.required}>*</span></label>
            <input
              className={styles.input}
              placeholder="예: 홍길동"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.label}>소속 구역</label>
              <input
                className={styles.input}
                placeholder=""
                value={form.zone}
                onChange={e => setForm(f => ({ ...f, zone: e.target.value }))}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>세부 위치 (선택)</label>
              <input
                className={styles.input}
                placeholder="예: A구역 2층"
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>헬멧 번호 (선택)</label>
            <input
              className={styles.input}
              placeholder="예: H-011"
              value={form.helmet}
              onChange={e => setForm(f => ({ ...f, helmet: e.target.value }))}
            />
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>취소</button>
            <button type="submit" className={styles.submitBtn}>등록</button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Main ── */
export default function WorkerStatus() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const filtered = WORKERS.filter(w => !search || w.name.includes(search) || w.workerId.includes(search))
  const dangerCount  = WORKERS.filter(w => w.level === 'danger').length
  const warnCount    = WORKERS.filter(w => w.level === 'warn').length
  const normalCount  = WORKERS.filter(w => w.level === 'normal').length

  if (selected) {
    return <WorkerDetail worker={selected} onBack={() => setSelected(null)} />
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>작업자 상태</h1>
        <p className={styles.subtitle}>전체 작업자 현황</p>
      </div>

      <div className={styles.toolbar}>
        <input
          className={styles.search}
          placeholder="작업자 이름 또는 ID 검색"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className={styles.countInfo}>
          {WORKERS.length}명 등록 중 ·
          <span style={{ color:'#22c55e' }}> 정상 {normalCount}</span> ·
          <span style={{ color:'#f97316' }}> 주의 {warnCount}</span> ·
          <span style={{ color:'#ef4444' }}> 위험 {dangerCount}</span>
        </div>
        <button className={styles.addBtn} onClick={() => setShowModal(true)}>+ 작업자 추가</button>
      </div>

      <div className={styles.grid}>
        {filtered.map((w) => (
          <div
            key={w.name}
            className={styles.card}
            style={{ borderColor: LBD[w.level], background: w.level !== 'normal' ? LB[w.level] : '#fff' }}
            onClick={() => setSelected(w)}
          >
            <div className={styles.cardDot} style={{ background: LC[w.level] }} />
            <div className={styles.avatar} />
            <div className={styles.nameRow}>
              <span className={styles.name}>{w.name}</span>
              <span className={styles.badge}
                style={{ color: LC[w.level], background: '#fff', border: `1px solid ${LBD[w.level]}` }}>
                ● {LL[w.level]}
              </span>
            </div>
            <div className={styles.zone}>📍 {w.zone}</div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>심박수</span>
              <span className={styles.infoVal}>♡ {w.bpm} bpm</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>피로도</span>
              <FatigueBars fatigue={w.fatigue} color={LC[w.level]} />
            </div>
            <div className={styles.statusMsg} style={{ color: w.level !== 'normal' ? LC[w.level] : '#6b7280' }}>
              {w.status}
            </div>
          </div>
        ))}
      </div>

      {showModal && <AddWorkerModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
