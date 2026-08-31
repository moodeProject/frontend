import {
  useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { WorkerScaffold } from '../../components/WorkerMobileUI';
import { useDetections } from '../../context/DetectionContext';
import { getWorkerProfile } from '../../utils/workerProfile';
import { detectionBelongsToWorker } from '../../utils/workerRealtime';

const tabs = [
  ['all', '전체'],
  ['external', '외부요인'],
  ['health', '건강'],
  ['fall', '추락'],
];

export default function WorkerAlerts() {
  const [tab, setTab] = useState('all');
  const navigate = useNavigate();

  const {
    detections,
    hazardLoading,
    hazardError,
    hazardStreamConnected,
  } = useDetections();

  const profile = getWorkerProfile();

  const items = useMemo(
    () =>
      detections
        .filter((item) =>
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

  const filtered =
    tab === 'all'
      ? items
      : items.filter(
          (item) => item.category === tab
        );

  const counts = useMemo(
    () => ({
      all: items.length,
      external: items.filter(
        (item) =>
          item.category === 'external'
      ).length,
      health: items.filter(
        (item) => item.category === 'health'
      ).length,
      fall: items.filter(
        (item) => item.category === 'fall'
      ).length,
    }),
    [items]
  );

  const openItem = (item) => {
    if (item.category === 'external') {
      navigate('/worker/hazards');
    } else if (item.category === 'health') {
      navigate('/worker/health');
    } else {
      navigate('/worker/fall-alert');
    }
  };

  return (
    <WorkerScaffold
      active="alerts"
      title="알림"
    >
      <div className="worker-alert-tabs">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            className={
              tab === key ? 'active' : ''
            }
            onClick={() => setTab(key)}
          >
            {label}{' '}
            {counts[key] > 0
              ? counts[key]
              : ''}
          </button>
        ))}
      </div>

      <div
        className={`worker-filter-banner ${
          hazardError ? 'danger' : 'normal'
        }`}
      >
        <span>
          {hazardError
            ? `알림 연동 실패: ${hazardError}`
            : hazardLoading
              ? '알림을 불러오는 중입니다.'
              : hazardStreamConnected
                ? `● 실시간 위험 알림 연결됨 · ${items.length}건`
                : '실시간 위험 알림 재연결 중'}
        </span>
      </div>

      <div className="worker-alert-list">
        {filtered.length > 0 ? (
          filtered.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`worker-alert-card ${item.level}`}
              onClick={() =>
                openItem(item)
              }
            >
              <div>
                <span>
                  ●{' '}
                  {item.level === 'danger'
                    ? '위험'
                    : '주의'}
                </span>
                <time>{item.time}</time>
              </div>

              <strong>{item.type}</strong>

              <p>
                {item.detailDescription ||
                  item.rawEvent?.description ||
                  `${item.name} · ${item.zone}`}
              </p>
            </button>
          ))
        ) : (
          <div className="records-empty">
            {tab === 'all'
              ? '현재 이 작업자에게 발생한 위험 알림이 없습니다.'
              : '해당 유형의 알림이 없습니다.'}
          </div>
        )}
      </div>
    </WorkerScaffold>
  );
}
