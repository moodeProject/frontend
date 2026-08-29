import { useState } from 'react';
import { Eye, HardHat, HeartPulse, Shield, ShieldAlert } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { defaultWorkerProfile, ensureWorkerProfile, saveWorkerProfile } from '../../utils/workerProfile';

export default function WorkerLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [employeeNo, setEmployeeNo] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!employeeNo.trim() || !password.trim()) {
      setError('사번과 비밀번호를 입력해주세요.');
      return;
    }
    const profile = ensureWorkerProfile();
    const validEmployeeNo = employeeNo.trim() === profile.employeeNo;
    const validPassword = password === (profile.password || defaultWorkerProfile.password);
    if (!validEmployeeNo || !validPassword) {
      setError('사번 또는 비밀번호를 확인해주세요.');
      return;
    }
    saveWorkerProfile(profile);
    navigate(location.state?.from || '/worker/home', { replace: true });
  };

  return (
    <div className="worker-login-page">
      <section className="worker-login-hero">
        <div className="worker-login-logo"><Shield size={44} /></div>
        <h1>안전지킴이</h1>
        <p>산업현장 작업자<br />안전관리 시스템</p>
        <div className="worker-login-features">
          <span><HardHat size={17} />안전모 연동</span>
          <span><HeartPulse size={17} />건강 모니터링</span>
          <span><ShieldAlert size={17} />긴급 대응</span>
        </div>
      </section>
      <form className="worker-login-card" onSubmit={submit}>
        <h2>로그인</h2>
        <label>사번<input value={employeeNo} onChange={(e) => setEmployeeNo(e.target.value)} placeholder="사번을 입력하세요" /></label>
        <label>비밀번호
          <div className="worker-password-field">
            <input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호를 입력하세요" />
            <button type="button" onClick={() => setShow((v) => !v)}><Eye size={17} /></button>
          </div>
        </label>
        {error && <p className="worker-login-error">{error}</p>}
        <button className="worker-primary-btn" type="submit">로그인</button>
        <small>데모: WK-20241103 / 1234</small>
      </form>
    </div>
  );
}
