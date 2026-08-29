import { CheckCircle2, ChevronLeft, HeartPulse, MapPin, Phone, Thermometer, TimerReset } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import ActionToast from '../components/ActionToast';
import TopHeader from '../components/TopHeader';
import { useDetections } from '../context/DetectionContext';
import { useNotifications } from '../context/NotificationContext';
import { useWorkers } from '../context/WorkerContext';

export default function HealthDetectionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { detections, acknowledgeDetection, completeDetection } = useDetections();
  const { workers } = useWorkers();
  const { addNotification } = useNotifications();
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const item = detections.find((d) => String(d.id) === String(id));
  const worker = workers.find((w) => w.name === item?.name);

  useEffect(() => {
    if (item?.category === 'health') acknowledgeDetection(id);
  }, [id, item?.category]);

  if (!item || item.category !== 'health') return <Navigate to="/detections?tab=health" replace />;

  const isHeat = item.kind === 'heat';
  const completed = item.processClass === 'completed';

  const sendRest = () => {
    addNotification({
      level: 'warning',
      title: `${item.name} 휴식 권고 전송`,
      message: `${item.type} 감지에 따라 15분 휴식을 권고했습니다.`,
      target: worker ? `/workers/${worker.id}` : '/workers',
    });
    setToast({ message: `${item.name} 작업자에게 휴식 권고를 전송했습니다.`, type: 'success' });
  };

  const callWorker = () => {
    if (worker?.phone) {
      window.location.href = `tel:${worker.phone.replace(/[^0-9+]/g, '')}`;
      setToast({ message: `${item.name} 작업자에게 전화를 연결합니다.`, type: 'info' });
    } else {
      setToast({ message: '등록된 연락처가 없습니다.', type: 'warning' });
    }
  };

  const finish = () => {
    completeDetection(item.id);
    setToast({ message: '건강 이상 감지 건을 처리완료로 변경했습니다.', type: 'success' });
  };

  return (
    <>
      <TopHeader title="이상 감지" subtitle="외부요인 · 건강 · 추락" />
      <div className="page-body health-detection-detail-page">
        <Link className="back-link detail-back" to="/detections?tab=health"><ChevronLeft size={14}/> 이상 감지 목록</Link>

        <div className="health-detection-heading">
          <div className="health-detection-icon">{isHeat ? <Thermometer size={21}/> : <HeartPulse size={21}/>}</div>
          <div><h2>건강 이상 감지</h2><p>{item.name} · {item.zone} · {item.time}</p></div>
          <span className="risk-chip warning">● 주의</span>
        </div>

        <div className="health-detection-grid">
          <section className="panel health-detection-main-card">
            <div className="section-caption">실시간 건강 상태</div>
            <div className="health-metric-hero">
              <div className="health-metric-icon">{isHeat ? <Thermometer size={28}/> : <HeartPulse size={28}/>}</div>
              <div><span>{item.type}</span><strong>{isHeat ? '38.1°C' : `${worker?.heartRate || 92} bpm`}</strong><p>{isHeat ? '체온 상승 및 고온 환경 노출이 감지되었습니다.' : '피로도 2단계가 감지되어 휴식이 필요합니다.'}</p></div>
            </div>
            <div className="health-metric-grid">
              <div><span>심박수</span><b>{worker?.heartRate || 92} bpm</b></div>
              <div><span>피로도</span><b>{worker?.fatigue || 2}단계</b></div>
              <div><span>작업 위치</span><b>{item.zone}</b></div>
              <div><span>센서 상태</span><b className="ok">정상 연결</b></div>
            </div>
            <div className="health-recommend-box"><TimerReset size={18}/><div><strong>권장 조치</strong><p>{isHeat ? '즉시 그늘 또는 냉방 공간으로 이동하고 수분을 섭취하도록 안내하세요.' : '15분 이상 휴식하고 수분을 섭취하도록 안내하세요.'}</p></div></div>
          </section>

          <aside className="health-detection-side">
            <section className="panel health-worker-card">
              <div className="health-worker-avatar">{worker?.profileImage ? <img src={worker.profileImage} alt=""/> : item.name.slice(0, 1)}</div>
              <div><strong>{item.name}</strong><span>{worker?.employeeNumber || 'W002'} · {item.zone}</span></div>
              <button type="button" onClick={() => worker && navigate(`/workers/${worker.id}`)}>작업자 상세</button>
            </section>
            <section className="panel health-action-card">
              <h3>관리자 조치</h3>
              <button type="button" onClick={sendRest}><TimerReset size={16}/> 휴식 권고 전송</button>
              <button type="button" className="secondary" onClick={callWorker}><Phone size={16}/> 작업자 연락</button>
              <button type="button" className="secondary" onClick={() => setToast({ message: `현재 위치: ${item.zone}`, type: 'info' })}><MapPin size={16}/> 위치 확인</button>
              <button type="button" className="complete" disabled={completed} onClick={() => !completed && finish()}><CheckCircle2 size={16}/> {completed ? '처리완료' : '처리 완료하기'}</button>
            </section>
          </aside>
        </div>
      </div>
      <ActionToast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })}/>
    </>
  );
}
