import { AlertTriangle, Bell, CheckCheck, ChevronRight, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';

function getSavedUpdateTime(pathname) {
  try {
    const raw = sessionStorage.getItem(`safehelmet-last-updated:${pathname}`);
    if (raw) return new Date(raw);
  } catch {}
  return new Date();
}

export default function TopHeader({ title, subtitle, onRefresh }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [lastUpdated, setLastUpdated] = useState(() => getSavedUpdateTime(location.pathname));
  const [refreshing, setRefreshing] = useState(false);
  const popoverRef = useRef(null);
  const recent = notifications.slice(0, 4);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setLastUpdated(getSavedUpdateTime(location.pathname));
  }, [location.pathname]);

  useEffect(() => {
    const close = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const dateLabel = useMemo(() => now.toLocaleDateString('ko-KR', {
    month: 'long', day: 'numeric', weekday: 'short',
  }), [now]);
  const clockLabel = useMemo(() => now.toLocaleTimeString('ko-KR', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  }), [now]);
  const formatTime = (date) => date.toLocaleTimeString('ko-KR', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    const at = new Date();
    window.dispatchEvent(new CustomEvent('safehelmet-page-refresh', {
      detail: { at: at.toISOString(), path: location.pathname, title },
    }));
    try {
      if (onRefresh) await onRefresh();
      await new Promise((resolve) => window.setTimeout(resolve, 350));
    } finally {
      const completedAt = new Date();
      setLastUpdated(completedAt);
      try {
        sessionStorage.setItem(`safehelmet-last-updated:${location.pathname}`, completedAt.toISOString());
      } catch {}
      setRefreshing(false);
    }
  };

  const openNotification = (item) => {
    markRead(item.id);
    setOpen(false);
    navigate(item.target || '/notifications');
  };

  return (
    <header className="top-header">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="header-right">
        <span className="date">{dateLabel}</span>
        <span className="clock">· {clockLabel}</span>
        <span className="header-pill danger">● 위험 1명</span>
        <span className="header-pill warning">● 주의 3명</span>
        <div className="page-refresh-wrap" title={`${title} 페이지 데이터 갱신`}>
          <span>마지막 업데이트 {formatTime(lastUpdated)}</span>
          <button className={`page-refresh-btn ${refreshing ? 'refreshing' : ''}`} onClick={handleRefresh} aria-label={`${title} 새로고침`}>
            <RefreshCw size={14}/><b>{refreshing ? '갱신 중' : '새로고침'}</b>
          </button>
        </div>
        <div className="notification-wrap" ref={popoverRef}>
          <button className={`bell-btn ${open ? 'active' : ''}`} onClick={() => setOpen((v) => !v)} aria-label="알림 열기">
            <Bell size={16} />
            {unreadCount > 0 && <span>{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </button>
          {open && (
            <div className="notification-popover">
              <div className="notification-popover-head">
                <div><strong>알림</strong><em>읽지 않음 {unreadCount}</em></div>
                <button onClick={markAllRead}><CheckCheck size={13}/> 모두 읽음</button>
              </div>
              <div className="notification-popover-list">
                {recent.map((item) => (
                  <button key={item.id} className={`notification-mini ${item.read ? '' : 'unread'} ${item.level}`} onClick={() => openNotification(item)}>
                    <span className={`notification-icon ${item.level}`}><AlertTriangle size={14}/></span>
                    <span className="notification-mini-copy">
                      <strong>{item.title}</strong>
                      <small>{item.message}</small>
                      <time>{item.date} {item.time}</time>
                    </span>
                    {!item.read && <i/>}
                  </button>
                ))}
              </div>
              <button className="notification-view-all" onClick={() => { setOpen(false); navigate('/notifications'); }}>
                알림 전체보기 <ChevronRight size={13}/>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
