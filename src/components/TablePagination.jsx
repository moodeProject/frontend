import './TablePagination.css';

const OPTIONS = [10, 20, 50, 'all'];

export default function TablePagination({ total, page, pageSize, onPageChange, onPageSizeChange }) {
  const all = pageSize === 'all';
  const totalPages = all ? 1 : Math.max(1, Math.ceil(total / Number(pageSize)));
  const current = Math.min(Math.max(1, page), totalPages);
  const start = total === 0 ? 0 : (all ? 1 : (current - 1) * Number(pageSize) + 1);
  const end = all ? total : Math.min(total, current * Number(pageSize));
  const windowStart = Math.max(1, Math.min(current - 2, totalPages - 4));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => windowStart + i);

  return (
    <nav className="table-pagination" aria-label="목록 페이지 이동">
      <div className="table-pagination-summary">전체 <strong>{total.toLocaleString('ko-KR')}</strong>건 · {start}–{end}건 표시</div>
      <div className="table-pagination-controls">
        {!all && totalPages > 1 && (
          <div className="table-pagination-pages">
            <button type="button" disabled={current === 1} onClick={() => onPageChange(1)} aria-label="첫 페이지">«</button>
            <button type="button" disabled={current === 1} onClick={() => onPageChange(current - 1)} aria-label="이전 페이지">‹</button>
            {pages.map(number => (
              <button key={number} type="button" className={number === current ? 'active' : ''} aria-current={number === current ? 'page' : undefined} onClick={() => onPageChange(number)}>{number}</button>
            ))}
            <button type="button" disabled={current === totalPages} onClick={() => onPageChange(current + 1)} aria-label="다음 페이지">›</button>
            <button type="button" disabled={current === totalPages} onClick={() => onPageChange(totalPages)} aria-label="마지막 페이지">»</button>
          </div>
        )}
        <label className="table-pagination-size">페이지당
          <select value={String(pageSize)} onChange={e => onPageSizeChange(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
            {OPTIONS.map(value => <option key={value} value={String(value)}>{value === 'all' ? '전체보기' : value + '개'}</option>)}
          </select>
        </label>
      </div>
    </nav>
  );
}
