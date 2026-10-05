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
  const level = String(
    worker.heatRiskLevel || ''
  ).toUpperCase();

  if (level === 'DANGER') return '위험';
  if (level === 'CAUTION') return '주의';
  if (level === 'NORMAL') return '정상';

  if (
    worker.heatRiskAbnormal ||
    worker.externalHeatWarning
  ) {
    return '주의';
  }

  return '데이터 대기';
}

function heatRiskTone(worker) {
  const level = String(
    worker.heatRiskLevel || ''
  ).toUpperCase();

  if (
    level === 'DANGER' ||
    worker.heatRiskAbnormal
  ) {
    return 'danger';
  }

  if (
    level === 'CAUTION' ||
    worker.externalHeatWarning
  ) {
    return 'warning';
  }

  return 'normal';
}

function workerIssueLabel(worker) {
  const issue = String(
    worker?.issue || ''
  ).trim();

  if (issue) return issue;

  const fallState = String(
    worker?.fallState || ''
  ).toUpperCase();

  if (
    fallState &&
    fallState !== 'NORMAL'
  ) {
    return '추락 상태 확인 필요';
  }

  const posture = String(
    worker?.posture || ''
  ).toUpperCase();

  if (worker?.postureAbnormal === true) {
    if (posture === 'COLLAPSE') {
      return '쓰러짐 감지';
    }

    if (posture === 'STUMBLE') {
      return '휘청거림 감지';
    }

    return '자세 이상 감지';
  }

  if (
    worker?.heatRiskAbnormal === true ||
    worker?.externalHeatWarning === true ||
    ['CAUTION', 'DANGER'].includes(
      String(
        worker?.heatRiskLevel || ''
      ).toUpperCase()
    )
  ) {
    return `개인 온열위험 ${heatRiskLabel(
      worker
    )}`;
  }

  if (worker?.fatigueAbnormal === true) {
    return '피로도 이상 감지';
  }

  return '';
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
    Boolean(worker.heatRiskLevel) ||
    typeof worker.heatRiskAbnormal === 'boolean';

  const personalHeatTone =
    heatRiskTone(worker);

  const issueText =
    workerIssueLabel(worker);

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
          <div
            className={`metric-row personal-heat-risk-row ${personalHeatTone}`}
          >
            <span>개인 온열위험</span>
            <b>
              <ThermometerSun size={14} />
              {heatRiskLabel(worker)}
            </b>
          </div>
        )}

        {issueText && (
          <div
            className={`issue-row ${worker.status}`}
          >
            {issueText}
          </div>
        )}
      </article>
    </Link>
  );
}
