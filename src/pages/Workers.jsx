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
import {
  createWorker,
  getWorkers,
  uiStatusToServer,
} from '../api/workers';
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

function sameWorker(
  serverWorker,
  liveWorker
) {
  return Boolean(
    serverWorker &&
      liveWorker &&
      (
        String(
          serverWorker.id || ''
        ) ===
          String(
            liveWorker.id || ''
          ) ||
        (
          serverWorker.employeeNumber &&
          String(
            serverWorker.employeeNumber
          ) ===
            String(
              liveWorker.employeeNumber ||
                liveWorker.workerCode ||
                ''
            )
        ) ||
        (
          serverWorker.deviceId &&
          String(
            serverWorker.deviceId
          ) ===
            String(
              liveWorker.deviceId ||
                ''
            )
        ) ||
        (
          serverWorker.helmetId &&
          String(
            serverWorker.helmetId
          ) ===
            String(
              liveWorker.helmetId ||
                ''
            )
        )
      )
  );
}

function hasMeaningfulValue(value) {
  const normalized = String(value ?? '').trim();

  return Boolean(
    normalized &&
      normalized !== '-' &&
      normalized !== '위치 미확인' &&
      normalized !== '미확인'
  );
}

function preferServerValue(serverValue, liveValue) {
  return hasMeaningfulValue(serverValue)
    ? serverValue
    : liveValue;
}

function mergeLiveWorker(
  serverWorker,
  liveWorker
) {
  if (!liveWorker) {
    return serverWorker;
  }

  const hasLiveRealtimeData =
    liveWorker.serverDataConnected === true ||
    liveWorker.heatRiskDataConnected === true ||
    liveWorker.sensorConnected === true ||
    Boolean(liveWorker.recordedAt);

  return {
    ...liveWorker,
    ...serverWorker,

    // 관리용 작업자 정보는 서버값을 우선하되,
    // 서버에 아직 헬멧/위치 연결값이 없으면
    // 기존 실시간 작업자 매핑값을 유지합니다.
    id:
      serverWorker.id ||
      liveWorker.id,
    name:
      serverWorker.name ||
      liveWorker.name,
    employeeNumber:
      serverWorker.employeeNumber ||
      liveWorker.employeeNumber ||
      liveWorker.workerCode,
    workerCode:
      serverWorker.workerCode ||
      liveWorker.workerCode ||
      liveWorker.employeeNumber,
    phone:
      serverWorker.phone ||
      liveWorker.phone,
    zone:
      preferServerValue(
        serverWorker.zone,
        liveWorker.zone
      ),
    zoneCode:
      serverWorker.zoneCode ||
      liveWorker.zoneCode,
    helmetId:
      preferServerValue(
        serverWorker.helmetId,
        liveWorker.helmetId
      ),
    helmetNo:
      preferServerValue(
        serverWorker.helmetNo,
        liveWorker.helmetNo
      ),
    deviceId:
      preferServerValue(
        serverWorker.deviceId,
        liveWorker.deviceId
      ),

    profileImage:
      liveWorker.profileImage ||
      serverWorker.profileImage,

    // 센서/건강 값은 실시간 API로 연결된 값이 있으면
    // 관리 API의 기본 NORMAL 값보다 우선합니다.
    status:
      hasLiveRealtimeData
        ? liveWorker.status
        : serverWorker.status,
    issue:
      hasLiveRealtimeData
        ? liveWorker.issue
        : serverWorker.issue,

    heartRate:
      hasLiveRealtimeData
        ? liveWorker.heartRate ??
          serverWorker.heartRate ??
          null
        : serverWorker.heartRate ??
          liveWorker.heartRate ??
          null,
    spo2:
      hasLiveRealtimeData
        ? liveWorker.spo2 ??
          serverWorker.spo2 ??
          null
        : serverWorker.spo2 ??
          liveWorker.spo2 ??
          null,
    hrv:
      liveWorker.hrv ??
      serverWorker.hrv ??
      null,

    fatigue:
      liveWorker.fatigue ??
      serverWorker.fatigue ??
      1,
    fatigueAbnormal:
      liveWorker.fatigueAbnormal ??
      serverWorker.fatigueAbnormal ??
      null,
    heatRiskAbnormal:
      liveWorker.heatRiskAbnormal ??
      serverWorker.heatRiskAbnormal ??
      null,
    externalHeatWarning:
      liveWorker.externalHeatWarning ??
      serverWorker.externalHeatWarning ??
      null,
    heatRiskLevel:
      liveWorker.heatRiskLevel ||
      serverWorker.heatRiskLevel ||
      '',
    heatRiskDataConnected:
      liveWorker.heatRiskDataConnected === true ||
      serverWorker.heatRiskDataConnected === true,

    posture:
      liveWorker.posture ||
      serverWorker.posture ||
      '',
    postureAbnormal:
      liveWorker.postureAbnormal ??
      serverWorker.postureAbnormal ??
      false,
    fallState:
      liveWorker.fallState ??
      serverWorker.fallState,
    healthState:
      liveWorker.healthState ??
      serverWorker.healthState,
    fallConfidence:
      liveWorker.fallConfidence ??
      serverWorker.fallConfidence,

    recordedAt:
      liveWorker.recordedAt ??
      serverWorker.recordedAt,
    serverDataConnected:
      liveWorker.serverDataConnected === true ||
      Boolean(serverWorker.recordedAt),
    sensorConnected:
      liveWorker.sensorConnected === true ||
      serverWorker.sensorConnected === true,
  };
}

