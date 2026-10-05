import {
  MapPin,
  Phone,
  TriangleAlert,
  UserRound,
} from 'lucide-react';
import {
  useEffect,
  useMemo,
} from 'react';
import {
  useNavigate,
} from 'react-router-dom';
import { WorkerScaffold } from '../../components/WorkerMobileUI';
import { useWorkers } from '../../context/WorkerContext';
import { getWorkerProfile } from '../../utils/workerProfile';
import {
  getWorkerDeviceId,
} from '../../utils/workerRealtime';

const DISTANCES = [14, 28, 41, 67, 89];
const POSITIONS = [
  { x: 49, y: 38 },
  { x: 56, y: 52 },
  { x: 32, y: 34 },
  { x: 38, y: 70 },
  { x: 74, y: 22 },
];

function currentWorkerFrom(
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

function statusMeta(worker) {
  if (worker?.status === 'danger') {
    return {
      label: '위험',
      className: 'danger',
    };
  }

  const savedStatus =
    localStorage.getItem(
      `safeon_worker_status_${worker?.id}`
    ) || '';

  if (
    savedStatus === '휴식 중' ||
    savedStatus === '휴식'
  ) {
    return {
      label: '휴식 중',
      className: 'rest',
    };
  }

  return {
    label: '근무 중',
    className: 'work',
  };
}

export default function WorkerNearby() {
  const navigate = useNavigate();
  const { workers } = useWorkers();
  const profile = getWorkerProfile();

  const currentWorker = useMemo(
    () =>
      currentWorkerFrom(
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

  const people = useMemo(() => {
    const candidates = workers
      .filter(
        (worker) =>
          !currentWorker ||
          worker.id !== currentWorker.id
      )
      .slice(0, 5);

    return candidates.map(
      (worker, index) => {
        const meta =
          statusMeta(worker);

        return {
          ...worker,
          initial:
            worker.name?.slice(0, 1) ||
            '?',
          distance:
            DISTANCES[index] ??
            100 + index * 10,
          x:
            POSITIONS[index]?.x ??
            50,
          y:
            POSITIONS[index]?.y ??
            50,
          state: meta.label,
          className:
            meta.className,
        };
      }
    );
  }, [workers, currentWorker]);

  const nearest =
    people[0] || null;

  const dangerCount =
    people.filter(
      (person) =>
        person.className === 'danger'
    ).length;

  /*
   * 주변 페이지를 열면 주변 위험 알림은 읽음 처리.
   */
  useEffect(() => {
    try {
      const key =
        'safeon_worker_nearby_danger_alerts_v1';

      const alerts = JSON.parse(
        localStorage.getItem(key) || '[]'
      );

      if (Array.isArray(alerts)) {
        localStorage.setItem(
          key,
          JSON.stringify(
            alerts.map((item) => ({
              ...item,
              read: true,
            }))
          )
        );

        window.dispatchEvent(
          new CustomEvent(
            'safeon-worker-nearby-alerts-updated'
          )
        );
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <WorkerScaffold
      active="nearby"
      title="주변 작업자"
    >
      {dangerCount > 0 && (
        <div className="worker-nearby-danger-summary">
          <TriangleAlert size={20} />

          <div>
            <strong>
              주변 작업자 {dangerCount}명
              위험 상태
            </strong>

            <span>
              위험 작업자를 확인하고
              필요 시 관리자에게 알려주세요.
            </span>
          </div>
        </div>
      )}

      <section className="worker-white-card worker-radar-card">
        <div className="worker-card-title">
          <strong>주변 작업자 레이더</strong>

          <span className="worker-live">
            ● 실시간
          </span>
        </div>

        <div className="worker-radar">
          <div className="worker-radar-center">
            나
          </div>

          <span className="worker-ring-label r30">
            30m
          </span>

          <span className="worker-ring-label r60">
            60m
          </span>

          {people.map((person) => (
            <div
              key={person.id}
              className={`worker-radar-dot ${person.className}`}
              style={{
                left: `${person.x}%`,
                top: `${person.y}%`,
              }}
            >
              <i />

              <small>
                {person.name}
              </small>
            </div>
          ))}
        </div>

        <div className="worker-radar-legend">
          <span>
            <i className="work" />
            근무 중
          </span>

          <span>
            <i className="rest" />
            휴식 중
          </span>

          <span>
            <i className="danger" />
            위험
          </span>
        </div>
      </section>

      {nearest && (
        <section className="worker-nearest-card">
          <div>
            <UserRound size={23} />

            <p>
              <small>
                가장 가까운 작업자
              </small>

              <strong>
                {nearest.name}{' '}
                <b>
                  {nearest.distance}m
                </b>
              </strong>

              <span>
                {nearest.zone || '-'}
                {' · '}
                {nearest.state}
              </span>
            </p>
          </div>

          <button
            type="button"
            disabled={!nearest.phone}
            onClick={() => {
              if (nearest.phone) {
                window.location.href =
                  `tel:${nearest.phone}`;
              }
            }}
          >
            <Phone size={19} />
            연락하기
          </button>
        </section>
      )}

      <div className="worker-nearby-list">
        {people.map(
          (person, index) => (
            <article
              key={person.id}
              className={
                person.className ===
                'danger'
                  ? 'danger'
                  : ''
              }
              onClick={() =>
                navigate('/worker/alerts')
              }
            >
              <div
                className={`worker-person-avatar ${person.className}`}
              >
                {person.initial}

                {index === 0 && (
                  <b>1</b>
                )}
              </div>

              <div className="worker-person-copy">
                <strong>
                  {person.name}{' '}

                  <em
                    className={
                      person.className
                    }
                  >
                    ● {person.state}
                  </em>
                </strong>

                <span>
                  <MapPin size={13} />
                  {person.zone || '-'}
                </span>

                {person.className ===
                  'danger' && (
                  <small className="worker-nearby-danger-reason">
                    {person.issue ||
                      '위험 상태 감지'}
                  </small>
                )}
              </div>

              <div className="worker-distance">
                <strong>
                  {person.distance}m
                </strong>

                <small>
                  {person.heartRate ??
                    '-'}{' '}
                  bpm
                </small>
              </div>
            </article>
          )
        )}
      </div>

      <p className="worker-last-update">
        상태 정보는 서버 작업자 상태 API를
        기준으로 표시합니다.
      </p>

      <div className="worker-nearby-api-note">
        현재 실제 거리/BLE 비콘 위치 API가
        없어서 레이더 거리값은 화면용
        임시값이며, 작업자의 위험·심박·상태는
        서버 상태값을 사용합니다.
      </div>
    </WorkerScaffold>
  );
}
