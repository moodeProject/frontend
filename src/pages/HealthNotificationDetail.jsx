import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { HeartPulse, RefreshCw, CheckCircle2, MapPin, Clock3, UserRound, ShieldAlert } from 'lucide-react';
import TopHeader from '../components/TopHeader';
import '../styles/healthNotificationDetail.css';
import { getNotifications, markNotificationRead } from '../api/notifications';
import { useWorkers } from '../context/WorkerContext';

function DetailItem({ label, value }) {
  return <div className="health-notice-field"><span>{label}</span><strong>{value || '-'}</strong></div>;
}
export default function HealthNotificationDetail() {
  const { id } = useParams();
  const { workers } = useWorkers();
  const [item, setItem] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      // The server supports paged notification lists; avoid size=1000 and search by notification ID.
      let found = null;
      for (let page = 0; page < 20 && !found; page += 1) {
        const rows = await getNotifications({ recipientType: 'MANAGER', page, size: 100 });
        found = rows.find(row => String(row.id) === String(id));
        if (rows.length < 100) break;
      }
      if (!found) throw new Error('건강 이상 알림 기록을 찾지 못했습니다.');
      setItem(found);
    } catch(e) { setError(e.message || '알림 조회 실패'); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { load(); }, [load]);
  const confirm = async () => {
    if (!item || saving) return;
    setSaving(true);
    try { await markNotificationRead(item.id); await load(); }
    catch(e) { setError(e.message || '읽음 처리 실패'); }
    finally { setSaving(false); }
  };
  const isRead = item?.read === true || item?.isRead === true;
  const parts = String(item?.message || '').split(' · ');
  const name = parts[0] || '작업자 정보 없음';
  const zone = parts[1] || '위치 미확인';
  const worker = workers.find(w => w.name === name);
  const date = item?.sentAt ? new Date(item.sentAt).toLocaleString('ko-KR') : '-';
  return (<>
    <TopHeader title="이상 감지" subtitle="외부요인 · 건강 · 추락" onRefresh={load} />
    <div className="page-body health-notice-page">
      <Link className="back-link detail-back" to="/detections?tab=health">← 이상 감지 목록</Link>
      {error && <div className="worker-filter-banner danger" role="alert">{error}</div>}
      {loading && !item && <div className="worker-filter-banner normal">건강 이상 기록을 불러오는 중입니다.</div>}
      {item && <>
        <div className="health-notice-banner">
          <div className="health-notice-banner-title"><ShieldAlert size={23}/><div><strong>건강 이상 징후가 감지되었습니다.</strong><span>{name} · {zone} · {date}</span></div></div>
          <span className={isRead ? 'health-notice-status resolved' : 'health-notice-status'}>{item.isRead ? '알림 확인함 · 조치 미확인' : '조치 필요'}</span>
        </div>
        <div className="health-notice-grid">
          <div className="health-notice-main">
            <section className="panel health-notice-panel">
              <div className="section-caption">건강 이상 감지 정보</div>
              <div className="health-notice-field-grid">
                <DetailItem label="감지 유형" value="건강 이상 징후"/>
                <DetailItem label="발생 시각" value={date}/>
                <DetailItem label="감지 작업자" value={name}/>
                <DetailItem label="감지 구역" value={zone}/>
              </div>
              <div className="health-notice-description">
                <span>감지 내용</span>
                <strong>{item.message}</strong>
              </div>
            </section>
            <section className="panel health-notice-panel">
              <h3>권장 조치</h3>
              <div className="health-recommend-box"><HeartPulse size={20}/><div><strong>작업자 상태 확인 및 휴식 안내</strong><p>작업을 중단하고 안전한 장소에서 휴식하도록 안내하세요. 작업자 상태를 확인하고 필요한 경우 추가 대응을 진행하세요.</p></div></div>
            </section>
          </div>
          <aside className="health-notice-side">
            <section className="panel health-notice-panel">
              <h3>작업자 정보</h3>
              <div className="health-notice-person"><div className="health-notice-avatar"><UserRound size={22}/></div><div><strong>{name}</strong><span>{worker?.employeeNumber || '작업자'} · {zone}</span></div></div>
              <div className="health-notice-summary"><MapPin size={16}/> {zone}</div>
              <div className="health-notice-summary"><Clock3 size={16}/> {date}</div>
              {worker && <Link className="health-notice-worker-link" to={`/workers/${worker.id}`}>작업자 상세 보기</Link>}
            </section>
            <section className="panel health-notice-panel health-notice-actions">
              <h3>관리자 조치</h3>
              <button type="button" className="health-notice-primary" onClick={confirm} disabled={saving || isRead}><CheckCircle2 size={17}/>{item.isRead ? '알림 확인함' : saving ? '처리 중...' : '알림 확인 처리'}</button>
              <button type="button" className="health-notice-secondary" onClick={() => load()} disabled={loading}><RefreshCw size={16}/>{loading ? "갱신 중..." : "새로고침"}</button>
              <p>알림 확인은 읽음 상태만 변경하며 사고 조치 완료로 처리되지는 않습니다.</p>
            </section>
          </aside>
        </div>
      </>}
    </div>
  </>);
}
