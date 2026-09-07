import {
  Activity,
  Box,
  Droplets,
  Eye,
  Flame,
  HeartPulse,
  Search,
  TriangleAlert,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Link } from 'react-router-dom';
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

const categoryIcons = {
  fall: Activity,
  health: HeartPulse,
  external: Box,
};

function iconForDetection(item) {
  if (item.kind === 'unguarded') return TriangleAlert;
  if (item.kind === 'puddle') return Droplets;
  if (item.kind === 'heat') return Flame;
  return categoryIcons[item.category] || Activity;
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

function sensorAlertToRecord(alert, workers) {
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
    employeeNo:
      worker?.employeeNumber || worker?.workerCode,
    // 화면에는 사람이 읽는 구역명(name)을 표시합니다.
    // /api/workers/alerts에 zone 정보가 없으면 작업자 기본 구역을 fallback으로 사용합니다.
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
    zoneId: alert?.zone?.id ?? null,
    helmetNo: worker?.helmetId,
    dateLabel,
    time,
    occurredAt: alert.recordedAt,
    recordedAt: alert.recordedAt,
    deviceId: alert.deviceId,
    process: '센서 감지',
    processClass: 'unprocessed',
    fallState: alert.fallState,
    heartRate: alert.heartRate,
    spo2: alert.spo2,
    fallConfidence: alert.fallConfidence,
    posture: alert.posture,
    postureAbnormal: alert.postureAbnormal,
  };
}

function processLabel(item) {
  if (item.source === 'sensor-alert') {
    return '센서 감지';
  }

  if (item.statusLabel) return item.statusLabel;

  return {
    UNHANDLED: '미처리',
    IN_PROGRESS: '처리중',
    RESOLVED: '처리완료',
  }[String(item.status ?? '').toUpperCase()] || item.process || '미처리';
}

function processClass(item) {
  if (item.source === 'sensor-alert') {
    return 'unprocessed';
  }

  const status = String(item.status ?? '').toUpperCase();

  if (status === 'RESOLVED') return 'confirmed';
  if (status === 'IN_PROGRESS') return 'processing';
  if (status === 'UNHANDLED') return 'unprocessed';

  if (item.processClass === 'completed') return 'confirmed';
  return item.processClass || 'unprocessed';
}

function levelLabel(item) {
  if (item.rawEvent?.severityLabel) {
    return item.rawEvent.severityLabel;
  }

  return item.level === 'danger' ? '위험' : '주의';
}

