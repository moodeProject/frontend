import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';

const ACCOUNT_KEY = 'safehelmet_admin_accounts';

export default function FindPassword() {
  const [id, setId] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const accounts = JSON.parse(localStorage.getItem(ACCOUNT_KEY) || '[]');
    const account = accounts.find(a => a.id === id && a.email.toLowerCase() === email.trim().toLowerCase());
    setMessage(account ? '등록된 이메일로 임시 비밀번호를 전송했습니다.' : '아이디와 이메일이 일치하는 계정을 찾을 수 없습니다.');
  };

  return (
    <AuthLayout>
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-card-head">
          <h1>비밀번호 찾기</h1>
          <p>등록된 아이디와 이메일로 임시 비밀번호를 받으세요</p>
        </div>
        <label className="auth-field"><span>아이디</span><input value={id} onChange={e=>setId(e.target.value)} placeholder="관리자 아이디를 입력하세요" /></label>
        <label className="auth-field"><span>이메일</span><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="등록된 이메일을 입력하세요" /></label>
        {message && <div className={`auth-result ${message.includes('찾을 수') ? 'error' : ''}`}>{message}</div>}
        <button className="auth-primary" type="submit">임시 비밀번호 전송</button>
        <div className="auth-links"><Link to="/login">로그인</Link><i/><Link to="/find-id">아이디 찾기</Link></div>
      </form>
    </AuthLayout>
  );
}
