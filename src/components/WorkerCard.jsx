import { Heart, MapPin } from 'lucide-react';
import StatusBadge from './StatusBadge';

const labels = { normal: '정상', warning: '주의', danger: '위험' };

export default function WorkerCard({ worker, compact = false }) {
  return (
    <article className={`worker-card ${worker.status} ${compact ? 'compact' : ''}`}>
      <span className="worker-dot" />
      <div className="worker-avatar">{worker.name.slice(0, 1)}</div>
      <div className="worker-title-row">
        <div>
          <strong>{worker.name}</strong>
          <div className="worker-zone"><MapPin size={11} /> {worker.zone}</div>
        </div>
        <StatusBadge level={worker.status}>{labels[worker.status]}</StatusBadge>
      </div>
      <div className="metric-row"><span>심박수</span><b><Heart size={14} /> {worker.heartRate}</b><small>bpm</small></div>
      <div className="metric-row"><span>피로도</span><div className={`fatigue-bar level-${worker.fatigue}`}><i/><i/><i/></div><b>{worker.fatigue}단계</b></div>
      <div className={`issue-row ${worker.status}`}>{worker.issue}</div>
    </article>
  );
}
