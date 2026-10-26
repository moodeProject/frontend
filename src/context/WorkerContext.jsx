import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getWorkers } from '../api/workers';
import { getHelmets, getHelmetsStatus } from '../api/helmets';
import { bindWorkerHelmet, measuredStatus } from '../utils/workerSensorBinding';
import {
  getAllWorkerHeatRisk,
  getAllWorkerStatuses,
} from '../api/workerStatus';
import { getDefaultWorkerProfile } from '../utils/defaultWorkerProfiles';

const initialWorkers = [];
const WorkerContext = createContext(null);
const STORAGE_KEY = 'safehelmet-workers-v3';
const SENSOR_REFRESH_MS = 5_000;
const SENSOR_FRESH_MS = 30_000;

function isFreshMeasurement(record) {
  if (!record?.recordedAt) return false;
  const stamp = new Date(record.recordedAt).getTime();
  return Number.isFinite(stamp) && Date.now() - stamp >= -30_000 && Date.now() - stamp < SENSOR_FRESH_MS;
}

function optionalNumber(value, minExclusive = -Infinity) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number > minExclusive ? number : null;
}


function text(value) {
  return value === undefined || value === null ? '' : String(value);
}

function deriveDeviceId(worker) {
  return text(worker?.deviceId || worker?.helmet?.deviceId).trim();
}

function deriveHelmetId(worker) {
  const helmet = worker?.helmet;
  const candidate =
    worker?.helmetId ||
    worker?.helmetNo ||
    worker?.helmetNumber ||
    helmet?.helmetNo ||
    helmet?.helmetNumber ||
    helmet?.id ||
    '';

  return text(candidate);
}

function readZone(worker) {
  const zone = worker?.zone;

  return {
    name:
      (typeof zone === 'object' ? zone?.name : zone) ||
      worker?.zoneName ||
      worker?.workZone ||
      worker?.detailLocation ||
      '',
    code:
      (typeof zone === 'object' ? zone?.code : '') ||
      worker?.zoneCode ||
      worker?.zoneId ||
      '',
    id:
      (typeof zone === 'object' ? zone?.id : null) ??
      worker?.zoneDbId ??
      null,
  };
}

function isUserUploadedProfile(value) {
  const src = text(value);
  return src.startsWith('data:') || src.startsWith('blob:');
}

function normalizeWorker(worker) {
  const helmetId = deriveHelmetId(worker);
  const deviceId = deriveDeviceId({ ...worker, helmetId });
  const zone = readZone(worker);
  const defaultProfile = getDefaultWorkerProfile({ ...worker, helmetId });
  const currentProfile = worker?.profileImage || worker?.profileUrl || '';

  const idCandidate =
    worker?.id ??
    worker?.workerId ??
    worker?.userId ??
    worker?.employeeNo ??
    worker?.employeeNumber ??
    worker?.workerCode ??
    helmetId ??
    deviceId;

  return {
    ...worker,
    id: text(idCandidate || deviceId || helmetId),
    name: worker?.name || worker?.workerName || '이름 미등록',
    employeeNumber:
      worker?.employeeNumber ||
      worker?.employeeNo ||
      worker?.workerCode ||
      '',
    workerCode:
      worker?.workerCode ||
      worker?.employeeNo ||
      worker?.employeeNumber ||
      '',
    phone: worker?.phone || worker?.phoneNumber || '',
    helmetId,
    deviceId,
    zone: zone.name || '위치 미확인',
    detailLocation:
      worker?.detailLocation || zone.name || '위치 미확인',
    zoneCode: zone.code || worker?.zoneCode || null,
    zoneDbId: zone.id,
    status:
      ['normal', 'warning', 'danger'].includes(worker?.status)
        ? worker.status
        : 'normal',
    issue: worker?.issue || worker?.statusMessage || '센서 데이터 대기',
    fatigue: worker?.fatigue ?? null,
    profileImage: isUserUploadedProfile(currentProfile)
      ? currentProfile
      : currentProfile || defaultProfile,
    serverDataConnected:
      worker?.serverDataConnected === true || Boolean(worker?.recordedAt),
    heatRiskDataConnected: worker?.heatRiskDataConnected === true,
    sensorConnected: worker?.sensorConnected === true,
    posture: worker?.posture || '',
    postureAbnormal: worker?.postureAbnormal === true,
    fatigueAbnormal:
      worker?.fatigueAbnormal === undefined || worker?.fatigueAbnormal === null
        ? null
        : isTrue(worker.fatigueAbnormal),
    heatRiskAbnormal:
      worker?.heatRiskAbnormal === undefined || worker?.heatRiskAbnormal === null
        ? null
        : isTrue(worker.heatRiskAbnormal),
    externalHeatWarning:
      worker?.externalHeatWarning === undefined || worker?.externalHeatWarning === null
        ? null
        : isTrue(worker.externalHeatWarning),
    hrv:
      worker?.hrv === undefined || worker?.hrv === null
        ? null
        : Number(worker.hrv),
    heatRiskLevel: worker?.heatRiskLevel || '',
  };
}

