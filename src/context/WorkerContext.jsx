import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { workers as initialWorkers } from '../data/mockData';

const WorkerContext = createContext(null);
const STORAGE_KEY = 'safehelmet-workers-v3';

function normalizeWorker(worker) {
  return {
    ...worker,
    employeeNumber: worker.employeeNumber || worker.workerCode || '',
    workerCode: worker.workerCode || worker.employeeNumber || '',
    phone: worker.phone || '',
  };
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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workers));
  }, [workers]);

  const api = useMemo(() => ({
    workers,
    addWorker(worker) {
      setWorkers((prev) => [...prev, normalizeWorker(worker)]);
    },
    updateWorker(id, patch) {
      setWorkers((prev) => prev.map((worker) => worker.id === id ? normalizeWorker({ ...worker, ...patch }) : worker));
    },
    deleteWorker(id) {
      setWorkers((prev) => prev.filter((worker) => worker.id !== id));
    },
    resetWorkers() {
      setWorkers(initialWorkers.map(normalizeWorker));
    },
  }), [workers]);

  return <WorkerContext.Provider value={api}>{children}</WorkerContext.Provider>;
}

export function useWorkers() {
  const context = useContext(WorkerContext);
  if (!context) throw new Error('useWorkers must be used inside WorkerProvider');
  return context;
}
