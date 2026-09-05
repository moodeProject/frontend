import {
  Activity,
  AlertTriangle,
  Droplets,
  Eye,
  HeartPulse,
  Package,
  Thermometer,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Link,
  useSearchParams,
} from 'react-router-dom';
import DateRangeFilter from '../components/DateRangeFilter';
import TopHeader from '../components/TopHeader';
import { useDetections } from '../context/DetectionContext';
import { useWorkers } from '../context/WorkerContext';
import { getWorkerAlerts } from '../api/workerStatus';

const tabs = [
  { key: 'all', label: '전체' },
  { key: 'external', label: '외부요인' },
  { key: 'health', label: '건강' },
  { key: 'fall', label: '추락' },
];

const typeMeta = {
  fall: { Icon: Activity, className: 'danger' },
  unguarded: { Icon: AlertTriangle, className: 'danger' },
  fatigue: { Icon: HeartPulse, className: 'orange' },
  puddle: { Icon: Droplets, className: 'blue' },
  obstacle: { Icon: Package, className: 'orange' },
  heat: { Icon: Thermometer, className: 'orange' },
};

const levelLabel = {
  danger: '위험',
  warning: '주의',
};

function deriveDeviceId(worker) {
  if (worker?.deviceId) return String(worker.deviceId);

  const helmetId = String(
    worker?.helmetId || worker?.id || ''
  );

  return /^H-\d+$/i.test(helmetId)
    ? helmetId.replace(/^H-/i, 'DEV-')
    : '';
}

function formatDateTime(value) {
  if (!value) {
    return {
      dateLabel: '--.--',
      time: '--:--',
    };
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return {
      dateLabel: '--.--',
      time: '--:--',
    };
  }

  return {
    dateLabel: `${String(date.getMonth() + 1).padStart(2, '0')}.${String(
      date.getDate()
    ).padStart(2, '0')}`,
    time: date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
  };
}

function sensorAlertToDetection(alert, workers) {
  const worker = workers.find(
    (item) =>
      deriveDeviceId(item) === String(alert.deviceId)
  );

  const { dateLabel, time } = formatDateTime(
    alert.recordedAt
  );

  return {
    id: `sensor-fall-${alert.deviceId}-${alert.recordedAt || 'latest'}`,
    source: 'sensor-alert',
    category: 'fall',
    kind: 'fall',
    level:
      String(alert.fallState || '').toUpperCase() === 'NORMAL'
        ? 'warning'
        : 'danger',
    type: '추락 감지',
    name: worker?.name || alert.deviceId || '미확인 작업자',
    zone: worker?.zone || '-',
    time,
    dateLabel,
    occurredAt: alert.recordedAt,
    recordedAt: alert.recordedAt,
    process: '센서 감지',
    processClass: 'unprocessed',
    deviceId: alert.deviceId,
    heartRate: alert.heartRate,
    spo2: alert.spo2,
    fallState: alert.fallState,
    fallConfidence: alert.fallConfidence,
    posture: alert.posture,
    postureAbnormal: alert.postureAbnormal,
  };
}

function isInDateRange(item, range) {
  if (!range.start && !range.end) return true;

  const value =
    item.occurredAt ||
    item.recordedAt ||
    item.rawEvent?.occurredAt;

  if (!value) return false;

  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return false;

  if (range.start) {
    const start = new Date(
      `${range.start}T00:00:00`
    ).getTime();
    if (timestamp < start) return false;
  }

  if (range.end) {
    const end = new Date(
      `${range.end}T23:59:59.999`
    ).getTime();
    if (timestamp > end) return false;
  }

  return true;
}

function detailPath(item) {
  if (item.source === 'sensor-alert') {
    const qs = new URLSearchParams();

    if (item.recordedAt) {
      qs.set('recordedAt', item.recordedAt);
    }

    return `/sensor-fall/${encodeURIComponent(
      item.deviceId
    )}${qs.toString() ? `?${qs}` : ''}`;
  }

  if (item.category === 'fall') {
    return `/incident/${item.id}`;
  }

  if (item.category === 'health') {
    return `/detections/health/${item.id}`;
  }

  return `/detections/${item.id}`;
}

