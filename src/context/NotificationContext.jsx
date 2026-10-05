import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useDetections } from './DetectionContext';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/notifications';

const READ_STORAGE_KEY = 'safehelmet_notification_read_ids_v2';
const MANUAL_STORAGE_KEY = 'safehelmet_manual_notifications_v2';
const AUTH_USER_KEY = 'auth_user';

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

function recipientFromSession() {
  let user = {};

  try {
    user = JSON.parse(
      localStorage.getItem(AUTH_USER_KEY) || '{}'
    );
  } catch {
    user = {};
  }

  const role = String(
    user?.role || user?.userType || ''
  ).toUpperCase();

  if (role.includes('WORKER')) {
    return {
      recipientType: 'WORKER',
      recipientId:
        user?.userId ??
        user?.id ??
        user?.workerId ??
        '',
    };
  }

  return {
    recipientType: 'MANAGER',
    recipientId: undefined,
  };
}

function eventTarget(item) {
  if (item.category === 'fall') return `/incident/${item.id}`;
  if (item.category === 'health') return `/detections/health/${item.id}`;
  return `/detections/${item.id}`;
}

function formatDateTime(value) {
  if (!value) return { date: '--.--', time: '--:--' };

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return { date: '--.--', time: '--:--' };
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

function serverLevel(raw) {
  const value = String(
    raw?.severity || raw?.level || raw?.type || ''
  ).toUpperCase();

  if (
    value.includes('DANGER') ||
    value.includes('EMERGENCY') ||
    value.includes('SOS') ||
    value.includes('FALL')
  ) {
    return 'danger';
  }

  if (
    value.includes('WARNING') ||
    value.includes('CAUTION')
  ) {
    return 'warning';
  }

  return 'normal';
}

function serverTarget(raw) {
  const eventId = raw?.eventId ?? raw?.hazardEventId;
  const category = String(raw?.category || '').toUpperCase();

  if (eventId) {
    if (category === 'FALL') return `/incident/${eventId}`;
    if (category === 'HEALTH') return `/detections/health/${eventId}`;
    return `/detections/${eventId}`;
  }

  const workerId = raw?.workerId ?? raw?.recipientId;

  if (workerId) return `/workers/${workerId}`;

  return '/notifications';
}

function normalizeServerNotification(raw) {
  const createdAt =
    raw?.createdAt ??
    raw?.occurredAt ??
    raw?.sentAt ??
    raw?.timestamp;

  const { date, time } = formatDateTime(createdAt);

  return {
    ...raw,
    id: raw?.notificationId ?? raw?.id,
    source: 'server',
    level: serverLevel(raw),
    title:
      raw?.title ??
      raw?.notificationTitle ??
      raw?.typeLabel ??
      '알림',
    message:
      raw?.message ??
      raw?.content ??
      raw?.description ??
      '',
    date,
    time,
    occurredAt: createdAt,
    target:
      raw?.targetUrl ??
      raw?.link ??
      serverTarget(raw),
    read:
      raw?.isRead === true ||
      raw?.read === true,
  };
}

export function NotificationProvider({ children }) {
  const {
    detections,
    hazardStreamConnected,
  } = useDetections();

  const [readIds, setReadIds] = useState(readStoredIds);
  const [manualNotifications, setManualNotifications] =
    useState(readManualNotifications);
  const [serverNotifications, setServerNotifications] =
    useState([]);
  const [serverNotificationError, setServerNotificationError] =
    useState('');

  const recipient = useMemo(() => recipientFromSession(), []);

  const refreshNotifications = useCallback(async () => {
    try {
      const rows = await getNotifications({
        recipientType: recipient.recipientType,
        recipientId: recipient.recipientId,
        page: 0,
        size: 100,
      });

      setServerNotifications(
        rows
          .map(normalizeServerNotification)
          .filter(
            (item) =>
              item.id !== undefined &&
              item.id !== null
          )
      );

      setServerNotificationError('');
    } catch (error) {
      setServerNotificationError(
        error?.message ||
          '서버 알림을 불러오지 못했습니다.'
      );
    }
  }, [recipient.recipientType, recipient.recipientId]);

  useEffect(() => {
    refreshNotifications();

    const timer = window.setInterval(
      refreshNotifications,
      10000
    );

    return () => window.clearInterval(timer);
  }, [refreshNotifications]);

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

  const notifications = useMemo(() => {
    const combined = [
      ...serverNotifications,
      ...hazardNotifications,
      ...manualWithReadState,
    ];

    const seen = new Set();

    return combined
      .filter((item) => {
        const key =
          item.source === 'server'
            ? `server-${item.id}`
            : item.eventId
              ? `event-${item.eventId}`
              : String(item.id);

        if (seen.has(key)) return false;

        seen.add(key);
        return true;
      })
      .sort((a, b) => {
        const aTime = new Date(
          a.occurredAt ||
            `${a.date || ''} ${a.time || ''}`
        ).getTime();

        const bTime = new Date(
          b.occurredAt ||
            `${b.date || ''} ${b.time || ''}`
        ).getTime();

        if (
          Number.isFinite(aTime) &&
          Number.isFinite(bTime) &&
          aTime !== bTime
        ) {
          return bTime - aTime;
        }

        return String(b.id).localeCompare(String(a.id));
      });
  }, [
    serverNotifications,
    hazardNotifications,
    manualWithReadState,
  ]);

  const markRead = useCallback(
    async (id) => {
      const key = String(id);

      const serverItem = serverNotifications.find(
        (item) => String(item.id) === key
      );

      if (serverItem) {
        try {
          await markNotificationRead(serverItem.id);

          setServerNotifications((items) =>
            items.map((item) =>
              String(item.id) === key
                ? { ...item, read: true }
                : item
            )
          );
        } catch {
          // 서버 읽음 처리 실패 시 로컬 상태는 유지
        }
      }

      setReadIds((items) =>
        items.includes(key) ? items : [...items, key]
      );
    },
    [serverNotifications]
  );

  const markAllRead = useCallback(async () => {
    try {
      await markAllNotificationsRead(
        recipient.recipientType,
        recipient.recipientId
      );

      setServerNotifications((items) =>
        items.map((item) => ({
          ...item,
          read: true,
        }))
      );
    } catch {
      // 로컬 읽음 상태는 아래에서 계속 적용
    }

    setReadIds((items) => {
      const next = new Set(items);

      notifications.forEach((item) => {
        next.add(String(item.id));
      });

      return [...next];
    });
  }, [
    notifications,
    recipient.recipientType,
    recipient.recipientId,
  ]);

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
        (existing) =>
          String(existing.id) !== String(item.id)
      ),
    ]);

    window.dispatchEvent(
      new CustomEvent('safeon-notification-created', {
        detail: {
          id: item.id,
          level: item.level,
          title: item.title,
        },
      })
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
      refreshNotifications,
      serverNotificationError,
      hazardStreamConnected,
    }),
    [
      notifications,
      unreadCount,
      markRead,
      markAllRead,
      addNotification,
      refreshNotifications,
      serverNotificationError,
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
