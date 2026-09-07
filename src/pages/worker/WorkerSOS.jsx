import {
  CheckCircle2,
  HeartPulse,
  LocateFixed,
  Phone,
  Radio,
  ShieldAlert,
  TriangleAlert,
} from 'lucide-react';
import {
  useMemo,
  useState,
} from 'react';
import {
  useSearchParams,
} from 'react-router-dom';
import { WorkerScaffold } from '../../components/WorkerMobileUI';
import { useNotifications } from '../../context/NotificationContext';
import { useWorkers } from '../../context/WorkerContext';
import { getWorkerProfile } from '../../utils/workerProfile';
import {
  getWorkerDeviceId,
  postureLabel,
} from '../../utils/workerRealtime';

function findCurrentWorker(workers, profile) {
  const deviceId = getWorkerDeviceId(profile);

  return (
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
    ) || null
  );
}

export default function WorkerSOS() {
  const [result, setResult] = useState(null);
  const [searchParams] = useSearchParams();
  const { addNotification } = useNotifications();
  const { workers } = useWorkers();

  const profile = getWorkerProfile();

  const worker = useMemo(
    () => findCurrentWorker(workers, profile),
    [
      workers,
      profile.name,
      profile.helmetNo,
      profile.employeeNo,
    ]
  );

  const autoDanger =
    searchParams.get('auto') === '1';

  const danger =
    worker?.status === 'danger';

  const reason =
    searchParams.get('reason') ||
    worker?.issue ||
    '긴급 상황';

  const submitSOS = (type) => {
    const now = new Date();

    addNotification({
      level: 'danger',
      title:
        type === 'location'
          ? '작업자 위치 전송'
          : '긴급 구조 요청',
      message: `${
        worker?.name || profile.name || '작업자'
      } · ${
        worker?.zone || profile.location || '-'
      } · ${reason}`,
      target: worker?.id
        ? `/workers/${worker.id}`
        : '/workers',
    });

    setResult({
      type,
      time: now.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    });
  };

  if (result) {
    return (
      <WorkerScaffold
        active="sos"
        title="긴급 SOS"
        className={`worker-sos-page ${
          danger ? 'danger-mode' : ''
        }`}
      >
        <section className="worker-sos-success">
          <header>✓ 요청 전송 완료</header>
          <CheckCircle2 size={60} />
          <h2>
            {result.type === 'location'
              ? '위치 전송이 완료되었습니다'
              : '긴급 구조 요청이 기록되었습니다'}
          </h2>
          <p>
            관리자가 확인할 수 있도록
            알림에 기록했습니다.
          </p>

          <div>
            <span>
              전송 시간
              <b>{result.time}</b>
            </span>

            <span>
              현재 위치
              <b>
                {worker?.zone ||
                  profile.location ||
                  '-'}
              </b>
            </span>

            <span>
              현재 상태
              <b
                className={
                  danger ? 'danger' : 'ok'
                }
              >
                <Radio size={13} />
                {danger ? '위험' : '확인 중'}
              </b>
            </span>
          </div>

          <button
            onClick={() => setResult(null)}
          >
            돌아가기
          </button>
        </section>
      </WorkerScaffold>
    );
  }

  return (
    <WorkerScaffold
      active="sos"
      title="긴급 SOS"
      subtitle={
        danger
          ? '위험 상태가 감지되었습니다'
          : '긴급 상황 즉시 대응 센터'
      }
      className={`worker-sos-page ${
        danger ? 'danger-mode' : ''
      }`}
    >
      {(danger || autoDanger) && (
        <section className="worker-sos-danger-banner">
          <TriangleAlert size={28} />
          <div>
            <strong>
              위험 상태가 감지되었습니다.
            </strong>
            <p>
              {reason}
              {' · '}
              {worker?.name ||
                profile.name ||
                '작업자'}
            </p>
          </div>
        </section>
      )}

      <div className="worker-sos-note">
        {danger
          ? '필요한 경우 즉시 긴급 구조 요청을 보내주세요.'
          : '긴급 상황 시 관리자 또는 구조 요청을 바로 보낼 수 있습니다.'}
      </div>

      <button
        className="worker-emergency-btn"
        onClick={() =>
          submitSOS('manager')
        }
      >
        <ShieldAlert size={47} />
        <strong>긴급 구조 요청</strong>
        <span>
          탭하면 관리자 알림에 즉시 기록됩니다
        </span>
      </button>

      <button
        className="worker-sos-action blue"
        onClick={() =>
          submitSOS('manager')
        }
      >
        <Phone size={20} />
        관리자 호출
      </button>

      <button
        className="worker-sos-action"
        onClick={() =>
          submitSOS('location')
        }
      >
        <LocateFixed size={20} />
        내 위치 전송
      </button>

      <section className="worker-white-card worker-current-state">
        <h3>현재 상태 정보</h3>

        <div>
          <span>현재 위치</span>
          <b>
            {worker?.zone ||
              profile.location ||
              '-'}
          </b>
        </div>

        <div>
          <span>최근 상태</span>
          <b
            className={
              danger ? 'danger' : 'warn'
            }
          >
            {worker?.issue ||
              (danger ? '위험' : '정상')}
          </b>
        </div>

        <div>
          <span>심박수</span>
          <b>
            <HeartPulse size={13} />
            {worker?.heartRate ?? '-'} bpm
          </b>
        </div>

        <div>
          <span>움직임</span>
          <b
            className={
              worker?.postureAbnormal
                ? 'danger'
                : 'ok'
            }
          >
            {postureLabel(
              worker?.posture
            )}
          </b>
        </div>

        <div>
          <span>센서 상태</span>
          <b
            className={
              worker?.serverDataConnected
                ? 'ok'
                : 'warn'
            }
          >
            {worker?.serverDataConnected
              ? '서버 연결됨'
              : '데이터 대기'}
          </b>
        </div>
      </section>

      <div className="worker-sos-api-note">
        현재 SOS 전용 백엔드 API가 없어
        구조 요청은 관리자 알림에 기록됩니다.
      </div>
    </WorkerScaffold>
  );
}
