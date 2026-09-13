import { AlertTriangle, CheckCheck, Circle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopHeader from '../components/TopHeader';
import { useNotifications } from '../context/NotificationContext';

export default function Notifications() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [tab, setTab] = useState('all');
  const shown = useMemo(() => tab === 'unread' ? notifications.filter((n) => !n.read) : notifications, [notifications, tab]);

  const openItem = (item) => {
    markRead(item.id);
    navigate(item.target || '/');
  };

  return (
    <>
      <TopHeader title="알림" subtitle="안전 이벤트 및 관리자 알림" />
      <div className="page-body notifications-page">
        <div className="notification-page-head">
          <div>
            <h2>알림 센터</h2>
            <p>현장에서 발생한 주요 안전 이벤트를 확인하세요.</p>
          </div>
          <button className="mark-all-btn" onClick={markAllRead}><CheckCheck size={15}/> 모두 읽음 처리</button>
        </div>

        <div className="notification-summary-grid">
          <div className="notification-stat panel"><span>전체 알림</span><strong>{notifications.length}</strong></div>
          <div className="notification-stat panel unread"><span>읽지 않음</span><strong>{unreadCount}</strong></div>
          <div className="notification-stat panel danger"><span>위험 알림</span><strong>{notifications.filter((n) => n.level === 'danger').length}</strong></div>
        </div>

        <section className="panel notification-center-panel">
          <div className="notification-tabs">
            <button className={tab === 'all' ? 'active' : ''} onClick={() => setTab('all')}>전체 <b>{notifications.length}</b></button>
            <button className={tab === 'unread' ? 'active' : ''} onClick={() => setTab('unread')}>읽지 않음 <b>{unreadCount}</b></button>
          </div>
          <div className="notification-page-list">
            {shown.length ? shown.map((item) => (
              <button key={item.id} className={`notification-page-row ${item.read ? '' : 'unread'} ${item.level}`} onClick={() => openItem(item)}>
                <span className={`notification-big-icon ${item.level}`}><AlertTriangle size={18}/></span>
                <span className="notification-page-copy">
                  <span className="notification-page-title"><strong>{item.title}</strong>{!item.read && <em>NEW</em>}</span>
                  <small>{item.message}</small>
                </span>
                <time>{item.date}<br/>{item.time}</time>
                <span className="notification-read-state">{item.read ? '읽음' : <><Circle size={7} fill="currentColor"/> 읽지 않음</>}</span>
              </button>
            )) : <div className="notification-empty">새로운 알림이 없습니다.</div>}
          </div>
        </section>
      </div>
    </>
  );
}
