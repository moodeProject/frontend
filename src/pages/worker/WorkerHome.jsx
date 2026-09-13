import { useState } from 'react';
import { Clock3, Heart, LocateFixed, MapPin, Radio, ShieldCheck, Siren, Thermometer, TriangleAlert, Wifi } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { WorkerScaffold } from '../../components/WorkerMobileUI';
import { getWorkerProfile } from '../../utils/workerProfile';

export default function WorkerHome() {
  const navigate = useNavigate();
  const [drawerKey] = useState(0);
  const profile = getWorkerProfile();

  return (
    <WorkerScaffold key={drawerKey} active="home" title={`${profile.name || '김현석'} 작업자님`} subtitle="오늘도 안전하게 작업하세요" className="worker-home-page">
      <div className="worker-home-statusline">
        <span><ShieldCheck size={14} /> 안전모 연결됨</span>
        <span><Wifi size={14} /> 센서 연결됨</span>
      </div>

      <section className="worker-state-card warning">
        <div className="worker-state-card-head"><strong><TriangleAlert size={16} /> 현재 상태</strong><span>⚠ 주의</span></div>
        <div className="worker-state-row"><span><MapPin size={17} /> 위치</span><b>{profile.location || 'B구역 3층'}</b></div>
        <div className="worker-state-row"><span><ShieldCheck size={17} /> 안전모</span><b className="ok">착용 중 ✓</b></div>
        <div className="worker-state-row"><span><Radio size={17} /> 센서</span><b className="ok">정상 연결</b></div>
      </section>

      <section className="worker-white-card">
        <div className="worker-card-title"><strong>건강 상태</strong><button onClick={() => navigate('/worker/health')}>상세보기 ›</button></div>
        <div className="worker-fatigue-row"><span>피로도</span><div className="worker-fatigue-bars"><i /><i /><i /></div><b>2단계 주의</b></div>
        <div className="worker-health-mini-grid">
          <div><Heart size={18} /><span>심박수</span><strong>92 <small>bpm</small></strong></div>
          <div><Thermometer size={18} /><span>열사병</span><strong>주의</strong></div>
        </div>
      </section>

      <section className="worker-white-card">
        <div className="worker-card-title"><strong>주변 위험요인</strong><span className="worker-count-pill">2건</span></div>
        <button className="worker-hazard-row" onClick={() => navigate('/worker/hazards')}><i>♨</i><div><strong>물웅덩이 감지</strong><small>바닥이 미끄럽습니다</small></div><b>• 주의</b></button>
        <button className="worker-hazard-row" onClick={() => navigate('/worker/hazards')}><i><TriangleAlert size={18} /></i><div><strong>장애물 감지</strong><small>이동 경로 주의</small></div><b>• 주의</b></button>
        <button className="worker-section-link" onClick={() => navigate('/worker/hazards')}>상세보기 ›</button>
      </section>

      <section className="worker-fall-ok-card">
        <div><ShieldCheck size={22} /><p><strong>추락 감지 없음</strong><small>추락 감지 센서 정상 작동 중</small></p></div>
        <button onClick={() => navigate('/worker/fall-alert')}><Siren size={14} /> 테스트</button>
      </section>

      <div className="worker-home-actions">
        <button onClick={() => navigate('/worker/attendance')}><Clock3 size={23} />근태 보기</button>
        <button className="outline" onClick={() => alert('현재 위치: B구역 3층')}><LocateFixed size={23} />위치 확인</button>
        <button className="danger" onClick={() => navigate('/worker/sos')}><Siren size={23} />SOS 요청</button>
      </div>
    </WorkerScaffold>
  );
}
