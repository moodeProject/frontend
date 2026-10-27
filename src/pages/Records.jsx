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
import TablePagination from '../components/TablePagination';
import '../styles/recordsPolish.css';
import TopHeader from '../components/TopHeader';
import { useDetections } from '../context/DetectionContext';
import { useWorkers } from '../context/WorkerContext';
import { getWorkerAlerts } from '../api/workerStatus';
import { getNotifications } from '../api/notifications';

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

function isActualFallAlert(alert) {
  const state = String(alert?.fallState || '').toUpperCase();
  const posture = String(alert?.posture || '').toUpperCase();
  return ['ACTION_REQUIRED', 'FALLING', 'FALLEN', 'UNCONSCIOUS'].includes(state)
    || ['STUMBLE', 'COLLAPSE'].includes(posture)
    || alert?.fallDetected === true;
}

function healthNotificationToRecord(raw) {
  const message = String(raw?.message || '');
  if (raw?.hazardEventId != null || raw?.sosId != null || !message.includes('건강 이상')) return null;
  const { dateLabel, time } = formatDateTime(raw.sentAt);
  const [name, zone] = message.split(' · ');
  return {
    id: `health-notification-${raw.id}`,
    notificationId: raw.id,
    source: 'health-notification',
    category: 'health',
    kind: 'fatigue',
    type: '건강 이상 감지',
    level: 'warning',
    name: name || '작업자 정보 없음',
    zone: zone || '위치 미확인',
    dateLabel, time,
    occurredAt: raw.sentAt,
    process: '조치 미확인',
    processClass: 'unknown',
    message,
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

function matchesActionableEvent(record, events) {
  if (record.source !== 'sensor-alert' && record.source !== 'health-notification') return false;
  const at = new Date(record.occurredAt || 0).getTime();
  if (!Number.isFinite(at)) return false;
  return events.some(event => event.source === 'server' &&
    event.category === record.category &&
    record.name && record.name !== '미확인 작업자' &&
    String(record.name) === String(event.name) &&
    Math.abs(new Date(event.occurredAt || 0).getTime() - at) <= 120000);
}

function processLabel(item) {
  if (item.source === 'health-notification') return '조치 미확인';
  if (item.source === 'sensor-alert') {
    return '조치 미확인';
  }

  if (item.statusLabel) return item.statusLabel;

  return {
    UNHANDLED: '미처리',
    IN_PROGRESS: '처리중',
    RESOLVED: '처리완료',
  }[String(item.status ?? '').toUpperCase()] || item.process || '미처리';
}

function processClass(item) {
  if (item.source === 'health-notification') return 'unknown';
  if (item.source === 'sensor-alert') {
    return 'unknown';
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
  if (item.source === 'health-notification') return `/detections/health-notification/${encodeURIComponent(item.notificationId)}`;
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
  const [healthRecords, setHealthRecords] = useState([]);
  const [healthError, setHealthError] = useState('');
  const [fallLoading, setFallLoading] = useState(false);
  const [fallError, setFallError] = useState('');
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);
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
        alerts.filter(isActualFallAlert).map((item) =>
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

  const loadHealthRecords = useCallback(async () => {
    try {
      const pages = [];
      for (let page = 0; page < 20; page += 1) {
        const batch = await getNotifications({recipientType: 'MANAGER', page, size: 100});
        pages.push(...batch);
        if (batch.length < 100) break;
      }
      const rows = pages;
      setHealthRecords(rows.map(healthNotificationToRecord).filter(Boolean));
      setHealthError('');
    } catch (error) { setHealthError(error?.message || '건강 알림 기록 조회 실패'); }
  }, []);

  useEffect(() => {
    loadHealthRecords();
    const timer = window.setInterval(loadHealthRecords, 10000);
    return () => window.clearInterval(timer);
  }, [loadHealthRecords]);

  const visibleItems = useMemo(
    () =>
      [...detections, ...fallAlerts, ...healthRecords]
        .filter((item) => !matchesActionableEvent(item, detections))
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
    [detections, fallAlerts, healthRecords, dateRange]
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

  useEffect(() => { setPage(1); }, [tab, search, dateRange.start, dateRange.end]);
  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedRows = pageSize === 'all' ? rows : rows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const handlePageSizeChange = (nextSize) => { setPageSize(nextSize); setPage(1); };

  const refreshPage = async () => {
    await Promise.allSettled([
      refreshHazardEvents(),
      loadFallAlerts(),
      loadHealthRecords(),
    ]);
  };

  return (
    <>
      <TopHeader
        title="사고·알림 기록"
        subtitle="전체 위험 발생 및 알림 이력"
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
            hazardError || fallError || healthError
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
                  healthError ? `건강 알림 API: ${healthError}` : '',
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

          {paginatedRows.map((item) => {
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
        <TablePagination total={rows.length} page={safePage} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={handlePageSizeChange} />
      </div>
    </>
  );
}
