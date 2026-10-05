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
    zone: worker?.zone || '-',
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

export default function Records() {
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
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });

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

  const visibleItems = useMemo(
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
      refreshHazardEvents(),
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
        </div>

        <div
          className="admin-date-filter-row records-date-filter-row"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
            width: '100%',
          }}
        >
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

          <label
            className="records-search"
            style={{
              marginLeft: 'auto',
              flexShrink: 0,
            }}
          >
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
                    ? `위험 이벤트 API: ${hazardError}`
                    : '',
                  fallError
                    ? `추락 이력 API: ${fallError}`
                    : '',
                ]
                  .filter(Boolean)
                  .join(' / ')
              : hazardLoading || fallLoading
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

                <span className="record-zone">
                  {item.zone || '-'}
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
