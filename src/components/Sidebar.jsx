import { Activity, AlertTriangle, FileText, Grid2X2, HardHat, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const items = [
  { to: '/', label: '통합 모니터링', icon: Grid2X2 },
  { to: '/detections', label: '이상 감지', icon: AlertTriangle, badge: '1' },
  { to: '/workers', label: '작업자 상태', icon: Users },
  { to: '/records', label: '사고·알림 기록', icon: FileText },
  { to: '/helmets', label: '헬멧 관리', icon: HardHat },
];

export default function Sidebar() {
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
        {items.map(({ to, label, icon: Icon, badge }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `side-item ${isActive ? 'active' : ''}`}>
            <Icon size={17} strokeWidth={1.8} />
            <span>{label}</span>
            {badge && <span className="nav-badge">{badge}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="admin-box">
        <div className="admin-avatar">관</div>
        <div>
          <div className="admin-name">관리자</div>
          <div className="admin-email">admin@safehelmet.kr</div>
        </div>
      </div>
    </aside>
  );
}