export default function Workers() {
  const {
    workers: liveWorkers,
    refreshWorkerStatuses,
    sensorApiConnected,
    heatRiskApiConnected,
    workerError:
      sensorError,
  } = useWorkers();

  const [serverWorkers, setServerWorkers] =
    useState([]);

  const [search, setSearch] =
    useState('');

  const [addOpen, setAddOpen] =
    useState(false);

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

  const [loading, setLoading] =
    useState(false);

  const [apiError, setApiError] =
    useState('');

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

  const loadWorkers =
    useCallback(async () => {
      setLoading(true);
      setApiError('');

      try {
        const result =
          await getWorkers({
            q:
              search.trim() ||
              undefined,
            status:
              statusFilter === 'all'
                ? undefined
                : uiStatusToServer(
                    statusFilter
                  ),
            page: 0,
            size: 100,
          });

        setServerWorkers(
          result.content
        );

        return result.content;
      } catch (error) {
        console.error(
          '작업자 관리 API 조회 실패:',
          error
        );

        setApiError(
          error?.message ||
            '작업자 목록을 불러오지 못했습니다.'
        );

        return [];
      } finally {
        setLoading(false);
      }
    }, [
      search,
      statusFilter,
    ]);

  useEffect(() => {
    const timer =
      window.setTimeout(
        loadWorkers,
        250
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [loadWorkers]);

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
        loadWorkers(),
        refreshWorkerStatuses?.(),
        loadWeather(),
      ]);
    };

  const workers =
    useMemo(
      () =>
        serverWorkers
          .map(
            (serverWorker) => {
              const live =
                liveWorkers.find(
                  (liveWorker) =>
                    sameWorker(
                      serverWorker,
                      liveWorker
                    )
                );

              return applySavedWorkerProfileImage(
                mergeLiveWorker(
                  serverWorker,
                  live
                )
              );
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
        serverWorkers,
        liveWorkers,
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

  const handleAddWorker =
    async (payload) => {
      await createWorker(
        payload
      );

      await loadWorkers();

      await refreshWorkerStatuses?.();
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
                      ? `${weather.apparentTemperature}℃`
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

        {(loading ||
          apiError ||
          sensorError) && (
          <div
            className={`worker-filter-banner ${
              apiError ||
              sensorError
                ? 'danger'
                : 'normal'
            }`}
          >
            <span>
              {loading
                ? '작업자 관리 API에서 목록을 불러오는 중입니다.'
                : `작업자 API 연동 확인 필요: ${
                    apiError ||
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
        onAdd={
          handleAddWorker
        }
      />
    </>
  );
}