function detailHref(item) {
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

// hazard-events가 생성된 추락은 정식 위험 이벤트를 우선 사용하고,
// 같은 작업자/비슷한 시각의 /api/workers/alerts 항목은 fallback에서 제외합니다.
function mergeHazardAndSensorAlerts(hazardItems, sensorAlerts) {
  const hazardFalls = hazardItems.filter(
    (item) => item.category === 'fall'
  );

  const filteredAlerts = sensorAlerts.filter((alert) => {
    const alertTime = new Date(
      alert.occurredAt || alert.recordedAt || 0
    ).getTime();

    if (!Number.isFinite(alertTime)) return true;

    return !hazardFalls.some((hazard) => {
      const hazardTime = new Date(
        hazard.occurredAt || 0
      ).getTime();

      if (!Number.isFinite(hazardTime)) return false;

      const sameWorker =
        (hazard.name && hazard.name === alert.name) ||
        (hazard.employeeNo &&
          hazard.employeeNo === alert.employeeNo) ||
        (hazard.helmetNo &&
          hazard.helmetNo === alert.helmetNo);

      return (
        sameWorker &&
        Math.abs(hazardTime - alertTime) <= 5000
      );
    });
  });

  return [...hazardItems, ...filteredAlerts];
}

export default function Records() {
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
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
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
          sensorAlertToRecord(item, workers)
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

  const hasDateRange = Boolean(dateRange.start || dateRange.end);

  const loadHazardsByDate = useCallback(
    async (range) => {
      if (!range.start && !range.end) {
        setDateHazards(null);
        setDateError('');
        return [];
      }

      if (range.start && range.end && range.start > range.end) {
        setDateError('시작일은 종료일보다 늦을 수 없습니다.');
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
            '기간별 사고·알림 기록 조회에 실패했습니다.'
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
  }, [dateRange.start, dateRange.end, hasDateRange, loadHazardsByDate]);

  // SSE로 새 이벤트가 들어오면 현재 기간의 기록을 다시 조회합니다.
  useEffect(() => {
    if (hasDateRange && lastHazardUpdated) {
      loadHazardsByDate(dateRange);
    }
  }, [lastHazardUpdated]);

  const hazardItems = dateHazards ?? detections;

  const visibleItems = useMemo(() => {
    const sensorItems = fallAlerts.filter((item) =>
      isInDateRange(item, dateRange)
    );

    return mergeHazardAndSensorAlerts(
      hazardItems,
      sensorItems
    ).sort(
      (a, b) =>
        new Date(
          b.occurredAt || b.recordedAt || 0
        ).getTime() -
        new Date(
          a.occurredAt || a.recordedAt || 0
        ).getTime()
    );
  }, [hazardItems, fallAlerts, dateRange]);

  const counts = useMemo(
    () => ({
      all: visibleItems.length,
      external: visibleItems.filter(
        (item) => item.category === 'external'
      ).length,
      health: visibleItems.filter(
        (item) => item.category === 'health'
      ).length,
      fall: visibleItems.filter(
        (item) => item.category === 'fall'
      ).length,
    }),
    [visibleItems]
  );

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return visibleItems.filter((item) => {
      const tabMatch =
        tab === 'all' || item.category === tab;

      const searchMatch =
        !query ||
        [
          item.name,
          item.employeeNo,
          item.type,
          item.zone,
          item.zoneCode,
          item.helmetNo,
          item.deviceId,
          item.statusLabel,
          item.process,
        ].some((value) =>
          String(value ?? '')
            .toLowerCase()
            .includes(query)
        );

      return tabMatch && searchMatch;
    });
  }, [tab, search, visibleItems]);

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
        title="사고·알림 기록"
        subtitle="실제 이상 감지 이벤트 처리 이력"
        onRefresh={refreshPage}
      />

      <div className="page-body records-page">
        <div className="records-toolbar">
          <div className="records-tabs">
            {tabs.map((item) => (
              <button
                key={item.key}
                className={tab === item.key ? 'active' : ''}
                onClick={() => setTab(item.key)}
              >
                {item.label} {counts[item.key] ?? 0}
              </button>
            ))}
          </div>

          <label className="records-search">
            <Search size={14} />
            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="작업자·유형·위치 검색"
            />
          </label>
        </div>

        <div className="admin-date-filter-row records-date-filter-row">
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
                    ? `위험 이벤트 API: ${hazardError}`
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
                ? '사고·알림 기록을 불러오는 중입니다.'
                : hazardStreamConnected
                  ? '● 실시간 위험 이벤트 기록 연결됨'
                  : '위험 이벤트 실시간 연결 재시도 중'}
          </span>
        </div>

        <section className="panel records-table">
          <div className="records-row records-head">
            <span>발생 시간</span>
            <span>작업자</span>
            <span>감지 유형</span>
            <span>위치</span>
            <span>위험도</span>
            <span>처리 상태</span>
            <span />
          </div>

          {rows.map((item) => {
            const Icon = iconForDetection(item);

            return (
              <div
                className={`records-row ${item.level}`}
                key={item.id}
              >
                <time>
                  {item.dateLabel || '--.--'}
                  &nbsp;
                  {item.time || '--:--'}
                </time>

                <strong>
                  {item.name || '미확인 작업자'}
                </strong>

                <span
                  className={`record-type ${item.level} ${item.kind}`}
                >
                  <Icon size={13} />
                  {item.type || '이상 감지'}
                </span>

                <span
                  className="record-zone"
                  title={
                    item.zoneCode
                      ? `구역 코드: ${item.zoneCode}`
                      : undefined
                  }
                >
                  {item.zone || '위치 미확인'}
                </span>

                <span>
                  <span
                    className={`record-risk ${item.level}`}
                  >
                    ● {levelLabel(item)}
                  </span>
                </span>

                <span>
                  <span
                    className={`record-process ${processClass(item)}`}
                  >
                    {processLabel(item)}
                  </span>
                </span>

                <Link
                  className="record-detail"
                  to={detailHref(item)}
                >
                  <Eye size={13} />
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
                {search
                  ? '검색 조건에 맞는 기록이 없습니다.'
                  : dateRange.start || dateRange.end
                    ? '선택한 기간에 저장된 사고·알림 기록이 없습니다.'
                    : '현재 서버에 저장된 사고·알림 기록이 없습니다.'}
              </div>
            )}
        </section>
      </div>
    </>
  );
}
