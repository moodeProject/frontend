import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from './AuthLayout'
import styles from './auth.module.css'

function EyeOpen() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <ellipse cx="12" cy="12" rx="10" ry="7" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
function EyeOff() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M2 2l20 20" />
      <path d="M6.7 6.7A9.8 9.8 0 0 0 2 12s3.6 7 10 7a9.9 9.9 0 0 0 5.3-1.7" />
      <path d="M10.4 10.4A3 3 0 0 0 12 15a3 3 0 0 0 3-3 3 3 0 0 0-.4-1.6" />
      <path d="M17.5 17.5A9.8 9.8 0 0 0 22 12S18.4 5 12 5a9.9 9.9 0 0 0-5 1.4" />
    </svg>
  )
}

export default function ResetPassword() {
  const navigate = useNavigate()
  const [phone, setPhone]       = useState('')
  const [code, setCode]         = useState('')
  const [newPw, setNewPw]       = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showNew, setShowNew]   = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [error, setError]       = useState('')

  function handleSendCode() {
    if (!phone.trim()) { setError('연락처를 입력하세요.'); return }
    // TODO: 실제 SMS 발송 API로 교체
    setCodeSent(true)
    setError('')
    alert('인증번호가 발송되었습니다. (임시: 1234)')
  }

  function handleSubmit() {
    if (!codeSent || code !== '1234') { setError('인증번호가 올바르지 않습니다.'); return }
    if (newPw.length < 6) { setError('비밀번호는 6자 이상 입력하세요.'); return }
    if (newPw !== confirmPw) { setError('새 비밀번호가 일치하지 않습니다.'); return }
    // TODO: 실제 비밀번호 변경 API로 교체
    alert('비밀번호가 변경되었습니다.')
    navigate('/login')
  }

  return (
    <AuthLayout>
      <div className={styles.box}>
        <h1 className={styles.title}>비밀번호 재설정</h1>

        <div className={styles.fieldRow}>
          <span className={styles.label}>연락처</span>
          <input
            className={styles.input}
            placeholder="연락처를 입력하세요."
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setError('') }}
          />
        </div>

        <div className={styles.fieldRow}>
          <span className={styles.label}>인증번호</span>
          <input
            className={styles.input}
            placeholder="인증번호를 입력해주세요."
            value={code}
            onChange={(e) => { setCode(e.target.value); setError('') }}
          />
          <button className={styles.codeBtn} onClick={handleSendCode}>
            인증번호<br />받기
          </button>
        </div>

        <div className={styles.fieldRow}>
          <span className={styles.label}>새 비밀번호</span>
          <div className={styles.pwWrap}>
            <input
              className={styles.input}
              type={showNew ? 'text' : 'password'}
              placeholder="비밀번호를 입력하세요."
              value={newPw}
              onChange={(e) => { setNewPw(e.target.value); setError('') }}
            />
            <button className={styles.eyeBtn} onClick={() => setShowNew((v) => !v)} type="button">
              {showNew ? <EyeOpen /> : <EyeOff />}
            </button>
          </div>
        </div>

        <div className={styles.fieldRow}>
          <span className={styles.label}>비밀번호 확인</span>
          <div className={styles.pwWrap}>
            <input
              className={styles.input}
              type={showConfirm ? 'text' : 'password'}
              placeholder="비밀번호를 다시 입력해주세요."
              value={confirmPw}
              onChange={(e) => { setConfirmPw(e.target.value); setError('') }}
            />
            <button className={styles.eyeBtn} onClick={() => setShowConfirm((v) => !v)} type="button">
              {showConfirm ? <EyeOpen /> : <EyeOff />}
            </button>
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button className={styles.submitBtn} onClick={handleSubmit}>
          비밀번호 변경
        </button>

        <button className={styles.backLink} onClick={() => navigate('/login')}>
          로그인으로 돌아가기
        </button>
      </div>
    </AuthLayout>
  )
}
