import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../api/notifications';

const initialNotifications = [
  { id: 'n1', level: 'danger', title: '추락 사고가 감지되었습니다.', message: '박민수 · A구역 3층', time: '10:28', date: '08.09', target: '/incident', read: false },
  { id: 'n2', level: 'danger', title: '난간 없는 구간 접근 감지', message: '박민수 · A구역 3층', time: '10:26', date: '08.09', target: '/detections/2', read: false },
  { id: 'n3', level: 'warning', title: '피로도 2단계 감지', message: '김현석 · B구역 · 휴식 권고 필요', time: '10:27', date: '08.09', target: '/workers/H-002', read: false },
  { id: 'n4', level: 'warning', title: '물웅덩이 감지', message: '이수진 · C구역 · 미끄럼 위험', time: '10:24', date: '08.09', target: '/detections/4', read: false },
  { id: 'n5', level: 'warning', title: '장애물 감지 확인 완료', message: '김현석 · B구역', time: '10:21', date: '08.09', target: '/detections/5', read: true },
  { id: 'n6', level: 'warning', title: '열사병 위험 감지', message: '정유진 · B구역 1층', time: '09:55', date: '08.09', target: '/workers/H-005', read: true },
];

function mapApiNotification(n) {
  const levelMap = { DANGER: 'danger', WARNING: 'warning', NORMAL: 'normal' }
  return {
    id: n.id,
    level: levelMap[n.level] || 'warning',
    title: n.title || n.message || '알림',
    message: n.message || '',
    time: n.createdAt ? new Date(n.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }) : '',
    date: n.createdAt ? new Date(n.createdAt).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }).replace('. ', '.').replace('.', '') : '',
    target: n.hazardEventId ? `/detections/${n.hazardEventId}` : '/notifications',
    read: n.isRead ?? false,
  }
}

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(initialNotifications);

  const fetchNotifications = useCallback(async () => {
    try {
      const list = await getNotifications({ recipientType: 'MANAGER' })
      const arr = Array.isArray(list) ? list : (list?.content ?? [])
      if (arr.length > 0) setNotifications(arr.map(mapApiNotification))
    } catch {
      // API 실패 시 목업 유지
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 30000);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  const markRead = async (id) => {
    setNotifications((items) => items.map((item) => item.id === id ? { ...item, read: true } : item));
    try { await markNotificationRead(id) } catch { /* 무시 */ }
  };

  const markAllRead = async () => {
    setNotifications((items) => items.map((item) => ({ ...item, read: true })));
    try { await markAllNotificationsRead('MANAGER') } catch { /* 무시 */ }
  };

  const addNotification = (notification) => {
    const now = new Date();
    const item = {
      id: notification.id || `n-${Date.now()}`,
      level: notification.level || 'warning',
      title: notification.title || '새 알림',
      message: notification.message || '',
      time: notification.time || now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
      date: notification.date || `${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`,
      target: notification.target || '/notifications',
      read: false,
    };
    setNotifications((items) => [item, ...items]);
    return item;
  };

  const unreadCount = notifications.filter((item) => !item.read).length;
  const value = useMemo(() => ({ notifications, unreadCount, markRead, markAllRead, addNotification, fetchNotifications }), [notifications, unreadCount, fetchNotifications]);
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used inside NotificationProvider');
  return context;
}
