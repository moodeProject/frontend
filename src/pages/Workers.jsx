import { statusWithOpenIncidents } from '../utils/workerIncidentStatus';
import {
  Plus,
  Search,
  ThermometerSun,
  X,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  useSearchParams,
} from 'react-router-dom';
import AddWorkerModal from '../components/AddWorkerModal';
import TopHeader from '../components/TopHeader';
import WorkerCard from '../components/WorkerCard';
import { useWorkers } from '../context/WorkerContext';
import { useDetections } from '../context/DetectionContext';
import {
  createWorker,
} from '../api/workers';
import { getHelmets, assignHelmet } from '../api/helmets';
import {
  getWeatherHeatRisk,
} from '../api/weather';
import {
  applySavedWorkerProfileImage,
} from '../utils/workerProfileImageStorage';
import '../styles/workerPersonalHeatRisk.css';

const STATUS_ORDER = {
  danger: 0,
  warning: 1,
  normal: 2,
};

const STATUS_LABEL = {
  danger: '위험',
  warning: '주의',
  normal: '정상',
};

function weatherTone(level) {
  const value =
    String(
      level || ''
    ).toUpperCase();

  if (
    !value ||
    value === 'NORMAL'
  ) {
    return 'normal';
  }

  if (
    value.includes('DANGER') ||
    value.includes('HIGH')
  ) {
    return 'danger';
  }

  return 'warning';
}

