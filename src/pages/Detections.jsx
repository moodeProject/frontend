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

function buildHazardDateParams(range) {
  const params = {};

  if (range.start) {
    params.from = new Date(
      `${range.start}T00:00:00`
    ).toISOString();
  }

  if (range.end) {
    params.to = new Date(
      `${range.end}T23:59:59.999`
    ).toISOString();
  }

  return params;
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

// API가 같은 eventId를 중복으로 내려주는 경우까지 한 번 더 방어합니다.
// 서로 다른 eventId는 같은 시각/작업자라도 별개의 이벤트로 유지합니다.
function dedupeByEventId(items) {
  const seen = new Set();

  return items.filter((item) => {
    const key = String(
      item.serverEventId ?? item.id ?? ''
    );

    if (!key) return true;
    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

function deriveDeviceId(worker) {
  if (worker?.deviceId) return String(worker.deviceId);

  const helmetId = String(
    worker?.helmetId || worker?.id || ''
  );

  return /^H-\d+$/i.test(helmetId)
    ? helmetId.replace(/^H-/i, 'DEV-')
    : '';
}

function formatSensorAlertDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return { dateLabel: '--.--', time: '--:--' };
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

  const { dateLabel, time } = formatSensorAlertDate(
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
    employeeNo:
      worker?.employeeNumber || worker?.workerCode,

    // 화면은 name, 로직은 code.
    // alerts API에 zone이 없으면 작업자 기본 구역을 표시용 fallback으로 사용합니다.
    zone:
      alert?.zone?.name ||
      alert?.zoneName ||
      worker?.zone ||
      '-',
    zoneCode:
      alert?.zone?.code ||
      alert?.zoneCode ||
      alert?.zoneId ||
      worker?.zoneCode ||
      null,

    helmetNo: worker?.helmetId,
    dateLabel,
    time,
    occurredAt: alert.recordedAt,
    recordedAt: alert.recordedAt,
    deviceId: alert.deviceId,
    process: '센서 감지',
    processClass: 'unprocessed',
    status: 'UNHANDLED',
    statusLabel: '센서 감지',
  };
}

function isInDateRange(item, range) {
  if (!range.start && !range.end) return true;

  const value = item.occurredAt || item.recordedAt;
  const timestamp = new Date(value || 0).getTime();

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

// 정식 hazard-event가 있으면 그것을 우선하고,
// 같은 작업자/5초 이내의 센서 추락 알림은 중복 표시하지 않습니다.
function mergeHazardsWithSensorFallback(hazardItems, sensorItems) {
  const hazardFalls = hazardItems.filter(
    (item) => item.category === 'fall'
  );

  const fallback = sensorItems.filter((sensor) => {
    const sensorTime = new Date(
      sensor.occurredAt || sensor.recordedAt || 0
    ).getTime();

    if (!Number.isFinite(sensorTime)) return true;

    return !hazardFalls.some((hazard) => {
      const hazardTime = new Date(
        hazard.occurredAt || 0
      ).getTime();

      if (!Number.isFinite(hazardTime)) return false;

      const sameWorker =
        (hazard.name && hazard.name === sensor.name) ||
        (hazard.employeeNo &&
          hazard.employeeNo === sensor.employeeNo) ||
        (hazard.helmetNo &&
          hazard.helmetNo === sensor.helmetNo);

      return (
        sameWorker &&
        Math.abs(hazardTime - sensorTime) <= 5000
      );
    });
  });

  return [...hazardItems, ...fallback];
}

export default function Detections() {
  const [searchParams, setSearchParams] =
    useSearchParams();

  const {
    detections,
    refreshHazardEvents,
    queryHazardEvents,
    hazardLoading,
    hazardError,
    hazardStreamConnected,
    lastHazardUpdated,
  } = useDetections();

  const { workers } = useWorkers();
  const [fallAlerts, setFallAlerts] = useState([]);
  const [fallLoading, setFallLoading] = useState(false);
  const [fallError, setFallError] = useState('');

  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });
  const [dateHazards, setDateHazards] = useState(null);
  const [dateLoading, setDateLoading] = useState(false);
  const [dateError, setDateError] = useState('');

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
          '추락 센서 이력을 불러오지 못했습니다.'
      );
    } finally {
      setFallLoading(false);
    }
  }, [workers]);

  useEffect(() => {
    loadFallAlerts();
  }, [loadFallAlerts]);

  const active =
    searchParams.get('tab') || 'all';

  const hasDateRange = Boolean(
    dateRange.start || dateRange.end
  );

  const loadHazardsByDate = useCallback(
    async (range) => {
      if (!range.start && !range.end) {
        setDateHazards(null);
        setDateError('');
        return [];
      }

      if (
        range.start &&
        range.end &&
        range.start > range.end
      ) {
        setDateError(
          '시작일은 종료일보다 늦을 수 없습니다.'
        );
        return [];
      }

      setDateLoading(true);
      setDateError('');

      try {
        const page = await queryHazardEvents(
          buildHazardDateParams(range)
        );
        setDateHazards(page.events);
        return page.events;
      } catch (error) {
        setDateError(
          error?.message ||
            '기간별 이상 감지 조회에 실패했습니다.'
        );
        return [];
      } finally {
        setDateLoading(false);
      }
    },
    [queryHazardEvents]
  );

  useEffect(() => {
    if (hasDateRange) {
      loadHazardsByDate(dateRange);
    } else {
      setDateHazards(null);
      setDateError('');
    }
  }, [
    dateRange.start,
    dateRange.end,
    hasDateRange,
    loadHazardsByDate,
  ]);

  // SSE로 새 hazard가 들어왔을 때 현재 기간 조회 결과도 다시 불러옵니다.
  useEffect(() => {
    if (hasDateRange && lastHazardUpdated) {
      loadHazardsByDate(dateRange);
    }
  }, [
    lastHazardUpdated,
    hasDateRange,
    loadHazardsByDate,
  ]);

  // hazard-events를 우선 사용하되, 아직 백엔드에서 sensor alert → hazard-event
  // 생성이 되지 않은 경우 /api/workers/alerts의 추락 이력을 fallback으로 보여줍니다.
  // 동일 사고가 두 API에 모두 존재하면 hazard-event만 남깁니다.
  const allItems = useMemo(() => {
    const hazardItems = dedupeByEventId(
      dateHazards ?? detections
    );

    const sensorItems = fallAlerts.filter((item) =>
      isInDateRange(item, dateRange)
    );

    return mergeHazardsWithSensorFallback(
      hazardItems,
      sensorItems
    ).sort(
      (a, b) =>
        new Date(b.occurredAt || 0).getTime() -
        new Date(a.occurredAt || 0).getTime()
    );
  }, [dateHazards, detections, fallAlerts, dateRange]);

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
      hasDateRange
        ? loadHazardsByDate(dateRange)
        : refreshHazardEvents(),
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
            hazardError || fallError || dateError
              ? 'danger'
              : 'normal'
          }`}
        >
          <span>
            {hazardError || fallError || dateError
              ? [
                  hazardError
                    ? `이상 감지 API: ${hazardError}`
                    : '',
                  fallError
                    ? `추락 이력 API: ${fallError}`
                    : '',
                  dateError
                    ? `기간 조회 API: ${dateError}`
                    : '',
                ]
                  .filter(Boolean)
                  .join(' / ')
              : hazardLoading || fallLoading || dateLoading
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
            const { Icon, className } =
              typeMeta[item.kind] ||
              typeMeta.obstacle;

            const locationTitle = item.zoneCode
              ? `비콘 구역: ${item.zoneCode}`
              : undefined;

            return (
              <div
                className={`detection-table detection-table-row ${item.level}`}
                key={item.serverEventId ?? item.id}
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

                <span
                  className="muted-cell"
                  title={locationTitle}
                >
                  {item.zone || '-'}
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
            !dateLoading &&
            rows.length === 0 && (
              <div className="records-empty">
                {hasDateRange
                  ? '선택한 기간에 저장된 이상 감지 이벤트가 없습니다.'
                  : '현재 서버에 저장된 이상 감지 이벤트가 없습니다.'}
              </div>
            )}
        </section>
      </div>
    </>
  );
}
