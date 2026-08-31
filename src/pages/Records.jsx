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
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import TopHeader from '../components/TopHeader';
import { useDetections } from '../context/DetectionContext';

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
  if (item.category === 'fall') {
    return `/incident/${item.id}`;
  }

  if (item.category === 'health') {
    return `/detections/health/${item.id}`;
  }

  return `/detections/${item.id}`;
}

function processLabel(item) {
  if (item.statusLabel) return item.statusLabel;

  return {
    UNHANDLED: '미처리',
    IN_PROGRESS: '처리중',
    RESOLVED: '처리완료',
  }[String(item.status ?? '').toUpperCase()] || item.process || '미처리';
}

function processClass(item) {
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

export default function Records() {
  const {
    detections,
    refreshHazardEvents,
    hazardLoading,
    hazardError,
    hazardSummary,
    hazardStreamConnected,
  } = useDetections();

  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');

  const counts = useMemo(() => {
    if (hazardSummary) {
      return {
        all: hazardSummary.all ?? detections.length,
        external:
          hazardSummary.external ??
          detections.filter((item) => item.category === 'external').length,
        health:
          hazardSummary.health ??
          detections.filter((item) => item.category === 'health').length,
        fall:
          hazardSummary.fall ??
          detections.filter((item) => item.category === 'fall').length,
      };
    }

    return {
      all: detections.length,
      external: detections.filter((item) => item.category === 'external').length,
      health: detections.filter((item) => item.category === 'health').length,
      fall: detections.filter((item) => item.category === 'fall').length,
    };
  }, [hazardSummary, detections]);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...detections]
      .sort((a, b) => {
        const aTime = new Date(a.occurredAt || 0).getTime();
        const bTime = new Date(b.occurredAt || 0).getTime();
        return bTime - aTime;
      })
      .filter((item) => {
        const tabMatch = tab === 'all' || item.category === tab;

        const searchMatch =
          !query ||
          [
            item.name,
            item.employeeNo,
            item.type,
            item.zone,
            item.helmetNo,
            item.statusLabel,
            item.process,
            item.rawEvent?.hazardType,
            item.rawEvent?.severityLabel,
          ].some((value) =>
            String(value ?? '')
              .toLowerCase()
              .includes(query)
          );

        return tabMatch && searchMatch;
      });
  }, [tab, search, detections]);

  return (
    <>
      <TopHeader
        title="사고·알림 기록"
        subtitle="실제 이상 감지 이벤트 처리 이력"
        onRefresh={refreshHazardEvents}
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
              onChange={(e) => setSearch(e.target.value)}
              placeholder="작업자·유형·위치 검색"
            />
          </label>
        </div>

        <div
          className={`worker-filter-banner ${
            hazardError ? 'danger' : 'normal'
          }`}
        >
          <span>
            {hazardError
              ? `사고·알림 기록 API 연동 실패: ${hazardError}`
              : hazardLoading
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
                  {item.dateLabel || '--.--'}&nbsp; {item.time || '--:--'}
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
                  <span className={`record-risk ${item.level}`}>
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
                  title={[
                    item.employeeNo,
                    item.helmetNo,
                    item.confidence != null
                      ? `신뢰도 ${Math.round(
                          Number(item.confidence) <= 1
                            ? Number(item.confidence) * 100
                            : Number(item.confidence)
                        )}%`
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                >
                  <Eye size={13} />
                  상세
                </Link>
              </div>
            );
          })}

          {!hazardLoading && rows.length === 0 && (
            <div className="records-empty">
              {search
                ? '검색 조건에 맞는 기록이 없습니다.'
                : tab === 'all'
                  ? '현재 서버에 저장된 사고·알림 기록이 없습니다.'
                  : `${tabs.find((item) => item.key === tab)?.label} 기록이 없습니다.`}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
