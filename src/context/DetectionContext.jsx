import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  getHazardEvents,
  openHazardEventStream,
} from '../api/hazardEvents';

const DetectionContext = createContext(null);

const categoryMap = {
  EXTERNAL: 'external',
  HEALTH: 'health',
  FALL: 'fall',
};

const processMap = {
  UNHANDLED: {
    process: '미처리',
    processClass: 'unprocessed',
  },
  IN_PROGRESS: {
    process: '처리중',
    processClass: 'processing',
  },
  RESOLVED: {
    process: '처리완료',
    processClass: 'completed',
  },
};

function lower(value) {
  return String(value ?? '').toLowerCase();
}

function mapKind(category, hazardType) {
  const value = lower(hazardType);

  if (category === 'fall') return 'fall';

  if (category === 'health') {
    if (
      value.includes('heat') ||
      value.includes('temperature') ||
      value.includes('thermal')
    ) {
      return 'heat';
    }

    return 'fatigue';
  }

  if (
    value.includes('unguarded') ||
    value.includes('edge') ||
    value.includes('rail')
  ) {
    return 'unguarded';
  }

  if (
    value.includes('puddle') ||
    value.includes('water') ||
    value.includes('wet')
  ) {
    return 'puddle';
  }

  return 'obstacle';
}

function defaultType(kind) {
  return {
    fall: '추락 감지',
    unguarded: '난간 없는 구간',
    puddle: '물웅덩이 감지',
    obstacle: '장애물 감지',
    fatigue: '피로도 이상',
    heat: '열사병 위험',
  }[kind] || '이상 감지';
}

function defaultRisk(kind) {
  return {
    fall: '추락',
    unguarded: '추락',
    puddle: '미끄럼 및 낙상',
    obstacle: '충돌 및 전도',
    fatigue: '피로 누적',
    heat: '온열질환',
  }[kind] || '위험';
}

function defaultDescription(kind) {
  return {
    fall: '추락 위험 또는 추락 이벤트가 감지되었습니다.',
    unguarded:
      '난간 또는 안전 경계가 없는 위험 구간이 감지되었습니다.',
    puddle:
      '작업 구역 바닥의 물 또는 젖은 구간이 감지되었습니다.',
    obstacle:
      '작업 동선에 장애물이 감지되어 충돌 또는 전도 위험이 있습니다.',
    fatigue:
      '센서 데이터에서 작업자의 피로 또는 건강 이상 징후가 감지되었습니다.',
    heat:
      '작업자의 온열질환 위험 징후가 감지되었습니다.',
  }[kind] || '위험 상황이 감지되었습니다.';
}

function defaultAction(kind, level) {
  if (kind === 'fall') return '즉시 작업자 상태 확인이 필요합니다.';
  if (kind === 'unguarded' || level === 'danger') {
    return '즉각적인 위험 구역 통제가 필요합니다.';
  }
  return '작업자에게 위험 경고가 필요합니다.';
}

function toDateLabels(occurredAt) {
  if (!occurredAt) {
    return {
      time: '--:--',
      dateLabel: '--.--',
    };
  }

  const date = new Date(occurredAt);

  if (Number.isNaN(date.getTime())) {
    return {
      time: '--:--',
      dateLabel: '--.--',
    };
  }

  return {
    time: date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
    dateLabel: `${String(date.getMonth() + 1).padStart(2, '0')}.${String(
      date.getDate()
    ).padStart(2, '0')}`,
  };
}

function toUiEvent(event) {
  const category =
    categoryMap[String(event?.category ?? '').toUpperCase()] ||
    'external';

  const kind = mapKind(category, event?.hazardType);
  const level =
    String(event?.severity ?? '').toUpperCase() === 'DANGER'
      ? 'danger'
      : 'warning';

  const processInfo =
    processMap[String(event?.status ?? '').toUpperCase()] ||
    processMap.UNHANDLED;

  const { time, dateLabel } = toDateLabels(event?.occurredAt);

  const zoneName =
    event?.zone?.name ||
    event?.zone?.code ||
    (typeof event?.zone === 'string' ? event.zone : '') ||
    '-';

  const workerName =
    event?.worker?.name ||
    event?.workerName ||
    event?.helmetNo ||
    '미확인 작업자';

  return {
    id: event?.eventId,
    serverEventId: event?.eventId,
    source: 'server',

    category,
    kind,
    level,

    type:
      event?.hazardLabel ||
      event?.hazardType ||
      defaultType(kind),

    name: workerName,
    workerId: event?.worker?.id,
    employeeNo: event?.worker?.employeeNo,

    zone: zoneName,
    zoneId: event?.zone?.id,
    zoneCode: event?.zone?.code,

    helmetNo: event?.helmetNo,
    confidence: event?.confidence,

    time,
    dateLabel,
    occurredAt: event?.occurredAt,

    status: event?.status,
    statusLabel: event?.statusLabel,
    ...processInfo,

    riskLabel:
      event?.description ||
      defaultRisk(kind),

    detailDescription:
      event?.description ||
      defaultDescription(kind),

    actionText:
      event?.recommendedAction ||
      defaultAction(kind, level),

    hasClip: Boolean(event?.hasClip),

    attentionRequired:
      level === 'danger' &&
      processInfo.processClass !== 'completed',

    rawEvent: event,
  };
}

