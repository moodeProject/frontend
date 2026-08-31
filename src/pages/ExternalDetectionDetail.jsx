import {
  AlertTriangle,
  Ban,
  BellRing,
  CheckCircle2,
  ChevronLeft,
  Droplets,
  Package,
  Play,
  RefreshCw,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Link, useParams } from 'react-router-dom';
import TopHeader from '../components/TopHeader';
import ActionToast from '../components/ActionToast';
import { useDetections } from '../context/DetectionContext';
import { useNotifications } from '../context/NotificationContext';
import {
  getHazardEvent,
  runHazardEventAction,
} from '../api/hazardEvents';

const icons = {
  unguarded: AlertTriangle,
  puddle: Droplets,
  obstacle: Package,
};

function lower(value) {
  return String(value ?? '').toLowerCase();
}

function detailKind(hazardType) {
  const value = lower(hazardType);

  if (
    value.includes('unguarded') ||
    value.includes('edge') ||
    value.includes('rail')
  ) {
    return 'unguarded';
  }

  if (
    value.includes('puddle') ||
    value.includes('water') ||
    value.includes('wet')
  ) {
    return 'puddle';
  }

  return 'obstacle';
}

function detailLevel(severity) {
  return String(severity ?? '').toUpperCase() === 'DANGER'
    ? 'danger'
    : 'warning';
}

function processInfo(status) {
  return {
    UNHANDLED: {
      process: '미처리',
      processClass: 'unprocessed',
    },
    IN_PROGRESS: {
      process: '처리중',
      processClass: 'processing',
    },
    RESOLVED: {
      process: '처리완료',
      processClass: 'completed',
    },
  }[String(status ?? '').toUpperCase()] || {
    process: '미처리',
    processClass: 'unprocessed',
  };
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
    // mock 로그인 단계에서는 Swagger 예시값 0을 사용합니다.
  }

  return 0;
}

function defaultText(kind) {
  return {
    unguarded: {
      type: '난간 없는 구간',
      risk: '추락',
      detail:
        '난간 또는 안전 경계가 없는 위험 구간이 감지되었습니다.',
      action: '즉각 접근 금지 조치가 필요합니다.',
    },
    puddle: {
      type: '물웅덩이 감지',
      risk: '미끄럼 및 낙상',
      detail:
        '작업 구역 바닥의 물 또는 젖은 구간이 감지되었습니다.',
      action: '작업자에게 위험 구역 경고가 필요합니다.',
    },
    obstacle: {
      type: '장애물 감지',
      risk: '충돌 및 전도',
      detail:
        '작업 동선에 장애물이 감지되어 충돌 또는 전도 위험이 있습니다.',
      action: '작업자에게 위험 구역 경고가 필요합니다.',
    },
  }[kind];
}

function mapDetail(detail, fallback) {
  const kind = detailKind(
    detail?.hazardType ?? fallback?.rawEvent?.hazardType
  );
  const defaults = defaultText(kind);
  const level = detailLevel(
    detail?.severity ?? fallback?.rawEvent?.severity
  );
  const process = processInfo(
    detail?.status ?? fallback?.status
  );

  return {
    ...fallback,

    id: detail?.eventId ?? fallback?.id,
    serverEventId: detail?.eventId ?? fallback?.serverEventId,

    category: 'external',
    kind,
    level,

    type:
      detail?.hazardLabel ||
      detail?.hazardType ||
      fallback?.type ||
      defaults.type,

    riskLabel:
      detail?.riskDescription ||
      fallback?.riskLabel ||
      defaults.risk,

    detailDescription:
      detail?.detail ||
      detail?.riskDescription ||
      fallback?.detailDescription ||
      defaults.detail,

    actionText:
      detail?.recommendedAction ||
      fallback?.actionText ||
      defaults.action,

    name:
      detail?.worker?.name ||
      fallback?.name ||
      '미확인 작업자',

    employeeNo:
      detail?.worker?.employeeNo ||
      fallback?.employeeNo,

    zone:
      detail?.zone?.name ||
      detail?.zone?.code ||
      fallback?.zone ||
      '-',

    helmetNo:
      detail?.helmetNo ||
      fallback?.helmetNo,

    occurredAt:
      detail?.occurredAt ||
      fallback?.occurredAt,

    time: formatTime(
      detail?.occurredAt ||
      fallback?.occurredAt
    ),

    status:
      detail?.status ||
      fallback?.status,

    statusLabel:
      detail?.statusLabel ||
      fallback?.statusLabel,

    ...process,

    clip: detail?.clip || null,
    playbackUrl: detail?.clip?.playbackUrl || '',
    clipExpiresAt: detail?.clip?.expiresAt,
    durationSeconds: detail?.clip?.durationSeconds,
    markedOffsetSeconds:
      detail?.clip?.markedOffsetSeconds,

    detection: detail?.detection || null,
    boxes: detail?.detection?.boxes || [],

    rawDetail: detail,
  };
}

