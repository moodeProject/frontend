import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';

const ACCOUNT_KEY = 'safehelmet_admin_accounts';
const initial = { id:'', password:'', passwordConfirm:'', employeeNumber:'', name:'', email:'', phone:'', department:'' };

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const update = (key) => (e) => setForm(v => ({...v, [key]: e.target.value}));

  const submit = (e) => {
    e.preventDefault();
    setError('');
    if (form.id.trim().length < 4 || !/^[A-Za-z0-9]+$/.test(form.id)) return setError('아이디는 영문·숫자 조합 4자 이상으로 입력해주세요.');
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password) || !/[^A-Za-z0-9]/.test(form.password)) return setError('비밀번호는 8자 이상이며 영문·숫자·특수문자를 포함해야 합니다.');
    if (form.password !== form.passwordConfirm) return setError('비밀번호 확인이 일치하지 않습니다.');
    if (!form.employeeNumber.trim() || !form.name.trim() || !form.email.trim()) return setError('필수 정보를 입력해주세요.');
    const accounts = JSON.parse(localStorage.getItem(ACCOUNT_KEY) || '[]');
    if (accounts.some(a => a.id === form.id)) return setError('이미 사용 중인 아이디입니다.');
    if (accounts.some(a => a.employeeNumber === form.employeeNumber.trim())) return setError('이미 등록된 관리자 사번입니다.');
    if (accounts.some(a => a.email.toLowerCase() === form.email.toLowerCase())) return setError('이미 등록된 이메일입니다.');
    accounts.push({...form, approved:false});
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(accounts));
    alert('회원가입 신청이 완료되었습니다. 관리자 승인 후 로그인할 수 있습니다.');
    navigate('/login');
  };

  return (
    <AuthLayout wide>
      <form className="auth-card signup-card" onSubmit={submit}>
        <div className="auth-card-head">
          <h1>관리자 회원가입</h1>
          <p>현장 안전관리 시스템 관리자 계정을 등록하세요</p>
        </div>

        <div className="auth-section-title">계정 정보</div>
        <label className="auth-field"><span>아이디 *</span><input value={form.id} onChange={update('id')} placeholder="영문·숫자 조합 4자 이상" /></label>
        <label className="auth-field"><span>비밀번호 *</span><input type="password" value={form.password} onChange={update('password')} placeholder="8자 이상, 영문·숫자·특수문자 포함" /><small>8자 이상, 영문·숫자·특수문자를 포함해주세요.</small></label>
        <label className="auth-field"><span>비밀번호 확인 *</span><input type="password" value={form.passwordConfirm} onChange={update('passwordConfirm')} placeholder="비밀번호를 다시 입력하세요" /></label>

        <div className="auth-divider"/>
        <div className="auth-section-title">담당자 정보</div>
        <label className="auth-field"><span>관리자 사번 *</span><input value={form.employeeNumber} onChange={update('employeeNumber')} placeholder="예: ADM-001" /></label>
        <label className="auth-field"><span>이름 *</span><input value={form.name} onChange={update('name')} placeholder="실명을 입력하세요" /></label>
        <label className="auth-field"><span>이메일 *</span><input type="email" value={form.email} onChange={update('email')} placeholder="업무용 이메일 주소" /></label>
        <label className="auth-field"><span>연락처</span><input value={form.phone} onChange={update('phone')} placeholder="010-0000-0000" /></label>
        <label className="auth-field"><span>소속 / 부서</span><input value={form.department} onChange={update('department')} placeholder="회사명 또는 부서명" /></label>

        {error && <div className="auth-error">{error}</div>}
        <button className="auth-primary" type="submit">회원가입 신청</button>
        <Link className="auth-secondary" to="/login">로그인으로 돌아가기</Link>
        <p className="auth-approval-note">가입 후 관리자 승인이 완료되면 로그인이 가능합니다.</p>
      </form>
    </AuthLayout>
  );
}
