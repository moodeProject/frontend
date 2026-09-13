import { useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FilePenLine,
  MoonStar,
  Plus,
  TimerReset,
  Umbrella,
  X,
} from 'lucide-react';
import { WorkerScaffold } from '../../components/WorkerMobileUI';

const HISTORY_KEY = 'safehelmet_worker_attendance_history_v2';
const REQUEST_KEY = 'safehelmet_worker_attendance_requests_v2';

const defaultHistory = [
  { id: 1, date: '08.29', day: '금', type: '근무', start: '08:58', end: '18:07', total: '8시간 09분', overtime: '0시간 07분', status: '정상' },
  { id: 2, date: '08.28', day: '목', type: '야근', start: '08:55', end: '21:16', total: '11시간 21분', overtime: '3시간 16분', status: '승인' },
  { id: 3, date: '08.27', day: '수', type: '근무', start: '09:01', end: '18:03', total: '8시간 02분', overtime: '-', status: '정상' },
  { id: 4, date: '08.26', day: '화', type: '연차', start: '-', end: '-', total: '1일', overtime: '-', status: '승인' },
  { id: 5, date: '08.25', day: '월', type: '근무', start: '08:51', end: '19:35', total: '9시간 44분', overtime: '1시간 35분', status: '정상' },
  { id: 6, date: '08.22', day: '금', type: '근무', start: '08:59', end: '18:01', total: '8시간 02분', overtime: '-', status: '정상' },
];

function loadHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || 'null');
    return Array.isArray(saved) && saved.length ? saved : defaultHistory;
  } catch {
    return defaultHistory;
  }
}

function loadRequests() {
  try {
    return JSON.parse(localStorage.getItem(REQUEST_KEY) || '[]');
  } catch {
    return [];
  }
}

const requestMeta = {
  연차: { icon: Umbrella, className: 'leave', label: '연차 신청' },
  야근: { icon: MoonStar, className: 'overtime', label: '야근 등록' },
  근무수정: { icon: FilePenLine, className: 'edit', label: '근무 수정 요청' },
};

