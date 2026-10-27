import { CheckCircle2, MapPin, Phone, Radio, ShieldAlert } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WorkerScaffold } from '../../components/WorkerMobileUI';
import { getMyHome, normalizeMyHome } from '../../api/myHome';
import { createSOS } from '../../api/sos';
import { getWorkerProfile } from '../../utils/workerProfile';

export default function WorkerFallAlert() {
  const navigate = useNavigate();
  const profile = getWorkerProfile();
  const [seconds, setSeconds] = useState(30);
  const [request, setRequest] = useState(null);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const requestedRef = useRef(false);
  const [home, setHome] = useState(null);
  const previousStatusRef = useRef(localStorage.getItem('safehelmet_worker_current_status') || '근무 중');

  useEffect(() => {
    let active = true;
    getMyHome().then(data => { if (active) setHome(normalizeMyHome(data)); }).catch(() => {});
    return () => { active = false; };
  }, []);

  const sendAutoRequest = async () => {
    if (requestedRef.current) return;
    requestedRef.current = true;
    setSending(true);
    setError('');
    try {
      // The worker-authenticated endpoint supplies the server's own numeric ID.
      const identity = normalizeMyHome(await getMyHome());
      setHome(identity);
      const workerId = Number(identity.workerId || identity.id);
      if (!Number.isSafeInteger(workerId) || workerId <= 0) throw new Error('서버에서 작업자 ID를 확인하지 못했습니다.');
      const saved = await createSOS(workerId);
      setRequest(saved);
    } catch (e) {
      setError('자동 구조 요청을 서버에 기록하지 못했습니다. 관리자 또는 119에 직접 연락해주세요. ' + (e?.message || ''));
      requestedRef.current = false;
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    localStorage.setItem('safehelmet_worker_current_status', '위험');
    window.dispatchEvent(new Event('safehelmet-worker-status-updated'));
    const timer = window.setInterval(() => setSeconds(value => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (seconds === 0 && !request && !sending) sendAutoRequest();
  }, [seconds, request, sending]);

  const zone = home?.zone || profile.location || '위치 미확인';
  return <WorkerScaffold active="sos" title="추락 자동 구조 요청" className="worker-fall-alert-page" hideNav>
    {request ? <div className="worker-fall-auto-success">
      <CheckCircle2 size={66}/>
      <h1>자동 구조 요청이 접수되었습니다</h1>
      <p>서버 SOS #{request.sosId ?? request.id}로 기록되었습니다. 관리자 알림함에서 확인할 수 있습니다.</p>
      <section><div><MapPin size={16}/><span>신고 시점 위치<b>{request.zoneName || zone}</b></span></div><div><Radio size={16}/><span>요청 상태<b>서버 접수 완료</b></span></div></section>
      <button onClick={() => navigate('/worker/sos')}>SOS 상태·관리자 호출</button>
    </div> : <div className="worker-fall-auto-success">
      <ShieldAlert size={66}/>
      <h1>추락이 감지되었습니다</h1>
      <p>{sending ? '서버에 구조 요청을 접수하는 중입니다.' : seconds ? `${seconds}초 후 자동으로 구조 요청됩니다.` : '자동 구조 요청을 확인하고 있습니다.'}</p>
      {error && <div className="worker-filter-banner danger">{error}</div>}
      <section><div><MapPin size={16}/><span>현재 등록 구역<b>{zone}</b></span></div><div><Radio size={16}/><span>서버 요청 상태<b>{error ? '접수 실패' : '접수 대기'}</b></span></div></section>
      <button onClick={sendAutoRequest} disabled={sending}>지금 관리자에게 구조 요청</button>
      <button onClick={() => window.location.href = 'tel:119'} className="worker-119-btn"><Phone size={19}/>119 전화 연결</button>
      <button className="worker-im-ok" onClick={() => {localStorage.setItem('safehelmet_worker_current_status', previousStatusRef.current === '위험' ? '근무 중' : previousStatusRef.current); navigate('/worker/home');}}>괜찮아요 · 자동 요청 취소</button>
    </div>}
  </WorkerScaffold>;
}
