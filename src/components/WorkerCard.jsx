import {
  Activity,
  Heart,
  MapPin,
  ThermometerSun,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import {
  postureLabel,
  postureTone,
} from '../utils/workerRealtime';

const labels = {
  normal: '정상',
  warning: '주의',
  danger: '위험',
};

function heatRiskLabel(worker) {
  const level = String(worker.heatRiskLevel || '').toUpperCase();

  if (
    worker.heatRiskAbnormal ||
    worker.externalHeatWarning ||
    (level && level !== 'NORMAL')
  ) {
    return worker.heatRiskLevel || '주의';
  }

  return '정상';
}

export default function WorkerCard({
  worker,
  compact = false,
}) {
  const hasServerData =
    worker.serverDataConnected === true ||
    worker.heatRiskDataConnected === true ||
    Boolean(worker.recordedAt);

  const movementTone = postureTone(worker);
  const fatigueKnown =
    hasServerData &&
    typeof worker.fatigueAbnormal === 'boolean';
  const heatKnown =
    worker.heatRiskDataConnected === true ||
    typeof worker.heatRiskAbnormal === 'boolean';
  const heatAbnormal =
    worker.heatRiskAbnormal ||
    worker.externalHeatWarning ||
    (worker.heatRiskLevel &&
      String(worker.heatRiskLevel).toUpperCase() !== 'NORMAL');

  return (
    <Link
      className="worker-card-link"
      to={`/workers/${encodeURIComponent(worker.id)}`}
    >
      <article
        className={`worker-card ${worker.status} ${compact ? 'compact' : ''}`}
      >
        <span className="worker-dot" />

        <div className="worker-avatar">
          {worker.profileImage ? (
            <img
              src={worker.profileImage}
              alt={`${worker.name} 프로필`}
            />
          ) : (
            <span>{worker.name.slice(0, 1)}</span>
          )}
        </div>

        <div
          className={`worker-live-state ${hasServerData ? 'connected' : 'waiting'}`}
          title={
            hasServerData
              ? `${worker.deviceId || ''} 실제 서버 센서 데이터 수신 중`
              : `${worker.deviceId || ''} 서버 센서 데이터 대기 중`
          }
        >
          {hasServerData ? <Wifi size={11} /> : <WifiOff size={11} />}
          {hasServerData ? '실시간 연결' : '데이터 대기'}
        </div>

        <div className="worker-title-row">
          <div>
            <strong>{worker.name}</strong>

            <div
              className="worker-zone"
              title={
                worker.zoneCode
                  ? `구역 코드: ${worker.zoneCode}`
                  : undefined
              }
            >
              <MapPin size={11} />
              {worker.zone || '위치 미확인'}
            </div>
          </div>

          <StatusBadge level={worker.status}>
            {labels[worker.status]}
          </StatusBadge>
        </div>

        <div className="metric-row">
          <span>심박수</span>
          <b>
            <Heart size={14} /> {worker.heartRate ?? '-'}
          </b>
          <small>bpm</small>
        </div>

        <div className="metric-row">
          <span>피로도</span>

          {fatigueKnown ? (
            <b className={worker.fatigueAbnormal ? 'orange' : 'green'}>
              {worker.fatigueAbnormal ? '이상 감지' : '정상'}
            </b>
          ) : (
            <>
              <div className={`fatigue-bar level-${worker.fatigue}`}>
                <i />
                <i />
                <i />
              </div>
              <b>{worker.fatigue}단계</b>
            </>
          )}

          {worker.hrv != null && Number.isFinite(Number(worker.hrv)) && (
            <small>HRV {Number(worker.hrv).toFixed(1)}</small>
          )}
        </div>

        <div className={`metric-row posture-metric ${movementTone}`}>
          <span>움직임</span>
          <b>
            <Activity size={14} />
            {hasServerData ? postureLabel(worker.posture) : '데이터 대기'}
          </b>
        </div>

        {heatKnown && (
          <div className={`metric-row ${heatAbnormal ? 'warning' : 'normal'}`}>
            <span>온열위험</span>
            <b>
              <ThermometerSun size={14} />
              {heatRiskLabel(worker)}
            </b>
          </div>
        )}

        <div className={`issue-row ${worker.status}`}>
          {worker.issue}
        </div>
      </article>
    </Link>
  );
}
