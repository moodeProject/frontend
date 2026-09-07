import {
  CheckCircle2,
  HeartPulse,
  LocateFixed,
  Phone,
  Radio,
  ShieldAlert,
  Siren,
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

function findCurrentWorker(
  workers,
  profile
) {
  const deviceId =
    getWorkerDeviceId(profile);

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
  const [result, setResult] =
    useState(null);

  const [searchParams] =
    useSearchParams();

  const { addNotification } =
    useNotifications();

  const { workers } = useWorkers();

  const profile = getWorkerProfile();

  const worker = useMemo(
    () =>
      findCurrentWorker(
        workers,
        profile
      ),
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

  const nowTime = () =>
    new Date().toLocaleTimeString(
      'ko-KR',
      {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }
    );

  const managerMessage = () => {
    const workerName =
      worker?.name ||
      profile.name ||
      '작업자';

    const zone =
      worker?.zone ||
      profile.location ||
      '-';

    return `${workerName} · ${zone} · 관리자 확인 요청 · ${reason}`;
  };

  const callManager = ({
    fromEmergency = false,
  } = {}) => {
    addNotification({
      level: 'danger',
      title: fromEmergency
        ? '119 신고 후 관리자 호출'
        : '관리자 호출',
      message: managerMessage(),
      target: worker?.id
        ? `/workers/${worker.id}`
        : '/workers',
    });

    setResult({
      type: fromEmergency
        ? 'emergency-manager'
        : 'manager',
      time: nowTime(),
    });
  };

  const requestEmergencyRescue = () => {
    const confirmed =
      window.confirm(
        '119 신고 연결을 진행할까요?'
      );

    if (!confirmed) return;

    setResult({
      type: 'emergency',
      time: nowTime(),
    });

    /*
     * 브라우저는 실제 통화 완료 여부를 확인할 수 없습니다.
     * 사용자의 버튼 클릭으로 기기의 119 전화 화면을 엽니다.
     */
    window.setTimeout(() => {
      window.location.href = 'tel:119';
    }, 200);
  };

  const sendLocation = () => {
    addNotification({
      level: 'warning',
      title: '작업자 위치 전송',
      message: `${
        worker?.name ||
        profile.name ||
        '작업자'
      } · ${
        worker?.zone ||
        profile.location ||
        '-'
      } · 위치 확인 요청`,
      target: worker?.id
        ? `/workers/${worker.id}`
        : '/workers',
    });

    setResult({
      type: 'location',
      time: nowTime(),
    });
  };

  if (result) {
    const isEmergency =
      result.type === 'emergency';

    const isEmergencyManager =
      result.type ===
      'emergency-manager';

    const isManager =
      result.type === 'manager';

    const isLocation =
      result.type === 'location';

    return (
      <WorkerScaffold
        active="sos"
        title="긴급 SOS"
        className={`worker-sos-page ${
          danger
            ? 'danger-mode'
            : ''
        }`}
      >
        <section className="worker-sos-success">
          <header>
            ✓{' '}
            {isEmergency
              ? '119 신고 연결 완료'
              : isEmergencyManager
                ? '관리자 호출 완료'
                : isManager
                  ? '관리자 호출 완료'
                  : '위치 전송 완료'}
          </header>

          <CheckCircle2 size={60} />

          <h2>
            {isEmergency
              ? '119 신고 연결을 진행했습니다'
              : isEmergencyManager
                ? '관리자 호출까지 완료했습니다'
                : isManager
                  ? '관리자 호출이 완료되었습니다'
                  : '현재 위치를 전송했습니다'}
          </h2>

          <p>
            {isEmergency
              ? '119 전화 화면 연결 후 필요하면 아래 버튼으로 관리자도 바로 호출하세요.'
              : isEmergencyManager
                ? '관리자가 확인할 수 있도록 긴급 알림에 기록했습니다.'
                : isManager
                  ? '관리자가 확인할 수 있도록 알림에 기록했습니다.'
                  : '관리자가 작업 위치를 확인할 수 있도록 알림에 기록했습니다.'}
          </p>

          <div>
            <span>
              처리 시간
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
                  danger
                    ? 'danger'
                    : 'ok'
                }
              >
                <Radio size={13} />
                {danger
                  ? '위험'
                  : '확인 중'}
              </b>
            </span>
          </div>

          {isEmergency && (
            <>
              <button
                type="button"
                className="worker-sos-result-manager-btn"
                onClick={() =>
                  callManager({
                    fromEmergency: true,
                  })
                }
              >
                <Phone size={19}/>
                관리자 호출
              </button>

              <a
                href="tel:119"
                className="worker-sos-result-recall"
              >
                <Siren size={17}/>
                119 다시 연결
              </a>
            </>
          )}

          <button
            onClick={() =>
              setResult(null)
            }
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
        danger
          ? 'danger-mode'
          : ''
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
          ? '필요한 경우 즉시 긴급 구조 요청을 진행해주세요.'
          : '119 신고 또는 관리자 호출을 선택할 수 있습니다.'}
      </div>

      <button
        className="worker-emergency-btn"
        onClick={
          requestEmergencyRescue
        }
      >
        <ShieldAlert size={47} />

        <strong>
          긴급 구조 요청
        </strong>

        <span>
          119 신고 연결
        </span>
      </button>

      <button
        className="worker-sos-action blue"
        onClick={() =>
          callManager()
        }
      >
        <Phone size={20} />
        관리자 호출
      </button>

      <button
        className="worker-sos-action"
        onClick={sendLocation}
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
              danger
                ? 'danger'
                : 'warn'
            }
          >
            {worker?.issue ||
              (danger
                ? '위험'
                : '정상')}
          </b>
        </div>

        <div>
          <span>심박수</span>

          <b>
            <HeartPulse size={13} />
            {worker?.heartRate ??
              '-'}{' '}
            bpm
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
      </section>
    </WorkerScaffold>
  );
}
