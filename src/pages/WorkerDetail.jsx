import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWorkers } from '../context/WorkerContext'
import { getHelmetStatus } from '../api/monitoring'
import Spinner from '../components/Spinner'
import styles from './WorkerDetail.module.css'

const STATUS_COLOR = {
  '작업중':  { bg: '#e8f5e9', color: '#2e7d32' },
  '휴식중':  { bg: '#fff3e0', color: '#e65100' },
  '작업대기': { bg: '#eeeeee', color: '#555'    },
  '비활성':  { bg: '#f3f4f6', color: '#999'    },
}

const BLOOD_TYPES = ['A', 'B', 'O', 'AB']
const GENDERS     = ['남성', '여성']
const STATUSES    = ['작업중', '휴식중', '작업대기', '비활성']

// 백엔드 센서 상태 → 화면 상태 매핑
const STATE_TO_STATUS = {
  NORMAL:  'normal',
  FALLING: 'caution',
  FALLEN:  'emergency',
}
const HELMET_STATUS_LABEL = {
  emergency: '긴급',
  caution:   '주의',
  normal:    '정상',
}
const HELMET_STATUS_COLOR = {
  emergency: '#e53935',
  caution:   '#ff9800',
  normal:    '#43a047',
}

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString('ko-KR', { hour12: false })
}

