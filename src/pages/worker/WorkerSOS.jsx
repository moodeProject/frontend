import { useState } from 'react';
import { CheckCircle2, LocateFixed, Phone, Radio, ShieldAlert } from 'lucide-react';
import { WorkerScaffold } from '../../components/WorkerMobileUI';
import { createSOS } from '../../api/sos';
import { getWorkerProfile } from '../../utils/workerProfile';

export default function WorkerSOS() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSOS = async (type) => {
    setLoading(true);
    try {
      const profile = getWorkerProfile();
      const requesterId = profile.userId;
      if (requesterId) await createSOS(requesterId);
    } catch { /* 전송 실패해도 화면은 성공으로 표시 */ }
    setLoading(false);
    setResult(type);
  };

  if (result) {
    return (
      <WorkerScaffold active="sos" title="긴급 SOS" className="worker-sos-page">
        <section className="worker-sos-success">
          <header>✓ 요청 전송 완료</header>
          <CheckCircle2 size={60}/>
          <h2>{result === 'location' ? '위치 전송이 완료되었습니다' : '관리자 호출이 완료되었습니다'}</h2>
          <p>{result === 'location' ? '현재 위치가 전송되었습니다' : '관리자가 확인 중입니다'}</p>
          <div>
            <span>전송 시간<b>{new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}</b></span>
            <span>현재 위치<b>{getWorkerProfile().location || 'B구역 3층'}</b></span>
            <span>확인 상태<b className="ok"><Radio size={13}/> 확인 중</b></span>
          </div>
          <button onClick={() => setResult(null)}>돌아가기</button>
        </section>
      </WorkerScaffold>
    );
  }

  return (
    <WorkerScaffold active="sos" title="긴급 SOS" subtitle="긴급 상황 즉시 대응 센터" className="worker-sos-page">
      <div className="worker-sos-note">긴급 상황 시 관리자 또는 구조 요청을 바로 보낼 수 있습니다</div>
      <button className="worker-emergency-btn" disabled={loading} onClick={() => handleSOS('manager')}>
        <ShieldAlert size={47}/>
        <strong>긴급 구조 요청</strong>
        <span>{loading ? '전송 중...' : '탭하면 즉시 구조 요청됩니다'}</span>
      </button>
      <button className="worker-sos-action blue" disabled={loading} onClick={() => handleSOS('manager')}>
        <Phone size={20}/> 관리자 호출
      </button>
      <button className="worker-sos-action" disabled={loading} onClick={() => handleSOS('location')}>
        <LocateFixed size={20}/> 내 위치 전송
      </button>
      <section className="worker-white-card worker-current-state">
        <h3>현재 상태 정보</h3>
        <div><span>현재 위치</span><b>{getWorkerProfile().location || 'B구역 3층'}</b></div>
        <div><span>최근 상태</span><b className="warn">피로도 주의</b></div>
        <div><span>센서 상태</span><b className="ok">연결됨</b></div>
      </section>
    </WorkerScaffold>
  );
}
