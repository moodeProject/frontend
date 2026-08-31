import {
  AlertTriangle,
  CheckCheck,
  Circle,
} from 'lucide-react';
import {
  useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import TopHeader from '../components/TopHeader';
import { useDetections } from '../context/DetectionContext';
import { useNotifications } from '../context/NotificationContext';

export default function Notifications() {
  const navigate = useNavigate();

  const {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    hazardStreamConnected,
  } = useNotifications();

  const {
    refreshHazardEvents,
    hazardLoading,
    hazardError,
  } = useDetections();

  const [tab, setTab] = useState('all');

  const shown = useMemo(
    () =>
      tab === 'unread'
        ? notifications.filter(
            (notification) =>
              !notification.read
          )
        : notifications,
    [notifications, tab]
  );

  const openItem = (item) => {
    markRead(item.id);
    navigate(item.target || '/');
  };

  return (
    <>
      <TopHeader
        title="알림"
        subtitle="실제 위험 이벤트 및 관리자 조치 알림"
        onRefresh={refreshHazardEvents}
      />

      <div className="page-body notifications-page">
        <div className="notification-page-head">
          <div>
            <h2>알림 센터</h2>
            <p>
              {hazardStreamConnected
                ? '실시간 위험 이벤트와 관리자 조치 알림을 확인하세요.'
                : '실시간 위험 이벤트 연결을 재시도하고 있습니다.'}
            </p>
          </div>

          <button
            className="mark-all-btn"
            onClick={markAllRead}
            disabled={notifications.length === 0}
          >
            <CheckCheck size={15} />
            모두 읽음 처리
          </button>
        </div>

        {hazardError && (
          <div className="worker-filter-banner danger">
            <span>
              알림 이벤트 API 연동 실패: {hazardError}
            </span>
          </div>
        )}

        <div className="notification-summary-grid">
          <div className="notification-stat panel">
            <span>전체 알림</span>
            <strong>
              {notifications.length}
            </strong>
          </div>

          <div className="notification-stat panel unread">
            <span>읽지 않음</span>
            <strong>{unreadCount}</strong>
          </div>

          <div className="notification-stat panel danger">
            <span>위험 알림</span>
            <strong>
              {
                notifications.filter(
                  (notification) =>
                    notification.level ===
                    'danger'
                ).length
              }
            </strong>
          </div>
        </div>

        <section className="panel notification-center-panel">
          <div className="notification-tabs">
            <button
              className={
                tab === 'all' ? 'active' : ''
              }
              onClick={() => setTab('all')}
            >
              전체 <b>{notifications.length}</b>
            </button>

            <button
              className={
                tab === 'unread' ? 'active' : ''
              }
              onClick={() => setTab('unread')}
            >
              읽지 않음 <b>{unreadCount}</b>
            </button>
          </div>

          <div className="notification-page-list">
            {hazardLoading &&
            notifications.length === 0 ? (
              <div className="notification-empty">
                실제 위험 이벤트를 불러오는 중입니다.
              </div>
            ) : shown.length > 0 ? (
              shown.map((item) => (
                <button
                  key={item.id}
                  className={`notification-page-row ${
                    item.read ? '' : 'unread'
                  } ${item.level}`}
                  onClick={() =>
                    openItem(item)
                  }
                >
                  <span
                    className={`notification-big-icon ${item.level}`}
                  >
                    <AlertTriangle size={18} />
                  </span>

                  <span className="notification-page-copy">
                    <span className="notification-page-title">
                      <strong>
                        {item.title}
                      </strong>

                      {!item.read && <em>NEW</em>}
                    </span>

                    <small>
                      {item.message}
                    </small>
                  </span>

                  <time>
                    {item.date}
                    <br />
                    {item.time}
                  </time>

                  <span className="notification-read-state">
                    {item.read ? (
                      '읽음'
                    ) : (
                      <>
                        <Circle
                          size={7}
                          fill="currentColor"
                        />
                        읽지 않음
                      </>
                    )}
                  </span>
                </button>
              ))
            ) : (
              <div className="notification-empty">
                {tab === 'unread'
                  ? '읽지 않은 알림이 없습니다.'
                  : '현재 서버에 위험 이벤트 알림이 없습니다.'}
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
