import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useWorkers } from './WorkerContext';
import { useDetections } from './DetectionContext';
import { buildPreventionItems, sensorSignals } from '../utils/prevention';

const PreventionContext = createContext([]);
export function PreventionProvider({ children }) {
  const { workers } = useWorkers();
  const { detections } = useDetections();
  const observations = useRef(new Map());
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    const active = new Set();
    for (const worker of workers) {
      for (const kind of sensorSignals(worker, now)) {
        const key = `${worker.workerId ?? worker.id}:${kind}`;
        active.add(key);
        if (!observations.current.has(key)) observations.current.set(key, { firstAt: now });
      }
    }
    for (const key of observations.current.keys()) if (!active.has(key)) observations.current.delete(key);
  }, [workers, now]);
  const items = buildPreventionItems(workers, detections, observations.current, now);
  return <PreventionContext.Provider value={items}>{children}</PreventionContext.Provider>;
}
export const usePrevention = () => useContext(PreventionContext);