export function DetectionProvider({ children }) {
  const [detections, setDetections] = useState([]);
  const [hazardSummary, setHazardSummary] = useState(null);
  const [hazardLoading, setHazardLoading] = useState(false);
  const [hazardError, setHazardError] = useState('');
  const [lastHazardUpdated, setLastHazardUpdated] = useState(null);
  const [hazardStreamConnected, setHazardStreamConnected] =
    useState(false);

  const refreshingRef = useRef(false);

  const refreshHazardEvents = useCallback(async (params = {}) => {
    if (refreshingRef.current) return [];

    refreshingRef.current = true;
    setHazardLoading(true);
    setHazardError('');

    try {
      const page = await getHazardEvents(params);
      const events = page.content.map(toUiEvent);

      setDetections(events);
      setHazardSummary(page.summary);
      setLastHazardUpdated(new Date());

      return events;
    } catch (error) {
      console.error('이상 감지 목록 조회 실패:', error);
      setHazardError(
        error?.message ||
          '이상 감지 목록을 불러오지 못했습니다.'
      );
      throw error;
    } finally {
      refreshingRef.current = false;
      setHazardLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshHazardEvents().catch(() => {});
  }, [refreshHazardEvents]);

  // 목록 API의 폴링과 별개로 SSE를 연결해 새 이벤트를 즉시 반영합니다.
  useEffect(() => {
    const stream = openHazardEventStream({
      onOpen: () => {
        setHazardStreamConnected(true);
      },

      onHazard: () => {
        setHazardStreamConnected(true);
        refreshHazardEvents().catch(() => {});
      },

      onClipReady: (data) => {
        setHazardStreamConnected(true);

        const eventId =
          data?.eventId ??
          data?.id ??
          (typeof data === 'number' ? data : null);

        window.dispatchEvent(
          new CustomEvent('safehelmet-hazard-clip-ready', {
            detail: {
              eventId,
            },
          })
        );

        refreshHazardEvents().catch(() => {});
      },

      onHeartbeat: () => {
        setHazardStreamConnected(true);
      },

      onError: () => {
        setHazardStreamConnected(false);
      },
    });

    return () => {
      stream.close();
    };
  }, [refreshHazardEvents]);

  const acknowledgeDetection = (id) => {
    setDetections((items) =>
      items.map((item) =>
        String(item.id) === String(id)
          ? {
              ...item,
              attentionRequired: false,
            }
          : item
      )
    );
  };

  const completeDetection = (id) => {
    setDetections((items) =>
      items.map((item) =>
        String(item.id) === String(id)
          ? {
              ...item,
              status: 'RESOLVED',
              statusLabel: '처리완료',
              process: '처리완료',
              processClass: 'completed',
              attentionRequired: false,
            }
          : item
      )
    );
  };

  const unresolvedDangerCount = detections.filter(
    (item) =>
      item.level === 'danger' &&
      item.attentionRequired &&
      item.processClass !== 'completed'
  ).length;

  const value = useMemo(
    () => ({
      detections,
      unresolvedDangerCount,

      acknowledgeDetection,
      completeDetection,

      refreshHazardEvents,

      hazardSummary,
      hazardLoading,
      hazardError,
      lastHazardUpdated,
      hazardStreamConnected,
    }),
    [
      detections,
      unresolvedDangerCount,
      refreshHazardEvents,
      hazardSummary,
      hazardLoading,
      hazardError,
      lastHazardUpdated,
      hazardStreamConnected,
    ]
  );

  return (
    <DetectionContext.Provider value={value}>
      {children}
    </DetectionContext.Provider>
  );
}

export function useDetections() {
  const context = useContext(DetectionContext);

  if (!context) {
    throw new Error(
      'useDetections must be used inside DetectionProvider'
    );
  }

  return context;
}
