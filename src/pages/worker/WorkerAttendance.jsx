import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  BriefcaseBusiness,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Coffee,
  FilePenLine,
  LogOut,
  MoonStar,
  Plus,
  TimerReset,
  Umbrella,
  X,
} from 'lucide-react';
import { WorkerScaffold } from '../../components/WorkerMobileUI';
import {
  checkIn,
  checkOut,
  createAttendanceRequest,
  getAttendanceHistory,
  getAttendanceRequests,
} from '../../api/attendance';
import { useWorkers } from '../../context/WorkerContext';
import { getWorkerProfile } from '../../utils/workerProfile';

const REQUEST_KEY =
  'safehelmet_worker_attendance_requests_v2';

const requestMeta = {
  연차: { icon: Umbrella, className: 'leave', label: '연차 신청' },
  야근: { icon: MoonStar, className: 'overtime', label: '야근 등록' },
  근무수정: { icon: FilePenLine, className: 'edit', label: '근무 수정 요청' },
};

function formatMinutes(minutes) {
  const value = Number(minutes);

  if (!Number.isFinite(value)) return '-';

  return `${Math.floor(value / 60)}시간 ${value % 60}분`;
}

function mapAttendanceItem(item) {
  const workDate = item?.workDate || item?.date || '';
  const start =
    item?.checkInAt ||
    item?.startAt ||
    item?.startTime ||
    '';
  const end =
    item?.checkOutAt ||
    item?.endAt ||
    item?.endTime ||
    '';

  const type =
    item?.type === 'OVERTIME'
      ? '야근'
      : item?.type === 'LEAVE'
        ? '연차'
        : '근무';

  const startText = start
    ? String(start).includes('T')
      ? String(start).slice(11, 16)
      : String(start).slice(0, 5)
    : '-';

  const endText = end
    ? String(end).includes('T')
      ? String(end).slice(11, 16)
      : String(end).slice(0, 5)
    : '-';

  return {
    ...item,
    id:
      item?.attendanceId ??
      item?.id ??
      `${workDate}-${startText}`,
    date: workDate
      ? workDate.slice(5, 10).replace('-', '.')
      : '',
    day: workDate
      ? ['일','월','화','수','목','금','토'][
          new Date(workDate).getDay()
        ]
      : '',
    type,
    start: startText,
    end: endText,
    total:
      item?.totalWorkMinutes !== undefined &&
      item?.totalWorkMinutes !== null
        ? formatMinutes(item.totalWorkMinutes)
        : item?.totalWorkTime || '-',
    overtime:
      item?.overtimeMinutes
        ? formatMinutes(item.overtimeMinutes)
        : '-',
    status:
      item?.statusLabel ||
      item?.status ||
      '정상',
  };
}

function mapRequestItem(item) {
  return {
    ...item,
    id:
      item?.requestId ??
      item?.id,
    type:
      item?.type === 'LEAVE'
        ? '연차'
        : item?.type === 'OVERTIME'
          ? '야근'
          : '근무수정',
    date:
      item?.startDate ||
      item?.date ||
      '',
    start:
      item?.startTime ||
      '-',
    end:
      item?.endTime ||
      '-',
    reason:
      item?.reason || '',
    status:
      item?.status === 'PENDING'
        ? '승인 대기'
        : item?.status === 'APPROVED'
          ? '승인'
          : item?.status === 'REJECTED'
            ? '반려'
            : item?.status ||
              '승인 대기',
  };
}

