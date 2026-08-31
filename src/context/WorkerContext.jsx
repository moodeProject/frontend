import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { workers as initialWorkers } from '../data/mockData';
import { getAllWorkerStatuses } from '../api/workerStatus';

const WorkerContext = createContext(null);
const STORAGE_KEY = 'safehelmet-workers-v3';

function deriveDeviceId(worker) {
  if (worker.deviceId) return worker.deviceId;
  const helmetId = worker.helmetId || worker.id || '';
  if (/^H-\d+$/i.test(helmetId)) return helmetId.replace(/^H-/i, 'DEV-');
  return '';
}

function normalizeWorker(worker) {
  return {
    ...worker,
    employeeNumber: worker.employeeNumber || worker.workerCode || '',
    workerCode: worker.workerCode || worker.employeeNumber || '',
    phone: worker.phone || '',
    deviceId: deriveDeviceId(worker),
  };
}

function isAbnormal(value) {
  return Boolean(value) && String(value).toUpperCase() !== 'NORMAL';
}

function mergeSensorStatus(worker, sensor) {
  if (!sensor) return worker;

  const fallAbnormal = isAbnormal(sensor.fallState);
  const healthAbnormal = isAbnormal(sensor.healthState);

  let status = 'normal';
  let issue = '정상 작업 중';
  let fatigue = worker.fatigue || 1;

  if (fallAbnormal) {
    status = 'danger';
    issue = '추락 감지됨';
  } else if (healthAbnormal) {
    status = 'warning';
    issue = sensor.healthState === 'NORMAL' ? '건강 이상 감지' : `건강 이상 · ${sensor.healthState}`;
    fatigue = Math.max(Number(worker.fatigue) || 1, 2);
  }

  const heartRate = Number(sensor.heartRate);

  return normalizeWorker({
    ...worker,
    deviceId: sensor.deviceId || worker.deviceId,
    status,
    issue,
    fatigue,
    heartRate: Number.isFinite(heartRate) && heartRate > 0 ? heartRate : worker.heartRate,
    spo2: sensor.spo2 ?? worker.spo2,
    fallState: sensor.fallState ?? worker.fallState,
    healthState: sensor.healthState ?? worker.healthState,
    fallConfidence: sensor.fallConfidence ?? worker.fallConfidence,
    recordedAt: sensor.recordedAt ?? worker.recordedAt,
    ax: sensor.ax ?? worker.ax,
    ay: sensor.ay ?? worker.ay,
    az: sensor.az ?? worker.az,
    gx: sensor.gx ?? worker.gx,
    gy: sensor.gy ?? worker.gy,
    gz: sensor.gz ?? worker.gz,
    sensorConnected: true,
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
  const [lastSensorUpdated, setLastSensorUpdated] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workers));
  }, [workers]);

  const refreshWorkerStatuses = useCallback(async () => {
    setSensorLoading(true);
    setSensorError('');

    try {
      const statuses = await getAllWorkerStatuses();

      setWorkers((prev) => {
        const byDeviceId = new Map(
          statuses
            .filter((item) => item?.deviceId)
            .map((item) => [String(item.deviceId), item])
        );

        return prev.map((worker) => {
          const deviceId = deriveDeviceId(worker);
          return mergeSensorStatus(
            normalizeWorker(worker),
            byDeviceId.get(String(deviceId))
          );
        });
      });

      setLastSensorUpdated(new Date());
      return statuses;
    } catch (error) {
      console.error('작업자 센서 상태 조회 실패:', error);
      setSensorError(error?.message || '작업자 상태를 불러오지 못했습니다.');
      throw error;
    } finally {
      setSensorLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshWorkerStatuses().catch(() => {});

    const timer = window.setInterval(() => {
      refreshWorkerStatuses().catch(() => {});
    }, 10000);

    return () => window.clearInterval(timer);
  }, [refreshWorkerStatuses]);

  const api = useMemo(() => ({
    workers,
    sensorLoading,
    sensorError,
    lastSensorUpdated,
    refreshWorkerStatuses,

    addWorker(worker) {
      setWorkers((prev) => [...prev, normalizeWorker(worker)]);
    },

    updateWorker(id, patch) {
      setWorkers((prev) =>
        prev.map((worker) =>
          worker.id === id
            ? normalizeWorker({ ...worker, ...patch })
            : worker
        )
      );
    },

    deleteWorker(id) {
      setWorkers((prev) => prev.filter((worker) => worker.id !== id));
    },

    resetWorkers() {
      setWorkers(initialWorkers.map(normalizeWorker));
    },
  }), [
    workers,
    sensorLoading,
    sensorError,
    lastSensorUpdated,
    refreshWorkerStatuses,
  ]);

  return (
    <WorkerContext.Provider value={api}>
      {children}
    </WorkerContext.Provider>
  );
}

export function useWorkers() {
  const context = useContext(WorkerContext);
  if (!context) throw new Error('useWorkers must be used inside WorkerProvider');
  return context;
}
