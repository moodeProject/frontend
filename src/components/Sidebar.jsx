import { AlertTriangle, FileText, Grid2X2, HardHat, LogOut, UserRound, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDetections } from '../context/DetectionContext';

const items = [
  { to: '/', label: '통합 모니터링', icon: Grid2X2 },
  { to: '/detections', label: '이상 감지', icon: AlertTriangle, detectionBadge: true },
  { to: '/workers', label: '작업자 상태', icon: Users },
  { to: '/records', label: '사고·알림 기록', icon: FileText },
  { to: '/helmets', label: '헬멧 관리', icon: HardHat },
];

function currentAdmin() {
  try {
    return JSON.parse(localStorage.getItem('safehelmet_current_admin') || '{}');
  } catch {
    return {};
  }
}

export default function Sidebar() {
  const navigate = useNavigate();
  const { unresolvedDangerCount } = useDetections();
  const [menuOpen, setMenuOpen] = useState(false);
  const [admin, setAdmin] = useState(currentAdmin);
  const menuRef = useRef(null);

  useEffect(() => {
    const close = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    };
    const syncAdmin = () => setAdmin(currentAdmin());
    document.addEventListener('mousedown', close);
    window.addEventListener('safehelmet-admin-profile-updated', syncAdmin);
    window.addEventListener('storage', syncAdmin);
    return () => {
      document.removeEventListener('mousedown', close);
      window.removeEventListener('safehelmet-admin-profile-updated', syncAdmin);
      window.removeEventListener('storage', syncAdmin);
    };
  }, []);

  const logout = () => {
    localStorage.removeItem('safehelmet_current_admin');
    navigate('/login', { replace: true });
  };

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">⌄</div>
        <div>
          <div className="brand-title">SAFE HELMET</div>
          <div className="brand-sub">SAFETY SYSTEM</div>
        </div>
      </div>
      <nav className="side-nav">
        {items.map(({ to, label, icon: Icon, detectionBadge }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `side-item ${isActive ? 'active' : ''}`}>
            <Icon size={17} strokeWidth={1.8} />
            <span>{label}</span>
            {detectionBadge && unresolvedDangerCount > 0 && (
              <span className="nav-badge" title={`확인이 필요한 위험 감지 ${unresolvedDangerCount}건`}>
                {unresolvedDangerCount > 9 ? '9+' : unresolvedDangerCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="admin-menu-wrap" ref={menuRef}>
        {menuOpen && (
          <div className="admin-popover">
            <button onClick={() => { setMenuOpen(false); navigate('/mypage'); }}><UserRound size={14}/> 마이페이지</button>
            <button className="logout" onClick={logout}><LogOut size={14}/> 로그아웃</button>
          </div>
        )}
        <button className="admin-box" onClick={() => setMenuOpen((v) => !v)}>
          <div className="admin-avatar">{(admin.name || '관리자').slice(0, 1)}</div>
          <div className="admin-copy">
            <div className="admin-name">{admin.name || '관리자'}</div>
            <div className="admin-email">{admin.email || 'admin@safehelmet.kr'}</div>
          </div>
          <span className="admin-more">•••</span>
        </button>
      </div>
    </aside>
  );
}
