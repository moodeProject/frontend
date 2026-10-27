import {
  Activity,
  AlertOctagon,
  HeartPulse,
  MapPin,
  Phone,
  Play,
  ShieldCheck,
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
  useParams,
  useSearchParams,
} from 'react-router-dom';
import ActionToast from '../components/ActionToast';
import TopHeader from '../components/TopHeader';
import { useDetections } from '../context/DetectionContext';
import { useNotifications } from '../context/NotificationContext';
import { useWorkers } from '../context/WorkerContext';
import { createSOS } from '../api/sos';
import {
  getAllWorkerHeatRisk,
  getWorkerAlerts,
  getWorkerStatus,
} from '../api/workerStatus';
import {
  postureLabel,
  postureTone,
} from '../utils/workerRealtime';

function deriveDeviceId(worker) {
  if (worker?.deviceId) return String(worker.deviceId);

  const helmetId = String(
    worker?.helmetId || worker?.id || ''
  );

  return /^H-\d+$/i.test(helmetId)
    ? helmetId.replace(/^H-/i, 'DEV-')
    : '';
}

function formatTime(value) {
  if (!value) return '--:--';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '--:--';
  }

  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function validMeasurement(value, unit = '') {
  const n = Number(value);
  return value == null || value === '' || !Number.isFinite(n) || n <= 0
    ? '측정 불가'
    : `${n}${unit}`;
}

function fallStateLabel(value) {
  return ({ NORMAL: '정상', RECOMMEND: '관찰 권고', ACTION_REQUIRED: '휘청거림 · 조치 필요', FALLING: '쓰러짐 감지', FALLEN: '추락 감지', UNCONSCIOUS: '의식불명 감지' })[String(value || '').toUpperCase()] || '판정 없음';
}

function confidence(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '-';
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return '-';
  }

  return `${Math.round(
    number <= 1 ? number * 100 : number
  )}%`;
}

function personalHeatRiskLabel(detail) {
  const level = String(
    detail?.heatRiskLevel || ''
  ).toUpperCase();

  if (level === 'DANGER') return '위험';
  if (level === 'CAUTION') return '주의';
  if (level === 'NORMAL') return '정상';

  if (
    detail?.heatRiskAbnormal === true ||
    detail?.externalHeatWarning === true
  ) {
    return '주의';
  }

  return '데이터 없음';
}

function personalHeatRiskClass(detail) {
  const level = String(
    detail?.heatRiskLevel || ''
  ).toUpperCase();

  if (
    level === 'DANGER' ||
    detail?.heatRiskAbnormal === true
  ) {
    return 'red';
  }

  if (
    level === 'CAUTION' ||
    detail?.externalHeatWarning === true
  ) {
    return 'orange';
  }

  return 'blue';
}

function sameWorker(item, worker, deviceId) {
  if (!item) return false;

  const raw = item.rawEvent || {};

  const eventName =
    item.name ||
    raw?.worker?.name ||
    raw?.workerName;

  const eventEmployeeNo =
    item.employeeNo ||
    raw?.worker?.employeeNo;

  const eventHelmetNo =
    item.helmetNo ||
    raw?.helmetNo;

  const eventDeviceId =
    item.deviceId ||
    raw?.deviceId;

  const workerEmployeeNo =
    worker?.employeeNumber ||
    worker?.workerCode;

  const workerHelmetNo =
    worker?.helmetId ||
    worker?.helmetNo;

  return Boolean(
    (worker?.name &&
      eventName &&
      String(worker.name) === String(eventName)) ||
      (workerEmployeeNo &&
        eventEmployeeNo &&
        String(workerEmployeeNo) ===
          String(eventEmployeeNo)) ||
      (workerHelmetNo &&
        eventHelmetNo &&
        String(workerHelmetNo) ===
          String(eventHelmetNo)) ||
      (deviceId &&
        eventDeviceId &&
        String(deviceId) === String(eventDeviceId))
  );
}

