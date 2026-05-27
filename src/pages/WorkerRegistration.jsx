import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { TEAMS } from '../data/mockWorkers'
import { useWorkers } from '../context/WorkerContext'
import styles from './WorkerRegistration.module.css'

const BLOOD_TYPES = ['선택', 'A', 'B', 'O', 'AB']
const GENDERS = ['선택', '남성', '여성']

const initialForm = {
  name: '',
  helmetId: '',
  employeeId: '',
  position: '',
  phone: '010-0000-0000',
  email: '',
  team: '',
  joinDate: new Date().toISOString().slice(0, 10),
  birthDate: '2001.01.01',
  gender: '선택',
  emergencyContact: '010-0000-0000',
  bloodType: '선택',
  address: '',
}

export default function WorkerRegistration() {
  const navigate = useNavigate()
  const { addWorker } = useWorkers()
  const fileRef = useRef(null)
  const [form, setForm] = useState(initialForm)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [errors, setErrors] = useState({})

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  function handleAvatarUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setAvatarUrl(url)
  }

  function validate() {
    const required = { name: '이름', helmetId: '안전모 ID', employeeId: '사번', phone: '연락처', team: '팀' }
    const next = {}
    for (const [key, label] of Object.entries(required)) {
      if (!form[key].trim()) next[key] = `${label}을(를) 입력해주세요.`
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    // TODO: 실제 API 호출로 교체 — addWorker를 API POST 함수로 변경
    addWorker({ ...form, avatarUrl })
    navigate('/workers')
  }

  return (
    <div className={styles.page}>
      {/* 브레드크럼 */}
      <div className={styles.breadcrumb}>
        <span className={styles.breadcrumbLink} onClick={() => navigate('/workers')}>
          작업자 관리
        </span>
        <span className={styles.breadcrumbSep}>&gt;</span>
        <span>작업자 등록</span>
      </div>

      <h1 className={styles.title}>작업자 등록</h1>
      <p className={styles.subtitle}>새로운 작업자 정보를 입력하여 등록할 수 있습니다.</p>

      {/* 기본 정보 */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>기본 정보</h2>
        <div className={styles.sectionBody}>
          {/* 아바타 */}
          <div className={styles.avatarArea}>
            <div className={styles.avatarCircle}>
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" className={styles.avatarImg} />
                : <div className={styles.avatarPlaceholder}>👤</div>
              }
            </div>
            <div className={styles.avatarActions}>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarUpload}
              />
              <button className={styles.avatarBtn} onClick={() => fileRef.current.click()}>업로드</button>
              <button className={styles.avatarBtn} onClick={() => setAvatarUrl(null)}>삭제</button>
            </div>
          </div>

          {/* 입력 그리드 */}
          <div className={styles.grid}>
            <Field label="이름" required error={errors.name}>
              <input
                className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                placeholder="이름을 입력하세요."
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </Field>

            <Field label="안전모 ID" required error={errors.helmetId}>
              <input
                className={`${styles.input} ${errors.helmetId ? styles.inputError : ''}`}
                placeholder="ID를 입력하세요."
                value={form.helmetId}
                onChange={(e) => handleChange('helmetId', e.target.value)}
              />
            </Field>

            <Field label="사번" required error={errors.employeeId}>
              <input
                className={`${styles.input} ${errors.employeeId ? styles.inputError : ''}`}
                placeholder="사번을 입력하세요"
                value={form.employeeId}
                onChange={(e) => handleChange('employeeId', e.target.value)}
              />
            </Field>

            <Field label="직책">
              <input
                className={styles.input}
                placeholder="직책을 입력하세요"
                value={form.position}
                onChange={(e) => handleChange('position', e.target.value)}
              />
            </Field>

            <Field label="연락처" required error={errors.phone}>
              <input
                className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
                placeholder="010-0000-0000"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </Field>

            <Field label="이메일">
              <input
                className={styles.input}
                placeholder="이메일을 입력하세요"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </Field>

            <Field label="팀" required error={errors.team}>
              <select
                className={`${styles.select} ${errors.team ? styles.inputError : ''}`}
                value={form.team}
                onChange={(e) => handleChange('team', e.target.value)}
              >
                <option value="">팀을 선택하세요</option>
                {TEAMS.filter((t) => t !== '전체 팀').map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>

            <Field label="입사일">
              <input
                className={styles.input}
                type="date"
                value={form.joinDate}
                onChange={(e) => handleChange('joinDate', e.target.value)}
              />
            </Field>
          </div>
        </div>
      </section>

      {/* 추가 정보 */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>추가 정보</h2>
        <div className={styles.additionalGrid}>
          <Field label="생년월일">
            <div className={styles.dateInputWrap}>
              <input
                className={styles.input}
                placeholder="2001.01.01"
                value={form.birthDate}
                onChange={(e) => handleChange('birthDate', e.target.value)}
              />
              <span className={styles.calIcon}>📅</span>
            </div>
          </Field>

          <Field label="성별">
            <select
              className={styles.select}
              value={form.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
            >
              {GENDERS.map((g) => <option key={g}>{g}</option>)}
            </select>
          </Field>

          <Field label="비상연락망">
            <input
              className={styles.input}
              placeholder="010-0000-0000"
              value={form.emergencyContact}
              onChange={(e) => handleChange('emergencyContact', e.target.value)}
            />
          </Field>

          <Field label="혈액형">
            <select
              className={styles.select}
              value={form.bloodType}
              onChange={(e) => handleChange('bloodType', e.target.value)}
            >
              {BLOOD_TYPES.map((b) => <option key={b}>{b}</option>)}
            </select>
          </Field>

          <Field label="주소" colSpan>
            <input
              className={styles.input}
              placeholder="주소를 입력하세요."
              value={form.address}
              onChange={(e) => handleChange('address', e.target.value)}
            />
          </Field>
        </div>
      </section>

      {/* 하단 버튼 */}
      <div className={styles.actions}>
        <button className={styles.cancelBtn} onClick={() => navigate('/workers')}>취소</button>
        <button className={styles.submitBtn} onClick={handleSubmit}>등록하기</button>
      </div>
    </div>
  )
}

function Field({ label, required, error, children, colSpan }) {
  return (
    <div className={colSpan ? styles.fieldColSpan : styles.field}>
      <label className={styles.label}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
      {children}
      {error && <p className={styles.errorMsg}>{error}</p>}
    </div>
  )
}
