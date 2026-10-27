import {
  Activity,
  AlertTriangle,
  Droplets,
  Eye,
  HeartPulse,
  Package,
  Search,
  Thermometer,
  CheckCheck,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Link,
  useSearchParams,
} from 'react-router-dom';
import DateRangeFilter from '../components/DateRangeFilter';
import TablePagination from '../components/TablePagination';
import TopHeader from '../components/TopHeader';
import { createRequestGate } from '../utils/requestGate';
import { useDetections } from '../context/DetectionContext';
import { useWorkers } from '../context/WorkerContext';
import { getWorkerAlerts } from '../api/workerStatus';
import { getNotifications } from '../api/notifications';
import { runHazardEventAction } from '../api/hazardEvents';
import '../styles/detectionsBulkAction.css';

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

function isFallAlert(alert) {
  const state = String(alert?.fallState || '').toUpperCase();
  const posture = String(alert?.posture || '').toUpperCase();
  return ['ACTION_REQUIRED', 'FALLING', 'FALLEN', 'UNCONSCIOUS'].includes(state)
    || ['STUMBLE', 'COLLAPSE'].includes(posture)
    || alert?.fallDetected === true;
}

function consolidateFallAlerts(alerts) {
  // Same device often reports repeated frames for one fall episode.
  // Keep the newest representative within each 2-minute window.
  const ordered = [...alerts].filter(isFallAlert).sort((a,b) =>
    new Date(b.recordedAt || 0).getTime() - new Date(a.recordedAt || 0).getTime()
  );
  const result = [];
  for (const alert of ordered) {
    const time = new Date(alert.recordedAt || 0).getTime();
    const duplicate = result.some(saved =>
      String(saved.deviceId) === String(alert.deviceId) &&
      Number.isFinite(time) &&
      Math.abs(new Date(saved.recordedAt).getTime() - time) < 2 * 60 * 1000
    );
    if (!duplicate) result.push(alert);
  }
  return result;
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
    process: '조치 미확인',
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

function healthNotificationToDetection(raw) {
  const message = String(raw.message || '');
  if (raw.hazardEventId != null || raw.sosId != null || !message.includes('건강 이상')) return null;
  const { dateLabel, time } = formatDateTime(raw.sentAt);
  const [name, zone] = message.split(' · ');
  return {
    id: `health-notification-${raw.id}`, notificationId: raw.id,
    source: 'health-notification', category: 'health', kind: 'fatigue',
    level: 'warning', type: '건강 이상 감지',
    name: name || '작업자 정보 없음', zone: zone || '위치 미확인',
    time, dateLabel, occurredAt: raw.sentAt,
    process: '조치 미확인',
    processClass: 'unprocessed',
    message
  };
}

function displayProcessStatus(item) {
  const rawStatus = String(item.status || item.rawEvent?.status || '').toUpperCase();
  const rawClass = String(item.processClass || '').toLowerCase();
  if (['RESOLVED', 'COMPLETED', 'CLOSED', 'DONE'].includes(rawStatus) ||
      ['completed', 'resolved', 'confirmed'].includes(rawClass)) {
    return { label: '처리완료', className: 'completed' };
  }
  if (['IN_PROGRESS', 'PROCESSING'].includes(rawStatus) ||
      ['processing', 'in-progress', 'in_progress'].includes(rawClass)) {
    return { label: '처리중', className: 'processing' };
  }
  // Sensor readings and notification read flags do not have a true resolution state.
  if (item.source === 'sensor-alert' || item.source === 'health-notification') {
    return { label: '조치 미확인', className: 'unknown' };
  }
  return { label: '미처리', className: 'unprocessed' };
}

function hasMatchingActionableEvent(record, serverEvents) {
  if (record.source !== 'sensor-alert' && record.source !== 'health-notification') return false;
  const occurred = new Date(record.occurredAt || record.recordedAt || 0).getTime();
  if (!Number.isFinite(occurred)) return false;
  return serverEvents.some(event => {
    if (event.source !== 'server' || event.category !== record.category) return false;
    const other = new Date(event.occurredAt || 0).getTime();
    if (!Number.isFinite(other) || Math.abs(other - occurred) > 120000) return false;
    // Match by device's worker or exact worker name: never dedupe unrelated workers by time alone.
    const sameWorker = record.name && event.name && record.name !== '미확인 작업자'
      && String(record.name) === String(event.name);
    return sameWorker;
  });
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

export default function Detections() {
  const [searchParams, setSearchParams] =
    useSearchParams();

  const {
    detections,
    refreshHazardEvents,
    completeDetection,
    hazardLoading,
    hazardError,
    hazardStreamConnected,
  } = useDetections();

  const { workers } = useWorkers();

  const [rawFallAlerts, setRawFallAlerts] = useState([]);
  const hasLoadedFalls = useRef(false);
  const fallAlerts = useMemo(() => rawFallAlerts.map(item => sensorAlertToDetection(item, workers)), [rawFallAlerts, workers]);
  const [healthRecords, setHealthRecords] = useState([]);
  const [healthError, setHealthError] = useState('');
  const [fallLoading, setFallLoading] = useState(false);
  const [fallError, setFallError] = useState('');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });

  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState('');

  const active =
    searchParams.get('tab') || 'all';

  const fallGate = useMemo(() => createRequestGate({
    load: getWorkerAlerts,
    onStart: () => setFallLoading(!hasLoadedFalls.current),
    onSuccess: alerts => {
      hasLoadedFalls.current = true;
      setRawFallAlerts(consolidateFallAlerts(alerts));
      setFallError('');
    },
    onError: error => setFallError(error?.message || '추락 감지 이력을 불러오지 못했습니다.'),
    onFinish: () => setFallLoading(false),
  }), []);
  const loadFallAlerts = useCallback(() => fallGate.run().catch(() => {}), [fallGate]);

  useEffect(() => {
    loadFallAlerts();
    const timer = window.setInterval(() => { if (!document.hidden) loadFallAlerts(); }, 5000);
    return () => window.clearInterval(timer);
  }, [loadFallAlerts]);

  const loadHealthRecords = useCallback(async () => {
    try {
      const rows = await getNotifications({ recipientType: 'MANAGER', page: 0, size: 1000 });
      setHealthRecords(rows.map(healthNotificationToDetection).filter(Boolean));
      setHealthError('');
    } catch (error) { setHealthError(error?.message || '건강 이력 조회 실패'); }
  }, []);

  useEffect(() => {
    loadHealthRecords();
    const timer = window.setInterval(loadHealthRecords, 10000);
    return () => window.clearInterval(timer);
  }, [loadHealthRecords]);

  const allItems = useMemo(
    () =>
      [...detections, ...fallAlerts, ...healthRecords]
        .filter((item) => !hasMatchingActionableEvent(item, detections))
        .filter((item) => {
          const resolved = ['RESOLVED', 'COMPLETED', 'CLOSED', 'DONE'].includes(String(item.status || '').toUpperCase())
            || ['completed', 'confirmed', 'resolved'].includes(String(item.processClass || '').toLowerCase())
            || ['처리완료', '조치완료', '완료'].includes(String(item.process || '').replace(/\s/g, ''))
            || ['처리완료', '조치완료', '완료'].includes(String(item.statusLabel || '').replace(/\s/g, ''));
          return !resolved;
        })
        .filter((item) => isInDateRange(item, dateRange))
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

  const rows = useMemo(() => {
    const categoryRows =
      active === 'all'
        ? allItems
        : allItems.filter(
            (item) =>
              item.category === active
          );

    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return categoryRows;
    }

    return categoryRows.filter(
      (item) =>
        [
          item.name,
          item.type,
          item.zone,
          item.deviceId,
          item.process,
          item.fallState,
          item.healthState,
          item.posture,
          levelLabel[item.level],
        ].some((value) =>
          String(value ?? '')
            .toLowerCase()
            .includes(query)
        )
    );
  }, [active, allItems, search]);

  const bulkCandidates = useMemo(() => rows.filter(item => (
    item.source === 'server' &&
    Number.isInteger(Number(item.serverEventId ?? item.id)) &&
    Number(item.serverEventId ?? item.id) > 0 &&
    !['RESOLVED', 'COMPLETED', 'CLOSED'].includes(String(item.status || '').toUpperCase()) &&
    item.processClass !== 'completed'
  )), [rows]);

  const bulkResolve = async () => {
    if (bulkProcessing || !bulkCandidates.length) return;
    if (!window.confirm(`현재 조회 조건에 표시된 서버 미처리 이벤트 ${bulkCandidates.length}건을 처리완료 하시겠습니까?\\n센서 감지 기록과 다른 기간/검색 결과는 제외됩니다.`)) return;

    setBulkProcessing(true);
    setBulkProgress('처리 준비 중...');
    const admin = (() => {
      try { return JSON.parse(localStorage.getItem('safehelmet_current_admin') || '{}'); }
      catch { return {}; }
    })();
    const adminId = [admin.adminId, admin.backendId, admin.userId, admin.id]
      .map(value => Number(value)).find(value => Number.isInteger(value) && value >= 0) ?? 0;
    let done = 0;
    let failed = 0;
    try {
      // Small batches limit server pressure and allow visible progress.
      for (let i = 0; i < bulkCandidates.length; i += 4) {
        const batch = bulkCandidates.slice(i, i + 4);
        const results = await Promise.allSettled(batch.map(item =>
          runHazardEventAction(item.serverEventId ?? item.id, {
            actionType: 'RESOLVE', adminId, memo: '관리자 이상 감지 목록 일괄 처리완료'
          })
        ));
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            done += 1;
            completeDetection(batch[index].id);
          } else {
            failed += 1;
          }
        });
        setBulkProgress(`처리 중 ${done + failed}/${bulkCandidates.length}건 · 성공 ${done}건`);
      }
      setBulkProgress(`처리 결과: 성공 ${done}건, 실패 ${failed}건. ${failed ? '실패한 항목은 처리되지 않았습니다.' : '완료되었습니다.'}`);
      await refreshHazardEvents();
    } catch (error) {
      setBulkProgress(`일괄 처리 중 오류: ${error?.message || '재시도해주세요.'}`);
    } finally {
      setBulkProcessing(false);
    }
  };

  useEffect(() => { setPage(1); }, [active, search, dateRange.start, dateRange.end]);
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

        <div
          className="admin-date-filter-row"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent:
              'space-between',
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

          <div className="detection-bulk-actions">
            <button type="button" className="detection-bulk-resolve-btn" disabled={bulkProcessing || bulkCandidates.length === 0} onClick={bulkResolve}>
              <CheckCheck size={15} />
              {bulkProcessing ? '처리 중...' : `일괄 처리완료 (${bulkCandidates.length})`}
            </button>
          </div>
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
                setSearch(
                  event.target.value
                )
              }
              placeholder="작업자·유형·위치 검색"
            />
          </label>
        </div>

        {bulkProgress && <div className="detection-bulk-progress" role="status" aria-live="polite">{bulkProgress}</div>}

        <div
          className={`worker-filter-banner ${
            hazardError || fallError || healthError
              ? 'danger'
              : 'normal'
          }`}
        >
          <span>
            {hazardError || fallError || healthError
              ? [
                  hazardError
                    ? `이상 감지 API: ${hazardError}`
                    : '',
                  fallError
                    ? `추락 이력 API: ${fallError}`
                    : '',
                  healthError ? `건강 알림 API: ${healthError}` : '',
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

          {paginatedRows.map((item) => {
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
                    className={`process-chip ${displayProcessStatus(item).className}`}
                  >
                    {displayProcessStatus(item).label}
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
                {search
                  ? '검색 조건에 맞는 이상 감지 이벤트가 없습니다.'
                  : dateRange.start ||
                      dateRange.end
                    ? '선택한 기간에 저장된 이상 감지 이벤트가 없습니다.'
                    : '현재 서버에 저장된 이상 감지 이벤트가 없습니다.'}
              </div>
            )}
        </section>
        <TablePagination total={rows.length} page={safePage} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={handlePageSizeChange} />
      </div>
    </>
  );
}
