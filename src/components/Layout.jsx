import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Layout.module.css'

const NAV_ITEMS = [
  { path: '/',         label: '통합 모니터링', icon: '⊞' },
  { path: '/anomaly',  label: '이상 감지',     icon: '△' },
  { path: '/workers',  label: '작업자 상태',   icon: '👤' },
  { path: '/logs',     label: '사고·알림 기록', icon: '📄' },
  { path: '/helmets',  label: '헬멧 관리',     icon: '⛑' },
]

function useClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const now = useClock()

  const days = ['일','월','화','수','목','금','토']
  const dateStr = `${now.getMonth()+1}월 ${now.getDate()}일 (${days[now.getDay()]})`
  const timeStr = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })

  function handleLogout() { logout(); navigate('/login') }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandLogo}>O</div>
          <div>
            <div className={styles.brandName}>SAFE HELMET</div>
            <div className={styles.brandSub}>SAFETY SYSTEM</div>
          </div>
        </div>

        <nav className={styles.nav}>
          {NAV_ITEMS.map(({ path, label, icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/' || path === '/anomaly'}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            >
              <span className={styles.navIcon}>{icon}</span>
              <span>{label}</span>
              {path === '/anomaly' && <span className={styles.navBadge}>1</span>}
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarBottom}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>{user?.name?.[0] ?? '관'}</div>
            <div className={styles.userText}>
              <div className={styles.userName}>{user?.name ?? '관리자'}</div>
              <div className={styles.userEmail}>{user?.id ? `${user.id}@safehelmet.kr` : 'admin@safehelmet.kr'}</div>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout} title="로그아웃">⏻</button>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerLeft} />
          <div className={styles.headerRight}>
            <span className={styles.clock}>{dateStr} · {timeStr}</span>
            <span className={styles.dangerBadge}>● 위험 1명</span>
            <span className={styles.warningBadge}>● 주의 3명</span>
            <div className={styles.bellWrap}>
              <span className={styles.bell}>🔔</span>
              <span className={styles.bellCount}>4</span>
            </div>
          </div>
        </header>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  )
}
