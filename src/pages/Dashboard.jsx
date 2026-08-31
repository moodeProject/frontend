import {
  AlertTriangle,
  Eye,
  HeartPulse,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import {
  useMemo,
  useState,
} from 'react';
import {
  Link,
  useNavigate,
} from 'react-router-dom';
import TopHeader from '../components/TopHeader';
import StatusBadge from '../components/StatusBadge';
import WorkerCard from '../components/WorkerCard';
import { useDetections } from '../context/DetectionContext';
import { useWorkers } from '../context/WorkerContext';

const labelMap = {
  normal: '정상',
  warning: '주의',
  danger: '위험',
};

function detectionTarget(item) {
  if (item.category === 'fall') {
    return `/incident/${item.id}`;
  }

  if (item.category === 'health') {
    return `/detections/health/${item.id}`;
  }

  return `/detections/${item.id}`;
}

function zoneKey(zone) {
  const value = String(zone || '').trim();

  if (!value) return '미지정';

  const match = value.match(/^([A-Za-z가-힣]+구역)/);

  return match?.[1] || value;
}

function zoneState(workers) {
  const grouped = new Map();

  workers.forEach((worker) => {
    const key = zoneKey(worker.zone);

    if (!grouped.has(key)) {
      grouped.set(key, {
        name: key,
        normal: 0,
        warning: 0,
        danger: 0,
      });
    }

    const row = grouped.get(key);
    const status =
      worker.status === 'danger'
        ? 'danger'
        : worker.status === 'warning'
          ? 'warning'
          : 'normal';

    row[status] += 1;
  });

  return [...grouped.values()]
    .map((row) => ({
      ...row,
      level:
        row.danger > 0
          ? 'danger'
          : row.warning > 0
            ? 'warning'
            : 'normal',
    }))
    .sort((a, b) =>
      a.name.localeCompare(b.name, 'ko')
    );
}

export default function Dashboard() {
  const {
    workers,
    refreshWorkerStatuses,
    sensorLoading,
    sensorError,
  } = useWorkers();

  const {
    detections,
    hazardSummary,
    refreshHazardEvents,
    hazardLoading,
    hazardError,
    hazardStreamConnected,
  } = useDetections();

  const [expandedStatus, setExpandedStatus] =
    useState('');

  const navigate = useNavigate();

  const riskyWorkers = workers.filter(
    (worker) => worker.status !== 'normal'
  );

  const counts = workers.reduce(
    (acc, worker) => ({
      ...acc,
      [worker.status]:
        (acc[worker.status] || 0) + 1,
    }),
    {}
  );

  const summary = [
    {
      key: 'all',
      label: '현재 작업자',
      value: workers.length,
      unit: '명',
      icon: Users,
    },
    {
      key: 'normal',
      label: '정상',
      value: counts.normal || 0,
      unit: '명',
      icon: ShieldCheck,
    },
    {
      key: 'warning',
      label: '주의',
      value: counts.warning || 0,
      unit: '명',
      icon: AlertTriangle,
    },
    {
      key: 'danger',
      label: '위험',
      value: counts.danger || 0,
      unit: '명',
      icon: HeartPulse,
    },
  ];

  const recentHazards = useMemo(
    () =>
      [...detections]
        .sort(
          (a, b) =>
            new Date(b.occurredAt || 0).getTime() -
            new Date(a.occurredAt || 0).getTime()
        )
        .slice(0, 5),
    [detections]
  );

  const zones = useMemo(
    () => zoneState(workers),
    [workers]
  );

  const handleSummaryClick = (key) => {
    if (key === 'warning' || key === 'danger') {
      setExpandedStatus((current) =>
        current === key ? '' : key
      );
      return;
    }

    if (key === 'all') {
      navigate('/workers');
    } else {
      navigate(`/workers?status=${key}`);
    }
  };

  const expandedWorkers = expandedStatus
    ? workers.filter(
        (worker) => worker.status === expandedStatus
      )
    : [];

  const refreshDashboard = async () => {
    await Promise.allSettled([
      refreshWorkerStatuses(),
      refreshHazardEvents(),
    ]);
  };

  const hazardCountLabel = hazardSummary
    ? `외부요인 ${hazardSummary.external ?? 0} · 건강 ${
        hazardSummary.health ?? 0
      } · 추락 ${hazardSummary.fall ?? 0}`
    : `전체 ${detections.length}건`;

  return (
    <>
      <TopHeader
        title="통합 모니터링"
        subtitle="현장 전체 실시간 현황"
        onRefresh={refreshDashboard}
      />

      <div className="page-body dashboard-page">
        {(sensorError || hazardError) && (
          <div className="worker-filter-banner danger">
            <span>
              {[
                sensorError
                  ? `작업자 상태: ${sensorError}`
                  : '',
                hazardError
                  ? `이상 감지: ${hazardError}`
                  : '',
              ]
                .filter(Boolean)
                .join(' / ')}
            </span>
          </div>
        )}

        <section className="summary-grid">
          {summary.map(
            ({
              key,
              label,
              value,
              unit,
              icon: Icon,
            }) => {
              const expandable =
                key === 'warning' || key === 'danger';

              const isExpanded =
                expandedStatus === key;

              return (
                <button
                  key={key}
                  className={`summary-card ${key} ${
                    isExpanded ? 'selected' : ''
                  }`}
                  onClick={() =>
                    handleSummaryClick(key)
                  }
                >
                  <div>
                    <span>{label}</span>
                    <strong>
                      {value}
                      <small>{unit}</small>
                    </strong>
                  </div>

                  <div className="summary-icon">
                    <Icon size={19} />
                  </div>

                  {expandable && (
                    <em className="summary-list-toggle">
                      {isExpanded
                        ? '목록 닫기 ▼'
                        : '목록 보기 ▲'}
                    </em>
                  )}
                </button>
              );
            }
          )}
        </section>

        {expandedStatus && (
          <section
            className={`expanded-workers panel ${expandedStatus}`}
          >
            <div className="panel-title-row">
              <div>
                <strong>
                  {labelMap[expandedStatus]} 작업자
                </strong>
                <span>
                  {expandedWorkers.length}명
                </span>
              </div>

              <button
                className="icon-btn expanded-close"
                onClick={() =>
                  setExpandedStatus('')
                }
                aria-label="목록 닫기"
              >
                <X size={16} />
              </button>
            </div>

            <div className="expanded-worker-grid">
              {expandedWorkers.map((worker) => (
                <WorkerCard
                  key={worker.id}
                  worker={worker}
                  compact
                />
              ))}
            </div>

            <div className="expanded-workers-footer">
              <button
                onClick={() =>
                  navigate(
                    `/workers?status=${expandedStatus}`
                  )
                }
              >
                {labelMap[expandedStatus]} 작업자
                전체보기
              </button>
            </div>
          </section>
        )}

        <div className="dashboard-grid">
          <section className="panel alert-panel">
            <div className="panel-title-row border-bottom">
              <div className="title-with-dot">
                <i className="red-dot" />
                <strong>실시간 이상 감지</strong>
                <span>
                  {hazardStreamConnected
                    ? `● 실시간 연결 · ${hazardCountLabel}`
                    : `재연결 중 · ${hazardCountLabel}`}
                </span>
              </div>

              <Link to="/detections">
                전체 보기 ›
              </Link>
            </div>

            <div className="alert-list">
              {recentHazards.length > 0 ? (
                recentHazards.map((item) => (
                  <div
                    className={`alert-row ${item.level}`}
                    key={item.id}
                  >
                    <div
                      className={`alert-symbol ${item.level}`}
                    >
                      <AlertTriangle size={18} />
                    </div>

                    <div className="alert-content">
                      <div className="alert-heading">
                        <StatusBadge
                          level={item.level}
                        >
                          {labelMap[item.level] ||
                            '주의'}
                        </StatusBadge>

                        <b>
                          {item.type ||
                            '이상 감지'}
                        </b>

                        <span>·</span>

                        <strong>
                          {item.name ||
                            '미확인 작업자'}
                        </strong>

                        <span className="zone-text">
                          ⌖ {item.zone || '-'}
                        </span>
                      </div>

                      <p>
                        {item.detailDescription ||
                          item.rawEvent?.description ||
                          item.statusLabel ||
                          '실제 서버에서 수신된 위험 이벤트입니다.'}
                      </p>
                    </div>

                    <time>
                      {item.time || '--:--'}
                    </time>

                    <Link
                      className="detail-btn"
                      to={detectionTarget(item)}
                    >
                      <Eye size={14} />
                      상세보기
                    </Link>
                  </div>
                ))
              ) : (
                <div
                  className="records-empty"
                  style={{ padding: 34 }}
                >
                  {hazardLoading
                    ? '실제 이상 감지 이벤트를 불러오는 중입니다.'
                    : '현재 서버에 저장된 이상 감지 이벤트가 없습니다.'}
                </div>
              )}
            </div>
          </section>

          <aside className="right-stack">
            <section className="panel zone-panel">
              <h3>
                현장 상태
                {(sensorLoading ||
                  hazardLoading) && (
                  <small
                    style={{
                      marginLeft: 8,
                      color: '#94a3b8',
                    }}
                  >
                    갱신 중
                  </small>
                )}
              </h3>

              {zones.length > 0 ? (
                zones.map((zone) => (
                  <div
                    key={zone.name}
                    className={`zone-card ${zone.level}`}
                  >
                    <b>
                      <i /> {zone.name}
                    </b>

                    <span>
                      <em>
                        정상 {zone.normal}
                      </em>

                      {zone.warning > 0 && (
                        <em>
                          주의 {zone.warning}
                        </em>
                      )}

                      {zone.danger > 0 && (
                        <em>
                          위험 {zone.danger}
                        </em>
                      )}
                    </span>
                  </div>
                ))
              ) : (
                <div className="records-empty">
                  작업자 구역 정보가 없습니다.
                </div>
              )}
            </section>

            <section className="panel risk-list-panel">
              <div className="panel-title-row border-bottom">
                <strong>주의·위험 작업자</strong>
                <Link to="/workers">전체</Link>
              </div>

              {riskyWorkers.length > 0 ? (
                riskyWorkers.map((worker) => (
                  <Link
                    to={`/workers/${encodeURIComponent(
                      worker.id
                    )}`}
                    key={worker.id}
                    className="risk-list-row"
                  >
                    <div className="mini-avatar">
                      {worker.profileImage ? (
                        <img
                          src={worker.profileImage}
                          alt=""
                        />
                      ) : (
                        worker.name.slice(0, 1)
                      )}
                    </div>

                    <div>
                      <div>
                        <strong>
                          {worker.name}
                        </strong>{' '}
                        <StatusBadge
                          level={worker.status}
                        >
                          {labelMap[
                            worker.status
                          ]}
                        </StatusBadge>
                      </div>

                      <p>
                        <HeartPulse size={12} />{' '}
                        {worker.heartRate || '-'}{' '}
                        <small>bpm</small>{' '}
                        <span>
                          {worker.zone}
                        </span>
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="records-empty">
                  현재 주의·위험 작업자가 없습니다.
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
    </>
  );
}
