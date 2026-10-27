import '../styles/dashboardSosLayout.css';
import {
  AlertTriangle,
  Eye,
  HeartPulse,
  ShieldAlert,
  ShieldCheck,
  Users,
  X,
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
  useNavigate,
} from 'react-router-dom';
import TopHeader from '../components/TopHeader';
import StatusBadge from '../components/StatusBadge';
import WorkerCard from '../components/WorkerCard';
import { useDetections } from '../context/DetectionContext';
import { useWorkers } from '../context/WorkerContext';
import { getSOSList, resolveSOSRequest } from '../api/sos';
import { getWorkerAlerts } from '../api/workerStatus';
import { getNotifications } from '../api/notifications';

const labelMap = {
  normal: '정상',
  warning: '주의',
  danger: '위험',
};

function detectionTarget(item) {
  if (item.source === 'sensor-alert') return `/sensor-fall/${encodeURIComponent(item.deviceId)}?recordedAt=${encodeURIComponent(item.occurredAt || '')}`;
  if (item.source === 'health-notification') return `/detections/health-notification/${encodeURIComponent(item.notificationId)}`;
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


function formatIncidentTime(value) {
  const date = new Date(value || 0);
  return Number.isFinite(date.getTime()) ? {
    time: date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
    dateLabel: date.toLocaleDateString('ko-KR'),
  } : { time: '--:--', dateLabel: '--' };
}
function extraSensorIncidents(alerts, workers) {
  const rows = Array.isArray(alerts) ? alerts : [];
  const result = [];
  for (const alert of [...rows].sort((a,b) => new Date(b.recordedAt || 0) - new Date(a.recordedAt || 0))) {
    const fallState = String(alert.fallState || '').toUpperCase();
    const posture = String(alert.posture || '').toUpperCase();
    if (!(['ACTION_REQUIRED','FALLING','FALLEN','UNCONSCIOUS'].includes(fallState)
      || ['STUMBLE','COLLAPSE'].includes(posture) || alert.fallDetected === true)) continue;
    if (result.some(existing => existing.deviceId === alert.deviceId &&
      Math.abs(new Date(existing.occurredAt) - new Date(alert.recordedAt)) < 120000)) continue;
    const worker = workers.find(w => String(w.deviceId || '').trim() === String(alert.deviceId || '').trim());
    result.push({
      id: 'sensor-fall-' + alert.deviceId + '-' + (alert.recordedAt || 'latest'),
      source: 'sensor-alert', category: 'fall', level: 'danger', type: '추락/쓰러짐',
      name: worker?.name || alert.deviceId || '미확인 작업자',
      zone: worker?.zone || '-', occurredAt: alert.recordedAt,
      ...formatIncidentTime(alert.recordedAt), deviceId: alert.deviceId,
      detailDescription: '헬멧 센서에서 추락 또는 자세 붕괴가 감지되었습니다.',
    });
  }
  return result;
}
function extraHealthIncidents(rows) {
  return (Array.isArray(rows) ? rows : []).filter(raw =>
    raw.hazardEventId == null && raw.sosId == null && String(raw.message || '').includes('건강 이상')
  ).map(raw => {
    const [name, zone] = String(raw.message || '').split(' · ');
    return {
      id: 'health-notification-' + raw.id, source: 'health-notification',
      notificationId: raw.id, category: 'health', level: 'warning',
      type: '건강 이상 감지', name: name || '미확인 작업자', zone: zone || '-',
      occurredAt: raw.sentAt, ...formatIncidentTime(raw.sentAt),
      detailDescription: raw.message || '작업자 건강 이상 알림',
    };
  });
}
function matchingServerIncident(record, events) {
  const timestamp = new Date(record.occurredAt || 0).getTime();
  return Number.isFinite(timestamp) && events.some(event =>
    event.source === 'server' && event.category === record.category &&
    event.name === record.name && record.name !== '미확인 작업자' &&
    Math.abs(new Date(event.occurredAt || 0).getTime() - timestamp) <= 120000
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

  const workersRef = useRef(workers);
  workersRef.current = workers;
  const rightStackRef = useRef(null);
  const alertHeaderRef = useRef(null);
  const alertListRef = useRef(null);
  const [visibleAlertCount, setVisibleAlertCount] = useState(5);

  const [expandedStatus, setExpandedStatus] =
    useState('');

  const [sosList, setSosList] = useState([]);
  const [sosError, setSosError] = useState('');
  const [extraIncidents, setExtraIncidents] = useState([]);
  const [dashboardUpdatedAt, setDashboardUpdatedAt] = useState(null);

  const navigate = useNavigate();


  const handleResolve = async (sosId) => {
    if (!window.confirm('정말 SOS 경고를 끄시겠습니까?')) return;
    try {
      await resolveSOSRequest(sosId);
      setSosList((prev) => prev.filter((s) => (s.sosId ?? s.id) !== sosId));
      const refreshed = await getSOSList('REQUESTED');
      if (Array.isArray(refreshed)) setSosList(refreshed);
    } catch (e) {
      alert(e.message || '처리 중 오류가 발생했습니다.');
    }
  };

  // Worker summary reflects the latest worker/sensor API status, not historical unresolved incidents.
  const attentionWorkers = workers;
  const riskyWorkers = attentionWorkers.filter(
    (worker) => worker.status !== 'normal'
  );

  const counts = attentionWorkers.reduce(
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
      [...detections, ...extraIncidents.filter(item => !matchingServerIncident(item, detections))]
        .sort(
          (a, b) =>
            new Date(b.occurredAt || 0).getTime() -
            new Date(a.occurredAt || 0).getTime()
        )
        .slice(0, visibleAlertCount),
    [detections, extraIncidents, visibleAlertCount]
  );

  const zones = useMemo(
    () => zoneState(attentionWorkers),
    [attentionWorkers]
  );

  // Match the real-time incident list to the height of the right-side panels.
  useEffect(() => {
    const side = rightStackRef.current;
    if (!side) return;
    const measure = () => {
      const available = side.getBoundingClientRect().height
        - (alertHeaderRef.current?.getBoundingClientRect().height || 54);
      const firstRow = alertListRef.current?.querySelector('.alert-row');
      const rowHeight = firstRow?.getBoundingClientRect().height || 98;
      const count = Math.max(1, Math.min(100, Math.floor(Math.max(0, available) / Math.max(1, rowHeight))));
      setVisibleAlertCount(prev => prev === count ? prev : count);
    };
    measure();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    observer?.observe(side);
    if (alertHeaderRef.current) observer?.observe(alertHeaderRef.current);
    window.addEventListener('resize', measure);
    return () => { observer?.disconnect(); window.removeEventListener('resize', measure); };
  }, [sosList.length, riskyWorkers.length, zones.length]);

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
    ? attentionWorkers.filter(
        (worker) => worker.status === expandedStatus
      )
    : [];

  const refreshDashboard = useCallback(async () => {
    const results = await Promise.allSettled([
      refreshWorkerStatuses(),
      refreshHazardEvents(),
      Promise.allSettled([getWorkerAlerts(), getNotifications({ recipientType: 'MANAGER', page: 0, size: 100 })]).then(([fall, health]) => {
        if (fall.status === 'rejected' && health.status === 'rejected') throw new Error('추가 감지 데이터 조회 실패');
        setExtraIncidents([
          ...extraSensorIncidents(fall.status === 'fulfilled' ? fall.value : [], workersRef.current),
          ...extraHealthIncidents(health.status === 'fulfilled' ? health.value : []),
        ]);
      }),
      getSOSList('REQUESTED').then(rows => {
        if (!Array.isArray(rows)) throw new Error('SOS 응답 형식이 올바르지 않습니다.');
        setSosList(rows);
        setSosError('');
      }).catch(error => {
        setSosError(error?.message || 'SOS 조회 실패');
        throw error;
      }),
    ]);
    if (results.every(result => result.status === 'rejected')) {
      throw new Error('홈 데이터를 갱신하지 못했습니다. 서버 연결을 확인해 주세요.');
    }
    setDashboardUpdatedAt(new Date());
  }, [refreshWorkerStatuses, refreshHazardEvents]);

  // Dashboard owns its refresh cadence: refresh every visible data section,
  // not just the zone/worker card, without resetting the current page.
  useEffect(() => {
    refreshDashboard().catch(() => {});
    const timer = window.setInterval(() => {
      if (!document.hidden) refreshDashboard().catch(() => {});
    }, 5000);
    const onFocus = () => refreshDashboard().catch(() => {});
    const onVisible = () => { if (!document.hidden) onFocus(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refreshDashboard]);

  const hazardCountLabel = hazardSummary
    ? `외부요인 ${hazardSummary.external ?? 0} · 건강 ${
        hazardSummary.health ?? 0
      } · 추락 ${hazardSummary.fall ?? 0}`
    : `전체 ${detections.length}건`;

  // SSE is an optional fast path; background API polling remains active every five seconds.
  const hazardConnectionLabel = hazardStreamConnected ? '실시간 연결' : '5초 간격 서버 갱신';

  return (
    <>
      <TopHeader
        title="통합 모니터링"
        subtitle="현장 전체 실시간 현황"
        onRefresh={refreshDashboard}
        dataUpdatedAt={dashboardUpdatedAt}
      />

      <div className="page-body dashboard-page">
        {(sensorError || hazardError || sosError) && (
          <div className="worker-filter-banner danger">
            <span>
              {[
                sensorError
                  ? `작업자 상태: ${sensorError}`
                  : '',
                hazardError
                  ? `이상 감지: ${hazardError}`
                  : '',
                sosError ? `SOS: ${sosError}` : '',
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
                  {`${hazardConnectionLabel} · ${hazardCountLabel}`}
                </span>
              </div>

              <Link to="/detections">
                전체 보기 ›
              </Link>
            </div>

            <div className="alert-list" ref={alertListRef}>
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

          <aside className="right-stack" ref={rightStackRef}>
            {(sosList.length > 0 || sosError) && (
              <section className="panel sos-panel dashboard-sos-list">
                <div className="panel-title-row border-bottom">
                  <div className="title-with-dot"><i className="red-dot"/><strong><ShieldAlert size={15}/> SOS 미처리</strong><span>{sosList.length}건</span></div>
                </div>
                {sosError && <p className="dashboard-sos-error">SOS 조회 실패 · {sosError}</p>}
                {sosList.map((s) => (
                  <div key={s.sosId ?? s.id} className="sos-row">
                    <div className="sos-row-info">
                      <strong>{s.requesterName || s.loginId || '작업자'}</strong>
                      <span>{s.zoneName || '위치 확인 중'}</span>
                      <small>{s.createdAt ? new Date(s.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }) : ''}</small>
                    </div>
                    <button className="sos-resolve-btn" onClick={() => handleResolve(s.sosId ?? s.id)}>처리완료</button>
                  </div>
                ))}
              </section>
            )}
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
