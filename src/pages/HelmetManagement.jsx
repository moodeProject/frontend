import {
  Link2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Wifi,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AddHelmetModal from '../components/AddHelmetModal';
import ConnectHelmetModal from '../components/ConnectHelmetModal';
import ActionToast from '../components/ActionToast';
import TopHeader from '../components/TopHeader';
import { useWorkers } from '../context/WorkerContext';
import { getAllWorkerStatuses } from '../api/workerStatus';
import {
  getHelmets,
  getHelmetsStatus,
} from '../api/helmets';
import '../styles/safeonSync.css';

const STORAGE_KEY = 'safehelmet-helmets-v1';

function formatRelativeTime(value) {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '-';

  const diff = Math.max(0, Date.now() - date.getTime());
  const seconds = Math.floor(diff / 1000);

  if (seconds < 10) return '방금 전';
  if (seconds < 60) return `${seconds}초 전`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}분 전`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;

  return date.toLocaleDateString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
  });
}

function classifyServerStatus(status) {
  if (!status) return 'disconnected';

  const state = String(
    status.overallRiskState || ''
  ).toUpperCase();

  if (
    ['ACTION_REQUIRED','FALLING','FALLEN','DANGER'].includes(state)
  ) {
    return 'danger';
  }

  if (
    ['RECOMMEND','CAUTION','WARNING'].includes(state)
  ) {
    return 'warning';
  }

  const fallAbnormal =
    Boolean(status.fallState) &&
    String(status.fallState).toUpperCase() !== 'NORMAL';

  const healthAbnormal =
    Boolean(status.healthState) &&
    String(status.healthState).toUpperCase() !== 'NORMAL';

  const posture = String(status.posture || '').toUpperCase();
  const postureAbnormal =
    status.postureAbnormal === true ||
    String(status.postureAbnormal).toLowerCase() === 'true';

  if (
    fallAbnormal ||
    (postureAbnormal && posture === 'COLLAPSE')
  ) {
    return 'danger';
  }

  if (healthAbnormal || postureAbnormal) {
    return 'warning';
  }

  return 'normal';
}

function normalizeHelmet(raw = {}) {
  const worker =
    raw.worker &&
    typeof raw.worker === 'object'
      ? raw.worker
      : {};

  const helmetNumber =
    raw.helmetNo ??
    raw.helmetNumber ??
    raw.number ??
    raw.code ??
    raw.id ??
    '';

  const deviceId =
    raw.deviceId ??
    raw.device?.deviceId ??
    raw.sensorDeviceId ??
    '';

  const workerId =
    worker.id ??
    raw.workerId ??
    raw.assigneeId ??
    '';

  const workerName =
    worker.name ??
    raw.workerName ??
    raw.assigneeName ??
    '미연결';

  const connected =
    raw.sensorConnected ??
    raw.connected ??
    raw.online ??
    false;

  const recordedAt =
    raw.recordedAt ??
    raw.lastCommunicationAt ??
    raw.lastSeenAt ??
    raw.updatedAt ??
    null;

  return {
    ...raw,
    helmetNumber: String(helmetNumber),
    deviceId: String(deviceId),
    workerId:
      workerId === null
        ? ''
        : String(workerId),
    workerName: workerName || '미연결',
    sensorConnected: Boolean(connected),
    lastCommunication:
      recordedAt
        ? formatRelativeTime(recordedAt)
        : '-',
    recordedAt,
    status:
      workerId
        ? connected
          ? 'inUse'
          : 'disconnected'
        : connected
          ? 'standby'
          : 'disconnected',
  };
}

function loadLocalHelmets() {
  try {
    const stored = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || '[]'
    );
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function listFromPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.helmets)) return payload.helmets;
  return [];
}

export default function HelmetManagement() {
  const {
    workers,
    updateWorker,
    refreshWorkerStatuses,
  } = useWorkers();

  const [helmets, setHelmets] =
    useState(loadLocalHelmets);
  const [search, setSearch] =
    useState('');
  const [registerOpen, setRegisterOpen] =
    useState(false);
  const [connectOpen, setConnectOpen] =
    useState(false);
  const [connectPreset, setConnectPreset] =
    useState({
      helmetNumber: '',
      workerId: '',
    });
  const [menuFor, setMenuFor] =
    useState('');
  const [toast, setToast] =
    useState('');
  const [reconnectingFor, setReconnectingFor] =
    useState('');
  const [serverStatuses, setServerStatuses] =
    useState([]);
  const [helmetStatusRows, setHelmetStatusRows] =
    useState([]);
  const [serverLoading, setServerLoading] =
    useState(false);
  const [serverError, setServerError] =
    useState('');
  const [serverHelmetCount, setServerHelmetCount] =
    useState(0);
  const menuRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(helmets)
    );
  }, [helmets]);

  useEffect(() => {
    const close = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setMenuFor('');
      }
    };

    document.addEventListener('mousedown', close);

    return () =>
      document.removeEventListener(
        'mousedown',
        close
      );
  }, []);

  const refreshHelmetServerStatus =
    useCallback(async () => {
      setServerLoading(true);
      setServerError('');

      try {
        const [
          serverHelmetResult,
          serverHelmetStatusResult,
          workerStatusResult,
        ] = await Promise.allSettled([
          getHelmets(),
          getHelmetsStatus(),
          getAllWorkerStatuses(),
        ]);

        const serverHelmetRows =
          serverHelmetResult.status === 'fulfilled'
            ? listFromPayload(serverHelmetResult.value)
            : [];

        const statusRows =
          serverHelmetStatusResult.status === 'fulfilled'
            ? listFromPayload(serverHelmetStatusResult.value)
            : [];

        const workerStatuses =
          workerStatusResult.status === 'fulfilled'
            ? listFromPayload(workerStatusResult.value)
            : [];

        if (serverHelmetRows.length) {
          const normalized =
            serverHelmetRows.map(normalizeHelmet);

          setHelmets(normalized);
          setServerHelmetCount(normalized.length);
        }

        setHelmetStatusRows(statusRows);
        setServerStatuses(workerStatuses);

        const failures = [
          serverHelmetResult,
          serverHelmetStatusResult,
          workerStatusResult,
        ].filter(
          (result) => result.status === 'rejected'
        );

        if (failures.length === 3) {
          throw failures[0].reason;
        }
      } catch (error) {
        setServerError(
          error?.message ||
            '헬멧 정보를 불러오지 못했습니다.'
        );
      } finally {
        setServerLoading(false);
      }
    }, []);

  useEffect(() => {
    refreshHelmetServerStatus();

    const timer = window.setInterval(
      refreshHelmetServerStatus,
      10000
    );

    return () => window.clearInterval(timer);
  }, [refreshHelmetServerStatus]);

  const viewHelmets = useMemo(() => {
    const statusByHelmet = new Map();

    helmetStatusRows.forEach((item) => {
      const key = String(
        item?.helmetNo ??
          item?.helmetNumber ??
          item?.id ??
          ''
      );

      if (key) {
        statusByHelmet.set(key, item);
      }
    });

    const statusByDevice = new Map(
      serverStatuses
        .filter((item) => item?.deviceId)
        .map((item) => [
          String(item.deviceId),
          item,
        ])
    );

    return helmets.map((helmet) => {
      const helmetStatus =
        statusByHelmet.get(
          String(helmet.helmetNumber)
        );

      const workerStatus =
        statusByDevice.get(
          String(helmet.deviceId)
        );

      const serverStatus =
        helmetStatus ||
        workerStatus ||
        null;

      const worker =
        workers.find(
          (item) =>
            String(item.deviceId || '') ===
              String(helmet.deviceId) ||
            String(item.helmetId || '') ===
              String(helmet.helmetNumber) ||
            String(item.id || '') ===
              String(helmet.workerId || '')
        ) || null;

      const riskLevel =
        classifyServerStatus(serverStatus);

      const sensorConnected =
        Boolean(serverStatus) ||
        helmet.sensorConnected;

      return {
        ...helmet,
        workerId:
          worker?.id ||
          helmet.workerId,
        workerName:
          worker?.name ||
          helmet.workerName ||
          '미연결',
        sensorConnected,
        serverStatus,
        riskLevel,
        lastCommunication:
          serverStatus
            ? formatRelativeTime(
                serverStatus.recordedAt ||
                  serverStatus.lastCommunicationAt ||
                  serverStatus.lastSeenAt
              )
            : helmet.lastCommunication || '-',
        status:
          worker || helmet.workerId
            ? sensorConnected
              ? 'inUse'
              : 'disconnected'
            : sensorConnected
              ? 'standby'
              : 'disconnected',
      };
    });
  }, [
    helmets,
    workers,
    serverStatuses,
    helmetStatusRows,
  ]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return viewHelmets;

    return viewHelmets.filter((item) =>
      [
        item.helmetNumber,
        item.workerName,
        item.deviceId,
      ].some((value) =>
        String(value)
          .toLowerCase()
          .includes(query)
      )
    );
  }, [viewHelmets, search]);

  const inUse = viewHelmets.filter(
    (item) => item.status === 'inUse'
  ).length;

  const disconnected = viewHelmets.filter(
    (item) => item.status === 'disconnected'
  ).length;

  const dangerCount = viewHelmets.filter(
    (item) => item.riskLevel === 'danger'
  ).length;

  const addHelmet = (helmet) => {
    setHelmets((prev) => [...prev, helmet]);

    if (helmet.workerId) {
      updateWorker(helmet.workerId, {
        helmetId: helmet.helmetNumber,
        sensorConnected: helmet.sensorConnected,
      });
    }

    setToast(
      `${helmet.helmetNumber} 헬멧을 화면에 추가했습니다. 현재 확인된 배포 API에 헬멧 생성 endpoint가 없어 서버 영구 저장은 하지 않습니다.`
    );
  };

  const connectHelmet = (
    helmetNumber,
    workerId
  ) => {
    const worker = workers.find(
      (item) =>
        String(item.id) ===
        String(workerId)
    );

    if (!worker) return;

    setHelmets((prev) =>
      prev.map((item) => {
        if (
          item.helmetNumber === helmetNumber
        ) {
          return {
            ...item,
            workerId,
            workerName: worker.name,
            sensorConnected: true,
            status: 'inUse',
            lastCommunication: '방금 전',
          };
        }

        if (
          String(item.workerId) === String(workerId) &&
          item.helmetNumber !== helmetNumber
        ) {
          return {
            ...item,
            workerId: '',
            workerName: '미연결',
            status:
              item.sensorConnected
                ? 'standby'
                : 'disconnected',
          };
        }

        return item;
      })
    );

    updateWorker(workerId, {
      helmetId: helmetNumber,
      sensorConnected: true,
    });

    setToast(
      `${helmetNumber} 헬멧 연결을 화면에 반영했습니다. 서버 배정 변경 API가 추가되면 영구 저장으로 전환할 수 있습니다.`
    );
  };

  const reconnectDevice = async (helmetNumber) => {
    setReconnectingFor(helmetNumber);

    try {
      await Promise.allSettled([
        refreshHelmetServerStatus(),
        refreshWorkerStatuses?.(),
      ]);

      setToast(
        `${helmetNumber} 최신 서버 상태를 갱신했습니다.`
      );
    } finally {
      setReconnectingFor('');
    }
  };

  const unassign = (helmetNumber) => {
    const target = helmets.find(
      (item) =>
        item.helmetNumber === helmetNumber
    );

    if (target?.workerId) {
      updateWorker(target.workerId, {
        helmetId: '',
        sensorConnected: false,
      });
    }

    setHelmets((prev) =>
      prev.map((item) =>
        item.helmetNumber === helmetNumber
          ? {
              ...item,
              workerId: '',
              workerName: '미연결',
              status:
                item.sensorConnected
                  ? 'standby'
                  : 'disconnected',
            }
          : item
      )
    );

    setToast(
      `${helmetNumber} 연결을 화면에서 해제했습니다. 서버 헬멧 배정 해제 API가 현재 확인되지 않아 서버 영구 변경은 아닙니다.`
    );
  };

  const remove = (helmetNumber) => {
    setHelmets((prev) =>
      prev.filter(
        (item) =>
          item.helmetNumber !== helmetNumber
      )
    );

    setToast(
      `${helmetNumber} 헬멧을 화면에서 제거했습니다. 서버 삭제 API가 현재 확인되지 않아 다음 서버 동기화 시 다시 나타날 수 있습니다.`
    );
  };

  return (
    <>
      <TopHeader
        title="헬멧 관리"
        subtitle="스마트 안전모 등록 및 연결"
        onRefresh={() =>
          Promise.allSettled([
            refreshHelmetServerStatus(),
            refreshWorkerStatuses?.(),
          ])
        }
      />

      <div className="page-body helmets-page">
        <div className="helmet-title-row">
          <div>
            <h2>헬멧 관리</h2>
            <p>
              서버 헬멧 목록과 상태를 기준으로 스마트 안전모를 확인합니다.
            </p>
          </div>

          <div className="helmet-title-actions">
            <button
              className="helmet-connect-btn"
              onClick={() => {
                setConnectPreset({
                  helmetNumber: '',
                  workerId: '',
                });
                setConnectOpen(true);
              }}
            >
              <Link2 size={16} />
              헬멧 연결
            </button>

            <button
              className="helmet-register-btn"
              onClick={() =>
                setRegisterOpen(true)
              }
            >
              <Plus size={16} />
              헬멧 등록
            </button>
          </div>
        </div>

        <div className="helmet-stats">
          <div className="helmet-stat">
            <span>전체</span>
            <strong>{viewHelmets.length}</strong>
          </div>
          <div className="helmet-stat">
            <span>사용 중</span>
            <strong className="blue">{inUse}</strong>
          </div>
          <div className="helmet-stat">
            <span>연결 끊김</span>
            <strong className="red">
              {disconnected}
            </strong>
          </div>
        </div>

        <div
          className={`worker-filter-banner ${
            serverError
              ? 'danger'
              : 'normal'
          }`}
        >
          <span>
            {serverError
              ? `헬멧 서버 연동 일부 실패: ${serverError}`
              : serverLoading
                ? '헬멧 서버 목록/상태를 확인 중입니다.'
                : `● 헬멧 조회 API 연동됨 · 서버 헬멧 ${serverHelmetCount || viewHelmets.length}개 · 위험 헬멧 ${dangerCount}개`}
          </span>
        </div>

        <label className="helmet-search">
          <Search size={14} />
          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="헬멧 번호 또는 작업자 검색"
          />
        </label>

        <section className="panel helmet-table">
          <div className="helmet-row helmet-head">
            <span>헬멧 번호</span>
            <span>연결 작업자</span>
            <span>기기 ID</span>
            <span>센서 상태</span>
            <span>마지막 통신</span>
            <span>상태</span>
            <span>관리</span>
          </div>

          {filtered.map((helmet) => (
            <div
              className="helmet-row"
              key={
                helmet.helmetNumber ||
                helmet.deviceId
              }
            >
              <strong>{helmet.helmetNumber}</strong>
              <span
                className={
                  helmet.workerName === '미연결'
                    ? 'muted'
                    : ''
                }
              >
                {helmet.workerName}
              </span>
              <code>{helmet.deviceId}</code>

              <span
                className={`sensor-state ${
                  helmet.riskLevel === 'danger'
                    ? 'danger'
                    : helmet.riskLevel === 'warning'
                      ? 'warning'
                      : helmet.sensorConnected
                        ? 'connected'
                        : 'disconnected'
                }`}
              >
                <Wifi size={13} />
                {helmet.riskLevel === 'danger'
                  ? '위험'
                  : helmet.riskLevel === 'warning'
                    ? '주의'
                    : helmet.sensorConnected
                      ? '연결'
                      : '미연결'}
              </span>

              <span className="muted">
                {helmet.lastCommunication}
              </span>

              <span>
                <span
                  className={`helmet-status ${helmet.status}`}
                >
                  {helmet.status === 'inUse'
                    ? '사용중'
                    : helmet.status === 'standby'
                      ? '대기'
                      : '연결 끊김'}
                </span>
              </span>

              <div
                className="helmet-row-actions"
                ref={
                  menuFor === helmet.helmetNumber
                    ? menuRef
                    : null
                }
              >
                <button
                  className={`helmet-reconnect-inline ${
                    reconnectingFor === helmet.helmetNumber
                      ? 'busy'
                      : ''
                  }`}
                  onClick={() =>
                    reconnectDevice(helmet.helmetNumber)
                  }
                  title="헬멧 센서 재연결"
                  disabled={
                    reconnectingFor === helmet.helmetNumber
                  }
                >
                  <RefreshCw size={14} />
                </button>

                <div className="helmet-menu-wrap">
                  <button
                    className="helmet-menu-btn"
                    onClick={() =>
                      setMenuFor((current) =>
                        current === helmet.helmetNumber
                          ? ''
                          : helmet.helmetNumber
                      )
                    }
                  >
                    <MoreHorizontal size={17} />
                  </button>

                  {menuFor === helmet.helmetNumber && (
                    <div className="helmet-menu">
                      <button
                        onClick={() => {
                          reconnectDevice(
                            helmet.helmetNumber
                          );
                          setMenuFor('');
                        }}
                      >
                        {reconnectingFor === helmet.helmetNumber
                          ? '재연결 중...'
                          : '센서 재연결'}
                      </button>

                      <button
                        onClick={() => {
                          setConnectPreset({
                            helmetNumber:
                              helmet.helmetNumber,
                            workerId:
                              helmet.workerId || '',
                          });
                          setMenuFor('');
                          setConnectOpen(true);
                        }}
                      >
                        {helmet.workerId
                          ? '작업자 재배정'
                          : '작업자 연결'}
                      </button>

                      {helmet.workerId && (
                        <button
                          onClick={() => {
                            unassign(
                              helmet.helmetNumber
                            );
                            setMenuFor('');
                          }}
                        >
                          작업자 연결 해제
                        </button>
                      )}

                      <button
                        className="danger"
                        onClick={() => {
                          remove(
                            helmet.helmetNumber
                          );
                          setMenuFor('');
                        }}
                      >
                        헬멧 삭제
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="records-empty">
              서버에 등록된 헬멧이 없거나 검색 결과가 없습니다.
            </div>
          )}
        </section>
      </div>

      <AddHelmetModal
        open={registerOpen}
        onClose={() =>
          setRegisterOpen(false)
        }
        onAdd={addHelmet}
        helmets={helmets}
        workers={workers}
      />

      <ConnectHelmetModal
        open={connectOpen}
        onClose={() =>
          setConnectOpen(false)
        }
        onConnect={connectHelmet}
        helmets={helmets}
        workers={workers}
        initialHelmetNumber={
          connectPreset.helmetNumber
        }
        initialWorkerId={
          connectPreset.workerId
        }
      />

      <ActionToast
        message={toast}
        onClose={() =>
          setToast('')
        }
      />
    </>
  );
}
