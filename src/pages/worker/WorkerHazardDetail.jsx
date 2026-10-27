import { ArrowLeft, ShieldCheck, TriangleAlert, MapPin, Clock3, Video } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { getHazardEvent } from '../../api/hazardEvents';
import '../../styles/workerHazardPolish.css';
import { WorkerScaffold } from '../../components/WorkerMobileUI';
import { useDetections } from '../../context/DetectionContext';
import '../../styles/workerFallHistory.css';

export default function WorkerHazardDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { eventId } = useParams();
  const { detections, hazardLoading, hazardError } = useDetections();
  const [serverDetail, setServerDetail] = useState(null);
  const [videoError, setVideoError] = useState('');
  useEffect(() => {
    let active = true;
    setServerDetail(null);
    setVideoError('');
    getHazardEvent(eventId).then(detail => { if (active) setServerDetail(detail); }).catch(() => {});
    return () => { active = false; };
  }, [eventId]);
  const event = useMemo(() => detections.find(item => String(item.id) === String(eventId)) ||
    (String(location.state?.hazardEvent?.id) === String(eventId) ? location.state?.hazardEvent : null),
    [detections, eventId, location.state]);
  if (!event) return <WorkerScaffold active="alerts" title="외부요인 감지 상세" back>
    <section className="worker-white-card worker-health-detail-card">
      <div className="worker-card-title"><strong>외부 위험요인 기록</strong></div>
      <p>{hazardLoading ? '선택한 위험 이벤트를 조회하고 있습니다.' : hazardError ? '이벤트 조회에 실패했습니다.' : '선택한 이벤트 정보를 찾을 수 없습니다.'}</p>
      <button className="worker-section-link" onClick={() => navigate('/worker/alerts')}>알림으로 돌아가기</button>
    </section>
  </WorkerScaffold>;

  const state = String(event.status || event.rawEvent?.status || '').toUpperCase();
  const resolved = ['RESOLVED','COMPLETED','CLOSED','DONE'].includes(state) || event.processClass === 'completed';
  const processing = ['IN_PROGRESS','PROCESSING'].includes(state) || event.processClass === 'processing';
  const caution = event.level === 'warning';
  const tone = caution ? 'warning' : 'danger';
  const clipUrl = serverDetail?.clip?.playbackUrl || '';
  const occurred = event.occurredAt ? new Date(event.occurredAt).toLocaleString('ko-KR') : [event.dateLabel,event.time].filter(Boolean).join(' ');
  return <WorkerScaffold active="alerts" title="외부요인 감지 상세" back>
    <section className={`worker-white-card worker-health-detail-card worker-fall-history-card worker-hazard-clean tone-${tone}`}>
      <div className="worker-card-title"><strong>외부 위험요인 기록</strong><span className="worker-count-pill">{caution ? '주의' : '위험'}</span></div>

      <p className="worker-hazard-summary">{event.detailDescription || event.rawEvent?.description || '작업 구역에서 위험요인이 감지되었습니다.'}</p>
      {resolved && <span className="worker-fall-resolution-chip"><ShieldCheck size={15}/> 관리자 처리완료</span>}
      <hr/>
      <div className="worker-health-detail-item"><i><TriangleAlert size={22}/></i><p><span>감지 유형</span><strong>{event.type || '외부 위험요인'}</strong></p></div>
      <div className="worker-health-detail-item"><i><Clock3 size={22}/></i><p><span>발생 시각</span><strong>{occurred || '확인 불가'}</strong></p></div>
      <div className="worker-health-detail-item"><i><MapPin size={22}/></i><p><span>발생 위치</span><strong>{event.zone || '위치 미확인'}</strong></p></div>
      <div className="worker-health-detail-item"><i><ShieldCheck size={22}/></i><p><span>처리 상태</span><strong>{resolved ? '처리완료' : processing ? '처리중' : state === 'UNHANDLED' ? '미처리' : '조치 미확인'}</strong></p></div>
    </section>
    {clipUrl && <section className="worker-white-card worker-hazard-video"><div className="worker-card-title"><strong><Video size={18}/> 현장 감지 영상</strong></div><video key={clipUrl} src={clipUrl} controls playsInline preload="metadata" onError={() => setVideoError("영상을 재생할 수 없습니다. 영상 주소가 만료되었을 수 있습니다.")}/>{videoError && <p>{videoError}</p>}<small>서버가 제공한 사고 기록 영상입니다. 실시간 카메라 영상은 아닙니다.</small></section>}
    <section className={`worker-recommend-card worker-fall-recommend tone-${tone} worker-hazard-guidance`}>
      <h3>안전 안내</h3>
      <p>✓ {event.actionText || event.rawEvent?.recommendedAction || '위험요인에 접근하지 말고 안전한 구역으로 이동하세요.'}</p>
      <p>✓ 현장 위험요인이 남아 있다면 관리자에게 즉시 알려주세요.</p>
    </section>
    <div className="worker-two-actions">
      <button type="button" onClick={() => navigate('/worker/alerts')}><ArrowLeft size={18}/> 알림 목록</button>
      <button type="button" className="secondary" onClick={() => navigate('/worker/sos')}><TriangleAlert size={18}/> SOS</button>
    </div>
  </WorkerScaffold>;
}
