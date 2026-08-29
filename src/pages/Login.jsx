import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';

const ACCOUNT_KEY = 'safehelmet_admin_accounts';

function getAccounts() {
  const saved = JSON.parse(localStorage.getItem(ACCOUNT_KEY) || '[]');
  if (saved.length) return saved;
  const defaults = [{ id: 'admin', password: 'admin1234!', name: '관리자', email: 'admin@safehelmet.kr', phone: '010-0000-0000', department: '안전관리팀', approved: true }];
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(defaults));
  return defaults;
}

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ id: '', password: '' });
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const account = getAccounts().find(a => a.id === form.id && a.password === form.password);
    if (!account) return setError('아이디 또는 비밀번호를 확인해주세요.');
    if (account.approved === false) return setError('관리자 승인 대기 중인 계정입니다.');
    localStorage.setItem('safehelmet_current_admin', JSON.stringify(account));
    navigate('/');
  };

  return (
    <AuthLayout>
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-card-head">
          <h1>관리자 로그인</h1>
          <p>안전관리 시스템에 로그인하세요</p>
        </div>

        <label className="auth-field">
          <span>아이디</span>
          <input value={form.id} onChange={e => setForm(v => ({...v, id: e.target.value}))} placeholder="관리자 아이디를 입력하세요" />
        </label>
        <label className="auth-field">
          <span>비밀번호</span>
          <input type="password" value={form.password} onChange={e => setForm(v => ({...v, password: e.target.value}))} placeholder="비밀번호를 입력하세요" />
        </label>
        {error && <div className="auth-error">{error}</div>}
        <button className="auth-primary" type="submit">로그인</button>

        <div className="auth-links auth-links-three">
          <Link to="/find-id">아이디 찾기</Link><i/>
          <Link to="/find-password">비밀번호 찾기</Link><i/>
          <Link to="/signup">회원가입</Link>
        </div>
      </form>
      <div className="auth-demo-hint">데모 계정: admin / admin1234!</div>
    </AuthLayout>
  );
}