export default function Detections() {
  const [searchParams, setSearchParams] =
    useSearchParams();

  const {
    detections,
    refreshHazardEvents,
    hazardLoading,
    hazardError,
    hazardStreamConnected,
  } = useDetections();

  const { workers } = useWorkers();

  const [fallAlerts, setFallAlerts] = useState([]);
  const [fallLoading, setFallLoading] = useState(false);
  const [fallError, setFallError] = useState('');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });

  const active =
    searchParams.get('tab') || 'all';

  const loadFallAlerts = useCallback(async () => {
    setFallLoading(true);
    setFallError('');

    try {
      const alerts = await getWorkerAlerts();
      setFallAlerts(
        alerts.map((item) =>
          sensorAlertToDetection(item, workers)
        )
      );
    } catch (error) {
      setFallError(
        error?.message ||
          '추락 감지 이력을 불러오지 못했습니다.'
      );
    } finally {
      setFallLoading(false);
    }
  }, [workers]);

  useEffect(() => {
    loadFallAlerts();
  }, [loadFallAlerts]);

  const allItems = useMemo(
    () =>
      [...detections, ...fallAlerts]
        .filter((item) =>
          isInDateRange(item, dateRange)
        )
        .sort(
          (a, b) =>
            new Date(
              b.occurredAt || b.recordedAt || 0
            ).getTime() -
            new Date(
              a.occurredAt || a.recordedAt || 0
            ).getTime()
        ),
    [detections, fallAlerts, dateRange]
  );

  const counts = useMemo(
    () => ({
      all: allItems.length,
      external: allItems.filter(
        (item) => item.category === 'external'
      ).length,
      health: allItems.filter(
        (item) => item.category === 'health'
      ).length,
      fall: allItems.filter(
        (item) => item.category === 'fall'
      ).length,
    }),
    [allItems]
  );

  const rows =
    active === 'all'
      ? allItems
      : allItems.filter(
          (item) => item.category === active
        );

  const refreshPage = async () => {
    await Promise.allSettled([
      refreshHazardEvents(),
      loadFallAlerts(),
    ]);
  };

  return (
    <>
      <TopHeader
        title="이상 감지"
        subtitle="외부요인 · 건강 · 추락"
        onRefresh={refreshPage}
      />

      <div className="page-body detections-page">
        <div
          className="detection-tabs"
          role="tablist"
          aria-label="이상 감지 분류"
        >
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab.key}
              className={
                active === tab.key ? 'active' : ''
              }
              onClick={() =>
                setSearchParams(
                  tab.key === 'all'
                    ? {}
                    : { tab: tab.key }
                )
              }
            >
              {tab.label}
              <span>{counts[tab.key]}</span>
            </button>
          ))}
        </div>

        <div className="admin-date-filter-row">
          <DateRangeFilter
            value={dateRange}
            onChange={setDateRange}
            onReset={() =>
              setDateRange({
                start: '',
                end: '',
              })
            }
          />
        </div>

        <div
          className={`worker-filter-banner ${
            hazardError || fallError
              ? 'danger'
              : 'normal'
          }`}
        >
          <span>
            {hazardError || fallError
              ? [
                  hazardError
                    ? `이상 감지 API: ${hazardError}`
                    : '',
                  fallError
                    ? `추락 이력 API: ${fallError}`
                    : '',
                ]
                  .filter(Boolean)
                  .join(' / ')
              : hazardLoading || fallLoading
                ? '실제 이상 감지 이벤트를 불러오는 중입니다.'
                : hazardStreamConnected
                  ? '● 실시간 이상 감지 연결됨'
                  : '실시간 이상 감지 재연결 대기 중'}
          </span>
        </div>

        <section className="panel detection-table-wrap">
          <div className="detection-table detection-table-head">
            <span>위험도</span>
            <span>감지 유형</span>
            <span>작업자</span>
            <span>위치</span>
            <span>발생 시간</span>
            <span>처리 상태</span>
            <span />
          </div>

          {rows.map((item) => {
            const {
              Icon,
              className,
            } =
              typeMeta[item.kind] ||
              typeMeta.obstacle;

            return (
              <div
                className={`detection-table detection-table-row ${item.level}`}
                key={item.id}
              >
                <div>
                  <span
                    className={`risk-chip ${item.level}`}
                  >
                    ● {levelLabel[item.level]}
                  </span>
                </div>

                <div
                  className={`detection-type ${className}`}
                >
                  <Icon
                    size={15}
                    strokeWidth={2}
                  />
                  <b>{item.type}</b>
                </div>

                <strong>{item.name}</strong>

                <span className="muted-cell">
                  {item.zone}
                </span>

                <time>
                  {item.dateLabel
                    ? `${item.dateLabel} `
                    : ''}
                  {item.time}
                </time>

                <div>
                  <span
                    className={`process-chip ${item.processClass}`}
                  >
                    {item.process}
                  </span>
                </div>

                <Link
                  to={detailPath(item)}
                  className="table-detail"
                >
                  <Eye size={14} />
                  상세
                </Link>
              </div>
            );
          })}

          {!hazardLoading &&
            !fallLoading &&
            rows.length === 0 && (
              <div className="records-empty">
                {dateRange.start || dateRange.end
                  ? '선택한 기간에 저장된 이상 감지 이벤트가 없습니다.'
                  : '현재 서버에 저장된 이상 감지 이벤트가 없습니다.'}
              </div>
            )}
        </section>
      </div>
    </>
  );
}
