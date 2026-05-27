import { NavLink } from 'react-router-dom'
import styles from './Layout.module.css'

const NAV_ITEMS = [
  { path: '/', label: '대시보드', icon: '⊞' },
  { path: '/workers', label: '작업자 관리', icon: '👥' },
  { path: '/monitoring', label: '실시간 모니터링', icon: '🖥' },
  { path: '/events', label: '위험 이벤트', icon: '⚠️' },
  { path: '/records', label: '작업 기록', icon: '🕐' },
  { path: '/zones', label: '안전 구역 관리', icon: '📍' },
  { path: '/stats', label: '통계 분석', icon: '📊' },
  { path: '/settings', label: '시스템 설정', icon: '⚙️' },
]

export default function Layout({ children }) {
  const now = new Date()
  const formatted = now.toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    weekday: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit',
  })

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
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
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
              }
            >
              <span className={styles.navIcon}>{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

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
          <div />
          <div className={styles.headerRight}>
            <button className={styles.bell}>🔔</button>
            <div className={styles.adminInfo}>
              <div className={styles.adminAvatar}>👤</div>
              <div>
                <div className={styles.adminName}>관리자</div>
                <div className={styles.adminId}>admin01</div>
              </div>
              <span>∨</span>
            </div>
          </div>
        </header>

        <div className={styles.content}>{children}</div>
      </div>
    </div>
  )
}
