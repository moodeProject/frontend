import styles from './AuthLayout.module.css'

export default function AuthLayout({ children }) {
  return (
    <div className={styles.shell}>
      {/* 왼쪽: 로고 영역 (나중에 로고 삽입) */}
      <div className={styles.left}>
        {/* TODO: 로고 디자인 완성 후 여기에 삽입 */}
      </div>

      {/* 오른쪽: 폼 영역 */}
      <div className={styles.right}>
        {children}
      </div>
    </div>
  )
}
