import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { workers as initialWorkers } from '../data/mockData';
import {
  getAllWorkerHeatRisk,
  getAllWorkerStatuses,
} from '../api/workerStatus';
import { getDefaultWorkerProfile } from '../utils/defaultWorkerProfiles';

const WorkerContext = createContext(null);
const STORAGE_KEY = 'safehelmet-workers-v3';
const SENSOR_REFRESH_MS = 10_000;

function text(value) {
  return value === undefined || value === null ? '' : String(value);
}

function deriveDeviceId(worker) {
  if (worker?.deviceId) return text(worker.deviceId);

  const helmetId =
    worker?.helmetId ||
    worker?.helmetNo ||
    worker?.helmetNumber ||
    worker?.helmet?.helmetNo ||
    worker?.helmet?.helmetNumber ||
    worker?.helmet?.id ||
    worker?.id ||
    '';

  if (/^H-\d+$/i.test(text(helmetId))) {
    return text(helmetId).replace(/^H-/i, 'DEV-');
  }

  return '';
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
    issue: worker?.issue || '센서 데이터 대기',
    fatigue: Number(worker?.fatigue) || 1,
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
  return !normalized || normalized === 'NORMAL';
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
    });
  }

  const fallAbnormal = sensor ? !isNormalState(sensor.fallState) : false;
  const healthStateAbnormal = sensor
    ? !isNormalState(sensor.healthState)
    : false;
  const posture = text(sensor?.posture ?? base.posture).toUpperCase();
  const postureAbnormal = isTrue(
    sensor?.postureAbnormal ?? base.postureAbnormal
  );

  const fatigueAbnormal = isTrue(
    heatRisk?.fatigueAbnormal ??
      sensor?.fatigueAbnormal ??
      base.fatigueAbnormal
  );

  const heatRiskAbnormal = isTrue(
    heatRisk?.heatRiskAbnormal ??
      sensor?.heatRiskAbnormal ??
      base.heatRiskAbnormal
  );

  const externalHeatWarning = isTrue(
    heatRisk?.externalHeatWarning ?? base.externalHeatWarning
  );

  const heatRiskLevel =
    heatRisk?.heatRiskLevel || base.heatRiskLevel || '';

  const heatLevelAbnormal = isHeatLevelAbnormal(heatRiskLevel);

  let status = 'normal';
  let issue = '정상 작업 중';

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

  const heartRate = Number(
    heatRisk?.heartRate ?? sensor?.heartRate ?? base.heartRate
  );
  const spo2 = heatRisk?.spo2 ?? sensor?.spo2 ?? base.spo2;
  const hrvRaw = heatRisk?.hrv ?? sensor?.hrv ?? base.hrv;
  const hrv = Number(hrvRaw);
  const sensorZone = readZone(sensor || {});

  return normalizeWorker({
    ...base,
    deviceId: sensor?.deviceId || heatRisk?.deviceId || base.deviceId,
    status,
    issue,
    fatigue: fatigueAbnormal ? 2 : 1,
    heartRate:
      Number.isFinite(heartRate) && heartRate > 0
        ? heartRate
        : base.heartRate,
    spo2,
    hrv: Number.isFinite(hrv) ? hrv : base.hrv,
    fatigueAbnormal,
    heatRiskAbnormal,
    externalHeatWarning,
    heatRiskLevel,
    fallState: sensor?.fallState ?? base.fallState,
    healthState: sensor?.healthState ?? base.healthState,
    fallConfidence: sensor?.fallConfidence ?? base.fallConfidence,
    posture: sensor?.posture ?? base.posture,
    postureAbnormal:
      sensor?.postureAbnormal ?? base.postureAbnormal ?? false,
    recordedAt:
      sensor?.recordedAt ?? heatRisk?.recordedAt ?? base.recordedAt,
    zone: sensorZone.name || base.zone,
    zoneCode: sensorZone.code || sensor?.zoneId || base.zoneCode || null,
    zoneDbId: sensorZone.id ?? base.zoneDbId ?? null,
    ax: sensor?.ax ?? base.ax,
    ay: sensor?.ay ?? base.ay,
    az: sensor?.az ?? base.az,
    gx: sensor?.gx ?? base.gx,
    gy: sensor?.gy ?? base.gy,
    gz: sensor?.gz ?? base.gz,
    sensorConnected: Boolean(sensor),
    serverDataConnected: Boolean(sensor),
    heatRiskDataConnected: Boolean(heatRisk),
  });
}

export function WorkerProvider({ children }) {
  const [workers, setWorkers] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const source = saved ? JSON.parse(saved) : initialWorkers;
      return source.map(normalizeWorker);
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

  const refreshWorkerStatuses = useCallback(async () => {
    setSensorLoading(true);
    setSensorError('');

    const [statusResult, heatResult] = await Promise.allSettled([
      getAllWorkerStatuses(),
      getAllWorkerHeatRisk(),
    ]);

    const statuses =
      statusResult.status === 'fulfilled' ? statusResult.value : [];
    const heatStatuses =
      heatResult.status === 'fulfilled' ? heatResult.value : [];

    setSensorApiConnected(statusResult.status === 'fulfilled');
    setHeatRiskApiConnected(heatResult.status === 'fulfilled');

    const errors = [];
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

    setWorkers((previous) =>
      previous.map((worker) => {
        const normalized = normalizeWorker(worker);
        const deviceId = deriveDeviceId(normalized);

        return mergeWorkerStatus(
          normalized,
          sensorMap.get(text(deviceId)),
          heatMap.get(text(deviceId))
        );
      })
    );

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
