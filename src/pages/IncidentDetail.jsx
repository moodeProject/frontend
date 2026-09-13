import { AlertOctagon, CheckCircle2, Flame, MapPin, Phone, Play, TriangleAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ActionToast from '../components/ActionToast';
import TopHeader from '../components/TopHeader';
import { useDetections } from '../context/DetectionContext';
import { useNotifications } from '../context/NotificationContext';

const FALL_ID = 1;

export default function IncidentDetail() {
  const navigate = useNavigate();
  const { detections, acknowledgeDetection, completeDetection } = useDetections();
  const { addNotification } = useNotifications();
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [rescueSent, setRescueSent] = useState(false);
  const incident = detections.find((item) => item.id === FALL_ID);
  const isCompleted = incident?.processClass === 'completed';

  useEffect(() => {
    acknowledgeDetection(FALL_ID);
  }, []);

  const complete = () => {
    completeDetection(FALL_ID);
    setToast({ message: '추락 사고를 처리완료로 변경했습니다.', type: 'success' });
  };

  const requestRescue = () => {
    if (rescueSent) {
      setToast({ message: '이미 긴급 구조 요청이 전송되었습니다.', type: 'info' });
      return;
    }
    setRescueSent(true);
    addNotification({
      level: 'danger',
      title: '긴급 구조 요청 전송',
      message: '박민수 · A구역 3층 · 현장 구조 대응을 요청했습니다.',
      target: '/incident',
    });
    setToast({ message: '현장 구조 담당자에게 긴급 구조 요청을 전송했습니다.', type: 'warning' });
  };

  return (
    <>
      <TopHeader title="이상 감지" subtitle="외부요인 · 건강 · 추락" />
      <div className="page-body incident-page">
        <Link className="back-link" to="/detections">← 이상 감지 목록</Link>
        <section className={`incident-banner ${isCompleted ? 'completed' : ''}`}>
          <div><AlertOctagon size={24}/><div><strong>추락 사고가 감지되었습니다.</strong><span>박민수 · A구역 3층 · 10:28</span></div></div>
          <button
            type="button"
            className={isCompleted ? 'completed' : ''}
            onClick={() => !isCompleted && complete()}
            disabled={isCompleted}
          >
            {isCompleted ? <><CheckCircle2 size={14}/> 처리완료</> : '● 처리중 · 완료하기'}
          </button>
        </section>

        <div className="incident-layout">
          <div className="incident-main">
            <section className="panel video-panel">
              <div className="section-caption">사고 영상 확인 <span>사고 시점 미정됨</span></div>
              <div className="fake-video">
                <div className="video-top"><span>● CCTV-A03</span><time>08.09 10:28</time></div>
                <div className="fall-scene"><div className="fall-box">⚠ FALL DETECTED · 97%</div><div className="impact">IMPACT</div></div>
                <div className="video-bottom"><span>AI ACTIVE · FALL DETECTED · MOTION: NONE · IMPACT: HIGH</span></div>
                <div className="video-controls"><Play size={18}/><b>사고 시점</b><span>00:12 / 00:30</span></div>
              </div>
              <div className="timeline-labels"><span>사고 전 10초</span><b>▶ 사고 시점</b><span>사고 후 10초</span></div>
            </section>

            <section className="panel cause-panel">
              <h3>추락 원인 분석</h3>
              <div className="cause-row danger"><span><b>1순위</b> 물웅덩이로 인한 미끄러짐</span><strong>78%</strong></div>
              <div className="cause-row warning"><span><b>2순위</b> 난간 없는 구간 접근</span><strong>45%</strong></div>
              <div className="subfactors"><span>보조 요인</span><div><i>피로도 2단계</i><i>작업 중 빠른 이동</i><i>고온 작업 환경</i></div></div>
              <div className="final-cause"><span>최종 추정 원인</span><strong>바닥 물웅덩이에 미끄러지며<br/>난간 없는 구간 방향으로 추락</strong><div className="cause-meta"><span>외부요인<b>물웅덩이</b></span><span>자세 상태<b>불안정</b></span><span>피로도<b>2단계 동반</b></span></div></div>
            </section>
          </div>

          <aside className="incident-side">
            <section className="panel worker-info-card"><div className="worker-head"><div className="mini-avatar large">박</div><div><strong>박민수</strong><span>A구역 3층 · H-001</span></div></div><dl><div><dt>발생 시간</dt><dd>10:28</dd></div><div><dt>심박수</dt><dd>118 bpm</dd></div><div><dt>피로도</dt><dd>2단계</dd></div></dl></section>
            <section className="panel detection-card"><h3>추락 감지 결과</h3><div>충격 감지 <b>높음</b></div><div>자세 변화 <b>감지됨</b></div><div>움직임 <b>없음</b></div><div>최종 판단 <b>추락 가능성 높음</b></div></section>
            <section className="panel related-card"><h3>연관 외부요인</h3><div className="blue"><Flame size={15}/> 물웅덩이 감지 <b>3분 전</b></div><div className="red"><TriangleAlert size={15}/> 난간 없는 구간 <b>2분 전</b></div></section>
            <button className="emergency-btn" onClick={requestRescue}><Phone size={16}/> {rescueSent ? '구조 요청 전송됨' : '긴급 구조 요청'}</button>
            <button className="location-btn" onClick={() => { setToast({ message: '박민수 현재 위치: A구역 3층', type: 'info' }); navigate('/workers/H-001'); }}><MapPin size={16}/> 작업자 위치 확인</button>
          </aside>
        </div>
      </div>
      <ActionToast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })}/>
    </>
  );
}
