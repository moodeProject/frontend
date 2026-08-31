import {
  Coffee,
  Heart,
  Phone,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';
import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import ActionToast from '../../components/ActionToast';
import { WorkerScaffold } from '../../components/WorkerMobileUI';
import { useDetections } from '../../context/DetectionContext';
import { useNotifications } from '../../context/NotificationContext';
import { getWorkerStatus } from '../../api/workerStatus';
import { getWorkerProfile } from '../../utils/workerProfile';
import {
  detectionBelongsToWorker,
  formatSensorTime,
  getWorkerDeviceId,
  isNormalState,
} from '../../utils/workerRealtime';

export default function WorkerHealth() {
  const { addNotification } = useNotifications();
  const { detections } = useDetections();

  const [toast, setToast] = useState({
    message: '',
    type: 'success',
  });

  const [resting, setResting] = useState(
    () =>
      localStorage.getItem(
        'safehelmet_worker_current_status'
      ) === '휴식 중'
  );

  const [sensor, setSensor] = useState(null);
  const [sensorLoading, setSensorLoading] = useState(true);
  const [sensorError, setSensorError] = useState('');

  const profile = getWorkerProfile();
  const deviceId = getWorkerDeviceId(profile);

  const loadSensor = async () => {
    if (!deviceId) {
      setSensor(null);
      setSensorError('연결된 deviceId가 없습니다.');
      setSensorLoading(false);
      return;
    }

    setSensorLoading(true);

    try {
      const data = await getWorkerStatus(deviceId);
      setSensor(data);
      setSensorError('');
    } catch (error) {
      setSensor(null);
      setSensorError(
        error?.message ||
          '최신 건강 센서 상태를 불러오지 못했습니다.'
      );
    } finally {
      setSensorLoading(false);
    }
  };

  useEffect(() => {
    loadSensor();

    const timer = window.setInterval(
      loadSensor,
      10000
    );

    return () => window.clearInterval(timer);
  }, [deviceId]);

  const healthEvents = useMemo(
    () =>
      detections
        .filter(
          (item) =>
            item.category === 'health' &&
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

  const latestHealthEvent = healthEvents[0];

  const healthNormal = sensor
    ? isNormalState(sensor.healthState)
    : null;

  const startRest = () => {
    const next = !resting;

    setResting(next);

    localStorage.setItem(
      'safehelmet_worker_current_status',
      next ? '휴식 중' : '근무 중'
    );

    setToast({
      message: next
        ? '휴식 상태로 전환했습니다.'
        : '휴식을 종료하고 근무 상태로 전환했습니다.',
      type: 'success',
    });

    window.dispatchEvent(
      new Event(
        'safehelmet-worker-status-updated'
      )
    );
  };

  const callManager = () => {
    addNotification({
      level: 'warning',
      title: `${
        profile.name || '작업자'
      } 관리자 호출`,
      message:
        '건강 이상으로 관리자 확인을 요청했습니다.',
      target: '/workers',
    });

    setToast({
      message:
        '관리자 호출은 현재 프론트 알림에 기록했습니다. 전용 호출 API가 추가되면 서버와 연결할 수 있습니다.',
      type: 'warning',
    });
  };

  const recommendedAction =
    latestHealthEvent?.actionText ||
    latestHealthEvent?.rawEvent
      ?.recommendedAction ||
    (!sensor
      ? '센서 연결 상태를 확인해주세요.'
      : healthNormal
        ? '현재 건강 센서 상태가 정상입니다.'
        : '작업을 멈추고 휴식 후 상태를 다시 확인하세요.');

  return (
    <WorkerScaffold
      active="home"
      title="건강 상태 상세"
      back
    >
      {sensorError && (
        <div className="worker-filter-banner danger">
          <span>
            {deviceId || 'deviceId'} · {sensorError}
          </span>
        </div>
      )}

      <section className="worker-white-card worker-health-detail-card">
        <div className="worker-card-title">
          <strong>실시간 건강 상태</strong>
          <span className="worker-count-pill">
            {!sensor
              ? '데이터 없음'
              : healthNormal
                ? '정상'
                : '주의'}
          </span>
        </div>

        <div className="worker-fatigue-big">
          <i />
          <i />
          <i />
        </div>

        <p>
          {latestHealthEvent?.detailDescription ||
            (!sensor
              ? '최신 센서 데이터가 없습니다.'
              : healthNormal
                ? '현재 서버에서 건강 이상 상태가 감지되지 않았습니다.'
                : `건강 상태: ${sensor.healthState}`)}
        </p>

        <hr />

        <div className="worker-health-detail-item">
          <i>
            <Heart size={22} />
          </i>

          <p>
            <span>심박수</span>
            <strong>
              {sensor?.heartRate ?? '-'}{' '}
              <small>bpm</small>
            </strong>
          </p>

          <b>
            {sensorLoading
              ? '갱신 중'
              : sensor?.heartRate != null
                ? '실시간'
                : '데이터 없음'}
          </b>
        </div>

        <div className="worker-health-detail-item">
          <i>
            <ShieldCheck size={22} />
          </i>

          <p>
            <span>SpO₂</span>
            <strong>
              {sensor?.spo2 ?? '-'}{' '}
              <small>%</small>
            </strong>
          </p>

          <b>
            {sensor
              ? formatSensorTime(
                  sensor.recordedAt
                )
              : '-'}
          </b>
        </div>

        <div className="worker-health-detail-item">
          <i>
            <TriangleAlert size={22} />
          </i>

          <p>
            <span>최근 건강 이벤트</span>
            <strong>
              {latestHealthEvent?.type ||
                '없음'}
            </strong>
          </p>

          <b>
            {latestHealthEvent?.time || '-'}
          </b>
        </div>
      </section>

      <section className="worker-recommend-card">
        <h3>권장 행동</h3>
        <p>✓ {recommendedAction}</p>

        {!healthNormal && sensor && (
          <>
            <p>
              ✓ 충분한 휴식과 수분 섭취 후 다시
              상태를 확인하세요.
            </p>
            <p>
              ✓ 증상이 지속되면 관리자를
              호출하세요.
            </p>
          </>
        )}
      </section>

      <div className="worker-two-actions">
        <button onClick={startRest}>
          <Coffee size={19} />
          {resting ? '휴식 종료' : '휴식하기'}
        </button>

        <button
          className="secondary"
          onClick={callManager}
        >
          <Phone size={19} />
          관리자 호출
        </button>
      </div>

      <button
        className="worker-section-link"
        onClick={loadSensor}
        disabled={sensorLoading}
      >
        <RefreshCw size={15} />
        {sensorLoading
          ? '센서 갱신 중'
          : '센서 상태 새로고침'}
      </button>

      <ActionToast
        message={toast.message}
        type={toast.type}
        onClose={() =>
          setToast({
            message: '',
            type: 'success',
          })
        }
      />
    </WorkerScaffold>
  );
}
