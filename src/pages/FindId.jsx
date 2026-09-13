import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';

const ACCOUNT_KEY = 'safehelmet_admin_accounts';

export default function FindId() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [result, setResult] = useState(null);

  const submit = (e) => {
    e.preventDefault();
    const accounts = JSON.parse(localStorage.getItem(ACCOUNT_KEY) || '[]');
    const account = accounts.find(a => a.name === name && a.email.toLowerCase() === email.trim().toLowerCase());
    setResult(account ? `등록된 아이디는 ${account.id} 입니다.` : '일치하는 관리자 계정을 찾을 수 없습니다.');
  };

  return (
    <AuthLayout>
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-card-head">
          <h1>아이디 찾기</h1>
          <p>등록된 이름과 이메일로 아이디를 확인하세요</p>
        </div>
        <label className="auth-field"><span>이름</span><input value={name} onChange={e=>setName(e.target.value)} placeholder="등록된 이름을 입력하세요" /></label>
        <label className="auth-field"><span>이메일</span><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="등록된 이메일을 입력하세요" /></label>
        {result && <div className={`auth-result ${result.includes('찾을 수') ? 'error' : ''}`}>{result}</div>}
        <button className="auth-primary" type="submit">아이디 찾기</button>
        <div className="auth-links"><Link to="/login">로그인</Link><i/><Link to="/find-password">비밀번호 찾기</Link></div>
      </form>
    </AuthLayout>
  );
}
