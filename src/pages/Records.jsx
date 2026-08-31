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
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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

function detailHref(item) {
  if (item.category === 'fall') return '/incident';
  if (item.category === 'external') return `/detections/${item.id}`;
  if (item.category === 'health') return `/detections/health/${item.id}`;
  return '/detections';
}

function isAbnormal(value) {
  return Boolean(value) && String(value).toUpperCase() !== 'NORMAL';
}

function deriveDeviceId(worker) {
  if (worker?.deviceId) return String(worker.deviceId);

  const helmetId = worker?.helmetId || worker?.id || '';
  if (/^H-\d+$/i.test(helmetId)) {
    return helmetId.replace(/^H-/i, 'DEV-');
  }

  return '';
}

function formatRecordedAt(recordedAt) {
  if (!recordedAt) {
    return {
      dateLabel: '--.--',
      time: '--:--',
    };
  }

  const date = new Date(recordedAt);

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

function convertAlertToRecord(alert, workers) {
  const worker = workers.find(
    (item) => deriveDeviceId(item) === String(alert.deviceId)
  );

  const { dateLabel, time } = formatRecordedAt(alert.recordedAt);
  const danger = isAbnormal(alert.fallState);

  return {
    id: `server-fall-${alert.deviceId}-${alert.recordedAt || Math.random()}`,
    category: 'fall',
    kind: 'fall',
    level: danger ? 'danger' : 'warning',
    type: danger ? '추락 감지' : '추락 감지 이력',
    name: worker?.name || alert.deviceId || '미확인 작업자',
    zone: worker?.zone || worker?.detailLocation || '-',
    dateLabel,
    time,
    process: '미처리',
    processClass: 'unprocessed',
    source: 'server',
    deviceId: alert.deviceId,
    fallState: alert.fallState,
    healthState: alert.healthState,
    heartRate: alert.heartRate,
    spo2: alert.spo2,
    fallConfidence: alert.fallConfidence,
    recordedAt: alert.recordedAt,
  };
}

export default function Records() {
  const { detections } = useDetections();
  const { workers } = useWorkers();

  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [serverFallRecords, setServerFallRecords] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertsError, setAlertsError] = useState('');

  const refreshAlerts = useCallback(async () => {
    setAlertsLoading(true);
    setAlertsError('');

    try {
      const alerts = await getWorkerAlerts();

      const converted = alerts
        .map((alert) => convertAlertToRecord(alert, workers))
        .sort((a, b) => {
          const aTime = new Date(a.recordedAt || 0).getTime();
          const bTime = new Date(b.recordedAt || 0).getTime();
          return bTime - aTime;
        });

      setServerFallRecords(converted);
      return alerts;
    } catch (error) {
      console.error('추락 감지 이력 조회 실패:', error);
      setAlertsError(
        error?.message || '추락 감지 이력을 불러오지 못했습니다.'
      );
      throw error;
    } finally {
      setAlertsLoading(false);
    }
  }, [workers]);

  useEffect(() => {
    refreshAlerts().catch(() => {});
  }, [refreshAlerts]);

  const mergedRecords = useMemo(() => {
    // 추락 기록은 실제 서버 API를 사용하고,
    // 외부요인/건강은 해당 API 연결 전까지 기존 데이터를 유지합니다.
    const nonFallMockRecords = detections.filter(
      (item) => item.category !== 'fall'
    );

    return [...serverFallRecords, ...nonFallMockRecords];
  }, [detections, serverFallRecords]);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return mergedRecords.filter((item) => {
      const tabMatch = tab === 'all' || item.category === tab;

      const searchMatch =
        !query ||
        [
          item.name,
          item.type,
          item.zone,
          item.process,
          item.deviceId,
          item.fallState,
          item.healthState,
        ].some((value) =>
          String(value ?? '')
            .toLowerCase()
            .includes(query)
        );

      return tabMatch && searchMatch;
    });
  }, [tab, search, mergedRecords]);

  return (
    <>
      <TopHeader
        title="사고·알림 기록"
        subtitle="이벤트 처리 이력"
        onRefresh={refreshAlerts}
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
                {item.label}
              </button>
            ))}
          </div>

          <label className="records-search">
            <Search size={14} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="검색"
            />
          </label>
        </div>

        {alertsLoading && (
          <div className="records-empty">
            실제 추락 감지 이력을 불러오는 중입니다.
          </div>
        )}

        {alertsError && (
          <div className="records-empty">
            추락 이력 연동 실패: {alertsError}
          </div>
        )}

        <section className="panel records-table">
          <div className="records-row records-head">
            <span>발생 시간</span>
            <span>작업자</span>
            <span>감지 유형</span>
            <span>위치</span>
            <span>위험도</span>
            <span>처리 상태</span>
            <span></span>
          </div>

          {rows.map((item) => {
            const Icon = iconForDetection(item);

            return (
              <div
                className={`records-row ${item.level}`}
                key={item.id}
              >
                <time>
                  {item.dateLabel || '08.09'}&nbsp; {item.time}
                </time>

                <strong>{item.name}</strong>

                <span
                  className={`record-type ${item.level} ${item.kind}`}
                >
                  <Icon size={13} />
                  {item.type}
                </span>

                <span className="record-zone">{item.zone}</span>

                <span>
                  <span className={`record-risk ${item.level}`}>
                    ● {item.level === 'danger' ? '위험' : '주의'}
                  </span>
                </span>

                <span>
                  <span
                    className={`record-process ${item.processClass}`}
                  >
                    {item.process}
                  </span>
                </span>

                <Link
                  className="record-detail"
                  to={detailHref(item)}
                  title={
                    item.source === 'server'
                      ? `${item.deviceId} · 심박 ${item.heartRate ?? '-'} bpm · SpO₂ ${item.spo2 ?? '-'}`
                      : undefined
                  }
                >
                  <Eye size={13} />
                  상세
                </Link>
              </div>
            );
          })}

          {!alertsLoading && rows.length === 0 && (
            <div className="records-empty">
              {tab === 'fall'
                ? '현재 서버에 저장된 추락 감지 이력이 없습니다.'
                : '검색 결과가 없습니다.'}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
