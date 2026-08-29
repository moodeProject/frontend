import { BadgeCheck, Check, KeyRound, LogOut, Mail, Phone, ShieldCheck, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopHeader from '../components/TopHeader';

const ACCOUNT_KEY = 'safehelmet_admin_accounts';
const CURRENT_KEY = 'safehelmet_current_admin';

function getCurrent() {
  try {
    const saved = JSON.parse(localStorage.getItem(CURRENT_KEY) || '{}');
    return { employeeNumber: 'ADM-001', ...saved };
  } catch {
    return { employeeNumber: 'ADM-001' };
  }
}

export default function MyPage() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(getCurrent);
  const [form, setForm] = useState(() => ({
    id: admin.id || '',
    employeeNumber: admin.employeeNumber || 'ADM-001',
    name: admin.name || '',
    email: admin.email || '',
    phone: admin.phone || '',
    department: admin.department || '',
  }));
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const saveProfile = (e) => {
    e.preventDefault();
    setProfileMessage('');
    const nextId = form.id.trim();
    const nextEmployeeNumber = admin.employeeNumber || 'ADM-001';
    if (nextId.length < 4 || !/^[A-Za-z0-9_-]+$/.test(nextId)) return setProfileMessage('아이디는 영문·숫자·-_ 조합 4자 이상으로 입력해주세요.');
    if (!form.name.trim() || !form.email.trim()) return setProfileMessage('이름과 이메일을 입력해주세요.');

    const accounts = JSON.parse(localStorage.getItem(ACCOUNT_KEY) || '[]');
    if (accounts.some((item) => item.id !== admin.id && item.id === nextId)) return setProfileMessage('이미 사용 중인 아이디입니다.');

    const updated = {
      ...admin,
      ...form,
      id: nextId,
      employeeNumber: nextEmployeeNumber,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      department: form.department.trim(),
    };
    localStorage.setItem(CURRENT_KEY, JSON.stringify(updated));
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(accounts.map((item) => item.id === admin.id ? { ...item, ...updated } : item)));
    setAdmin(updated);
    setForm((value) => ({ ...value, id: updated.id, employeeNumber: updated.employeeNumber }));
    window.dispatchEvent(new CustomEvent('safehelmet-admin-profile-updated', { detail: updated }));
    setProfileMessage('관리자 정보가 저장되었습니다.');
  };

  const changePassword = (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordMessage('');
    if (passwords.current !== admin.password) return setPasswordError('현재 비밀번호가 일치하지 않습니다.');
    if (passwords.next.length < 8) return setPasswordError('새 비밀번호는 8자 이상 입력해주세요.');
    if (passwords.next !== passwords.confirm) return setPasswordError('새 비밀번호 확인이 일치하지 않습니다.');
    const updated = { ...admin, password: passwords.next };
    localStorage.setItem(CURRENT_KEY, JSON.stringify(updated));
    const accounts = JSON.parse(localStorage.getItem(ACCOUNT_KEY) || '[]');
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(accounts.map((item) => item.id === admin.id ? { ...item, password: passwords.next } : item)));
    setAdmin(updated);
    window.dispatchEvent(new CustomEvent('safehelmet-admin-profile-updated', { detail: updated }));
    setPasswords({ current: '', next: '', confirm: '' });
    setPasswordMessage('비밀번호가 변경되었습니다.');
  };

  const logout = () => {
    localStorage.removeItem(CURRENT_KEY);
    navigate('/login', { replace: true });
  };

  return (
    <>
      <TopHeader title="마이페이지" subtitle="로그인한 관리자 회원정보 및 보안 설정" />
      <div className="page-body mypage-page">
        <section className="panel my-profile-summary">
          <div className="my-avatar">{(admin.name || '관').slice(0, 1)}</div>
          <div>
            <div className="my-name-row"><h2>{admin.name || '관리자'}</h2><span><ShieldCheck size={12}/> 승인 완료</span></div>
            <p>{admin.employeeNumber || 'ADM-001'} · {admin.department || '안전관리팀'} · {admin.email || 'admin@safehelmet.kr'}</p>
          </div>
          <button className="mypage-logout-top" onClick={logout}><LogOut size={14}/> 로그아웃</button>
        </section>

        <div className="mypage-grid">
          <form className="panel mypage-card" onSubmit={saveProfile}>
            <div className="mypage-card-head"><span className="mypage-head-icon"><UserRound size={17}/></span><div><h3>회원정보</h3><p>로그인한 관리자 정보를 확인하고 수정합니다.</p></div></div>
            <div className="mypage-two-col">
              <label className="mypage-field"><span>아이디 *</span><input value={form.id} onChange={(e) => setForm((v) => ({ ...v, id: e.target.value }))} placeholder="관리자 아이디"/></label>
              <label className="mypage-field"><span><BadgeCheck size={12}/> 관리자 사번</span><input value={form.employeeNumber} disabled readOnly/><small className="mypage-fixed-help">관리자 사번은 계정 생성 후 변경할 수 없습니다.</small></label>
            </div>
            <label className="mypage-field"><span>이름 *</span><input value={form.name} onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))}/></label>
            <label className="mypage-field"><span><Mail size={12}/> 이메일 *</span><input type="email" value={form.email} onChange={(e) => setForm((v) => ({ ...v, email: e.target.value }))}/></label>
            <label className="mypage-field"><span><Phone size={12}/> 연락처</span><input value={form.phone} onChange={(e) => setForm((v) => ({ ...v, phone: e.target.value }))} placeholder="010-0000-0000"/></label>
            <label className="mypage-field"><span>소속 / 부서</span><input value={form.department} onChange={(e) => setForm((v) => ({ ...v, department: e.target.value }))}/></label>
            {profileMessage && <div className={`mypage-message ${profileMessage.includes('저장') ? 'success' : 'error'}`}>{profileMessage.includes('저장') && <Check size={12}/>} {profileMessage}</div>}
            <button className="mypage-save" type="submit">정보 저장</button>
          </form>

          <form className="panel mypage-card" onSubmit={changePassword}>
            <div className="mypage-card-head"><span className="mypage-head-icon security"><KeyRound size={17}/></span><div><h3>비밀번호 변경</h3><p>계정 보안을 위해 비밀번호를 변경할 수 있습니다.</p></div></div>
            <label className="mypage-field"><span>현재 비밀번호</span><input type="password" value={passwords.current} onChange={(e) => setPasswords((v) => ({ ...v, current: e.target.value }))} placeholder="현재 비밀번호"/></label>
            <label className="mypage-field"><span>새 비밀번호</span><input type="password" value={passwords.next} onChange={(e) => setPasswords((v) => ({ ...v, next: e.target.value }))} placeholder="8자 이상 입력"/></label>
            <label className="mypage-field"><span>새 비밀번호 확인</span><input type="password" value={passwords.confirm} onChange={(e) => setPasswords((v) => ({ ...v, confirm: e.target.value }))} placeholder="새 비밀번호 다시 입력"/></label>
            {passwordError && <div className="mypage-message error">{passwordError}</div>}
            {passwordMessage && <div className="mypage-message success"><Check size={12}/>{passwordMessage}</div>}
            <button className="mypage-save" type="submit">비밀번호 변경</button>
            <div className="mypage-security-note"><ShieldCheck size={15}/><span>비밀번호는 8자 이상으로 설정하고 다른 서비스와 다른 비밀번호 사용을 권장합니다.</span></div>
          </form>
        </div>
      </div>
    </>
  );
}
