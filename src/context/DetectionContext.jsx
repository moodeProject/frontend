import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { detections as initialDetections } from '../data/mockData';

const STORAGE_KEY = 'safehelmet_detection_state_v1';
const DetectionContext = createContext(null);

function createInitialState() {
  return initialDetections.map((item) => ({
    ...item,
    // 데모 초기 상태: 현재 관리자가 아직 확인하지 않은 '위험' 이벤트 1건만 배지에 표시
    // 실제 API 연동 시 새 danger 이벤트가 들어오면 attentionRequired=true로 넣으면 된다.
    attentionRequired: item.id === 1,
  }));
}

export function DetectionProvider({ children }) {
  const [detections, setDetections] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      return Array.isArray(saved) && saved.length ? saved : createInitialState();
    } catch {
      return createInitialState();
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(detections));
  }, [detections]);

  const acknowledgeDetection = (id) => {
    setDetections((items) => items.map((item) =>
      String(item.id) === String(id)
        ? { ...item, attentionRequired: false }
        : item
    ));
  };

  const completeDetection = (id) => {
    setDetections((items) => items.map((item) =>
      String(item.id) === String(id)
        ? {
            ...item,
            attentionRequired: false,
            process: '처리완료',
            processClass: 'completed',
          }
        : item
    ));
  };

  // 이후 백엔드 실시간 감지(WebSocket/SSE) 연결 시 이 함수를 호출하면
  // 새 위험 이벤트는 자동으로 사이드바 배지에 반영된다.
  const addDetection = (detection) => {
    setDetections((items) => [
      {
        ...detection,
        attentionRequired: detection.level === 'danger',
      },
      ...items,
    ]);
  };

  const unresolvedDangerCount = detections.filter((item) =>
    item.level === 'danger' &&
    item.attentionRequired &&
    item.processClass !== 'completed'
  ).length;

  const value = useMemo(() => ({
    detections,
    unresolvedDangerCount,
    acknowledgeDetection,
    completeDetection,
    addDetection,
  }), [detections, unresolvedDangerCount]);

  return <DetectionContext.Provider value={value}>{children}</DetectionContext.Provider>;
}

export function useDetections() {
  const context = useContext(DetectionContext);
  if (!context) throw new Error('useDetections must be used inside DetectionProvider');
  return context;
}
