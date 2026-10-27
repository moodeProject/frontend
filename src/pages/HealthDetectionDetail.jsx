import {
  CheckCircle2,
  ChevronLeft,
  HeartPulse,
  MapPin,
  Phone,
  RefreshCw,
  Thermometer,
  TimerReset,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom';
import ActionToast from '../components/ActionToast';
import TopHeader from '../components/TopHeader';
import { useDetections } from '../context/DetectionContext';
import { useNotifications } from '../context/NotificationContext';
import { useWorkers } from '../context/WorkerContext';
import {
  getHazardEvent,
  runHazardEventAction,
} from '../api/hazardEvents';

function getAdminId() {
  try {
    const admin = JSON.parse(
      localStorage.getItem('safehelmet_current_admin') || '{}'
    );

    const candidates = [
      admin.adminId,
      admin.backendId,
      admin.userId,
      admin.id,
    ];

    for (const candidate of candidates) {
      const value = Number(candidate);
      if (Number.isInteger(value) && value >= 0) {
        return value;
      }
    }
  } catch {
    // mock 로그인 단계에서는 0 사용
  }

  return 0;
}

function findWorker(detail, fallback, workers) {
  return workers.find((worker) => {
    const byName =
      detail?.worker?.name &&
      worker.name === detail.worker.name;

    const byEmployeeNo =
      detail?.worker?.employeeNo &&
      (worker.employeeNumber === detail.worker.employeeNo ||
        worker.workerCode === detail.worker.employeeNo);

    const byHelmet =
      detail?.helmetNo &&
      (worker.helmetId === detail.helmetNo ||
        worker.id === detail.helmetNo);

    const fallbackName =
      fallback?.name &&
      worker.name === fallback.name;

    return byName || byEmployeeNo || byHelmet || fallbackName;
  });
}

function isHeatHazard(detail, fallback) {
  const raw = String(
    detail?.hazardType ??
      detail?.hazardLabel ??
      fallback?.kind ??
      ''
  ).toLowerCase();

  return (
    raw.includes('heat') ||
    raw.includes('temperature') ||
    raw.includes('thermal') ||
    raw.includes('열')
  );
}

// 서버 HazardActionType / WorkerState 를 화면 문구로
const ACTION_LABELS = {
  SEND_WARNING: '휴식 권고 전송',
  BLOCK_ZONE: '구역 접근 금지',
  RESOLVE: '처리 완료',
};

const HEALTH_STATE_LABELS = {
  NORMAL: '정상',
  RECOMMEND: '휴식 권고',
  ACTION_REQUIRED: '조치 필요',
};

function formatVital(value, unit) {
  return value != null && Number(value) > 0 ? `${value}${unit}` : '-';
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatTime(value) {
  if (!value) return '--:--';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--:--';

  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export default function HealthDetectionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    detections,
    acknowledgeDetection,
    completeDetection,
    refreshHazardEvents,
  } = useDetections();

  const { workers } = useWorkers();
  const { addNotification } = useNotifications();

  const fallbackItem = useMemo(
    () =>
      detections.find(
        (item) => String(item.id) === String(id)
      ),
    [detections, id]
  );

  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [detailError, setDetailError] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [toast, setToast] = useState({
    message: '',
    type: 'success',
  });

  const loadDetail = useCallback(async () => {
    setDetailLoading(true);
    setDetailError('');

    try {
      const data = await getHazardEvent(id);
      setDetail(data);
      return data;
    } catch (error) {
      console.error('건강 이상 상세 조회 실패:', error);
      setDetailError(
        error?.message ||
          '건강 이상 상세 정보를 불러오지 못했습니다.'
      );
      throw error;
    } finally {
      setDetailLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDetail().catch(() => {});
    acknowledgeDetection(id);
  }, [id, loadDetail]);

  const worker = useMemo(
    () => findWorker(detail, fallbackItem, workers),
    [detail, fallbackItem, workers]
  );

  const isHeat = isHeatHazard(detail, fallbackItem);
  // 사고가 생긴 순간의 생체 값(서버 vitals). 아래 "현재 상태"는 실시간 값이라 서로 다를 수 있다.
  const snapshot = detail?.vitals ?? null;
  const actions = Array.isArray(detail?.actions) ? detail.actions : [];
  const exampleHeart = worker?.healthExampleFields?.heartRate === true;
  const exampleSpo2 = worker?.healthExampleFields?.spo2 === true;

  const category = String(
    detail?.category ?? ''
  ).toUpperCase();

  const completed =
    String(detail?.status ?? fallbackItem?.status ?? '')
      .toUpperCase() === 'RESOLVED' ||
    fallbackItem?.processClass === 'completed';

  const name =
    detail?.worker?.name ||
    fallbackItem?.name ||
    worker?.name ||
    '미확인 작업자';

  const zone =
    detail?.zone?.name ||
    detail?.zone?.code ||
    fallbackItem?.zone ||
    worker?.zone ||
    '-';

  const time = formatTime(
    detail?.occurredAt ||
      fallbackItem?.occurredAt
  );

  const type =
    detail?.hazardLabel ||
    detail?.hazardType ||
    fallbackItem?.type ||
    (isHeat ? '열사병 위험' : '건강 이상');

  const riskDescription =
    detail?.riskDescription ||
    detail?.detail ||
    fallbackItem?.detailDescription ||
    (isHeat
      ? '체온 상승 또는 고온 환경 노출 위험이 감지되었습니다.'
      : '센서 데이터에서 건강 이상 징후가 감지되었습니다.');

  const recommendedAction =
    detail?.recommendedAction ||
    fallbackItem?.actionText ||
    (isHeat
      ? '그늘 또는 냉방 공간으로 이동하고 수분을 섭취하도록 안내하세요.'
      : '충분한 휴식과 수분 섭취를 안내하세요.');

  const runAction = async (
    actionType,
    memo,
    successMessage
  ) => {
    if (actionLoading) return null;

    setActionLoading(actionType);

    try {
      const result = await runHazardEventAction(id, {
        actionType,
        adminId: getAdminId(),
        memo,
      });

      if (actionType === 'RESOLVE') {
        completeDetection(id);
      }

      await Promise.allSettled([
        loadDetail(),
        refreshHazardEvents(),
      ]);

      setToast({
        message: result?.message || successMessage,
        type: 'success',
      });

      return result;
    } catch (error) {
      setToast({
        message:
          error?.message ||
          '조치 실행에 실패했습니다.',
        type: 'error',
      });
      return null;
    } finally {
      setActionLoading('');
    }
  };

  const sendRest = async () => {
    const result = await runAction(
      'SEND_WARNING',
      `${name} 작업자 건강 이상 감지 · 휴식 권고`,
      `${name} 작업자에게 휴식 권고 경고를 전송했습니다.`
    );

    if (result) {
      addNotification({
        level: 'warning',
        title: `${name} 휴식 권고 전송`,
        message: `${type} 감지에 따라 휴식 권고를 전송했습니다.`,
        target: worker
          ? `/workers/${worker.id}`
          : `/detections/health/${id}`,
      });
    }
  };

  const finish = async () => {
    // type 이 이미 "건강 이상 감지"면 그대로 붙였을 때 "건강 이상 감지 건강 이상 감지"가 된다
    const label = type.includes('건강 이상') ? type : `${type} 건강 이상`;
    await runAction(
      'RESOLVE',
      `${label} 처리 완료`,
      '건강 이상 감지 건을 처리완료로 변경했습니다.'
    );
  };

  const callWorker = () => {
    if (worker?.phone) {
      window.location.href = `tel:${worker.phone.replace(
        /[^0-9+]/g,
        ''
      )}`;

      setToast({
        message: `${name} 작업자에게 전화를 연결합니다.`,
        type: 'info',
      });
    } else {
      setToast({
        message: '등록된 연락처가 없습니다.',
        type: 'warning',
      });
    }
  };

  if (
    !detailLoading &&
    detail &&
    category &&
    category !== 'HEALTH'
  ) {
    return (
      <>
        <TopHeader
          title="이상 감지"
          subtitle="외부요인 · 건강 · 추락"
          onRefresh={loadDetail}
        />
        <div className="page-body health-detection-detail-page">
          <Link
            className="back-link detail-back"
            to="/detections?tab=health"
          >
            <ChevronLeft size={14} />
            이상 감지 목록
          </Link>

          <div className="records-empty">
            건강 감지 이벤트가 아닙니다.
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TopHeader
        title="이상 감지"
        subtitle="외부요인 · 건강 · 추락"
        onRefresh={loadDetail}
      />

      <div className="page-body health-detection-detail-page">
        <Link
          className="back-link detail-back"
          to="/detections?tab=health"
        >
          <ChevronLeft size={14} />
          이상 감지 목록
        </Link>

        {detailLoading && (
          <div className="worker-filter-banner normal">
            <span>
              건강 이상 상세 정보를 불러오는 중입니다.
            </span>
          </div>
        )}

        {detailError && (
          <div className="worker-filter-banner danger">
            <span>
              건강 상세 API 연동 실패: {detailError}
            </span>
          </div>
        )}

        <div className="health-detection-heading">
          <div className="health-detection-icon">
            {isHeat ? (
              <Thermometer size={21} />
            ) : (
              <HeartPulse size={21} />
            )}
          </div>

          <div>
            <h2>건강 이상 감지</h2>
            <p>
              {name} · {zone} · {time}
            </p>
          </div>

          <span className="risk-chip warning">
            ● 주의
          </span>
        </div>

        <div className="health-detection-grid">
          <section className="panel health-detection-main-card">
            <div className="section-caption">
              건강 상태
            </div>

            <div className="health-metric-hero">
              <div className="health-metric-icon">
                {isHeat ? (
                  <Thermometer size={28} />
                ) : (
                  <HeartPulse size={28} />
                )}
              </div>

              <div>
                <span>{type}</span>

                <strong>
                  {snapshot?.heartRate > 0
                    ? `${snapshot.heartRate} bpm`
                    : worker?.heartRate
                      ? `${worker.heartRate} bpm${exampleHeart ? ' · 예시' : ''}`
                      : '센서 확인 필요'}
                </strong>

                <p>{riskDescription}</p>
              </div>
            </div>

            {snapshot && (
              <>
                <div className="section-caption health-section-gap">
                  발생 당시 측정값 · {time}
                </div>
                <div className="health-metric-grid">
                  <div>
                    <span>심박수</span>
                    <b>{formatVital(snapshot.heartRate, ' bpm')}</b>
                  </div>
                  <div>
                    <span>SpO₂</span>
                    <b>{formatVital(snapshot.spo2, '%')}</b>
                  </div>
                  <div>
                    <span>HRV</span>
                    <b>{formatVital(snapshot.hrv, ' ms')}</b>
                  </div>
                  <div>
                    <span>위험 단계</span>
                    <b>
                      {HEALTH_STATE_LABELS[snapshot.healthState] ||
                        snapshot.healthState ||
                        '-'}
                    </b>
                  </div>
                </div>
              </>
            )}

            <div className="section-caption health-section-gap">
              현재 상태 · 실시간
            </div>

            <div className="health-metric-grid">
              <div>
                <span>심박수</span>
                <b>
                  {worker?.heartRate
                    ? `${worker.heartRate} bpm${exampleHeart ? ' · 예시' : ''}`
                    : '-'}
                </b>
              </div>

              <div>
                <span>SpO₂</span>
                <b>
                  {worker?.spo2 != null
                    ? `${worker.spo2}%${exampleSpo2 ? ' · 예시' : ''}`
                    : '-'}
                </b>
              </div>

              <div>
                <span>작업 위치</span>
                <b>{zone}</b>
              </div>

              <div>
                <span>센서 상태</span>
                <b
                  className={
                    worker?.sensorConnected ? 'ok' : ''
                  }
                >
                  {worker?.sensorConnected
                    ? '정상 연결'
                    : '확인 필요'}
                </b>
              </div>
            </div>

            <div className="health-recommend-box">
              <TimerReset size={18} />

              <div>
                <strong>권장 조치</strong>
                <p>{recommendedAction}</p>
              </div>
            </div>
          </section>

          <aside className="health-detection-side">
            <section className="panel health-worker-card">
              <div className="health-worker-avatar">
                {worker?.profileImage ? (
                  <img
                    src={worker.profileImage}
                    alt=""
                  />
                ) : (
                  name.slice(0, 1)
                )}
              </div>

              <div>
                <strong>{name}</strong>
                <span>
                  {detail?.worker?.employeeNo ||
                    worker?.employeeNumber ||
                    '-'}{' '}
                  · {zone}
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  worker &&
                  navigate(`/workers/${worker.id}`)
                }
              >
                작업자 상세
              </button>
            </section>

            <section className="panel health-action-card">
              <h3>관리자 조치</h3>

              <button
                type="button"
                disabled={
                  Boolean(actionLoading) || completed
                }
                onClick={sendRest}
              >
                <TimerReset size={16} />
                {actionLoading === 'SEND_WARNING'
                  ? '전송 중...'
                  : '휴식 권고 전송'}
              </button>

              <button
                type="button"
                className="secondary"
                onClick={callWorker}
              >
                <Phone size={16} />
                작업자 연락
              </button>

              <button
                type="button"
                className="secondary"
                onClick={() =>
                  setToast({
                    message: `현재 위치: ${zone}`,
                    type: 'info',
                  })
                }
              >
                <MapPin size={16} />
                위치 확인
              </button>

              <button
                type="button"
                className="complete"
                disabled={
                  Boolean(actionLoading) || completed
                }
                onClick={() =>
                  !completed && finish()
                }
              >
                <CheckCircle2 size={16} />
                {completed
                  ? '처리완료'
                  : actionLoading === 'RESOLVE'
                    ? '처리 중...'
                    : '처리 완료하기'}
              </button>

              <button
                type="button"
                className="secondary"
                onClick={() =>
                  loadDetail().catch(() => {})
                }
              >
                <RefreshCw size={16} />
                상세 새로고침
              </button>
            </section>

            <section className="panel health-history-card">
              <h3>조치 이력</h3>
              {actions.length === 0 ? (
                <p className="health-history-empty">
                  아직 조치 기록이 없습니다.
                </p>
              ) : (
                <ul>
                  {actions.map((action, index) => (
                    <li key={`${action.actionType}-${index}`}>
                      <strong>
                        {ACTION_LABELS[action.actionType] ||
                          action.actionType}
                      </strong>
                      <span>
                        {formatDateTime(action.performedAt)}
                        {action.performedBy != null
                          ? ` · 관리자 ${action.performedBy}`
                          : ''}
                      </span>
                      {action.memo && <p>{action.memo}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>
        </div>
      </div>

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
    </>
  );
}
