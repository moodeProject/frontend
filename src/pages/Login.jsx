import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { loginApi } from '../api/auth';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ id: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await loginApi(form.id, form.password);
      localStorage.setItem('safehelmet_current_admin', JSON.stringify(user));
      navigate('/');
    } catch (err) {
      setError(err.message || '아이디 또는 비밀번호를 확인해주세요.');
    } finally {
      setLoading(false);
    }
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
        <button className="auth-primary" type="submit" disabled={loading}>
          {loading ? '로그인 중...' : '로그인'}
        </button>

        <div className="auth-links auth-links-three">
          <Link to="/find-id">아이디 찾기</Link><i/>
          <Link to="/find-password">비밀번호 찾기</Link><i/>
          <Link to="/signup">회원가입</Link>
        </div>
      </form>
    </AuthLayout>
  );
}
