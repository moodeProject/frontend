import { Coffee, Heart, Phone, Thermometer } from 'lucide-react';
import { useState } from 'react';
import ActionToast from '../../components/ActionToast';
import { WorkerScaffold } from '../../components/WorkerMobileUI';
import { useNotifications } from '../../context/NotificationContext';
import { getWorkerProfile } from '../../utils/workerProfile';

export default function WorkerHealth(){
  const { addNotification } = useNotifications();
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [resting, setResting] = useState(() => localStorage.getItem('safehelmet_worker_current_status') === '휴식 중');
  const profile = getWorkerProfile();

  const startRest = () => {
    const next = !resting;
    setResting(next);
    localStorage.setItem('safehelmet_worker_current_status', next ? '휴식 중' : '근무 중');
    setToast({ message: next ? '휴식 상태로 전환했습니다. 15분 이상 휴식하세요.' : '휴식을 종료하고 근무 상태로 전환했습니다.', type: 'success' });
    window.dispatchEvent(new Event('safehelmet-worker-status-updated'));
  };

  const callManager = () => {
    addNotification({
      level: 'warning',
      title: `${profile.name || '김현석'} 작업자 관리자 호출`,
      message: '건강 이상으로 관리자 확인을 요청했습니다.',
      target: '/workers/H-002',
    });
    setToast({ message: '관리자에게 호출 요청을 전송했습니다.', type: 'warning' });
  };

  return <WorkerScaffold active="home" title="건강 상태 상세" back>
    <section className="worker-white-card worker-health-detail-card"><div className="worker-card-title"><strong>피로도</strong><span className="worker-count-pill">2단계 주의</span></div><div className="worker-fatigue-big"><i/><i/><i/></div><p>현재 피로도가 높습니다. 15분 휴식을 권장합니다.</p><hr/>
      <div className="worker-health-detail-item"><i><Heart size={22}/></i><p><span>심박수</span><strong>92 <small>bpm</small></strong></p><b>다소 높음</b></div>
      <div className="worker-health-detail-item"><i><Thermometer size={22}/></i><p><span>열사병 위험</span><strong>주의</strong></p><b>33°C</b></div>
    </section>
    <section className="worker-recommend-card"><h3>권장 행동</h3><p>✓ 15분 이상 그늘에서 휴식하세요</p><p>✓ 수분을 충분히 섭취하세요</p><p>✓ 증상이 지속되면 관리자를 호출하세요</p></section>
    <div className="worker-two-actions"><button onClick={startRest}><Coffee size={19}/>{resting ? '휴식 종료' : '휴식하기'}</button><button className="secondary" onClick={callManager}><Phone size={19}/>관리자 호출</button></div>
    <ActionToast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })}/>
  </WorkerScaffold>
}
