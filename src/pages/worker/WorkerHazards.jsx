import {
  Ban,
  Flame,
  MapPin,
  TriangleAlert,
} from 'lucide-react';
import { useMemo } from 'react';
import { WorkerScaffold } from '../../components/WorkerMobileUI';
import { useDetections } from '../../context/DetectionContext';
import { getWorkerProfile } from '../../utils/workerProfile';
import { detectionBelongsToWorker } from '../../utils/workerRealtime';

function hazardIcon(kind) {
  if (kind === 'unguarded') return Ban;
  if (kind === 'heat') return Flame;
  return TriangleAlert;
}

export default function WorkerHazards() {
  const {
    detections,
    hazardLoading,
    hazardError,
    hazardStreamConnected,
  } = useDetections();

  const profile = getWorkerProfile();

  const hazards = useMemo(
    () =>
      detections
        .filter(
          (item) =>
            item.category === 'external' &&
            detectionBelongsToWorker(
              item,
              profile
            )
        )
        .sort(
          (a, b) =>
            new Date(b.occurredAt || 0).getTime() -
            new Date(a.occurredAt || 0).getTime()
        ),
    [
      detections,
      profile.employeeNo,
      profile.name,
      profile.helmetNo,
    ]
  );

  return (
    <WorkerScaffold
      active="home"
      title="주변 위험요인 상세"
      back
    >
      <div
        className={`worker-filter-banner ${
          hazardError ? 'danger' : 'normal'
        }`}
      >
        <span>
          {hazardError
            ? `위험 이벤트 연동 실패: ${hazardError}`
            : hazardLoading
              ? '위험 이벤트를 불러오는 중입니다.'
              : hazardStreamConnected
                ? `● 실시간 연결 · ${profile.name} 관련 ${hazards.length}건`
                : '실시간 위험 이벤트 재연결 중'}
        </span>
      </div>

      <div className="worker-hazard-detail-list">
        {hazards.length > 0 ? (
          hazards.map((item) => {
            const Icon = hazardIcon(item.kind);

            return (
              <article
                key={item.id}
                className={item.level}
              >
                <div className="worker-hazard-detail-head">
                  <i>
                    <Icon size={20} />
                  </i>

                  <p>
                    <strong>{item.type}</strong>
                    <small>
                      {item.dateLabel}{' '}
                      {item.time}
                    </small>
                  </p>

                  <b>
                    ●{' '}
                    {item.level === 'danger'
                      ? '위험'
                      : '주의'}
                  </b>
                </div>

                <span>
                  <MapPin size={14} />
                  {item.zone || '-'}
                </span>

                <p>
                  {item.detailDescription ||
                    item.rawEvent?.description ||
                    '위험 이벤트가 감지되었습니다.'}
                </p>

                <em>
                  {item.level === 'danger'
                    ? '⊘'
                    : '⚠'}{' '}
                  {item.actionText ||
                    '현장 안전에 주의하세요.'}
                </em>
              </article>
            );
          })
        ) : (
          <div className="records-empty">
            현재 이 작업자에게 발생한 외부 위험
            이벤트가 없습니다.
          </div>
        )}
      </div>
    </WorkerScaffold>
  );
}
