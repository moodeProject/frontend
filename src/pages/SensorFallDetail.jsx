import {
  Activity,
  AlertOctagon,
  CheckCircle2,
  HeartPulse,
  MapPin,
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
import TopHeader from '../components/TopHeader';
import { useWorkers } from '../context/WorkerContext';
import {
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

function confidence(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) return '-';

  return `${Math.round(
    number <= 1 ? number * 100 : number
  )}%`;
}

export default function SensorFallDetail() {
  const { deviceId } = useParams();
  const [searchParams] = useSearchParams();
  const { workers } = useWorkers();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      const [latest, alerts] =
        await Promise.all([
          getWorkerStatus(deviceId),
          getWorkerAlerts(),
        ]);

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

  const movementTone = postureTone(detail);
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
                {formatTime(detail?.recordedAt)}
              </span>
            </div>
          </div>

          <button type="button">
            ● 센서 감지
          </button>
        </section>

        <div className="incident-layout">
          <div className="incident-main">
            <section className="panel video-panel">
              <div className="section-caption">
                사고 센서 확인
                <span>MPU 기반 감지</span>
              </div>

              <div className="fake-video">
                <div className="video-top">
                  <span>
                    ● SENSOR · {deviceId}
                  </span>
                  <time>
                    {formatTime(detail?.recordedAt)}
                  </time>
                </div>

                <div className="fall-scene">
                  <div className="fall-box">
                    ⚠ FALL STATE ·{' '}
                    {detail?.fallState || '-'}
                  </div>

                  <div className="impact">
                    {postureLabel(
                      detail?.posture
                    )}
                  </div>
                </div>

                <div className="video-bottom">
                  <span>
                    SENSOR ACTIVE · POSTURE{' '}
                    {detail?.posture || '-'} ·
                    FALL CONFIDENCE{' '}
                    {confidence(
                      detail?.fallConfidence
                    )}
                  </span>
                </div>

                <div className="video-controls">
                  <Play size={18} />
                  <b>센서 감지 시점</b>
                  <span>
                    {formatTime(
                      detail?.recordedAt
                    )}
                  </span>
                </div>
              </div>

              <div className="timeline-labels">
                <span>가속도</span>
                <b>▶ 감지 시점</b>
                <span>자이로</span>
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
                    (worker?.name ||
                      deviceId).slice(0, 1)
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
                    {detail?.heartRate ??
                      '-'}{' '}
                    bpm
                  </dd>
                </div>

                <div>
                  <dt>SpO₂</dt>
                  <dd>
                    {detail?.spo2 ?? '-'}%
                  </dd>
                </div>
              </dl>
            </section>

            <section className="panel detection-card">
              <h3>추락 감지 결과</h3>

              <div>
                충격 감지{' '}
                <b>
                  {detail?.fallState &&
                  detail.fallState !== 'NORMAL'
                    ? '높음'
                    : '정상'}
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

              <div>
                최종 판단{' '}
                <b>
                  {detail?.fallState ||
                    '-'}
                </b>
              </div>

              <div>
                AI 신뢰도{' '}
                <b>
                  {confidence(
                    detail?.fallConfidence
                  )}
                </b>
              </div>
            </section>

            <section className="panel related-card">
              <h3>건강 센서</h3>

              <div className="blue">
                <HeartPulse size={15} />
                심박수
                <b>
                  {detail?.heartRate ??
                    '-'}{' '}
                  bpm
                </b>
              </div>

              <div className="blue">
                <ShieldCheck size={15} />
                SpO₂
                <b>
                  {detail?.spo2 ?? '-'}%
                </b>
              </div>

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

            <div className="worker-filter-banner normal">
              <span>
                현재 상세는 센서 추락 이력
                API를 기준으로 표시합니다.
                영상·조치 정보는 FALL
                hazard-event 생성 시 추가됩니다.
              </span>
            </div>

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
    </>
  );
}
