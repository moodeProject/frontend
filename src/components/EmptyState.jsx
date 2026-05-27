import styles from './EmptyState.module.css'

/**
 * 빈 데이터 상태 표시 컴포넌트
 * @param {string} icon    - 이모지 아이콘
 * @param {string} title   - 제목
 * @param {string} desc    - 설명 (선택)
 * @param {node}   action  - 버튼 등 액션 (선택)
 */
export default function EmptyState({
  icon = '📭',
  title = '데이터가 없습니다.',
  desc,
  action,
}) {
  return (
    <div className={styles.wrap}>
      <div className={styles.icon}>{icon}</div>
      <p className={styles.title}>{title}</p>
      {desc && <p className={styles.desc}>{desc}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  )
}
