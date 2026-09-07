import {
  Clock3,
  Heart,
  LocateFixed,
  MapPin,
  Radio,
  ShieldCheck,
  Siren,
  TriangleAlert,
  Wifi,
} from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { WorkerScaffold } from '../../components/WorkerMobileUI';
import { useDetections } from '../../context/DetectionContext';
import { useWorkers } from '../../context/WorkerContext';
import { getWorkerProfile } from '../../utils/workerProfile';
import {
  detectionBelongsToWorker,
  formatSensorTime,
  getWorkerDeviceId,
  isNormalState,
  postureLabel,
  postureTone,
  sensorUiStatus,
} from '../../utils/workerRealtime';

export default function WorkerHome() {
  const navigate = useNavigate();
  const profile = getWorkerProfile();

  const {
    detections,
    hazardStreamConnected,
  } = useDetections();

  const {
    workers,
    sensorLoading,
    sensorError,
    refreshWorkerStatuses,
  } = useWorkers();

  const deviceId = getWorkerDeviceId(profile);

  const currentWorker = useMemo(
    () =>
      workers.find(
        (worker) =>
          (deviceId &&
            String(worker.deviceId || '') ===
              String(deviceId)) ||
          (profile.helmetNo &&
            String(worker.helmetId || '') ===
              String(profile.helmetNo)) ||
          (profile.name &&
            String(worker.name || '') ===
              String(profile.name))
      ) || null,
    [
      workers,
      deviceId,
      profile.helmetNo,
      profile.name,
    ]
  );

  const sensor =
    currentWorker?.serverDataConnected
      ? currentWorker
      : null;

  useEffect(() => {
    refreshWorkerStatuses().catch(() => {});
  }, [refreshWorkerStatuses]);

  const myEvents = useMemo(
    () =>
      detections
        .filter((item) =>
          detectionBelongsToWorker(item, profile)
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

  const externalHazards = myEvents
    .filter((item) => item.category === 'external')
    .slice(0, 2);

  const latestHealth = myEvents.find(
    (item) => item.category === 'health'
  );

  const uiStatus = sensorUiStatus(sensor);

  const sensorConnected = Boolean(sensor);
  const fallNormal = sensor
    ? isNormalState(sensor.fallState)
    : null;

  const healthNormal = sensor
    ? isNormalState(sensor.healthState)
    : null;

  const movementTone = postureTone(sensor);

  return (
    <WorkerScaffold
      active="home"
      title={`${profile.name || '작업자'} 작업자님`}
      subtitle="오늘도 안전하게 작업하세요"
      className="worker-home-page"
    >
      <div className="worker-home-statusline">
        <span>
          <ShieldCheck size={14} />
          {profile.helmetConnected !== false
            ? '안전모 연결됨'
            : '안전모 연결 확인 필요'}
        </span>

        <span>
          <Wifi size={14} />
          {sensorConnected
            ? `센서 연결됨 · ${formatSensorTime(
                sensor.recordedAt
              )}`
            : sensorLoading
              ? '센서 확인 중'
              : '센서 데이터 없음'}
        </span>
      </div>

      {sensorError && (
        <div className="worker-filter-banner danger">
          <span>
            {deviceId || 'deviceId'} · {sensorError}
          </span>
        </div>
      )}

      <section
        className={`worker-state-card ${
          uiStatus.key === 'danger'
            ? 'danger'
            : uiStatus.key === 'warning'
              ? 'warning'
              : 'normal'
        }`}
      >
        <div className="worker-state-card-head">
          <strong>
            <TriangleAlert size={16} /> 현재 상태
          </strong>
          <span>
            {uiStatus.key === 'danger'
              ? '● 위험'
              : uiStatus.key === 'warning'
                ? '● 주의'
                : uiStatus.key === 'normal'
                  ? '● 정상'
                  : '● 확인 필요'}
          </span>
        </div>

        <div className="worker-state-row">
          <span>
            <MapPin size={17} /> 위치
          </span>
          <b>{currentWorker?.zone || profile.location || '-'}</b>
        </div>

        <div className="worker-state-row">
          <span>
            <ShieldCheck size={17} /> 안전모
          </span>
          <b className="ok">
            {currentWorker?.helmetId || profile.helmetNo || '-'}
          </b>
        </div>

        <div className="worker-state-row">
          <span>
            <Radio size={17} /> 센서
          </span>
          <b className={sensorConnected ? 'ok' : ''}>
            {sensorConnected
              ? deviceId
              : '최신 데이터 없음'}
          </b>
        </div>

        <div className={`worker-state-row movement ${movementTone}`}>
          <span>
            <TriangleAlert size={17} /> 움직임
          </span>
          <b>
            {sensorConnected
              ? postureLabel(sensor?.posture)
              : '데이터 없음'}
          </b>
        </div>
      </section>

      <section className="worker-white-card">
        <div className="worker-card-title">
          <strong>건강 상태</strong>
          <button
            onClick={() =>
              navigate('/worker/health')
            }
          >
            상세보기 ›
          </button>
        </div>

        <div className="worker-fatigue-row">
          <span>건강 상태</span>
          <div className="worker-fatigue-bars">
            <i />
            <i />
            <i />
          </div>
          <b>
            {!sensor
              ? '확인 필요'
              : healthNormal
                ? '정상'
                : '주의'}
          </b>
        </div>

        <div className="worker-health-mini-grid">
          <div>
            <Heart size={18} />
            <span>심박수</span>
            <strong>
              {sensor?.heartRate ?? '-'}{' '}
              <small>bpm</small>
            </strong>
          </div>

          <div>
            <TriangleAlert size={18} />
            <span>건강 이벤트</span>
            <strong>
              {latestHealth?.type ||
                (!sensor
                  ? '데이터 없음'
                  : healthNormal
                    ? '정상'
                    : sensor.healthState)}
            </strong>
          </div>
        </div>
      </section>

      <section className="worker-white-card">
        <div className="worker-card-title">
          <strong>주변 위험요인</strong>
          <span className="worker-count-pill">
            {
              myEvents.filter(
                (item) =>
                  item.category === 'external'
              ).length
            }
            건
          </span>
        </div>

        {externalHazards.length > 0 ? (
          externalHazards.map((item) => (
            <button
              className="worker-hazard-row"
              key={item.id}
              onClick={() =>
                navigate('/worker/hazards')
              }
            >
              <i>
                <TriangleAlert size={18} />
              </i>

              <div>
                <strong>{item.type}</strong>
                <small>
                  {item.detailDescription ||
                    item.rawEvent?.description ||
                    item.zone}
                </small>
              </div>

              <b>
                ●{' '}
                {item.level === 'danger'
                  ? '위험'
                  : '주의'}
              </b>
            </button>
          ))
        ) : (
          <div className="records-empty">
            {hazardStreamConnected
              ? '현재 작업자에게 발생한 외부 위험 이벤트가 없습니다.'
              : '위험 이벤트 연결을 확인 중입니다.'}
          </div>
        )}

        <button
          className="worker-section-link"
          onClick={() =>
            navigate('/worker/hazards')
          }
        >
          상세보기 ›
        </button>
      </section>

      <section
        className={
          fallNormal === false
            ? 'worker-fall-ok-card danger'
            : 'worker-fall-ok-card'
        }
      >
        <div>
          {fallNormal === false ? (
            <TriangleAlert size={22} />
          ) : (
            <ShieldCheck size={22} />
          )}

          <p>
            <strong>
              {!sensor
                ? '추락 상태 확인 필요'
                : fallNormal
                  ? '추락 감지 없음'
                  : `추락 상태: ${sensor.fallState}`}
            </strong>
            <small>
              {!sensor
                ? '최신 센서 데이터가 없습니다.'
                : `신뢰도 ${
                    sensor.fallConfidence ?? '-'
                  } · ${formatSensorTime(
                    sensor.recordedAt
                  )}`}
            </small>
          </p>
        </div>

        <button
          onClick={() =>
            navigate('/worker/fall-alert')
          }
        >
          <Siren size={14} />
          상세
        </button>
      </section>

      <div className="worker-home-actions">
        <button
          onClick={() =>
            navigate('/worker/attendance')
          }
        >
          <Clock3 size={23} />
          근태 보기
        </button>

        <button
          className="outline"
          onClick={() =>
            alert(
              `현재 위치: ${
                profile.location || '-'
              }`
            )
          }
        >
          <LocateFixed size={23} />
          위치 확인
        </button>

        <button
          className="danger"
          onClick={() =>
            navigate('/worker/sos')
          }
        >
          <Siren size={23} />
          SOS 요청
        </button>
      </div>
    </WorkerScaffold>
  );
}
