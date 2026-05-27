import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from './AuthLayout'
import { ADMIN_ROLES } from '../../data/mockSettings'
import styles from './Register.module.css'

const REGISTER_LAYOUT_CSS = {
  /* 오른쪽 패널을 위에서부터 시작하도록 덮어씌움 */
}

export default function Register() {
  const navigate = useNavigate()
  const fileRef  = useRef(null)

  const [avatarUrl, setAvatarUrl]   = useState(null)
  const [showMenu, setShowMenu]     = useState(false)
  const [form, setForm] = useState({
    name: '', role: '', email: '', position: '',
    birthDate: '2001.01.01', emergency: '010-0000-0000', address: '',
  })
  const [errors, setErrors] = useState({})

  function handleChange(field, value) {
    setForm((p) => ({ ...p, [field]: value }))
    if (errors[field]) setErrors((p) => ({ ...p, [field]: '' }))
  }

  function handleAvatarUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setAvatarUrl(URL.createObjectURL(file))
    setShowMenu(false)
  }

  function validate() {
    const next = {}
    if (!form.name.trim())  next.name = '이름을 입력하세요.'
    if (!form.role)         next.role = '권한을 선택하세요.'
    if (!form.birthDate)    next.birthDate = '생년월일을 입력하세요.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    // TODO: 실제 회원가입 API로 교체
    alert('관리자 계정이 등록되었습니다.')
    navigate('/login')
  }

  return (
    <AuthLayout>
      <div className={styles.page}>
        <h1 className={styles.title}>관리자 회원가입</h1>

        {/* 기본 정보 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>기본 정보</h2>
          <div className={styles.sectionBody}>
            {/* 아바타 */}
            <div className={styles.avatarWrap}>
              <div
                className={styles.avatarCircle}
                onClick={() => setShowMenu((v) => !v)}
              >
                {avatarUrl
                  ? <img src={avatarUrl} alt="avatar" className={styles.avatarImg} />
                  : <div className={styles.avatarPlaceholder}>👤</div>
                }
              </div>

              {showMenu && (
                <div className={styles.avatarMenu}>
                  <button onClick={() => { setAvatarUrl(null); setShowMenu(false) }}>기본 설정</button>
                  <button onClick={() => { fileRef.current.click(); }}>업로드</button>
                  <button onClick={() => { setAvatarUrl(null); setShowMenu(false) }}>삭제</button>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
            </div>

            {/* 입력 필드 */}
            <div className={styles.grid}>
              <Field label="이름" required error={errors.name}>
                <input className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                  placeholder="이름을 입력하세요."
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                />
              </Field>

              <Field label="권한" required error={errors.role}>
                <select className={`${styles.select} ${errors.role ? styles.inputError : ''}`}
                  value={form.role}
                  onChange={(e) => handleChange('role', e.target.value)}
                >
                  <option value="">관리자 권한을 선택하세요.</option>
                  {ADMIN_ROLES.map((r) => <option key={r.role} value={r.role}>{r.label}</option>)}
                </select>
              </Field>

              <Field label="이메일">
                <input className={styles.input}
                  placeholder="이메일을 입력하세요."
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                />
              </Field>

              <Field label="직책">
                <input className={styles.input}
                  placeholder="직책을 입력하세요."
                  value={form.position}
                  onChange={(e) => handleChange('position', e.target.value)}
                />
              </Field>
            </div>
          </div>
        </section>

        {/* 추가 정보 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>추가 정보</h2>
          <div className={styles.additionalGrid}>
            <Field label="생년월일" required error={errors.birthDate}>
              <div className={styles.dateWrap}>
                <input className={`${styles.input} ${errors.birthDate ? styles.inputError : ''}`}
                  placeholder="2001.01.01"
                  value={form.birthDate}
                  onChange={(e) => handleChange('birthDate', e.target.value)}
                />
                <span className={styles.calIcon}>📅</span>
              </div>
            </Field>

            <Field label="비상연락망">
              <input className={styles.input}
                placeholder="010-0000-0000"
                value={form.emergency}
                onChange={(e) => handleChange('emergency', e.target.value)}
              />
            </Field>

            <Field label="주소" colSpan>
              <input className={styles.input}
                placeholder="주소를 입력하세요."
                value={form.address}
                onChange={(e) => handleChange('address', e.target.value)}
              />
            </Field>
          </div>
        </section>

        {/* 하단 버튼 */}
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={() => navigate('/login')}>취소</button>
          <button className={styles.submitBtn} onClick={handleSubmit}>회원가입</button>
        </div>
      </div>
    </AuthLayout>
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
