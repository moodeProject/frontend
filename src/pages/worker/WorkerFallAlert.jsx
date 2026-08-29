import { CheckCircle2, MapPin, Phone, Radio, ShieldAlert } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WorkerScaffold } from '../../components/WorkerMobileUI';
import { useNotifications } from '../../context/NotificationContext';
import { getWorkerProfile } from '../../utils/workerProfile';

export default function WorkerFallAlert(){
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [seconds,setSeconds] = useState(30);
  const [autoRequested, setAutoRequested] = useState(false);
  const requestedRef = useRef(false);
  const previousStatusRef = useRef(localStorage.getItem('safehelmet_worker_current_status') || '근무 중');
  const profile = getWorkerProfile();

  const sendAutoRequest = () => {
    if (requestedRef.current) return;
    requestedRef.current = true;
    setAutoRequested(true);
    addNotification({
      level: 'danger',
      title: `${profile.name || '김현석'} 추락 자동 구조 요청`,
      message: `${profile.location || 'B구역 3층'} · 30초 내 안전 확인이 없어 자동 구조 요청이 전송되었습니다.`,
      target: '/workers/H-002',
    });
  };

  useEffect(() => {
    localStorage.setItem('safehelmet_worker_current_status', '위험');
    window.dispatchEvent(new Event('safehelmet-worker-status-updated'));
    const id = window.setInterval(() => {
      setSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(id);
          sendAutoRequest();
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  if (autoRequested) {
    return <WorkerScaffold active="sos" title="추락 감지" className="worker-fall-alert-page" hideNav>
      <div className="worker-fall-auto-success">
        <CheckCircle2 size={66}/>
        <h1>자동 구조 요청이 전송되었습니다</h1>
        <p>관리자와 긴급 대응 담당자가 확인 중입니다.</p>
        <section><div><MapPin size={16}/><span>현재 위치<b>{profile.location || 'B구역 3층'}</b></span></div><div><Radio size={16}/><span>알림 상태<b>구조 요청 전송 완료</b></span></div></section>
        <button onClick={() => navigate('/worker/sos')}>SOS 상태 확인</button>
      </div>
    </WorkerScaffold>;
  }

  return <div className="worker-fall-alert-page"><ShieldAlert size={67}/><h1>추락이 감지되었습니다</h1><p>즉시 안전 여부를 확인합니다</p><section><div><MapPin size={16}/><span>현재 위치<b>{profile.location || 'B구역 3층'}</b></span></div><div><Radio size={16}/><span>알림 상태<b>관리자에게 긴급 알림 전송 중...</b></span></div></section><button className="worker-119-btn" onClick={()=>{window.location.href='tel:119'}}><Phone size={22}/>119 구조 요청</button><button className="worker-im-ok" onClick={()=>{localStorage.setItem('safehelmet_worker_current_status', previousStatusRef.current === '위험' ? '근무 중' : previousStatusRef.current); window.dispatchEvent(new Event('safehelmet-worker-status-updated')); navigate('/worker/home')}}>괜찮아요</button><small>{seconds}초 후 자동으로 구조 요청됩니다</small></div>
}
