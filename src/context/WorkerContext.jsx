import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { workers as mockWorkers } from '../data/mockData';
import { createWorker, deactivateWorker, getWorkers, updateWorker as updateWorkerApi } from '../api/workers';

const WorkerContext = createContext(null);

function normalizeWorker(worker) {
  return {
    ...worker,
    employeeNumber: worker.employeeNumber || worker.workerCode || '',
    workerCode: worker.workerCode || worker.employeeNumber || '',
    phone: worker.phone || '',
  };
}

export function WorkerProvider({ children }) {
  const [workers, setWorkers] = useState(mockWorkers.map(normalizeWorker));
  const [loaded, setLoaded] = useState(false);

  // 서버에서 작업자 목록 불러오기
  const fetchWorkers = useCallback(async () => {
    try {
      const list = await getWorkers();
      if (list && list.length > 0) {
        setWorkers(list.map(normalizeWorker));
      }
    } catch {
      // API 실패 시 목업 데이터 유지
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  const api = useMemo(() => ({
    workers,
    loaded,
    fetchWorkers,
    async addWorker(workerData) {
      try {
        const created = await createWorker(workerData);
        if (created) {
          setWorkers((prev) => [...prev, normalizeWorker(created)]);
          return created;
        }
      } catch {
        // API 실패 시 로컬에만 추가
        const fallback = normalizeWorker({ ...workerData, id: workerData.id || `local-${Date.now()}` });
        setWorkers((prev) => [...prev, fallback]);
        return fallback;
      }
    },
    async updateWorker(id, patch) {
      // 로컬 즉시 반영
      setWorkers((prev) => prev.map((w) => w.id === id ? normalizeWorker({ ...w, ...patch }) : w));
      try {
        await updateWorkerApi(id, patch);
      } catch {
        // API 실패해도 로컬 상태는 유지
      }
    },
    async deleteWorker(id) {
      setWorkers((prev) => prev.filter((w) => w.id !== id));
      try {
        await deactivateWorker(id);
      } catch {
        // 소프트 삭제 실패해도 로컬에서는 제거
      }
    },
    resetWorkers() {
      setWorkers(mockWorkers.map(normalizeWorker));
    },
  }), [workers, loaded, fetchWorkers]);

  return <WorkerContext.Provider value={api}>{children}</WorkerContext.Provider>;
}

export function useWorkers() {
  const context = useContext(WorkerContext);
  if (!context) throw new Error('useWorkers must be used inside WorkerProvider');
  return context;
}
