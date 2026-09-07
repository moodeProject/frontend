import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useDetections } from './DetectionContext';

const READ_STORAGE_KEY = 'safehelmet_notification_read_ids_v2';
const MANUAL_STORAGE_KEY = 'safehelmet_manual_notifications_v2';

const NotificationContext = createContext(null);

function readStoredIds() {
  try {
    const value = JSON.parse(
      localStorage.getItem(READ_STORAGE_KEY) || '[]'
    );
    return Array.isArray(value) ? value.map(String) : [];
  } catch {
    return [];
  }
}

function readManualNotifications() {
  try {
    const value = JSON.parse(
      localStorage.getItem(MANUAL_STORAGE_KEY) || '[]'
    );
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function eventTarget(item) {
  if (item.category === 'fall') {
    return `/incident/${item.id}`;
  }

  if (item.category === 'health') {
    return `/detections/health/${item.id}`;
  }

  return `/detections/${item.id}`;
}

function formatDateTime(value) {
  if (!value) {
    return {
      date: '--.--',
      time: '--:--',
    };
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return {
      date: '--.--',
      time: '--:--',
    };
  }

  return {
    date: `${String(date.getMonth() + 1).padStart(2, '0')}.${String(
      date.getDate()
    ).padStart(2, '0')}`,
    time: date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
  };
}

function notificationFromDetection(item, readIds) {
  const { date, time } = formatDateTime(item.occurredAt);

  const title =
    item.category === 'fall'
      ? `${item.type || '추락 감지'}`
      : item.category === 'health'
        ? `${item.type || '건강 이상 감지'}`
        : `${item.type || '외부 위험요인 감지'}`;

  const message = [
    item.name,
    item.zone,
    item.statusLabel || item.process,
  ]
    .filter(Boolean)
    .join(' · ');

  const notificationId = `hazard-${item.id}`;

  return {
    id: notificationId,
    eventId: item.id,
    source: 'hazard',
    level: item.level || 'warning',
    category: item.category,
    title,
    message,
    date,
    time,
    occurredAt: item.occurredAt,
    target: eventTarget(item),
    read: readIds.includes(notificationId),
  };
}

export function NotificationProvider({ children }) {
  const {
    detections,
    hazardStreamConnected,
  } = useDetections();

  const [readIds, setReadIds] = useState(readStoredIds);
  const [manualNotifications, setManualNotifications] = useState(
    readManualNotifications
  );

  useEffect(() => {
    localStorage.setItem(
      READ_STORAGE_KEY,
      JSON.stringify(readIds)
    );
  }, [readIds]);

  useEffect(() => {
    localStorage.setItem(
      MANUAL_STORAGE_KEY,
      JSON.stringify(manualNotifications)
    );
  }, [manualNotifications]);

  const hazardNotifications = useMemo(
    () =>
      detections.map((item) =>
        notificationFromDetection(item, readIds)
      ),
    [detections, readIds]
  );

  const manualWithReadState = useMemo(
    () =>
      manualNotifications.map((item) => ({
        ...item,
        read:
          item.read === true ||
          readIds.includes(String(item.id)),
      })),
    [manualNotifications, readIds]
  );

  const notifications = useMemo(
    () =>
      [...hazardNotifications, ...manualWithReadState].sort(
        (a, b) => {
          const aTime = new Date(
            a.occurredAt || `${a.date || ''} ${a.time || ''}`
          ).getTime();
          const bTime = new Date(
            b.occurredAt || `${b.date || ''} ${b.time || ''}`
          ).getTime();

          if (
            Number.isFinite(aTime) &&
            Number.isFinite(bTime) &&
            aTime !== bTime
          ) {
            return bTime - aTime;
          }

          return String(b.id).localeCompare(String(a.id));
        }
      ),
    [hazardNotifications, manualWithReadState]
  );

  const markRead = useCallback((id) => {
    const key = String(id);

    setReadIds((items) =>
      items.includes(key) ? items : [...items, key]
    );
  }, []);

  const markAllRead = useCallback(() => {
    setReadIds((items) => {
      const next = new Set(items);

      notifications.forEach((item) => {
        next.add(String(item.id));
      });

      return [...next];
    });
  }, [notifications]);

  const addNotification = useCallback((notification) => {
    const now = new Date();

    const item = {
      id:
        notification.id ||
        `manual-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 7)}`,
      source: 'manual',
      level: notification.level || 'warning',
      category: notification.category,
      title: notification.title || '새 알림',
      message: notification.message || '',
      time:
        notification.time ||
        now.toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }),
      date:
        notification.date ||
        `${String(now.getMonth() + 1).padStart(2, '0')}.${String(
          now.getDate()
        ).padStart(2, '0')}`,
      occurredAt:
        notification.occurredAt || now.toISOString(),
      target: notification.target || '/notifications',
      read: false,
    };

    setManualNotifications((items) => [
      item,
      ...items.filter(
        (existing) => String(existing.id) !== String(item.id)
      ),
    ]);

    // SOS/관리자 호출 등 새 수동 알림도
    // 벨을 클릭하지 않아도 즉시 팝업으로 보여줍니다.
    window.dispatchEvent(
      new CustomEvent(
        'safeon-notification-created',
        {
          detail: {
            id: item.id,
            level: item.level,
            title: item.title,
          },
        }
      )
    );

    return item;
  }, []);

  const unreadCount = notifications.filter(
    (item) => !item.read
  ).length;

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      markRead,
      markAllRead,
      addNotification,
      hazardStreamConnected,
    }),
    [
      notifications,
      unreadCount,
      markRead,
      markAllRead,
      addNotification,
      hazardStreamConnected,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      'useNotifications must be used inside NotificationProvider'
    );
  }

  return context;
}