function isNormalState(value) {
  const normalized = text(value).toUpperCase();
  return normalized === 'NORMAL';
}

function isTrue(value) {
  return value === true || text(value).toLowerCase() === 'true';
}

function isHeatLevelAbnormal(value) {
  const level = text(value).toUpperCase();
  return Boolean(level) && level !== 'NORMAL';
}

function mergeWorkerStatus(worker, sensor, heatRisk) {
  const base = normalizeWorker(worker);

  if (!sensor && !heatRisk) {
    return normalizeWorker({
      ...base,
      recordedAt: null,
      heartRate: null,
      spo2: null,
      fatigue: null,
      serverDataConnected: false,
      heatRiskDataConnected: false,
      sensorConnected: false,
      posture: '',
      postureAbnormal: false,
      issue: '센서 데이터 대기',
      fatigueAbnormal: null,
      heatRiskAbnormal: null,
      externalHeatWarning: null,
      heatRiskLevel: '',
      hrv: null,
      fallState: null,
      healthState: null,
      fallConfidence: null,
      ax: null, ay: null, az: null, gx: null, gy: null, gz: null,
      status: 'normal',
    });
  }

  const fallAbnormal = Boolean(sensor && ((sensor.fallState != null && String(sensor.fallState).trim() !== '' && !isNormalState(sensor.fallState)) || isTrue(sensor.fallDetected)));
  const healthStateAbnormal = Boolean(sensor && ((sensor.healthState != null && String(sensor.healthState).trim() !== '' && !isNormalState(sensor.healthState)) || isTrue(sensor.healthAbnormal) || isTrue(sensor.heartRiskAbnormal)));
  const posture = text(sensor?.posture).toUpperCase();
  const postureAbnormal = isTrue(sensor?.postureAbnormal);

  const fatigueAbnormal = isTrue(
    heatRisk?.fatigueAbnormal ??
      sensor?.fatigueAbnormal ??
      null
  );

  const heatRiskAbnormal = isTrue(
    heatRisk?.heatRiskAbnormal ??
      sensor?.heatRiskAbnormal ??
      null
  );

  const externalHeatWarning = isTrue(
    heatRisk?.externalHeatWarning
  );

  const heatRiskLevel =
    heatRisk?.heatRiskLevel || '';

  const heatLevelAbnormal = isHeatLevelAbnormal(heatRiskLevel);

  let status = 'normal';
  let issue = sensor || heatRisk ? '정상 작업 중' : '센서 데이터 대기';

  if (fallAbnormal) {
    status = 'danger';
    issue = '추락 감지됨';
  } else if (postureAbnormal && posture === 'COLLAPSE') {
    status = 'danger';
    issue = '쓰러짐 감지';
  } else if (
    heatRiskAbnormal ||
    externalHeatWarning ||
    heatLevelAbnormal
  ) {
    status = 'warning';
    issue = heatRiskLevel
      ? `온열질환 위험 · ${heatRiskLevel}`
      : '온열질환 위험 감지';
  } else if (fatigueAbnormal) {
    status = 'warning';
    issue = '피로도 이상 감지';
  } else if (healthStateAbnormal) {
    status = 'warning';
    issue = `건강 이상 · ${sensor?.healthState || '확인 필요'}`;
  } else if (postureAbnormal) {
    status = 'warning';
    issue =
      posture === 'STUMBLE'
        ? '휘청거림 감지'
        : `자세 이상 · ${posture || 'UNKNOWN'}`;
  }

  const heartRate = optionalNumber(sensor?.heartRate ?? heatRisk?.heartRate, 0);
  const spo2 = optionalNumber(sensor?.spo2 ?? heatRisk?.spo2, 0);
  const hrv = optionalNumber(sensor?.hrv ?? heatRisk?.hrv, 0);
  const sensorZone = readZone(sensor || {});

  return normalizeWorker({
    ...base,
    deviceId: sensor?.deviceId || heatRisk?.deviceId || base.deviceId,
    status,
    issue,
    fatigue: typeof (heatRisk?.fatigueAbnormal ?? sensor?.fatigueAbnormal) === 'boolean' ? (fatigueAbnormal ? 2 : 1) : null,
    heartRate:
      heartRate,
    spo2,
    hrv,
    fatigueAbnormal,
    heatRiskAbnormal,
    externalHeatWarning,
    heatRiskLevel,
    fallState: sensor?.fallState ?? (sensor?.fallDetected === true ? 'DANGER' : null),
    healthState: sensor?.healthState ?? null,
    fallConfidence: sensor?.fallConfidence ?? null,
    posture: sensor?.posture ?? null,
    postureAbnormal:
      sensor?.postureAbnormal ?? false,
    recordedAt:
      sensor?.recordedAt ?? heatRisk?.recordedAt ?? null,
    zone: sensorZone.name || base.zone,
    zoneCode: sensorZone.code || sensor?.zoneId || base.zoneCode || null,
    zoneDbId: sensorZone.id ?? base.zoneDbId ?? null,
    ax: sensor?.ax ?? null,
    ay: sensor?.ay ?? null,
    az: sensor?.az ?? null,
    gx: sensor?.gx ?? null,
    gy: sensor?.gy ?? null,
    gz: sensor?.gz ?? null,
    sensorConnected: isFreshMeasurement(sensor),
    serverDataConnected: isFreshMeasurement(sensor),
    heatRiskDataConnected: isFreshMeasurement(heatRisk),
  });
}

