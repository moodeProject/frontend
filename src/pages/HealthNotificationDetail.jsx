import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { HeartPulse, RefreshCw, CheckCircle2 } from 'lucide-react';
import TopHeader from '../components/TopHeader';
import { getNotifications, markNotificationRead } from '../api/notifications';

export default function HealthNotificationDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const rows = await getNotifications({ recipientType: 'MANAGER', page: 0, size: 1000 });
      const found = rows.find(row => String(row.id) === String(id) && String(row.message || '').includes('건강 이상') && row.hazardEventId == null);
      if (!found) throw new Error('건강 이상 알림 기록을 찾지 못했습니다. 조회 범위 밖이거나 삭제되었을 수 있습니다.');
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
  const parts = String(item?.message || '').split(' · ');
  return (<>
    <TopHeader title="건강 이상 상세" subtitle="건강 이상 알림 기록" onRefresh={load} />
    <div className="page-body" style={{ maxWidth: 1100, margin: '0 auto' }}>
      <Link className="back-link detail-back" to="/detections?tab=health">← 건강 이상 목록</Link>
      {error && <div className="worker-filter-banner danger" role="alert">{error}</div>}
      {loading && <div className="worker-filter-banner normal">건강 이상 기록을 조회하는 중입니다.</div>}
      {item && <div className="panel" style={{ padding: 26, marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <HeartPulse color="#dc5555" size={26} />
          <div><h2 style={{ margin: 0 }}>건강 이상 징후 감지</h2><p style={{ color:'#718096', margin: '7px 0 0' }}>작업자 상태 확인 및 초기 대응</p></div>
        </div>
        <div className="final-cause"><span>대상 작업자</span><strong>{parts[0] || '정보 없음'}</strong></div>
        <div className="final-cause"><span>감지 구역</span><strong>{parts[1] || '위치 미확인'}</strong></div>
        <div className="final-cause"><span>발생 시간</span><strong>{item.sentAt ? new Date(item.sentAt).toLocaleString('ko-KR') : '-'}</strong></div>
        <div className="final-cause"><span>감지 내용</span><strong>{item.message}</strong></div>
        <div className="final-cause"><span>확인 상태</span><strong>{item.isRead ? '확인함' : '확인 필요'}</strong></div>
        <div className="health-recommend-box" style={{ marginTop: 16 }}>
          <HeartPulse size={18} /><div><strong>권장 조치</strong><p>작업 중단과 휴식을 안내하고 작업자의 상태를 확인하세요. 필요할 경우 현장 관리자에게 긴급 대응을 요청하세요.</p></div>
        </div>
        <p style={{fontSize:12,color:'#718096',marginTop:16}}>이 기록은 서버에 저장된 건강 알림을 기반으로 표시됩니다. 발생 당시의 심박수·SpO₂ 센서 스냅샷은 알림 API에 포함되어 있지 않습니다.</p>
        <button type="button" className="location-btn" onClick={confirm} disabled={saving || item.isRead} style={{marginTop:16}}><CheckCircle2 size={16} />{item.isRead?'확인 완료':saving?'처리 중...':'알림 확인 처리'}</button>
        <button type="button" className="location-btn" onClick={load} style={{marginLeft:10,marginTop:16}}><RefreshCw size={15}/>새로고침</button>
      </div>}
    </div>
  </>);
}