export default function WorkerDetail() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const { workers, updateWorker } = useWorkers()

  const worker = workers.find((w) => String(w.id) === String(id))

  const [editing, setEditing] = useState(false)
  const [form, setForm]       = useState(null)
  const [saving, setSaving]   = useState(false)

  // 실제 백엔드(/api/workers/{deviceId})에서 받아온 헬멧 실시간 상태
  const [helmetLive, setHelmetLive] = useState(null)

  useEffect(() => {
    if (!worker) return
    let cancelled = false

    async function fetchLive() {
      try {
        const data = await getHelmetStatus(worker.helmetId)
        if (!cancelled) setHelmetLive(data)
      } catch {
        if (!cancelled) setHelmetLive(null)
      }
    }

    fetchLive()
    const interval = setInterval(fetchLive, 5000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [worker?.helmetId])

  if (!worker) {
    return (
      <div className={styles.notFound}>
        <span className={styles.notFoundIcon}>🔍</span>
        <p>작업자를 찾을 수 없습니다.</p>
        <button className={styles.backBtn} onClick={() => navigate('/workers')}>목록으로 돌아가기</button>
      </div>
    )
  }

  function startEdit() {
    setForm({ ...worker })
    setEditing(true)
  }

  function cancelEdit() {
    setForm(null)
    setEditing(false)
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    setSaving(true)
    // TODO: 실제 API 호출로 교체 → PUT /users/:id
    await new Promise((r) => setTimeout(r, 500)) // mock 딜레이
    updateWorker(worker.id, form)
    setSaving(false)
    setEditing(false)
    setForm(null)
  }

  const data = editing ? form : worker
  const st   = STATUS_COLOR[data.status] ?? { bg: '#eee', color: '#888' }

  const helmetStatus    = helmetLive ? (STATE_TO_STATUS[helmetLive.state] ?? null) : null
  const helmetUpdatedAt = helmetLive ? formatTime(helmetLive.recordedAt) : '-'

  return (
    <div className={styles.page}>
      {/* 브레드크럼 */}
      <div className={styles.breadcrumb}>
        <span className={styles.breadLink} onClick={() => navigate('/workers')}>작업자 관리</span>
        <span className={styles.breadSep}>›</span>
        <span className={styles.breadCurrent}>작업자 상세</span>
      </div>

      {/* 상단 액션 */}
      <div className={styles.topBar}>
        <h1 className={styles.title}>작업자 상세 정보</h1>
        <div className={styles.actions}>
          {editing ? (
            <>
              <button className={styles.cancelBtn} onClick={cancelEdit} disabled={saving}>취소</button>
              <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                {saving ? <Spinner size="sm" /> : '저장'}
              </button>
            </>
          ) : (
            <>
              <button className={styles.editBtn} onClick={startEdit}>✏️ 수정</button>
              <button className={styles.backBtn2} onClick={() => navigate('/workers')}>← 목록</button>
            </>
          )}
        </div>
      </div>

      <div className={styles.body}>
        {/* 왼쪽: 프로필 카드 */}
        <div className={styles.profileCard}>
          <div className={styles.avatarCircle}>
            {data.avatar
              ? <img src={data.avatar} alt="avatar" className={styles.avatarImg} />
              : <span className={styles.avatarLetter}>{data.name[0]}</span>
            }
          </div>

          <div className={styles.profileName}>{data.name}</div>
          <span className={styles.statusBadge} style={{ background: st.bg, color: st.color }}>
            {data.status}
          </span>

          <div className={styles.profileMeta}>
            <div className={styles.metaRow}><span className={styles.metaKey}>사번</span><span>{data.employeeId}</span></div>
            <div className={styles.metaRow}><span className={styles.metaKey}>팀</span><span>{data.team}</span></div>
            <div className={styles.metaRow}><span className={styles.metaKey}>직책</span><span>{data.position || '-'}</span></div>
            <div className={styles.metaRow}><span className={styles.metaKey}>입사일</span><span>{data.joinDate || '-'}</span></div>
            <div className={styles.metaRow}><span className={styles.metaKey}>최근 작업</span><span className={styles.metaSmall}>{data.lastWork || '-'}</span></div>
          </div>
        </div>

        {/* 오른쪽: 상세 정보 */}
        <div className={styles.detailPanel}>
          {/* 기본 정보 */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>기본 정보</h2>
            <div className={styles.grid}>
              <Field label="이름">
                {editing
                  ? <input className={styles.input} value={form.name} onChange={(e) => handleChange('name', e.target.value)} />
                  : <span>{data.name}</span>
                }
              </Field>
              <Field label="상태">
                {editing
                  ? <select className={styles.select} value={form.status} onChange={(e) => handleChange('status', e.target.value)}>
                      {STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  : <span>{data.status}</span>
                }
              </Field>
              <Field label="연락처">
                {editing
                  ? <input className={styles.input} value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} />
                  : <span>{data.phone}</span>
                }
              </Field>
              <Field label="이메일">
                {editing
                  ? <input className={styles.input} value={form.email || ''} onChange={(e) => handleChange('email', e.target.value)} />
                  : <span>{data.email || '-'}</span>
                }
              </Field>
              <Field label="안전모 ID">
                {editing
                  ? <input className={styles.input} value={form.helmetId} onChange={(e) => handleChange('helmetId', e.target.value)} />
                  : <span>{data.helmetId}</span>
                }
              </Field>
              <Field label="안전모 상태">
                {helmetStatus
                  ? (
                    <span
                      className={styles.statusBadge}
                      style={{
                        background: (HELMET_STATUS_COLOR[helmetStatus] ?? '#ccc') + '22',
                        color: HELMET_STATUS_COLOR[helmetStatus] ?? '#666',
                      }}
                    >
                      {HELMET_STATUS_LABEL[helmetStatus] ?? '-'}
                    </span>
                  )
                  : '-'
                }
              </Field>
              <Field label="상태 업데이트">
                <span>{helmetUpdatedAt}</span>
              </Field>
              <Field label="팀">
                {editing
                  ? <input className={styles.input} value={form.team} onChange={(e) => handleChange('team', e.target.value)} />
                  : <span>{data.team}</span>
                }
              </Field>
              <Field label="직책">
                {editing
                  ? <input className={styles.input} value={form.position || ''} onChange={(e) => handleChange('position', e.target.value)} />
                  : <span>{data.position || '-'}</span>
                }
              </Field>
              <Field label="입사일">
                {editing
                  ? <input className={styles.input} type="date" value={form.joinDate || ''} onChange={(e) => handleChange('joinDate', e.target.value)} />
                  : <span>{data.joinDate || '-'}</span>
                }
              </Field>
            </div>
          </section>

          {/* 개인 정보 */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>개인 정보</h2>
            <div className={styles.grid}>
              <Field label="생년월일">
                {editing
                  ? <input className={styles.input} value={form.birthDate || ''} onChange={(e) => handleChange('birthDate', e.target.value)} />
                  : <span>{data.birthDate || '-'}</span>
                }
              </Field>
              <Field label="성별">
                {editing
                  ? <select className={styles.select} value={form.gender || ''} onChange={(e) => handleChange('gender', e.target.value)}>
                      <option value="">선택</option>
                      {GENDERS.map((g) => <option key={g}>{g}</option>)}
                    </select>
                  : <span>{data.gender || '-'}</span>
                }
              </Field>
              <Field label="혈액형">
                {editing
                  ? <select className={styles.select} value={form.bloodType || ''} onChange={(e) => handleChange('bloodType', e.target.value)}>
                      <option value="">선택</option>
                      {BLOOD_TYPES.map((b) => <option key={b}>{b}</option>)}
                    </select>
                  : <span>{data.bloodType || '-'}</span>
                }
              </Field>
              <Field label="비상연락망">
                {editing
                  ? <input className={styles.input} value={form.emergencyContact || ''} onChange={(e) => handleChange('emergencyContact', e.target.value)} />
                  : <span>{data.emergencyContact || '-'}</span>
                }
              </Field>
              <Field label="주소" colSpan>
                {editing
                  ? <input className={styles.input} value={form.address || ''} onChange={(e) => handleChange('address', e.target.value)} />
                  : <span>{data.address || '-'}</span>
                }
              </Field>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children, colSpan }) {
  return (
    <div className={colSpan ? styles.fieldFull : styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <div className={styles.fieldValue}>{children}</div>
    </div>
  )
}