export default function WorkerAttendance() {
  const [tab, setTab] = useState('history');
  const [historyFilter, setHistoryFilter] = useState('전체');
  const [month, setMonth] = useState({ year: 2026, month: 8 });
  const [history] = useState(loadHistory);
  const [requests, setRequests] = useState(loadRequests);
  const [modalType, setModalType] = useState('');
  const [form, setForm] = useState({ date: '2026-08-31', start: '18:00', end: '21:00', reason: '' });
  const [message, setMessage] = useState('');

  const isDemoMonth = month.year === 2026 && month.month === 8;
  const summary = useMemo(() => isDemoMonth
    ? ({ work: 18, overtime: 4, leave: 1, hours: '152h 40m' })
    : ({ work: 0, overtime: 0, leave: 0, hours: '0h 00m' }), [isDemoMonth]);
  const monthHistory = isDemoMonth ? history : [];
  const filteredHistory = historyFilter === '전체' ? monthHistory : monthHistory.filter((item) => item.type === historyFilter);
  const monthLabel = `${month.year}년 ${month.month}월`;
  const shiftMonth = (delta) => setMonth((current) => {
    const date = new Date(current.year, current.month - 1 + delta, 1);
    return { year: date.getFullYear(), month: date.getMonth() + 1 };
  });

  const submitRequest = (e) => {
    e.preventDefault();
    if (!form.date) return;
    const item = {
      id: Date.now(),
      type: modalType,
      date: form.date,
      start: modalType === '연차' ? '-' : form.start,
      end: modalType === '연차' ? '-' : form.end,
      reason: form.reason || '사유 미입력',
      status: '승인 대기',
      createdAt: new Date().toISOString(),
    };
    const next = [item, ...requests];
    setRequests(next);
    localStorage.setItem(REQUEST_KEY, JSON.stringify(next));
    setModalType('');
    setForm((v) => ({ ...v, reason: '' }));
    setMessage('신청이 접수되었습니다. 관리자 승인 후 반영됩니다.');
    setTab('requests');
  };

  return (
    <WorkerScaffold active="home" title="출퇴근 관리" back>
      <section className="worker-white-card worker-attendance-month-card">
        <div className="worker-attendance-month-head">
          <button aria-label="이전 달" onClick={() => shiftMonth(-1)}><ChevronLeft size={18}/></button>
          <strong>{monthLabel}</strong>
          <button aria-label="다음 달" onClick={() => shiftMonth(1)}><ChevronRight size={18}/></button>
        </div>
        <div className="worker-attendance-summary-grid">
          <div><span>정상 근무</span><b>{summary.work}<small>일</small></b></div>
          <div><span>야근</span><b className="orange">{summary.overtime}<small>회</small></b></div>
          <div><span>연차</span><b className="blue">{summary.leave}<small>일</small></b></div>
          <div><span>총 근무</span><b>{summary.hours}</b></div>
        </div>
      </section>

      <section className="worker-white-card worker-attendance-request-card">
        <div className="worker-card-title"><strong>근태 관리</strong><span className="worker-attendance-helper">필요한 항목을 직접 신청하세요</span></div>
        <div className="worker-attendance-request-actions">
          {Object.entries(requestMeta).map(([key, meta]) => {
            const Icon = meta.icon;
            return <button key={key} className={meta.className} onClick={() => setModalType(key)}><i><Icon size={19}/></i><strong>{meta.label}</strong><small>신청하기</small></button>;
          })}
        </div>
      </section>

      <div className="worker-attendance-tabs">
        <button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>근무 내역</button>
        <button className={tab === 'requests' ? 'active' : ''} onClick={() => setTab('requests')}>신청 내역 <span>{requests.length}</span></button>
      </div>

      {message && <div className="worker-attendance-message">✓ {message}</div>}

      {tab === 'history' ? (
        <section className="worker-white-card worker-attendance-history">
          <div className="worker-card-title"><strong>{month.month}월 근무 기록</strong><span className="worker-attendance-count">{monthHistory.length ? `최근 ${monthHistory.length}건` : `기록 없음`}</span></div>
          <div className="worker-attendance-filter-chips">{['전체','근무','야근','연차'].map((item) => <button key={item} className={historyFilter === item ? 'active' : ''} onClick={() => setHistoryFilter(item)}>{item}</button>)}</div>
          {filteredHistory.length === 0 && <div className="worker-attendance-empty"><CalendarDays size={28}/><strong>{monthLabel} 근무 기록이 없습니다.</strong><p>다른 달을 선택해 확인해보세요.</p></div>}
          {filteredHistory.map((item) => (
            <article key={item.id} className="worker-attendance-history-row">
              <div className="worker-attendance-date"><b>{item.date}</b><small>{item.day}</small></div>
              <div className="worker-attendance-history-main">
                <div><strong>{item.type}</strong><span className={`worker-attendance-type ${item.type === '연차' ? 'leave' : item.type === '야근' ? 'overtime' : 'work'}`}>{item.status}</span></div>
                <p>{item.type === '연차' ? '연차 사용' : `${item.start} - ${item.end}`}</p>
              </div>
              <div className="worker-attendance-history-time"><b>{item.total}</b><small>{item.overtime !== '-' ? `야근 ${item.overtime}` : '정상 근무'}</small></div>
            </article>
          ))}
        </section>
      ) : (
        <section className="worker-white-card worker-attendance-history">
          <div className="worker-card-title"><strong>근태 신청 내역</strong><span className="worker-attendance-count">{requests.length}건</span></div>
          {requests.length === 0 ? (
            <div className="worker-attendance-empty"><CalendarDays size={28}/><strong>신청 내역이 없습니다.</strong><p>연차, 야근, 근무 수정 요청을 이곳에서 확인할 수 있습니다.</p></div>
          ) : requests.map((item) => (
            <article key={item.id} className="worker-attendance-history-row request">
              <div className="worker-attendance-date request"><CalendarDays size={18}/></div>
              <div className="worker-attendance-history-main">
                <div><strong>{requestMeta[item.type]?.label || item.type}</strong><span className="worker-attendance-type pending">{item.status}</span></div>
                <p>{item.date}{item.start !== '-' ? ` · ${item.start} - ${item.end}` : ''}</p>
                <small>{item.reason}</small>
              </div>
            </article>
          ))}
        </section>
      )}

      {modalType && (
        <div className="worker-modal-overlay" onClick={() => setModalType('')}>
          <form className="worker-attendance-modal" onSubmit={submitRequest} onClick={(e) => e.stopPropagation()}>
            <div className="worker-attendance-modal-head"><div><h3>{requestMeta[modalType]?.label}</h3><p>내용을 입력하면 관리자에게 승인 요청됩니다.</p></div><button type="button" onClick={() => setModalType('')}><X size={18}/></button></div>
            <label><span>날짜</span><input type="date" value={form.date} onChange={(e) => setForm((v) => ({...v, date: e.target.value}))}/></label>
            {modalType !== '연차' && <div className="worker-attendance-time-fields"><label><span>시작 시간</span><input type="time" value={form.start} onChange={(e) => setForm((v) => ({...v, start: e.target.value}))}/></label><label><span>종료 시간</span><input type="time" value={form.end} onChange={(e) => setForm((v) => ({...v, end: e.target.value}))}/></label></div>}
            <label><span>사유</span><textarea value={form.reason} onChange={(e) => setForm((v) => ({...v, reason: e.target.value}))} placeholder="사유를 입력해주세요"/></label>
            <div className="worker-attendance-modal-note"><TimerReset size={15}/> 승인 전까지 신청 내역에서 상태를 확인할 수 있습니다.</div>
            <button className="worker-primary-btn" type="submit"><Plus size={16}/> 신청하기</button>
          </form>
        </div>
      )}
    </WorkerScaffold>
  );
}
