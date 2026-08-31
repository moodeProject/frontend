import {
  AlertOctagon,
  CheckCircle2,
  MapPin,
  Phone,
  Play,
  RefreshCw,
  TriangleAlert,
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

function formatDateTime(value) {
  if (!value) return '--.-- --:--';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--.-- --:--';

  return `${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate()
  ).padStart(2, '0')} ${formatTime(value)}`;
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

function confidenceValue(detail, worker) {
  const boxConfidence = Math.max(
    0,
    ...(detail?.detection?.boxes || [])
      .map((box) => Number(box?.confidence))
      .filter(Number.isFinite)
  );

  if (boxConfidence > 0) return boxConfidence;

  const workerConfidence = Number(worker?.fallConfidence);
  if (Number.isFinite(workerConfidence)) {
    return workerConfidence;
  }

  return null;
}

export default function IncidentDetail() {
  const { id: routeId } = useParams();
  const navigate = useNavigate();

  const {
    detections,
    acknowledgeDetection,
    completeDetection,
    refreshHazardEvents,
  } = useDetections();

  const { workers } = useWorkers();
  const { addNotification } = useNotifications();

  const latestFall = useMemo(
    () =>
      detections
        .filter((item) => item.category === 'fall')
        .sort(
          (a, b) =>
            new Date(b.occurredAt || 0).getTime() -
            new Date(a.occurredAt || 0).getTime()
        )[0],
    [detections]
  );

  const eventId =
    routeId ||
    latestFall?.serverEventId ||
    latestFall?.id;

  const fallbackIncident = useMemo(
    () =>
      detections.find(
        (item) =>
          String(item.id) === String(eventId)
      ) || latestFall,
    [detections, eventId, latestFall]
  );

  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(
    Boolean(eventId)
  );
  const [detailError, setDetailError] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [showClip, setShowClip] = useState(false);
  const [rescueSent, setRescueSent] = useState(false);
  const [toast, setToast] = useState({
    message: '',
    type: 'success',
  });

  const loadDetail = useCallback(async () => {
    if (!eventId) return null;

    setDetailLoading(true);
    setDetailError('');

    try {
      const data = await getHazardEvent(eventId);
      setDetail(data);
      return data;
    } catch (error) {
      console.error('추락 상세 조회 실패:', error);
      setDetailError(
        error?.message ||
          '추락 상세 정보를 불러오지 못했습니다.'
      );
      throw error;
    } finally {
      setDetailLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;

    loadDetail().catch(() => {});
    acknowledgeDetection(eventId);
  }, [eventId, loadDetail]);

  useEffect(() => {
    const handleClipReady = (event) => {
      const clipEventId = event?.detail?.eventId;

      if (
        clipEventId == null ||
        String(clipEventId) === String(eventId)
      ) {
        loadDetail().catch(() => {});
      }
    };

    window.addEventListener(
      'safehelmet-hazard-clip-ready',
      handleClipReady
    );

    return () => {
      window.removeEventListener(
        'safehelmet-hazard-clip-ready',
        handleClipReady
      );
    };
  }, [eventId, loadDetail]);

  const worker = useMemo(
    () =>
      findWorker(
        detail,
        fallbackIncident,
        workers
      ),
    [detail, fallbackIncident, workers]
  );

  const name =
    detail?.worker?.name ||
    fallbackIncident?.name ||
    worker?.name ||
    '미확인 작업자';

  const zone =
    detail?.zone?.name ||
    detail?.zone?.code ||
    fallbackIncident?.zone ||
    worker?.zone ||
    '-';

  const occurredAt =
    detail?.occurredAt ||
    fallbackIncident?.occurredAt;

  const time = formatTime(occurredAt);

  const status = String(
    detail?.status ||
      fallbackIncident?.status ||
      ''
  ).toUpperCase();

  const isCompleted =
    status === 'RESOLVED' ||
    fallbackIncident?.processClass === 'completed';

  const severity = String(
    detail?.severity ||
      fallbackIncident?.rawEvent?.severity ||
      ''
  ).toUpperCase();

  const hazardLabel =
    detail?.hazardLabel ||
    detail?.hazardType ||
    fallbackIncident?.type ||
    '추락 감지';

  const riskDescription =
    detail?.riskDescription ||
    detail?.detail ||
    fallbackIncident?.detailDescription ||
    '추락 위험 이벤트가 감지되었습니다.';

  const recommendedAction =
    detail?.recommendedAction ||
    fallbackIncident?.actionText ||
    '즉시 작업자 상태와 현장 위험 요소를 확인하세요.';

  const confidence = confidenceValue(detail, worker);

  const relatedEvents = useMemo(() => {
    if (!occurredAt) return [];

    const incidentTime = new Date(occurredAt).getTime();
    if (!Number.isFinite(incidentTime)) return [];

    return detections
      .filter((item) => {
        if (item.category !== 'external') return false;

        const sameWorker =
          item.name === name ||
          (detail?.worker?.id &&
            item.workerId === detail.worker.id);

        if (!sameWorker) return false;

        const eventTime = new Date(
          item.occurredAt || 0
        ).getTime();

        if (!Number.isFinite(eventTime)) return false;

        const diff = incidentTime - eventTime;

        return diff >= 0 && diff <= 10 * 60 * 1000;
      })
      .sort(
        (a, b) =>
          new Date(b.occurredAt || 0).getTime() -
          new Date(a.occurredAt || 0).getTime()
      )
      .slice(0, 3);
  }, [detections, occurredAt, name, detail?.worker?.id]);

  const runResolve = async () => {
    if (!eventId || actionLoading) return;

    setActionLoading('RESOLVE');

    try {
      const result = await runHazardEventAction(
        eventId,
        {
          actionType: 'RESOLVE',
          adminId: getAdminId(),
          memo: `${hazardLabel} 추락 이벤트 처리 완료`,
        }
      );

      completeDetection(eventId);

      await Promise.allSettled([
        loadDetail(),
        refreshHazardEvents(),
      ]);

      setToast({
        message:
          result?.message ||
          '추락 사고를 처리완료로 변경했습니다.',
        type: 'success',
      });
    } catch (error) {
      setToast({
        message:
          error?.message ||
          '처리완료 요청에 실패했습니다.',
        type: 'error',
      });
    } finally {
      setActionLoading('');
    }
  };

  const requestRescue = () => {
    if (rescueSent) {
      setToast({
        message:
          '이미 화면에서 긴급 구조 요청을 기록했습니다.',
        type: 'info',
      });
      return;
    }

    setRescueSent(true);

    addNotification({
      level: 'danger',
      title: '긴급 구조 요청',
      message: `${name} · ${zone} · 현장 구조 대응 필요`,
      target: eventId
        ? `/incident/${eventId}`
        : '/incident',
    });

    setToast({
      message:
        '현재 백엔드에 SOS 전용 API가 없어 프론트 알림으로 우선 기록했습니다.',
      type: 'warning',
    });
  };

  if (!eventId) {
    return (
      <>
        <TopHeader
          title="이상 감지"
          subtitle="외부요인 · 건강 · 추락"
          onRefresh={refreshHazardEvents}
        />

        <div className="page-body incident-page">
          <Link
            className="back-link"
            to="/detections?tab=fall"
          >
            ← 이상 감지 목록
          </Link>

          <div className="records-empty">
            현재 서버에서 조회된 추락 이벤트가 없습니다.
          </div>
        </div>
      </>
    );
  }

  const playbackUrl = detail?.clip?.playbackUrl;
  const boxes = detail?.detection?.boxes || [];

  return (
    <>
      <TopHeader
        title="이상 감지"
        subtitle="외부요인 · 건강 · 추락"
        onRefresh={loadDetail}
      />

      <div className="page-body incident-page">
        <Link
          className="back-link"
          to="/detections?tab=fall"
        >
          ← 이상 감지 목록
        </Link>

        {detailLoading && (
          <div className="worker-filter-banner normal">
            <span>
              추락 사고 상세 정보를 불러오는 중입니다.
            </span>
          </div>
        )}

        {detailError && (
          <div className="worker-filter-banner danger">
            <span>
              추락 상세 API 연동 실패: {detailError}
            </span>
          </div>
        )}

        <section
          className={`incident-banner ${
            isCompleted ? 'completed' : ''
          }`}
        >
          <div>
            <AlertOctagon size={24} />

            <div>
              <strong>
                추락 사고가 감지되었습니다.
              </strong>
              <span>
                {name} · {zone} · {time}
              </span>
            </div>
          </div>

          <button
            type="button"
            className={
              isCompleted ? 'completed' : ''
            }
            onClick={() =>
              !isCompleted && runResolve()
            }
            disabled={
              isCompleted ||
              actionLoading === 'RESOLVE'
            }
          >
            {isCompleted ? (
              <>
                <CheckCircle2 size={14} />
                처리완료
              </>
            ) : actionLoading === 'RESOLVE' ? (
              '처리 중...'
            ) : (
              '● 처리중 · 완료하기'
            )}
          </button>
        </section>

        <div className="incident-layout">
          <div className="incident-main">
            <section className="panel video-panel">
              <div className="section-caption">
                사고 영상 확인
                <span>
                  {detail?.clip
                    ? '서버 저장 영상'
                    : '영상 준비 전'}
                </span>
              </div>

              {playbackUrl && showClip ? (
                <video
                  key={playbackUrl}
                  src={playbackUrl}
                  controls
                  autoPlay
                  style={{
                    width: '100%',
                    maxHeight: 520,
                    borderRadius: 12,
                    background: '#07111d',
                  }}
                />
              ) : (
                <div className="fake-video">
                  <div className="video-top">
                    <span>● 현장 영상</span>
                    <time>
                      {formatDateTime(occurredAt)}
                    </time>
                  </div>

                  <div className="fall-scene">
                    <div className="fall-box">
                      ⚠ {hazardLabel}
                      {confidence != null
                        ? ` · ${Math.round(
                            confidence <= 1
                              ? confidence * 100
                              : confidence
                          )}%`
                        : ''}
                    </div>

                    <div className="impact">
                      FALL
                    </div>
                  </div>

                  <div className="video-bottom">
                    <span>
                      AI ACTIVE ·{' '}
                      {severity || 'FALL'} ·{' '}
                      {boxes.length} DETECTION
                    </span>
                  </div>

                  <div className="video-controls">
                    <Play size={18} />
                    <b>사고 시점</b>
                    <span>
                      {detail?.clip?.markedOffsetSeconds ??
                        '-'}{' '}
                      /{' '}
                      {detail?.clip?.durationSeconds ??
                        '-'}
                    </span>
                  </div>
                </div>
              )}

              <div className="timeline-labels">
                <span>사고 전</span>
                <b>▶ 사고 시점</b>
                <span>사고 후</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  marginTop: 12,
                }}
              >
                {playbackUrl && (
                  <button
                    type="button"
                    className="location-btn"
                    onClick={() =>
                      setShowClip((value) => !value)
                    }
                  >
                    <Play size={15} />
                    {showClip
                      ? '영상 닫기'
                      : '실제 영상 재생'}
                  </button>
                )}

                <button
                  type="button"
                  className="location-btn"
                  onClick={() =>
                    loadDetail().catch(() => {})
                  }
                >
                  <RefreshCw size={15} />
                  영상/상세 갱신
                </button>
              </div>
            </section>

            <section className="panel cause-panel">
              <h3>사고 상세 분석</h3>

              <div className="final-cause">
                <span>위험 설명</span>
                <strong>{riskDescription}</strong>
              </div>

              <div className="final-cause">
                <span>상세 내용</span>
                <strong>
                  {detail?.detail ||
                    '추가 상세 정보가 없습니다.'}
                </strong>
              </div>

              <div className="health-recommend-box">
                <TriangleAlert size={18} />

                <div>
                  <strong>권장 조치</strong>
                  <p>{recommendedAction}</p>
                </div>
              </div>

              {boxes.length > 0 && (
                <div className="subfactors">
                  <span>AI 감지 객체</span>

                  <div>
                    {boxes.map((box, index) => (
                      <i
                        key={`${box.type}-${index}`}
                      >
                        {box.label ||
                          box.type ||
                          `객체 ${index + 1}`}
                        {Number.isFinite(
                          Number(box.confidence)
                        )
                          ? ` · ${Math.round(
                              Number(box.confidence) <= 1
                                ? Number(
                                    box.confidence
                                  ) * 100
                                : Number(
                                    box.confidence
                                  )
                            )}%`
                          : ''}
                      </i>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>

          <aside className="incident-side">
            <section className="panel worker-info-card">
              <div className="worker-head">
                <div className="mini-avatar large">
                  {name.slice(0, 1)}
                </div>

                <div>
                  <strong>{name}</strong>
                  <span>
                    {zone} ·{' '}
                    {detail?.helmetNo ||
                      worker?.helmetId ||
                      '-'}
                  </span>
                </div>
              </div>

              <dl>
                <div>
                  <dt>발생 시간</dt>
                  <dd>{time}</dd>
                </div>

                <div>
                  <dt>심박수</dt>
                  <dd>
                    {worker?.heartRate
                      ? `${worker.heartRate} bpm`
                      : '-'}
                  </dd>
                </div>

                <div>
                  <dt>SpO₂</dt>
                  <dd>
                    {worker?.spo2 != null
                      ? `${worker.spo2}%`
                      : '-'}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="panel detection-card">
              <h3>추락 감지 결과</h3>

              <div>
                감지 유형 <b>{hazardLabel}</b>
              </div>

              <div>
                위험도{' '}
                <b>
                  {detail?.severityLabel ||
                    severity ||
                    '-'}
                </b>
              </div>

              <div>
                추락 상태{' '}
                <b>
                  {worker?.fallState || '-'}
                </b>
              </div>

              <div>
                AI 신뢰도{' '}
                <b>
                  {confidence != null
                    ? `${Math.round(
                        confidence <= 1
                          ? confidence * 100
                          : confidence
                      )}%`
                    : '-'}
                </b>
              </div>
            </section>

            <section className="panel related-card">
              <h3>연관 외부요인</h3>

              {relatedEvents.length > 0 ? (
                relatedEvents.map((item) => (
                  <div
                    className={
                      item.level === 'danger'
                        ? 'red'
                        : 'blue'
                    }
                    key={item.id}
                  >
                    <TriangleAlert size={15} />
                    {item.type}
                    <b>{item.time}</b>
                  </div>
                ))
              ) : (
                <p
                  style={{
                    color: '#64748b',
                    fontSize: 13,
                  }}
                >
                  사고 전 10분 내 연관 외부요인이
                  조회되지 않았습니다.
                </p>
              )}
            </section>

            <button
              className="emergency-btn"
              onClick={requestRescue}
            >
              <Phone size={16} />
              {rescueSent
                ? '구조 요청 기록됨'
                : '긴급 구조 요청'}
            </button>

            <button
              className="location-btn"
              onClick={() => {
                setToast({
                  message: `${name} 현재 위치: ${zone}`,
                  type: 'info',
                });

                if (worker) {
                  navigate(`/workers/${worker.id}`);
                }
              }}
            >
              <MapPin size={16} />
              작업자 위치 확인
            </button>
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
