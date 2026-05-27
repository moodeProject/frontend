import styles from './Spinner.module.css'

/**
 * 로딩 스피너
 * @param {string} size   - 'sm' | 'md'(기본) | 'lg'
 * @param {string} text   - 스피너 아래 표시할 텍스트 (선택)
 * @param {boolean} fullPage - 페이지 전체 중앙에 표시할지 여부
 */
export default function Spinner({ size = 'md', text, fullPage = false }) {
  const spinner = (
    <div className={styles.wrap}>
      <div className={`${styles.ring} ${styles[size]}`} />
      {text && <p className={styles.text}>{text}</p>}
    </div>
  )

  if (fullPage) {
    return <div className={styles.fullPage}>{spinner}</div>
  }
  return spinner
}