export default function Workers() {
  const { detections } = useDetections();
  const {
    workers: liveWorkers,
    refreshWorkerStatuses,
    sensorApiConnected,
    heatRiskApiConnected,
    workerError:
      sensorError,
    workerLoading: loading,
  } = useWorkers();

  const [search, setSearch] =
    useState('');

  const [addOpen, setAddOpen] =
    useState(false);
  const [availableHelmets, setAvailableHelmets] = useState([]);
  const [helmetOptionsError, setHelmetOptionsError] = useState('');
  const [addWarning, setAddWarning] = useState('');

  useEffect(() => {
    if (!addOpen) return;
    let alive = true;
    setHelmetOptionsError('');
    getHelmets().then(rows => {
      if (!alive) return;
      const values = Array.isArray(rows) ? rows : (rows?.content || rows?.items || []);
      setAvailableHelmets(values.filter(h => h?.workerId == null));
    }).catch(error => {
      if (alive) { setAvailableHelmets([]); setHelmetOptionsError(error?.message || '헬멧 목록을 불러오지 못했습니다.'); }
    });
    return () => { alive = false; };
  }, [addOpen]);

  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  const [weather, setWeather] =
    useState(null);

  const [
    weatherError,
    setWeatherError,
  ] = useState('');

  const statusFilter =
    searchParams.get('status') ||
    'all';

  const loadWeather =
    useCallback(async () => {
      try {
        const data =
          await getWeatherHeatRisk();

        setWeather(data);
        setWeatherError('');

        return data;
      } catch (error) {
        console.error(
          '현장 온열위험 조회 실패:',
          error
        );

        setWeatherError(
          error?.message ||
            '기상 API 조회 실패'
        );

        return null;
      }
    }, []);

  useEffect(() => {
    loadWeather();

    const timer =
      window.setInterval(
        loadWeather,
        60_000
      );

    return () =>
      window.clearInterval(
        timer
      );
  }, [loadWeather]);

  const refreshPage =
    async () => {
      await Promise.allSettled([
        refreshWorkerStatuses?.(),
        loadWeather(),
      ]);
    };

  const workers =
    useMemo(
      () =>
        liveWorkers
          .map(worker => statusWithOpenIncidents(worker, detections))
          .filter(worker => !search.trim() || `${worker.name} ${worker.employeeNumber}`.toLowerCase().includes(search.trim().toLowerCase()))
          .filter(worker => statusFilter === 'all' || worker.status === statusFilter)
          .map(
            (serverWorker) => {
              return applySavedWorkerProfileImage(serverWorker);
            }
          )
          .map(
            (worker, index) => ({
              worker,
              index,
            })
          )
          .sort(
            (a, b) =>
              (
                STATUS_ORDER[
                  a.worker.status
                ] ?? 99
              ) -
                (
                  STATUS_ORDER[
                    b.worker.status
                  ] ?? 99
                ) ||
              a.index - b.index
          )
          .map(
            ({ worker }) =>
              worker
          ),
      [
        liveWorkers,
        detections,
        search,
        statusFilter,
      ]
    );

  const counts =
    workers.reduce(
      (acc, worker) => ({
        ...acc,
        [worker.status]:
          (
            acc[
              worker.status
            ] || 0
          ) + 1,
      }),
      {}
    );

  const weatherLevel =
    weather?.heatRiskLevel ||
    '';

  const weatherClass =
    weatherTone(
      weatherLevel
    );

  const handleAddWorker = async (payload) => {
    setAddWarning('');
    // Backend POST /api/workers with helmetNo creates a NEW helmet.
    // Existing helmets must be assigned through POST /api/helmets/{id}/assign.
    const { helmetId, ...workerFields } = payload;
    const created = await createWorker(workerFields);
    if (helmetId) {
      try {
        await assignHelmet(helmetId, created.id);
      } catch (error) {
        setAddWarning(`작업자는 서버에 등록되었지만 헬멧 배정은 실패했습니다: ${error?.message || '배정 실패'}. 헬멧 관리에서 다시 배정해주세요.`);
      }
    }
    await refreshWorkerStatuses?.().catch(() => {});
  };

  return (
    <>
      <TopHeader
        title="작업자 상태"
        subtitle="전체 작업자 현황"
        onRefresh={
          refreshPage
        }
      />

      <div className="page-body workers-page">
        <div className="worker-toolbar">
          <div className="search-box">
            <Search size={15} />

            <input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="작업자 이름 또는 사번 검색"
            />
          </div>

          <div className="worker-count">
            <b>
              {workers.length}명
            </b>
            {' '}
            등록 중 ·{' '}

            <span className="red">
              위험{' '}
              {counts.danger ||
                0}
            </span>{' '}

            <span className="orange">
              주의{' '}
              {counts.warning ||
                0}
            </span>{' '}

            <span className="green">
              정상{' '}
              {counts.normal ||
                0}
            </span>

            {' · '}

            <span
              className={
                sensorApiConnected
                  ? 'green'
                  : 'orange'
              }
            >
              센서 API{' '}
              {sensorApiConnected
                ? '연결'
                : '대기'}
            </span>

            {' · '}

            <span
              className={
                heatRiskApiConnected
                  ? 'green'
                  : 'orange'
              }
            >
              건강 API{' '}
              {heatRiskApiConnected
                ? '연결'
                : '대기'}
            </span>
          </div>

          <button
            className="primary-btn"
            onClick={() =>
              setAddOpen(true)
            }
          >
            <Plus size={17} />
            작업자 추가
          </button>
        </div>

        {(weather ||
          weatherError) && (
          <div
            className={`worker-filter-banner ${
              weatherError
                ? 'danger'
                : weatherClass
            }`}
          >
            <span
              style={{
                display: 'flex',
                alignItems:
                  'center',
                gap: 8,
              }}
            >
              <ThermometerSun
                size={15}
              />

              {weatherError ? (
                <>
                  현장 기상 API
                  연동 확인 필요:{' '}
                  {weatherError}
                </>
              ) : (
                <>
                  현장 체감온도{' '}
                  <b>
                    {weather?.apparentTemperature !=
                    null
                      ? `${Number(weather.apparentTemperature).toFixed(1)}℃`
                      : '-'}
                  </b>
                  {' · '}
                  온열질환 위험도{' '}
                  <b>
                    {weatherLevel ||
                      'NORMAL'}
                  </b>
                </>
              )}
            </span>
          </div>
        )}

        {addWarning && <div className="worker-filter-banner warning"><span>{addWarning}</span></div>}

        {(loading ||
          sensorError) && (
          <div
            className={`worker-filter-banner ${
              sensorError
                ? 'danger'
                : 'normal'
            }`}
          >
            <span>
              {loading
                ? '작업자 관리 API에서 목록을 불러오는 중입니다.'
                : `작업자 API 연동 확인 필요: ${
                    sensorError
                  }`}
            </span>
          </div>
        )}

        {statusFilter !==
          'all' && (
          <div
            className={`worker-filter-banner ${statusFilter}`}
          >
            <span>
              {
                STATUS_LABEL[
                  statusFilter
                ]
              }{' '}
              작업자만 표시 중
            </span>

            <button
              type="button"
              onClick={() =>
                setSearchParams(
                  {}
                )
              }
            >
              <X size={13} />
              필터 해제
            </button>
          </div>
        )}

        <section className="workers-grid">
          {workers.map(
            (worker) => (
              <WorkerCard
                key={worker.id}
                worker={worker}
              />
            )
          )}
        </section>

        {workers.length === 0 && (
          <div className="empty-workers">
            {loading
              ? '작업자 정보를 불러오는 중입니다.'
              : '검색 결과가 없습니다.'}
          </div>
        )}
      </div>

      <AddWorkerModal
        open={addOpen}
        onClose={() =>
          setAddOpen(false)
        }
        onAdd={handleAddWorker}
        availableHelmets={availableHelmets}
        helmetOptionsError={helmetOptionsError}
      />
    </>
  );
}
