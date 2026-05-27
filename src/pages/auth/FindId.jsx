import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from './AuthLayout'
import styles from './auth.module.css'

export default function FindId() {
  const navigate = useNavigate()
  const [phone, setPhone]       = useState('')
  const [code, setCode]         = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [result, setResult]     = useState('')

  function handleSendCode() {
    if (!phone.trim()) return
    // TODO: 실제 SMS 발송 API로 교체
    setCodeSent(true)
    alert('인증번호가 발송되었습니다. (임시: 1234)')
  }

  function handleSubmit() {
    if (!codeSent || code !== '1234') {
      alert('인증번호가 올바르지 않습니다.')
      return
    }
    // TODO: 실제 아이디 조회 API로 교체
    setResult('해당 연락처로 등록된 아이디: admin01')
  }

  return (
    <AuthLayout>
      <div className={styles.box}>
        <h1 className={styles.title}>아이디 찾기</h1>

        <div className={styles.fieldRow}>
          <span className={styles.label}>연락처</span>
          <input
            className={styles.input}
            placeholder="연락처를 입력하세요."
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className={styles.fieldRow}>
          <span className={styles.label}>인증번호</span>
          <input
            className={styles.input}
            placeholder="인증번호를 입력해주세요."
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button className={styles.codeBtn} onClick={handleSendCode}>
            인증번호<br />받기
          </button>
        </div>

        {result && <p className={styles.successMsg}>{result}</p>}

        <button className={styles.submitBtn} onClick={handleSubmit}>
          아이디 찾기
        </button>

        <button className={styles.backLink} onClick={() => navigate('/login')}>
          로그인으로 돌아가기
        </button>
      </div>
    </AuthLayout>
  )
}