export default function WorkerAttendance() {
  const [tab, setTab] = useState('history');
  const [historyFilter, setHistoryFilter] =
    useState('전체');

  const [month, setMonth] = useState(() => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    };
  });

  const [history, setHistory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [modalType, setModalType] = useState('');
  const [form, setForm] = useState({
    date: '',
    start: '18:00',
    end: '21:00',
    reason: '',
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [currentStatus, setCurrentStatus] =
    useState(
      () =>
        localStorage.getItem(
          'safehelmet_worker_current_status'
        ) || '출근 전'
    );

  const profile = getWorkerProfile();
  const { workers } = useWorkers();

  const currentWorker = useMemo(
    () =>
      workers.find(
        (item) =>
          (profile.employeeNo &&
            String(
              item.employeeNumber ||
                item.workerCode ||
                ''
            ) === String(profile.employeeNo)) ||
          (profile.helmetNo &&
            String(item.helmetId || '') ===
              String(profile.helmetNo)) ||
          (profile.name &&
            String(item.name || '') ===
              String(profile.name))
      ) || null,
    [
      workers,
      profile.employeeNo,
      profile.helmetNo,
      profile.name,
    ]
  );

  const workerId =
    currentWorker?.id ||
    currentWorker?.workerId ||
    profile.workerId ||
    profile.userId ||
    '';

  const attendanceIdentity =
    profile.employeeNo ||
    currentWorker?.employeeNumber ||
    currentWorker?.workerCode ||
    workerId;

  const monthStr =
    `${month.year}-${String(month.month).padStart(2, '0')}`;

  const refreshAttendance = async () => {
    if (!workerId) {
      setHistory([]);
      setRequests([]);
      return;
    }

    setLoading(true);

    try {
      const [historyRows, requestRows] =
        await Promise.all([
          getAttendanceHistory(workerId, monthStr),
          getAttendanceRequests(workerId),
        ]);

      setHistory(historyRows.map(mapAttendanceItem));
      setRequests(requestRows.map(mapRequestItem));
    } catch (e) {
      setHistory([]);
      setRequests([]);
      setMessage(
        e?.message ||
          '근태 정보를 불러오지 못했습니다.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAttendance();
  }, [workerId, monthStr]);

  useEffect(() => {
    localStorage.setItem(
      REQUEST_KEY,
      JSON.stringify(requests)
    );
  }, [requests]);

  const applyLocalStatus = (status) => {
    localStorage.setItem(
      'safehelmet_worker_current_status',
      status
    );

    localStorage.setItem(
      'safeon_worker_manual_status_updated_at',
      new Date().toISOString()
    );

    setCurrentStatus(status);

    window.dispatchEvent(
      new CustomEvent(
        'safehelmet-worker-status-updated',
        {
          detail: {
            status,
            source: 'server-or-manual',
          },
        }
      )
    );
  };

  const setWorkStatus = async (status) => {
    setMessage('');

    try {
      if (status === '근무 중') {
        await checkIn(attendanceIdentity);
      } else if (status === '퇴근') {
        await checkOut(attendanceIdentity);
      }

      applyLocalStatus(status);

      setMessage(
        status === '휴식 중'
          ? '휴식 상태로 변경했습니다. 현재 서버에는 별도 휴식 상태 API가 없어 이 상태만 브라우저에 저장됩니다.'
          : `${status} 처리가 서버에 반영되었습니다.`
      );

      if (status !== '휴식 중') {
        await refreshAttendance();
      }
    } catch (e) {
      setMessage(
        e?.message ||
          `${status} 처리 중 오류가 발생했습니다.`
      );
    }
  };

  const summary = useMemo(() => {
    const workRows = history.filter(
      (item) => item.type !== '연차'
    );
    const overtimeRows = history.filter(
      (item) =>
        item.type === '야근' ||
        Number(item.overtimeMinutes || 0) > 0
    );
    const leaveRows = history.filter(
      (item) => item.type === '연차'
    );
    const totalMinutes = history.reduce(
      (sum, item) =>
        sum + Number(item.totalWorkMinutes || 0),
      0
    );

    return {
      work: workRows.length,
      overtime: overtimeRows.length,
      leave: leaveRows.length,
      hours: totalMinutes
        ? `${Math.floor(totalMinutes / 60)}h ${String(
            totalMinutes % 60
          ).padStart(2, '0')}m`
        : '0h 00m',
    };
  }, [history]);

  const filteredHistory =
    historyFilter === '전체'
      ? history
      : history.filter(
          (item) => item.type === historyFilter
        );

  const monthLabel =
    `${month.year}년 ${month.month}월`;

  const shiftMonth = (delta) =>
    setMonth((current) => {
      const date = new Date(
        current.year,
        current.month - 1 + delta,
        1
      );

      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
      };
    });

  const submitRequest = async (e) => {
    e.preventDefault();

    if (!form.date || !workerId) {
      setMessage(
        '작업자 정보와 신청 날짜를 확인해주세요.'
      );
      return;
    }

    const typeMap = {
      연차: 'LEAVE',
      야근: 'OVERTIME',
      근무수정: 'CORRECTION',
    };

    try {
      await createAttendanceRequest({
        workerId,
        type:
          typeMap[modalType] ||
          'CORRECTION',
        startDate: form.date,
        startTime:
          modalType === '연차'
            ? null
            : form.start,
        endTime:
          modalType === '연차'
            ? null
            : form.end,
        reason:
          form.reason || '',
      });

      setModalType('');
      setForm((value) => ({
        ...value,
        reason: '',
      }));
      setMessage(
        '신청이 서버에 접수되었습니다.'
      );
      setTab('requests');

      await refreshAttendance();
    } catch (e2) {
      setMessage(
        e2?.message ||
          '근태 신청을 서버에 접수하지 못했습니다.'
      );
    }
  };

  return (
    <WorkerScaffold
      active="home"
      title="출퇴근 관리"
      back
    >
      <section className="worker-white-card worker-manual-status-card">
        <div className="worker-card-title">
          <div>
            <strong>현재 근무 상태</strong>
            <small>
              출근·퇴근은 서버에 저장되고, 휴식 상태는 현재 브라우저에 표시됩니다.
            </small>
          </div>

          <span
            className={`worker-manual-current-status ${
              currentStatus === '근무 중'
                ? 'work'
                : currentStatus === '휴식 중'
                  ? 'rest'
                  : 'off'
            }`}
          >
            ● {currentStatus}
          </span>
        </div>

        <div className="worker-manual-status-actions">
          <button
            type="button"
            className={
              currentStatus === '근무 중'
                ? 'work active'
                : 'work'
            }
            onClick={() =>
              setWorkStatus('근무 중')
            }
          >
            <BriefcaseBusiness size={20} />
            <strong>출근</strong>
            <span>작업 시작</span>
          </button>

          <button
            type="button"
            className={
              currentStatus === '휴식 중'
                ? 'rest active'
                : 'rest'
            }
            onClick={() =>
              setWorkStatus('휴식 중')
            }
          >
            <Coffee size={20} />
            <strong>휴식</strong>
            <span>휴식 상태</span>
          </button>

          <button
            type="button"
            className={
              currentStatus === '퇴근'
                ? 'off active'
                : 'off'
            }
            onClick={() =>
              setWorkStatus('퇴근')
            }
          >
            <LogOut size={20} />
            <strong>퇴근</strong>
            <span>근무 종료</span>
          </button>
        </div>
      </section>

      <section className="worker-white-card worker-attendance-month-card">
        <div className="worker-attendance-month-head">
          <button
            aria-label="이전 달"
            onClick={() => shiftMonth(-1)}
          >
            <ChevronLeft size={18} />
          </button>

          <strong>{monthLabel}</strong>

          <button
            aria-label="다음 달"
            onClick={() => shiftMonth(1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="worker-attendance-summary-grid">
          <div>
            <span>정상 근무</span>
            <b>{summary.work}<small>일</small></b>
          </div>
          <div>
            <span>야근</span>
            <b className="orange">
              {summary.overtime}<small>회</small>
            </b>
          </div>
          <div>
            <span>연차</span>
            <b className="blue">
              {summary.leave}<small>일</small>
            </b>
          </div>
          <div>
            <span>총 근무</span>
            <b>{summary.hours}</b>
          </div>
        </div>
      </section>

      <section className="worker-white-card worker-attendance-request-card">
        <div className="worker-card-title">
          <strong>근태 관리</strong>
          <span className="worker-attendance-helper">
            필요한 항목을 직접 신청하세요
          </span>
        </div>

        <div className="worker-attendance-request-actions">
          {Object.entries(requestMeta).map(([key, meta]) => {
            const Icon = meta.icon;

            return (
              <button
                key={key}
                className={meta.className}
                onClick={() => setModalType(key)}
              >
                <i><Icon size={19} /></i>
                <strong>{meta.label}</strong>
                <small>신청하기</small>
              </button>
            );
          })}
        </div>
      </section>

      <div className="worker-attendance-tabs">
        <button
          className={tab === 'history' ? 'active' : ''}
          onClick={() => setTab('history')}
        >
          근무 내역
        </button>

        <button
          className={tab === 'requests' ? 'active' : ''}
          onClick={() => setTab('requests')}
        >
          신청 내역 <span>{requests.length}</span>
        </button>
      </div>

      {message && (
        <div className="worker-attendance-message">
          {message}
        </div>
      )}

      {loading && (
        <div className="worker-attendance-message">
          서버 근태 정보를 불러오는 중입니다.
        </div>
      )}

      {tab === 'history' ? (
        <section className="worker-white-card worker-attendance-history">
          <div className="worker-card-title">
            <strong>{month.month}월 근무 기록</strong>
            <span className="worker-attendance-count">
              {history.length
                ? `${history.length}건`
                : '기록 없음'}
            </span>
          </div>

          <div className="worker-attendance-filter-chips">
            {['전체','근무','야근','연차'].map((item) => (
              <button
                key={item}
                className={
                  historyFilter === item
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setHistoryFilter(item)
                }
              >
                {item}
              </button>
            ))}
          </div>

          {filteredHistory.length === 0 && (
            <div className="worker-attendance-empty">
              <CalendarDays size={28} />
              <strong>
                {monthLabel} 근무 기록이 없습니다.
              </strong>
              <p>
                서버에 저장된 근태 기록이 생기면 이곳에 표시됩니다.
              </p>
            </div>
          )}

          {filteredHistory.map((item) => (
            <article
              key={item.id}
              className="worker-attendance-history-row"
            >
              <div className="worker-attendance-date">
                <b>{item.date}</b>
                <small>{item.day}</small>
              </div>

              <div className="worker-attendance-history-main">
                <div>
                  <strong>{item.type}</strong>
                  <span
                    className={`worker-attendance-type ${
                      item.type === '연차'
                        ? 'leave'
                        : item.type === '야근'
                          ? 'overtime'
                          : 'work'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <p>
                  {item.type === '연차'
                    ? '연차 사용'
                    : `${item.start} - ${item.end}`}
                </p>
              </div>

              <div className="worker-attendance-history-time">
                <b>{item.total}</b>
                <small>
                  {item.overtime !== '-'
                    ? `야근 ${item.overtime}`
                    : '정상 근무'}
                </small>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="worker-white-card worker-attendance-history">
          <div className="worker-card-title">
            <strong>근태 신청 내역</strong>
            <span className="worker-attendance-count">
              {requests.length}건
            </span>
          </div>

          {requests.length === 0 ? (
            <div className="worker-attendance-empty">
              <CalendarDays size={28} />
              <strong>신청 내역이 없습니다.</strong>
              <p>
                서버에 접수된 연차, 야근, 근무 수정 요청을 확인할 수 있습니다.
              </p>
            </div>
          ) : requests.map((item) => (
            <article
              key={item.id}
              className="worker-attendance-history-row request"
            >
              <div className="worker-attendance-date request">
                <CalendarDays size={18} />
              </div>
              <div className="worker-attendance-history-main">
                <div>
                  <strong>
                    {requestMeta[item.type]?.label || item.type}
                  </strong>
                  <span className="worker-attendance-type pending">
                    {item.status}
                  </span>
                </div>
                <p>
                  {item.date}
                  {item.start !== '-'
                    ? ` · ${item.start} - ${item.end}`
                    : ''}
                </p>
                <small>{item.reason}</small>
              </div>
            </article>
          ))}
        </section>
      )}

      {modalType && (
        <div
          className="worker-modal-overlay"
          onClick={() => setModalType('')}
        >
          <form
            className="worker-attendance-modal"
            onSubmit={submitRequest}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="worker-attendance-modal-head">
              <div>
                <h3>{requestMeta[modalType]?.label}</h3>
                <p>내용 입력 후 서버로 승인 요청됩니다.</p>
              </div>
              <button
                type="button"
                onClick={() => setModalType('')}
              >
                <X size={18} />
              </button>
            </div>

            <label>
              <span>날짜</span>
              <input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((value) => ({
                    ...value,
                    date: e.target.value,
                  }))
                }
              />
            </label>

            {modalType !== '연차' && (
              <div className="worker-attendance-time-fields">
                <label>
                  <span>시작 시간</span>
                  <input
                    type="time"
                    value={form.start}
                    onChange={(e) =>
                      setForm((value) => ({
                        ...value,
                        start: e.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  <span>종료 시간</span>
                  <input
                    type="time"
                    value={form.end}
                    onChange={(e) =>
                      setForm((value) => ({
                        ...value,
                        end: e.target.value,
                      }))
                    }
                  />
                </label>
              </div>
            )}

            <label>
              <span>사유</span>
              <textarea
                value={form.reason}
                onChange={(e) =>
                  setForm((value) => ({
                    ...value,
                    reason: e.target.value,
                  }))
                }
                placeholder="사유를 입력해주세요"
              />
            </label>

            <div className="worker-attendance-modal-note">
              <TimerReset size={15} />
              승인 전까지 신청 내역에서 상태를 확인할 수 있습니다.
            </div>

            <button
              className="worker-primary-btn"
              type="submit"
            >
              <Plus size={16} />
              신청하기
            </button>
          </form>
        </div>
      )}
    </WorkerScaffold>
  );
}