export default function ExternalDetectionDetail() {
  const { id } = useParams();

  const {
    detections,
    acknowledgeDetection,
    completeDetection,
    refreshHazardEvents,
  } = useDetections();

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
  const [showClip, setShowClip] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [toast, setToast] = useState({
    message: '',
    type: 'success',
  });

  const loadDetail = useCallback(async () => {
    setDetailLoading(true);
    setDetailError('');

    try {
      // playbackUrl은 15분 임시 URL이라 이 함수가 호출될 때마다
      // 백엔드에서 새 상세 데이터를 받습니다.
      const data = await getHazardEvent(id);
      setDetail(data);
      return data;
    } catch (error) {
      console.error('이상 감지 상세 조회 실패:', error);
      setDetailError(
        error?.message ||
          '이상 감지 상세 정보를 불러오지 못했습니다.'
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

  // SSE에서 clip-ready 이벤트가 오면 해당 상세의 임시 영상 URL을 재발급합니다.
  useEffect(() => {
    const handleClipReady = (event) => {
      const eventId = event?.detail?.eventId;

      if (
        eventId == null ||
        String(eventId) === String(id)
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
  }, [id, loadDetail]);

  const item = useMemo(
    () => mapDetail(detail, fallbackItem || {}),
    [detail, fallbackItem]
  );

  const runAction = async (
    actionType,
    memo,
    successMessage
  ) => {
    if (actionLoading) return;

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
        refreshHazardEvents(),
        loadDetail(),
      ]);

      setToast({
        message:
          result?.message ||
          successMessage,
        type:
          actionType === 'BLOCK_ZONE'
            ? 'warning'
            : 'success',
      });

      return result;
    } catch (error) {
      console.error('이상 감지 조치 실행 실패:', error);
      setToast({
        message:
          error?.message ||
          '조치 실행에 실패했습니다.',
        type: 'error',
      });
    } finally {
      setActionLoading('');
    }
  };

  const sendWarning = async () => {
    const result = await runAction(
      'SEND_WARNING',
      `${item.name} 작업자에게 ${item.type} 경고 전송`,
      `${item.name} 작업자에게 경고 알림을 전송했습니다.`
    );

    if (result) {
      addNotification({
        level: item.level,
        title: `${item.type} 경고 알림 전송`,
        message: `${item.name} · ${item.zone} 작업자에게 위험 경고를 전송했습니다.`,
        target: `/detections/${item.id}`,
      });
    }
  };

  const blockZone = async () => {
    const result = await runAction(
      'BLOCK_ZONE',
      `${item.zone} 위험 구역 접근 금지`,
      `${item.zone} 구역을 접근 금지로 설정했습니다.`
    );

    if (result) {
      addNotification({
        level: 'danger',
        title: '위험 구역 접근 금지 설정',
        message: `${item.zone} 구역을 접근 금지 상태로 변경했습니다.`,
        target: `/detections/${item.id}`,
      });
    }
  };

  const finish = async () => {
    await runAction(
      'RESOLVE',
      `${item.type} 이상 감지 처리 완료`,
      '이상 감지 건을 처리완료로 변경했습니다.'
    );
  };

  if (detailLoading && !fallbackItem) {
    return (
      <>
        <TopHeader
          title="이상 감지"
          subtitle="외부요인 · 건강 · 추락"
          onRefresh={loadDetail}
        />
        <div className="page-body external-detail-page">
          <div className="records-empty">
            이상 감지 상세 정보를 불러오는 중입니다.
          </div>
        </div>
      </>
    );
  }

  if (detailError && !fallbackItem && !detail) {
    return (
      <>
        <TopHeader
          title="이상 감지"
          subtitle="외부요인 · 건강 · 추락"
          onRefresh={loadDetail}
        />
        <div className="page-body external-detail-page">
          <Link
            className="back-link detail-back"
            to="/detections?tab=external"
          >
            <ChevronLeft size={14} />
            이상 감지 목록
          </Link>

          <div className="records-empty">
            {detailError}
          </div>
        </div>
      </>
    );
  }

  const Icon = icons[item.kind] || AlertTriangle;
  const isDanger = item.level === 'danger';
  const isCompleted =
    item.processClass === 'completed' ||
    item.status === 'RESOLVED';

  return (
    <>
      <TopHeader
        title="이상 감지"
        subtitle="외부요인 · 건강 · 추락"
        onRefresh={loadDetail}
      />

      <div className="page-body external-detail-page">
        <Link
          className="back-link detail-back"
          to="/detections?tab=external"
        >
          <ChevronLeft size={14} />
          이상 감지 목록
        </Link>

        {detailError && (
          <div className="worker-filter-banner danger">
            <span>상세 API 연동 실패: {detailError}</span>
          </div>
        )}

        <div className="external-detail-heading">
          <div
            className={`external-heading-icon ${item.kind}`}
          >
            <Icon size={20} />
          </div>

          <div>
            <h2>외부 위험요인 감지</h2>
            <p>
              {item.name} · {item.zone} · {item.time}
            </p>
          </div>

          <span className={`risk-chip ${item.level}`}>
            ● {isDanger ? '위험' : '주의'}
          </span>
        </div>

        <div className="external-detail-grid">
          <div className="external-detail-main">
            <section className="panel ai-video-panel">
              <div className="section-caption">
                현장 영상 · AI 감지
              </div>

              {item.playbackUrl && showClip ? (
                <video
                  key={item.playbackUrl}
                  src={item.playbackUrl}
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
                <HazardVideo item={item} />
              )}

              <p className="video-helper">
                {item.playbackUrl
                  ? `서버 저장 영상 · ${item.durationSeconds ?? '-'}초 · 감지 시점 ${item.markedOffsetSeconds ?? '-'}초`
                  : '저장된 영상 클립이 아직 준비되지 않았습니다.'}
              </p>
            </section>

            <section className="panel saved-clips-panel">
              <div className="section-caption">
                저장된 영상 클립
              </div>

              <div className="saved-clip-grid">
                {item.playbackUrl ? (
                  <>
                    <button
                      type="button"
                      className={showClip ? 'active' : ''}
                      onClick={() => setShowClip((value) => !value)}
                    >
                      <Play size={14} />
                      {showClip
                        ? '영상 닫기'
                        : '감지 영상 재생'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowClip(false);
                        loadDetail()
                          .then(() => {
                            setToast({
                              message:
                                '영상 재생 URL을 새로 발급받았습니다.',
                              type: 'success',
                            });
                          })
                          .catch(() => {});
                      }}
                    >
                      <RefreshCw size={14} />
                      영상 URL 갱신
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      loadDetail().catch(() => {})
                    }
                  >
                    <RefreshCw size={14} />
                    영상 준비 상태 확인
                  </button>
                )}
              </div>

              {item.clipExpiresAt && (
                <p className="video-helper">
                  재생 URL 만료:{' '}
                  {new Date(
                    item.clipExpiresAt
                  ).toLocaleTimeString('ko-KR')}
                </p>
              )}
            </section>
          </div>

          <aside className="external-detail-side">
            <section className="panel ai-result-card">
              <h3>AI 감지 결과</h3>

              <div
                className={`ai-type-box ${item.kind}`}
              >
                <span>감지 유형</span>
                <strong>{item.type}</strong>
              </div>

              <dl>
                <div>
                  <dt>위험 설명</dt>
                  <dd>{item.riskLabel}</dd>
                </div>

                <div>
                  <dt>관련 작업자</dt>
                  <dd>{item.name}</dd>
                </div>

                <div>
                  <dt>위치</dt>
                  <dd>{item.zone}</dd>
                </div>

                <div>
                  <dt>안전모</dt>
                  <dd>{item.helmetNo || '-'}</dd>
                </div>

                <div>
                  <dt>발생 시간</dt>
                  <dd>{item.time}</dd>
                </div>

                <div>
                  <dt>처리 상태</dt>
                  <dd>
                    {item.statusLabel ||
                      item.process}
                  </dd>
                </div>

                {item.boxes?.length > 0 && (
                  <div>
                    <dt>AI 객체 감지</dt>
                    <dd>{item.boxes.length}건</dd>
                  </div>
                )}
              </dl>

              <p>{item.detailDescription}</p>
            </section>

            <section
              className={`external-action-card ${
                isDanger ? 'danger' : 'warning'
              }`}
            >
              <strong>{item.actionText}</strong>

              <button
                type="button"
                disabled={
                  Boolean(actionLoading) || isCompleted
                }
                onClick={sendWarning}
              >
                <BellRing size={15} />
                {actionLoading === 'SEND_WARNING'
                  ? '전송 중...'
                  : '경고 알림 전송'}
              </button>

              {isDanger && (
                <button
                  type="button"
                  className="outline"
                  disabled={
                    Boolean(actionLoading) || isCompleted
                  }
                  onClick={blockZone}
                >
                  <Ban size={15} />
                  {actionLoading === 'BLOCK_ZONE'
                    ? '설정 중...'
                    : '구역 접근 금지'}
                </button>
              )}

              <button
                type="button"
                className="complete-action"
                disabled={
                  Boolean(actionLoading) || isCompleted
                }
                onClick={() => !isCompleted && finish()}
              >
                <CheckCircle2 size={15} />
                {isCompleted
                  ? '처리완료'
                  : actionLoading === 'RESOLVE'
                    ? '처리 중...'
                    : '처리 완료하기'}
              </button>
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

function HazardVideo({ item }) {
  const labels =
    {
      unguarded: {
        camera: 'CCTV-A03',
        ai: 'AI ACTIVE · UNGUARDED EDGE',
        hazard: '⚠ UNGUARDED EDGE',
      },
      puddle: {
        camera: 'CCTV-C02',
        ai: 'AI ACTIVE · PUDDLE DETECTED',
        hazard: 'PUDDLE · 미끄럼 위험',
      },
      obstacle: {
        camera: 'CCTV-B01',
        ai: 'AI ACTIVE · OBSTACLE DETECTED',
        hazard: 'OBSTACLE DETECTED',
      },
    }[item.kind] || {
      camera: 'CCTV',
      ai: 'AI ACTIVE',
      hazard: 'HAZARD',
    };

  return (
    <div className={`hazard-video hazard-${item.kind}`}>
      <div className="hazard-video-top">
        <span>● {labels.camera}</span>
        <time>{item.time}</time>
      </div>

      <div className="hazard-stage">
        <div className="worker-detection">
          <span>WORKER</span>

          <div className="worker-figure">
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>

        {item.kind === 'unguarded' && (
          <>
            <span className="danger-arrow">
              접근 감지
            </span>

            <div className="edge-hazard">
              <b>{labels.hazard}</b>
              <i />
              <i />
              <i />
              <i />
            </div>
          </>
        )}

        {item.kind === 'puddle' && (
          <div className="puddle-hazard">
            <b>{labels.hazard}</b>
            <span>PUDDLE</span>
          </div>
        )}

        {item.kind === 'obstacle' && (
          <>
            <span className="collision-tag">
              ⚠ 충돌 위험
            </span>

            <div className="obstacle-hazard">
              <b>{labels.hazard}</b>
            </div>
          </>
        )}
      </div>

      <div className="hazard-ai-line">
        {labels.ai}
      </div>

      <div className="hazard-controls">
        <span className="skip">|◀</span>
        <span className="round-play">
          <Play size={15} fill="currentColor" />
        </span>
        <div className="hazard-progress">
          <i />
        </div>
        <time>--:-- / --:--</time>
      </div>
    </div>
  );
}
