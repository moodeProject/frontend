import { AlertTriangle, Bell, CheckCheck, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';

export default function TopHeader({ title, subtitle }) {
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const popoverRef = useRef(null);
  const recent = notifications.slice(0, 4);

  useEffect(() => {
    const close = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

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
        <span className="date">8월 16일 (일)</span>
        <span className="clock">· 오후 06:11:13</span>
        <span className="header-pill danger">● 위험 1명</span>
        <span className="header-pill warning">● 주의 3명</span>
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
