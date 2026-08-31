import {
  Heart,
  MapPin,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';

const labels = {
  normal: '정상',
  warning: '주의',
  danger: '위험',
};

export default function WorkerCard({
  worker,
  compact = false,
}) {
  const hasServerData =
    worker.serverDataConnected === true ||
    Boolean(worker.recordedAt);

  return (
    <Link
      className="worker-card-link"
      to={`/workers/${encodeURIComponent(
        worker.id
      )}`}
    >
      <article
        className={`worker-card ${
          worker.status
        } ${compact ? 'compact' : ''}`}
      >
        <span className="worker-dot" />

        <div className="worker-avatar">
          {worker.profileImage ? (
            <img
              src={worker.profileImage}
              alt={`${worker.name} 프로필`}
            />
          ) : (
            <span>
              {worker.name.slice(0, 1)}
            </span>
          )}
        </div>

        <div
          className={`worker-live-state ${
            hasServerData
              ? 'connected'
              : 'waiting'
          }`}
          title={
            hasServerData
              ? `${worker.deviceId || ''} 실제 서버 센서 데이터 수신 중`
              : `${
                  worker.deviceId || ''
                } 서버 센서 데이터 대기 중`
          }
        >
          {hasServerData ? (
            <Wifi size={11} />
          ) : (
            <WifiOff size={11} />
          )}

          {hasServerData
            ? '실시간 연결'
            : '데이터 대기'}
        </div>

        <div className="worker-title-row">
          <div>
            <strong>{worker.name}</strong>

            <div className="worker-zone">
              <MapPin size={11} />
              {worker.zone}
            </div>
          </div>

          <StatusBadge
            level={worker.status}
          >
            {labels[worker.status]}
          </StatusBadge>
        </div>

        <div className="metric-row">
          <span>심박수</span>
          <b>
            <Heart size={14} />{' '}
            {worker.heartRate ?? '-'}
          </b>
          <small>bpm</small>
        </div>

        <div className="metric-row">
          <span>피로도</span>

          <div
            className={`fatigue-bar level-${
              worker.fatigue
            }`}
          >
            <i />
            <i />
            <i />
          </div>

          <b>{worker.fatigue}단계</b>
        </div>

        <div
          className={`issue-row ${
            worker.status
          }`}
        >
          {worker.issue}
        </div>
      </article>
    </Link>
  );
}