export default function SensorFallDetail() {
  const { deviceId } = useParams();
  const [searchParams] = useSearchParams();

  const { workers } = useWorkers();
  const { detections } = useDetections();
  const { addNotification } = useNotifications();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rescueSent, setRescueSent] = useState(false);
  const [toast, setToast] = useState({
    message: '',
    type: 'success',
  });

  const recordedAt =
    searchParams.get('recordedAt');

  const worker = useMemo(
    () =>
      workers.find(
        (item) =>
          deriveDeviceId(item) ===
          String(deviceId)
      ),
    [workers, deviceId]
  );

  const loadDetail = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [
        latest,
        alerts,
        heatRiskList,
      ] = await Promise.all([
        getWorkerStatus(deviceId),
        getWorkerAlerts(),
        getAllWorkerHeatRisk(),
      ]);

      const personalHeatRisk =
        Array.isArray(heatRiskList)
          ? heatRiskList.find(
              (item) =>
                String(item?.deviceId) ===
                String(deviceId)
            )
          : null;

      const candidates = alerts.filter(
        (item) =>
          String(item.deviceId) ===
          String(deviceId)
      );

      let selected =
        candidates[0] || latest;

      if (recordedAt && candidates.length) {
        const target = new Date(
          recordedAt
        ).getTime();

        selected = [...candidates].sort(
          (a, b) =>
            Math.abs(
              new Date(
                a.recordedAt || 0
              ).getTime() - target
            ) -
            Math.abs(
              new Date(
                b.recordedAt || 0
              ).getTime() - target
            )
        )[0];
      }

      setDetail({
        ...latest,
        ...selected,
        ...(personalHeatRisk || {}),
        // 사고 당시 스냅샷이 있는 경우만 표시. 최신 센서값으로 과거 사고를 채우지 않음.
        heartRate: selected?.heartRate ?? null,
        spo2: selected?.spo2 ?? null,
        hrv: selected?.hrv ?? null,
        heatRiskLevel: selected?.heatRiskLevel ?? null,
        heatRiskAbnormal: selected?.heatRiskAbnormal ?? null,
        externalHeatWarning: selected?.externalHeatWarning ?? null,
      });
    } catch (err) {
      setError(
        err?.message ||
          '추락 상세 정보를 불러오지 못했습니다.'
      );
    } finally {
      setLoading(false);
    }
  }, [deviceId, recordedAt]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const relatedExternalEvents = useMemo(() => {
    const fallTime = new Date(
      detail?.recordedAt ||
        recordedAt ||
        0
    ).getTime();

    if (!Number.isFinite(fallTime)) {
      return [];
    }

    return detections
      .filter(
        (item) =>
          item.category === 'external' &&
          sameWorker(item, worker, deviceId)
      )
      .filter((item) => {
        const eventTime = new Date(
          item.occurredAt ||
            item.rawEvent?.occurredAt ||
            0
        ).getTime();

        if (!Number.isFinite(eventTime)) {
          return false;
        }

        const diff = fallTime - eventTime;

        return (
          diff >= 0 &&
          diff <= 10 * 60 * 1000
        );
      })
      .sort(
        (a, b) =>
          new Date(
            b.occurredAt || 0
          ).getTime() -
          new Date(
            a.occurredAt || 0
          ).getTime()
      )
      .slice(0, 3);
  }, [
    detections,
    detail?.recordedAt,
    recordedAt,
    worker,
    deviceId,
  ]);

  const requestEmergencyRescue = async () => {
    if (rescueSent) {
      setToast({
        message:
          '이미 긴급 구조 요청을 기록했습니다.',
        type: 'info',
      });
      return;
    }

    const confirmed = window.confirm(
      `${worker?.name || deviceId} 작업자에 대해 긴급 구조 요청을 진행할까요?`
    );

    if (!confirmed) return;

    const requesterId =
      worker?.id ||
      worker?.workerId;

    if (!requesterId) {
      setToast({
        message:
          'SOS 요청에 필요한 작업자 ID를 찾지 못했습니다.',
        type: 'warning',
      });
      return;
    }

    try {
      await createSOS(requesterId);

      setRescueSent(true);

      addNotification({
        level: 'danger',
        title: '긴급 구조 요청',
        message: `${
          worker?.name || deviceId
        } · ${worker?.zone || '-'} · 추락 센서 감지`,
        target: `/sensor-fall/${encodeURIComponent(
          deviceId
        )}${
          recordedAt
            ? `?recordedAt=${encodeURIComponent(
                recordedAt
              )}`
            : ''
        }`,
      });

      setToast({
        message:
          '긴급 구조 요청을 서버 SOS 목록에 기록했습니다.',
        type: 'success',
      });
    } catch (err) {
      setToast({
        message:
          err?.message ||
          'SOS 요청을 서버에 기록하지 못했습니다.',
        type: 'warning',
      });
    }
  };

  if (loading) {
    return (
      <>
        <TopHeader
          title="이상 감지"
          subtitle="외부요인 · 건강 · 추락"
          onRefresh={loadDetail}
        />

        <div className="page-body incident-page">
          <div className="records-empty">
            추락 상세 정보를 불러오는 중입니다.
          </div>
        </div>
      </>
    );
  }

  const movementTone =
    postureTone(detail);

  const postureAbnormal =
    detail?.postureAbnormal === true ||
    String(
      detail?.postureAbnormal
    ).toLowerCase() === 'true';

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

        {error && (
          <div className="worker-filter-banner danger">
            <span>{error}</span>
          </div>
        )}

        <section className="incident-banner">
          <div>
            <AlertOctagon size={24} />

            <div>
              <strong>
                추락 사고가 감지되었습니다.
              </strong>
              <span>
                {worker?.name || deviceId}
                {' · '}
                {worker?.zone || '-'}
                {' · '}
                {formatTime(
                  detail?.recordedAt
                )}
              </span>
            </div>
          </div>

          <button type="button">
            ● 센서 감지
          </button>
        </section>

        <div className="incident-layout">
          <div className="incident-main">
            <section className="panel cause-panel" style={{ marginBottom: 16 }}>
              <div className="section-caption">추락 감지 정보 · 센서 기반</div>
              <div className="final-cause">
                <span>감지 시각</span>
                <strong>{formatTime(detail?.recordedAt)}</strong>
              </div>
              <div className="final-cause">
                <span>추락 상태 · 자세</span>
                <strong>{fallStateLabel(detail?.fallState)} · {postureLabel(detail?.posture)}</strong>
              </div>
              <div className="final-cause">
                <span>온보드 AI 추락 확률</span>
                <strong>{confidence(detail?.fallConfidence)}</strong>
              </div>
            </section>

                        <section className="panel cause-panel">
              <h3>추락 원인 분석</h3>

              <div className="final-cause">
                <span>최종 판단</span>
                <strong>
                  {detail?.fallState ||
                    'ACTION_REQUIRED'}
                </strong>
              </div>

              <div className="subfactors">
                <span>센서 값</span>

                <div>
                  <i>
                    ax {detail?.ax ?? '-'}
                  </i>
                  <i>
                    ay {detail?.ay ?? '-'}
                  </i>
                  <i>
                    az {detail?.az ?? '-'}
                  </i>
                  <i>
                    gx {detail?.gx ?? '-'}
                  </i>
                  <i>
                    gy {detail?.gy ?? '-'}
                  </i>
                  <i>
                    gz {detail?.gz ?? '-'}
                  </i>
                </div>
              </div>
            </section>
          </div>

          <aside className="incident-side">
            <section className="panel worker-info-card">
              <div className="worker-head">
                <div className="mini-avatar large">
                  {worker?.profileImage ? (
                    <img
                      src={worker.profileImage}
                      alt=""
                    />
                  ) : (
                    (
                      worker?.name ||
                      deviceId
                    ).slice(0, 1)
                  )}
                </div>

                <div>
                  <strong>
                    {worker?.name ||
                      deviceId}
                  </strong>
                  <span>
                    {worker?.zone || '-'} ·{' '}
                    {worker?.helmetId || '-'}
                  </span>
                </div>
              </div>

              <dl>
                <div>
                  <dt>발생 시간</dt>
                  <dd>
                    {formatTime(
                      detail?.recordedAt
                    )}
                  </dd>
                </div>

                <div>
                  <dt>심박수</dt>
                  <dd>
                    {validMeasurement(detail?.heartRate, ' bpm')}
                  </dd>
                </div>

                <div>
                  <dt>SpO₂</dt>
                  <dd>
                    {validMeasurement(detail?.spo2, '%')}
                  </dd>
                </div>

                <div>
                  <dt>HRV</dt>
                  <dd>
                    {validMeasurement(detail?.hrv)}
                  </dd>
                </div>

                <div>
                  <dt>개인 온열위험</dt>
                  <dd>
                    {personalHeatRiskLabel(
                      detail
                    )}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="panel detection-card">
              <h3>추락 감지 결과</h3>

              <div>
                추락 상태{' '}
                <b>
                  {fallStateLabel(detail?.fallState)}
                </b>
              </div>

              <div>
                자세 변화{' '}
                <b
                  className={`posture-result ${movementTone}`}
                >
                  {postureAbnormal
                    ? '감지됨'
                    : '정상'}
                </b>
              </div>

              <div>
                자세 상태{' '}
                <b
                  className={`posture-result ${movementTone}`}
                >
                  {postureLabel(
                    detail?.posture
                  )}
                </b>
              </div>

            </section>

            <section className="panel related-card">
              <h3>연관 외부요인</h3>

              {relatedExternalEvents.length > 0 ? (
                relatedExternalEvents.map(
                  (item) => (
                    <Link
                      to={`/detections/${item.id}`}
                      key={item.id}
                      className={
                        item.level === 'danger'
                          ? 'red'
                          : 'blue'
                      }
                    >
                      <TriangleAlert
                        size={15}
                      />
                      {item.type}
                      <b>
                        {item.time || '--:--'}
                      </b>
                    </Link>
                  )
                )
              ) : (
                <p
                  style={{
                    color: '#94a3b8',
                    fontSize: 12,
                    lineHeight: 1.55,
                    margin: 0,
                  }}
                >
                  사고 발생 전 10분 이내
                  연관된 외부 위험요인이
                  없습니다.
                </p>
              )}
            </section>

            <section className="panel related-card">
              <h3>사고 기록의 건강 센서</h3>
              <p style={{fontSize:12,color:'#7b899d',margin:'0 0 10px'}}>해당 사고 이력에 수치가 포함된 경우만 표시합니다.</p>

              <div className="blue">
                <HeartPulse size={15} />
                심박수
                <b>
                  {validMeasurement(detail?.heartRate, ' bpm')}
                </b>
              </div>

              <div className="blue">
                <ShieldCheck size={15} />
                SpO₂
                <b>
                  {validMeasurement(detail?.spo2, '%')}
                </b>
              </div>

              <div
                className={
                  personalHeatRiskClass(
                    detail
                  )
                }
              >
                <TriangleAlert size={15} />
                개인 온열질환 위험도
                <b>
                  {personalHeatRiskLabel(
                    detail
                  )}
                </b>
              </div>

              <div
                className={
                  detail?.fatigueAbnormal === true
                    ? 'orange'
                    : 'blue'
                }
              >
                <HeartPulse size={15} />
                피로도
                <b>
                  {detail?.fatigueAbnormal === true
                    ? '이상 감지'
                    : detail?.fatigueAbnormal === false
                      ? '정상'
                      : '데이터 없음'}
                </b>
              </div>

              {Number(detail?.hrv) > 0 && (
                <div className="blue">
                  <HeartPulse size={15} />
                  HRV
                  <b>
                    {Number(
                      detail.hrv
                    ).toFixed(1)}
                  </b>
                </div>
              )}

              <div
                className={
                  postureAbnormal
                    ? 'red'
                    : 'blue'
                }
              >
                <Activity size={15} />
                움직임
                <b>
                  {postureLabel(
                    detail?.posture
                  )}
                </b>
              </div>
            </section>

            <button
              className="emergency-btn"
              type="button"
              onClick={requestEmergencyRescue}
            >
              <Phone size={16} />
              {rescueSent
                ? '구조 요청 기록됨'
                : '긴급 구조 요청'}
            </button>

<button
              className="location-btn"
              type="button"
              onClick={() => {
                if (worker) {
                  window.location.href =
                    `/workers/${worker.id}`;
                }
              }}
            >
              <MapPin size={16} />
              작업자 상세 확인
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
