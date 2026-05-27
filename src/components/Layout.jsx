import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Layout.module.css'

const NAV_ITEMS = [
  { path: '/',           label: '대시보드',      icon: '⊞' },
  { path: '/workers',    label: '작업자 관리',    icon: '👥' },
  { path: '/monitoring', label: '실시간 모니터링', icon: '🖥' },
  { path: '/events',     label: '위험 이벤트',    icon: '⚠️' },
  { path: '/records',    label: '작업 기록',      icon: '🕐' },
  { path: '/zones',      label: '안전 구역 관리',  icon: '📍' },
  { path: '/stats',      label: '통계 분석',      icon: '📊' },
  { path: '/settings',   label: '시스템 설정',    icon: '⚙️' },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const [sideOpen, setSideOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className={styles.shell}>
      {/* 모바일 오버레이 */}
      {sideOpen && (
        <div className={styles.overlay} onClick={() => setSideOpen(false)} />
      )}

      <aside className={`${styles.sidebar} ${sideOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.brand}>
          <div className={styles.brandLogo}>
            <span className={styles.brandIcon}>◈</span>
          </div>
          <div>
            <div className={styles.brandName}>Smart Safety</div>
            <div className={styles.brandSub}>Helmet System</div>
          </div>
        </div>

        <nav className={styles.nav}>
          {NAV_ITEMS.map(({ path, label, icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              onClick={() => setSideOpen(false)}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
              }
            >
              <span className={styles.navIcon}>{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* 로그인 사용자 정보 */}
        <div className={styles.userInfo}>
          <div className={styles.userAvatar}>
            {user?.name?.[0] ?? '관'}
          </div>
          <div className={styles.userText}>
            <div className={styles.userName}>{user?.name ?? '관리자'}</div>
            <div className={styles.userRole}>{user?.role ?? '-'}</div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout} title="로그아웃">
            ⏻
          </button>
        </div>

        <div className={styles.emergency}>
          <span className={styles.emergencyIcon}>📞</span>
          <div>
            <div className={styles.emergencyLabel}>긴급연락</div>
            <div className={styles.emergencyNumber}>02-123-4567</div>
          </div>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.header}>
          {/* 모바일 햄버거 */}
          <button className={styles.hamburger} onClick={() => setSideOpen((v) => !v)}>
            ☰
          </button>
          <div className={styles.headerRight}>
            <button className={styles.bell}>🔔</button>
            <div className={styles.adminInfo}>
              <div className={styles.adminAvatar}>
                {user?.name?.[0] ?? '관'}
              </div>
              <div>
                <div className={styles.adminName}>{user?.name ?? '관리자'}</div>
                <div className={styles.adminId}>{user?.id ?? 'admin01'}</div>
              </div>
            </div>
          </div>
        </header>

        <div className={styles.content}>{children}</div>
      </div>
    </div>
  )
}
