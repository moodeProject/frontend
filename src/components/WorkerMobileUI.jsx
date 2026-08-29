import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Bell,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock3,
  HardHat,
  Home,
  LogOut,
  Menu,
  Settings,
  ShieldAlert,
  Users,
  X,
} from 'lucide-react';
import { getWorkerProfile } from '../utils/workerProfile';

const WORK_STATUS_META = {
  '근무 중': { key: 'work', label: '작업 중', description: '현재 현장 작업 중입니다.' },
  '작업 중': { key: 'work', label: '작업 중', description: '현재 현장 작업 중입니다.' },
  '휴식 중': { key: 'rest', label: '휴식 중', description: '휴식 상태입니다.' },
  '퇴근': { key: 'off', label: '퇴근', description: '오늘 근무가 종료되었습니다.' },
  '퇴근 완료': { key: 'off', label: '퇴근', description: '오늘 근무가 종료되었습니다.' },
  '출근 전': { key: 'off', label: '출근 전', description: '아직 근무를 시작하지 않았습니다.' },
  '위험': { key: 'danger', label: '위험', description: '안전 확인이 필요한 상태입니다.' },
};

function getWorkStatusMeta(status) {
  return WORK_STATUS_META[status] || { key: 'work', label: status || '작업 중', description: '현재 상태를 확인 중입니다.' };
}

export function WorkerHeader({ title, subtitle, back = false, onMenu }) {
  const navigate = useNavigate();
  return (
    <header className="worker-mobile-header">
      <div className="worker-mobile-header-left">
        {back && (
          <button className="worker-round-icon" onClick={() => navigate(-1)} aria-label="뒤로가기">
            <ChevronLeft size={21} />
          </button>
        )}
        <div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      <button className="worker-round-icon" onClick={onMenu} aria-label="메뉴 열기">
        <Menu size={20} />
      </button>
    </header>
  );
}

export function WorkerBottomNav({ active = 'home' }) {
  const items = [
    { key: 'home', label: '홈', to: '/worker/home', icon: Home },
    { key: 'alerts', label: '알림', to: '/worker/alerts', icon: Bell, badge: 3 },
    { key: 'sos', label: 'SOS', to: '/worker/sos', icon: ShieldAlert },
    { key: 'nearby', label: '주변', to: '/worker/nearby', icon: Users },
  ];

  return (
    <nav className="worker-bottom-nav">
      {items.map(({ key, label, to, icon: Icon, badge }) => (
        <NavLink key={key} to={to} className={`worker-bottom-item ${active === key ? 'active' : ''} ${key === 'sos' ? 'sos' : ''}`}>
          <span className="worker-bottom-icon-wrap">
            <Icon size={20} />
            {badge ? <b>{badge}</b> : null}
          </span>
          <small>{label}</small>
        </NavLink>
      ))}
    </nav>
  );
}

export function WorkerDrawer({ open, onClose }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(getWorkerProfile);
  const [workStatus, setWorkStatus] = useState(() => localStorage.getItem('safehelmet_worker_current_status') || '근무 중');

  useEffect(() => {
    if (open) {
      setProfile(getWorkerProfile());
      setWorkStatus(localStorage.getItem('safehelmet_worker_current_status') || '근무 중');
    }
    const sync = () => setProfile(getWorkerProfile());
    const syncStatus = () => setWorkStatus(localStorage.getItem('safehelmet_worker_current_status') || '근무 중');
    window.addEventListener('safehelmet-worker-profile-updated', sync);
    window.addEventListener('safehelmet-worker-status-updated', syncStatus);
    window.addEventListener('storage', syncStatus);
    return () => {
      window.removeEventListener('safehelmet-worker-profile-updated', sync);
      window.removeEventListener('safehelmet-worker-status-updated', syncStatus);
      window.removeEventListener('storage', syncStatus);
    };
  }, [open]);

  if (!open) return null;

  const statusMeta = getWorkStatusMeta(workStatus);

  const logout = () => {
    localStorage.removeItem('safehelmet_worker_session');
    navigate('/worker/login', { replace: true });
  };

  const menuItems = [
    { label: '출퇴근 관리', icon: Clock3, color: 'blue', to: '/worker/attendance' },
    { label: '내 기록', icon: BookOpen, color: 'green', to: '/worker/records' },
    { label: '주변 작업자', icon: Users, color: 'purple', to: '/worker/nearby' },
    { label: '설정 · 회원정보', icon: Settings, color: 'gray', to: '/worker/settings' },
  ];

  return (
    <div className="worker-drawer-overlay" onClick={onClose}>
      <aside className="worker-drawer" onClick={(e) => e.stopPropagation()}>
        <div className={`worker-drawer-head ${statusMeta.key}`}>
          <div className={`worker-drawer-symbol ${profile.photo ? 'has-photo' : ''}`}>
            {profile.photo ? <img src={profile.photo} alt="프로필" /> : <HardHat size={24} />}
          </div>
          <button onClick={onClose}><X size={20} /></button>
          <h2>{profile.name || '김현석'}</h2>
          <p>사번: {profile.employeeNo || 'WK-20241103'} · {profile.location || 'B구역 3층'}</p>
          <div className="worker-drawer-status-wrap"><span className={`worker-drawer-status ${statusMeta.key}`}>{statusMeta.label}</span><small>{statusMeta.description}</small></div>
        </div>
        <div className="worker-drawer-menu">
          {menuItems.map(({ label, icon: Icon, color, to }) => (
            <button key={label} onClick={() => { navigate(to); onClose(); }}>
              <i className={color}><Icon size={19} /></i>
              <strong>{label}</strong>
              <ChevronRight size={18} />
            </button>
          ))}
        </div>
        <button className="worker-drawer-logout" onClick={logout}>
          <LogOut size={17} /> 로그아웃
        </button>
      </aside>
    </div>
  );
}

export function WorkerScaffold({ children, active = 'home', title, subtitle, back = false, hideNav = false, header = true, className = '' }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  return (
    <div className={`worker-mobile-shell ${className}`}>
      {header && <WorkerHeader title={title} subtitle={subtitle} back={back} onMenu={() => setDrawerOpen(true)} />}
      <main className={`worker-mobile-content ${hideNav ? 'no-nav' : ''}`}>{children}</main>
      {!hideNav && <WorkerBottomNav active={active} />}
      <WorkerDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
