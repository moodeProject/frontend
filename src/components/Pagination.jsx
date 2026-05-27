import styles from './Pagination.module.css'

const DEFAULT_PAGE_SIZES = [5, 10, 20]

export default function Pagination({ page, totalPages, pageSize, onPage, onPageSize, pageSizes = DEFAULT_PAGE_SIZES }) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <div className={styles.wrap}>
      <div className={styles.pager}>
        <button
          className={styles.arrow}
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
        >
          ‹
        </button>

        {pages.map((p) => (
          <button
            key={p}
            className={`${styles.pageBtn} ${p === page ? styles.active : ''}`}
            onClick={() => onPage(p)}
          >
            {p}
          </button>
        ))}

        <button
          className={styles.arrow}
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
        >
          ›
        </button>
      </div>

      <select
        className={styles.sizeSelect}
        value={pageSize}
        onChange={(e) => onPageSize(Number(e.target.value))}
      >
        {pageSizes.map((s) => (
          <option key={s} value={s}>{s}개씩 보기</option>
        ))}
      </select>
    </div>
  )
}
