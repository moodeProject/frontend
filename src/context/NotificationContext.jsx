import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'safehelmet_notifications';

const initialNotifications = [
  { id: 'n1', level: 'danger', title: '추락 사고가 감지되었습니다.', message: '박민수 · A구역 3층', time: '10:28', date: '08.09', target: '/incident', read: false },
  { id: 'n2', level: 'danger', title: '난간 없는 구간 접근 감지', message: '박민수 · A구역 3층', time: '10:26', date: '08.09', target: '/detections/2', read: false },
  { id: 'n3', level: 'warning', title: '피로도 2단계 감지', message: '김현석 · B구역 · 휴식 권고 필요', time: '10:27', date: '08.09', target: '/workers/H-002', read: false },
  { id: 'n4', level: 'warning', title: '물웅덩이 감지', message: '이수진 · C구역 · 미끄럼 위험', time: '10:24', date: '08.09', target: '/detections/4', read: false },
  { id: 'n5', level: 'warning', title: '장애물 감지 확인 완료', message: '김현석 · B구역', time: '10:21', date: '08.09', target: '/detections/5', read: true },
  { id: 'n6', level: 'warning', title: '열사병 위험 감지', message: '정유진 · B구역 1층', time: '09:55', date: '08.09', target: '/workers/H-005', read: true },
];

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      return Array.isArray(saved) && saved.length ? saved : initialNotifications;
    } catch {
      return initialNotifications;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  const markRead = (id) => setNotifications((items) => items.map((item) => item.id === id ? { ...item, read: true } : item));
  const markAllRead = () => setNotifications((items) => items.map((item) => ({ ...item, read: true })));
  const unreadCount = notifications.filter((item) => !item.read).length;

  const value = useMemo(() => ({ notifications, unreadCount, markRead, markAllRead }), [notifications, unreadCount]);
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used inside NotificationProvider');
  return context;
}