export function WorkerProvider({ children }) {
  const [workers, setWorkers] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const source = saved ? JSON.parse(saved) : initialWorkers;
      return source.map(worker => mergeWorkerStatus({ ...worker, recordedAt: null }, null, null));
    } catch {
      return initialWorkers.map(normalizeWorker);
    }
  });

  const [sensorLoading, setSensorLoading] = useState(false);
  const [sensorError, setSensorError] = useState('');
  const [sensorApiConnected, setSensorApiConnected] = useState(false);
  const [heatRiskApiConnected, setHeatRiskApiConnected] = useState(false);
  const [lastSensorUpdated, setLastSensorUpdated] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workers));
  }, [workers]);

  const refreshSequence = useRef(0);
  const refreshWorkerStatuses = useCallback(async () => {
    const sequence = ++refreshSequence.current;
    setSensorLoading(true);
    setSensorError('');

    const [statusResult, heatResult, workerResult, helmetResult, helmetStatusResult] = await Promise.allSettled([
      getAllWorkerStatuses(),
      getAllWorkerHeatRisk(),
      getWorkers({ size: 100 }),
      getHelmets(),
      getHelmetsStatus(),
    ]);

    if (sequence !== refreshSequence.current) return;

    const statuses =
      statusResult.status === 'fulfilled' ? statusResult.value : [];
    const heatStatuses =
      heatResult.status === 'fulfilled' ? heatResult.value : [];

    setSensorApiConnected(statusResult.status === 'fulfilled');
    setHeatRiskApiConnected(heatResult.status === 'fulfilled');

    const errors = [];
    for (const [result, label] of [[workerResult, '작업자 목록'], [helmetResult, '헬멧 배정']]) {
      if (result.status === 'rejected') errors.push(`${label} 조회 실패: ${result.reason?.message || ''}`);
    }
    if (statusResult.status === 'rejected') {
      console.error('작업자 센서 상태 조회 실패:', statusResult.reason);
      errors.push(
        statusResult.reason?.message || '센서 상태 API 조회 실패'
      );
    }
    if (heatResult.status === 'rejected') {
      console.error('작업자 온열/피로도 조회 실패:', heatResult.reason);
      errors.push(
        heatResult.reason?.message || '온열/피로도 API 조회 실패'
      );
    }

    setSensorError(errors.join(' / '));

    const sensorMap = new Map(
      statuses
        .filter((item) => item?.deviceId)
        .map((item) => [text(item.deviceId), item])
    );

    const heatMap = new Map(
      heatStatuses
        .filter((item) => item?.deviceId)
        .map((item) => [text(item.deviceId), item])
    );

    // Use server-provided worker and helmet assignments.
    const helmetStatuses = helmetStatusResult.status === 'fulfilled'
      ? helmetStatusResult.value : [];
    const helmetRows = helmetResult.status === 'fulfilled'
      ? helmetResult.value : helmetStatuses;

    setWorkers((previous) => {
      if (workerResult.status !== 'fulfilled') {
        return previous.map(worker =>
          mergeWorkerStatus(
            { ...worker, recordedAt: null },
            null,
            null
          )
        );
      }

      return workerResult.value.content.map(worker => {
        const saved = previous.find(
          item => text(item.id) === text(worker.id)
        );

        const bound = bindWorkerHelmet(worker, helmetRows);

        const sensor = measuredStatus(
          sensorMap.get(bound.deviceId)
        );

        const heat = measuredStatus(
          heatMap.get(bound.deviceId)
        );

        const latest =
          sensor && isFreshMeasurement(sensor)
            ? sensor
            : null;

        const latestHeat =
          heat && isFreshMeasurement(heat)
            ? heat
            : null;

        const merged = mergeWorkerStatus(
          {
            ...bound,
            profileImage: saved?.profileImage || worker.profileImage,
          },
          latest,
          latestHeat
        );

        return !latest && sensor
          ? {
              ...merged,
              recordedAt: sensor.recordedAt,
              issue: '수신 지연',
            }
          : merged;

      });
    });

    if (
      statusResult.status === 'fulfilled' ||
      heatResult.status === 'fulfilled'
    ) {
      setLastSensorUpdated(new Date());
    }

    setSensorLoading(false);

    if (
      statusResult.status === 'rejected' &&
      heatResult.status === 'rejected'
    ) {
      throw statusResult.reason || heatResult.reason;
    }

    return { statuses, heatStatuses };
  }, []);

  useEffect(() => {
    refreshWorkerStatuses().catch(() => {});

    const timer = window.setInterval(() => {
      refreshWorkerStatuses().catch(() => {});
    }, SENSOR_REFRESH_MS);

    return () => window.clearInterval(timer);
  }, [refreshWorkerStatuses]);

  const api = useMemo(
    () => ({
      workers,
      sensorLoading,
      sensorError,
      sensorApiConnected,
      heatRiskApiConnected,
      workerLoading: sensorLoading,
      workerError: sensorError,
      lastSensorUpdated,
      refreshWorkerStatuses,
      refreshWorkers: refreshWorkerStatuses,

      addWorker(worker) {
        setWorkers((previous) => [
          ...previous,
          normalizeWorker({ ...worker, localOnly: true }),
        ]);
      },

      updateWorker(id, patch) {
        setWorkers((previous) =>
          previous.map((worker) =>
            text(worker.id) === text(id)
              ? normalizeWorker({ ...worker, ...patch })
              : worker
          )
        );
      },

      deleteWorker(id) {
        setWorkers((previous) =>
          previous.filter((worker) => text(worker.id) !== text(id))
        );
      },

      resetWorkers() {
        setWorkers(initialWorkers.map(normalizeWorker));
      },
    }),
    [
      workers,
      sensorLoading,
      sensorError,
      sensorApiConnected,
      heatRiskApiConnected,
      lastSensorUpdated,
      refreshWorkerStatuses,
    ]
  );

  return (
    <WorkerContext.Provider value={api}>
      {children}
    </WorkerContext.Provider>
  );
}

export function useWorkers() {
  const context = useContext(WorkerContext);

  if (!context) {
    throw new Error('useWorkers must be used inside WorkerProvider');
  }

  return context;
}
