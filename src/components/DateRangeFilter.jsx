import {
  CalendarDays,
  RotateCcw,
} from 'lucide-react';

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function quickRange(days) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));

  return {
    start: formatDate(start),
    end: formatDate(end),
  };
}

export default function DateRangeFilter({
  value,
  onChange,
  onReset,
}) {
  const applyQuick = (days) => {
    onChange(quickRange(days));
  };

  return (
    <div className="admin-date-filter">
      <span className="admin-date-filter-title">
        <CalendarDays size={14} />
        조회 기간
      </span>

      <button
        type="button"
        className="admin-date-quick"
        onClick={() => applyQuick(1)}
      >
        오늘
      </button>

      <button
        type="button"
        className="admin-date-quick"
        onClick={() => applyQuick(7)}
      >
        최근 7일
      </button>

      <button
        type="button"
        className="admin-date-quick"
        onClick={() => applyQuick(30)}
      >
        최근 30일
      </button>

      <div className="admin-date-inputs">
        <input
          type="date"
          value={value.start}
          max={value.end || undefined}
          onChange={(event) =>
            onChange({
              ...value,
              start: event.target.value,
            })
          }
          aria-label="시작일"
        />
        <span>~</span>
        <input
          type="date"
          value={value.end}
          min={value.start || undefined}
          onChange={(event) =>
            onChange({
              ...value,
              end: event.target.value,
            })
          }
          aria-label="종료일"
        />
      </div>

      <button
        type="button"
        className="admin-date-reset"
        onClick={onReset}
      >
        <RotateCcw size={13} />
        전체
      </button>
    </div>
  );
}
