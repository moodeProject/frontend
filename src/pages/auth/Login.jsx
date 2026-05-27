import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from './AuthLayout'
import { useAuth } from '../../context/AuthContext'
import styles from './Login.module.css'

export default function Login() {
  const navigate  = useNavigate()
  const { login } = useAuth()
  const [id, setId]           = useState('')
  const [pw, setPw]           = useState('')
  const [showPw, setShowPw]   = useState(false)
  const [error, setError]     = useState('')

  function handleLogin() {
    if (!id.trim() || !pw.trim()) {
      setError('아이디와 비밀번호를 입력하세요.')
      return
    }
    // TODO: 실제 API 인증으로 교체 → loginApi(id, pw) from src/api/auth.js
    const ok = login(id, pw)
    if (ok) {
      navigate('/')
    } else {
      setError('아이디 또는 비밀번호가 올바르지 않습니다.')
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <AuthLayout>
      <div className={styles.box}>
        <h1 className={styles.title}>로그인</h1>

        <div className={styles.formRow}>
          {/* ID / PW 필드 */}
          <div className={styles.fields}>
            <div className={styles.field}>
              <span className={styles.label}>ID</span>
              <input
                className={styles.input}
                placeholder="아이디를 입력하세요."
                value={id}
                onChange={(e) => { setId(e.target.value); setError('') }}
                onKeyDown={handleKeyDown}
                autoComplete="username"
              />
            </div>
            <div className={styles.field}>
              <span className={styles.label}>PW</span>
              <div className={styles.pwWrap}>
                <input
                  className={styles.input}
                  type={showPw ? 'text' : 'password'}
                  placeholder="비밀번호를 입력하세요."
                  value={pw}
                  onChange={(e) => { setPw(e.target.value); setError('') }}
                  onKeyDown={handleKeyDown}
                  autoComplete="current-password"
                />
                <button
                  className={styles.eyeBtn}
                  onClick={() => setShowPw((v) => !v)}
                  tabIndex={-1}
                  type="button"
                >
                  {showPw ? <EyeOpen /> : <EyeOff />}
                </button>
              </div>
            </div>
          </div>

          {/* LOGIN 버튼 */}
          <button className={styles.loginBtn} onClick={handleLogin}>
            LOGIN
          </button>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {/* 하단 링크 */}
        <div className={styles.links}>
          <button className={styles.link} onClick={() => navigate('/find-id')}>아이디 찾기</button>
          <span className={styles.divider}>|</span>
          <button className={styles.link} onClick={() => navigate('/reset-password')}>비밀번호 찾기</button>
          <span className={styles.divider}>|</span>
          <button className={styles.link} onClick={() => navigate('/register')}>회원가입</button>
        </div>
      </div>
    </AuthLayout>
  )
}

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
