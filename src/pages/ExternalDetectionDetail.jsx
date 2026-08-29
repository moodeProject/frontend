import {
  AlertTriangle,
  Ban,
  BellRing,
  CheckCircle2,
  ChevronLeft,
  Droplets,
  Package,
  Play,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import TopHeader from '../components/TopHeader';
import ActionToast from '../components/ActionToast';
import { useDetections } from '../context/DetectionContext';
import { useNotifications } from '../context/NotificationContext';

const icons = {
  unguarded: AlertTriangle,
  puddle: Droplets,
  obstacle: Package,
};

export default function ExternalDetectionDetail() {
  const { id } = useParams();
  const { detections, acknowledgeDetection, completeDetection } = useDetections();
  const { addNotification } = useNotifications();
  const [activeClip, setActiveClip] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const item = detections.find((d) => String(d.id) === String(id));

  useEffect(() => {
    if (item?.category === 'external') acknowledgeDetection(id);
  }, [id, item?.category]);

  if (!item || item.category !== 'external') return <Navigate to="/detections" replace />;

  const Icon = icons[item.kind] || AlertTriangle;
  const isDanger = item.level === 'danger';
  const isCompleted = item.processClass === 'completed';

  const playClip = (clip) => {
    setActiveClip(clip);
    setToast({ message: `${clip === 'before' ? '감지 전' : '감지 후'} 30초 영상 클립을 재생합니다.`, type: 'info' });
  };

  const sendWarning = () => {
    addNotification({
      level: item.level,
      title: `${item.type} 경고 알림 전송`,
      message: `${item.name} · ${item.zone} 작업자에게 위험 경고를 전송했습니다.`,
      target: `/detections/${item.id}`,
    });
    setToast({ message: `${item.name} 작업자에게 경고 알림을 전송했습니다.`, type: 'success' });
  };

  const blockZone = () => {
    const key = 'safehelmet_restricted_zones';
    let zones = [];
    try { zones = JSON.parse(localStorage.getItem(key) || '[]'); } catch { zones = []; }
    if (!zones.includes(item.zone)) zones.push(item.zone);
    localStorage.setItem(key, JSON.stringify(zones));
    addNotification({
      level: 'danger',
      title: '위험 구역 접근 금지 설정',
      message: `${item.zone} 구역을 접근 금지 상태로 변경했습니다.`,
      target: `/detections/${item.id}`,
    });
    setToast({ message: `${item.zone} 구역을 접근 금지로 설정했습니다.`, type: 'warning' });
  };

  const finish = () => {
    completeDetection(item.id);
    setToast({ message: '이상 감지 건을 처리완료로 변경했습니다.', type: 'success' });
  };

  return (
    <>
      <TopHeader title="이상 감지" subtitle="외부요인 · 건강 · 추락" />
      <div className="page-body external-detail-page">
        <Link className="back-link detail-back" to="/detections?tab=external"><ChevronLeft size={14}/> 이상 감지 목록</Link>

        <div className="external-detail-heading">
          <div className={`external-heading-icon ${item.kind}`}><Icon size={20}/></div>
          <div>
            <h2>외부 위험요인 감지</h2>
            <p>{item.name} · {item.zone} · {item.time}</p>
          </div>
          <span className={`risk-chip ${item.level}`}>● {isDanger ? '위험' : '주의'}</span>
        </div>

        <div className="external-detail-grid">
          <div className="external-detail-main">
            <section className="panel ai-video-panel">
              <div className="section-caption">현장 영상 · AI 감지</div>
              <HazardVideo item={item} activeClip={activeClip} />
              <p className="video-helper">AI가 영상을 실시간 분석하여 위험요인과 작업자를 감지합니다.</p>
            </section>

            <section className="panel saved-clips-panel">
              <div className="section-caption">저장된 영상 클립</div>
              <div className="saved-clip-grid">
                <button type="button" className={activeClip === 'before' ? 'active' : ''} onClick={() => playClip('before')}><Play size={14}/> {activeClip === 'before' ? '재생 중 · 감지 전 30초' : '감지 전 30초'}</button>
                <button type="button" className={activeClip === 'after' ? 'active' : ''} onClick={() => playClip('after')}><Play size={14}/> {activeClip === 'after' ? '재생 중 · 감지 후 30초' : '감지 후 30초'}</button>
              </div>
            </section>
          </div>

          <aside className="external-detail-side">
            <section className="panel ai-result-card">
              <h3>AI 감지 결과</h3>
              <div className={`ai-type-box ${item.kind}`}>
                <span>감지 유형</span>
                <strong>{item.type}</strong>
              </div>
              <dl>
                <div><dt>위험 설명</dt><dd>{item.riskLabel}</dd></div>
                <div><dt>관련 작업자</dt><dd>{item.name}</dd></div>
                <div><dt>위치</dt><dd>{item.zone}</dd></div>
                <div><dt>발생 시간</dt><dd>{item.time}</dd></div>
              </dl>
              <p>{item.detailDescription}</p>
            </section>

            <section className={`external-action-card ${isDanger ? 'danger' : 'warning'}`}>
              <strong>{item.actionText}</strong>
              <button type="button" onClick={sendWarning}><BellRing size={15}/> 경고 알림 전송</button>
              {isDanger && <button type="button" className="outline" onClick={blockZone}><Ban size={15}/> 구역 접근 금지</button>}
              <button
                type="button"
                className="complete-action"
                disabled={isCompleted}
                onClick={() => !isCompleted && finish()}
              >
                <CheckCircle2 size={15}/> {isCompleted ? '처리완료' : '처리 완료하기'}
              </button>
            </section>
          </aside>
        </div>
      </div>
      <ActionToast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
    </>
  );
}

function HazardVideo({ item, activeClip }) {
  const labels = {
    unguarded: { camera: 'CCTV-A03', ai: 'AI ACTIVE · UNGUARDED EDGE · FALL RISK HIGH', hazard: '⚠ UNGUARDED EDGE' },
    puddle: { camera: 'CCTV-C02', ai: 'AI ACTIVE · PUDDLE DETECTED · SLIP RISK', hazard: 'PUDDLE · 미끄럼 위험' },
    obstacle: { camera: 'CCTV-B01', ai: 'AI ACTIVE · OBSTACLE DETECTED · COLLISION RISK', hazard: 'OBSTACLE 91%' },
  }[item.kind];

  return (
    <div className={`hazard-video hazard-${item.kind} ${activeClip ? 'clip-playing' : ''}`}>
      <div className="hazard-video-top">
        <span>● {labels.camera}</span><time>08.09 {item.time}</time>
      </div>
      <div className="hazard-stage">
        <div className="worker-detection">
          <span>WORKER 94%</span>
          <div className="worker-figure"><i/><i/><i/><i/></div>
        </div>

        {item.kind === 'unguarded' && (
          <>
            <span className="danger-arrow">접근 감지</span>
            <div className="edge-hazard"><b>{labels.hazard}</b><i/><i/><i/><i/></div>
          </>
        )}

        {item.kind === 'puddle' && (
          <div className="puddle-hazard"><b>{labels.hazard}</b><span>PUDDLE</span></div>
        )}

        {item.kind === 'obstacle' && (
          <>
            <span className="collision-tag">⚠ 충돌 위험</span>
            <div className="obstacle-hazard"><b>{labels.hazard}</b></div>
          </>
        )}
      </div>
      <div className="hazard-ai-line">{activeClip ? `${activeClip === 'before' ? 'BEFORE' : 'AFTER'} CLIP PLAYING · ` : ''}{labels.ai}</div>
      <div className="hazard-controls">
        <span className="skip">|◀</span>
        <span className="round-play"><Play size={15} fill="currentColor"/></span>
        <div className="hazard-progress"><i/></div>
        <time>00:09 / 00:30</time>
      </div>
    </div>
  );
}
