import { useState } from 'react';
import { Bell, Camera, Check, KeyRound, Link2, Mail, MapPin, Phone, Radio, RefreshCw, ShieldCheck, UserRound } from 'lucide-react';
import { WorkerScaffold } from '../../components/WorkerMobileUI';
import { getWorkerProfile, saveWorkerProfile } from '../../utils/workerProfile';

export default function WorkerSettings() {
  const [push, setPush] = useState(true);
  const [locationShare, setLocationShare] = useState(true);
  const [profile, setProfile] = useState(getWorkerProfile);
  const [form, setForm] = useState(() => ({
    name: profile.name || '',
    email: profile.email || '',
    phone: profile.phone || '',
    department: profile.department || '',
    emergencyContact: profile.emergencyContact || '',
    location: profile.location || '',
    photo: profile.photo || '',
  }));
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [helmetBusy, setHelmetBusy] = useState(false);
  const [helmetMessage, setHelmetMessage] = useState('');

  const change = (key) => (e) => setForm((v) => ({ ...v, [key]: e.target.value }));

  const onImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setProfileMessage('프로필 이미지는 2MB 이하만 등록할 수 있습니다.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((v) => ({ ...v, photo: String(reader.result || '') }));
    reader.readAsDataURL(file);
  };

  const saveProfile = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      setProfileMessage('이름과 연락처를 입력해주세요.');
      return;
    }
    const updated = { ...profile, ...form };
    saveWorkerProfile(updated);
    setProfile(updated);
    setProfileMessage('회원정보가 저장되었습니다.');
  };


  const reconnectHelmet = () => {
    setHelmetBusy(true);
    setHelmetMessage('헬멧과 센서 연결을 다시 확인하고 있습니다...');
    window.setTimeout(() => {
      const updated = { ...getWorkerProfile(), helmetConnected: true, sensorConnected: true, helmetLastConnectedAt: new Date().toISOString() };
      saveWorkerProfile(updated);
      setProfile(updated);
      try {
        const helmetKey = 'safehelmet-helmets-v1';
        const helmets = JSON.parse(localStorage.getItem(helmetKey) || '[]');
        if (helmets.length) {
          const nextHelmets = helmets.map((helmet) => helmet.helmetNumber === updated.helmetNo ? {
            ...helmet,
            workerName: updated.name || helmet.workerName,
            sensorConnected: true,
            lastCommunication: '방금 전',
            status: helmet.workerId ? 'inUse' : 'standby',
          } : helmet);
          localStorage.setItem(helmetKey, JSON.stringify(nextHelmets));
        }
      } catch {}
      setHelmetBusy(false);
      setHelmetMessage(`${updated.helmetNo || 'H-002'} 헬멧과 센서가 재연결되었습니다.`);
      localStorage.setItem('safehelmet_worker_current_status', localStorage.getItem('safehelmet_worker_current_status') || '근무 중');
      window.dispatchEvent(new Event('safehelmet-worker-helmet-reconnected'));
      window.dispatchEvent(new Event('safehelmet-helmets-updated'));
    }, 650);
  };

  const changePassword = (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordMessage('');
    if (passwords.current !== profile.password) return setPasswordError('현재 비밀번호가 일치하지 않습니다.');
    if (passwords.next.length < 4) return setPasswordError('새 비밀번호는 4자 이상 입력해주세요.');
    if (passwords.next !== passwords.confirm) return setPasswordError('새 비밀번호 확인이 일치하지 않습니다.');
    const updated = { ...profile, password: passwords.next };
    saveWorkerProfile(updated);
    setProfile(updated);
    setPasswords({ current: '', next: '', confirm: '' });
    setPasswordMessage('비밀번호가 변경되었습니다.');
  };

  return (
    <WorkerScaffold active="home" title="설정" back>
      <form className="worker-white-card worker-profile-edit-card" onSubmit={saveProfile}>
        <div className="worker-card-title"><strong>회원정보</strong><span className="worker-profile-edit-sub">로그인한 내 정보를 수정합니다</span></div>
        <div className="worker-profile-photo-row">
          <div className="worker-profile-photo">
            {form.photo ? <img src={form.photo} alt="프로필" /> : <UserRound size={31}/>} 
          </div>
          <label className="worker-profile-photo-button"><Camera size={15}/> 사진 변경<input type="file" accept="image/*" onChange={onImage}/></label>
        </div>
        <label className="worker-profile-field"><span>사번</span><input value={profile.employeeNo || ''} disabled/></label>
        <label className="worker-profile-field"><span>이름 *</span><input value={form.name} onChange={change('name')}/></label>
        <label className="worker-profile-field"><span><Mail size={13}/> 이메일</span><input type="email" value={form.email} onChange={change('email')} placeholder="example@safehelmet.kr"/></label>
        <label className="worker-profile-field"><span><Phone size={13}/> 연락처 *</span><input value={form.phone} onChange={change('phone')} placeholder="010-0000-0000"/></label>
        <label className="worker-profile-field"><span>소속 / 부서</span><input value={form.department} onChange={change('department')}/></label>
        <label className="worker-profile-field"><span>비상 연락처</span><input value={form.emergencyContact} onChange={change('emergencyContact')} placeholder="010-0000-0000"/></label>
        <label className="worker-profile-field"><span><MapPin size={13}/> 기본 작업 위치</span><input value={form.location} onChange={change('location')}/></label>
        {profileMessage && <div className={`worker-profile-message ${profileMessage.includes('저장') ? 'success' : 'error'}`}><Check size={13}/>{profileMessage}</div>}
        <button className="worker-primary-btn" type="submit">회원정보 저장</button>
      </form>

      <form className="worker-white-card worker-profile-edit-card" onSubmit={changePassword}>
        <div className="worker-card-title"><strong>비밀번호 변경</strong><KeyRound size={17}/></div>
        <label className="worker-profile-field"><span>현재 비밀번호</span><input type="password" value={passwords.current} onChange={(e) => setPasswords((v) => ({ ...v, current: e.target.value }))}/></label>
        <label className="worker-profile-field"><span>새 비밀번호</span><input type="password" value={passwords.next} onChange={(e) => setPasswords((v) => ({ ...v, next: e.target.value }))}/></label>
        <label className="worker-profile-field"><span>새 비밀번호 확인</span><input type="password" value={passwords.confirm} onChange={(e) => setPasswords((v) => ({ ...v, confirm: e.target.value }))}/></label>
        {passwordError && <div className="worker-profile-message error">{passwordError}</div>}
        {passwordMessage && <div className="worker-profile-message success"><Check size={13}/>{passwordMessage}</div>}
        <button className="worker-profile-password-btn" type="submit">비밀번호 변경</button>
      </form>

      <section className="worker-white-card worker-helmet-reconnect-card">
        <div className="worker-card-title"><strong>안전모 연결</strong><span>{profile.helmetNo || 'H-002'}</span></div>
        <div className="worker-helmet-reconnect-state"><span><ShieldCheck size={18}/> 현재 상태</span><b className={profile.helmetConnected === false ? 'warn' : 'ok'}>{profile.helmetConnected === false ? '연결 끊김' : '연결됨'}</b></div>
        <button type="button" className="worker-helmet-reconnect-btn" onClick={reconnectHelmet} disabled={helmetBusy}>{helmetBusy ? <RefreshCw size={16} className="spin"/> : <Link2 size={16}/>} {helmetBusy ? '재연결 중...' : '헬멧 재연결'}</button>
        {helmetMessage && <p className="worker-helmet-reconnect-message">{helmetMessage}</p>}
      </section>

      <section className="worker-white-card worker-settings-card">
        <h3>서비스 설정</h3>
        <label><span><Bell size={18}/>위험 알림</span><input type="checkbox" checked={push} onChange={(e) => setPush(e.target.checked)}/></label>
        <label><span><MapPin size={18}/>위치 공유</span><input type="checkbox" checked={locationShare} onChange={(e) => setLocationShare(e.target.checked)}/></label>
        <div><span><Radio size={18}/>센서 연결</span><b className="ok">정상</b></div>
        <div><span><ShieldCheck size={18}/>안전모</span><b className="ok">{profile.helmetNo || 'H-002'}</b></div>
      </section>
    </WorkerScaffold>
  );
}
