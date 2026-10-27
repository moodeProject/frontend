import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CheckCircle2, MapPin, ShieldAlert, UserRound } from 'lucide-react';
import { getSOSList, resolveSOSRequest } from '../api/sos';
import TopHeader from '../components/TopHeader';
import '../styles/sosDetail.css';

export default function SOSDetail() {
  const { sosId } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const load = useCallback(async () => {
    try {
      const rows = await getSOSList();
      const found = (Array.isArray(rows) ? rows : []).find(item => String(item.sosId ?? item.id) === String(sosId));
      if (!found) throw new Error('요청한 SOS 기록을 찾을 수 없습니다.');
      setRecord(found);
      setError('');
    } catch(e) { setError(e?.message || 'SOS 기록을 조회하지 못했습니다.'); }
    finally { setLoading(false); }
  }, [sosId]);
  useEffect(() => { load(); const timer = window.setInterval(load, 10000); return () => window.clearInterval(timer); }, [load]);
  const resolve = async () => {
    if (!record || !window.confirm('현장 조치를 확인했나요? SOS를 처리완료로 변경합니다.')) return;
    setResolving(true);
    try { await resolveSOSRequest(record.sosId ?? record.id); await load(); }
    catch (e) { setError(e?.message || '처리완료 요청 실패'); }
    finally { setResolving(false); }
  };
  return <>
    <TopHeader title="SOS 긴급 요청 상세" subtitle="서버에 저장된 구조 요청 정보" onRefresh={load} />
    <div className="page-body sos-detail-page">
      <button className="sos-detail-back" onClick={() => navigate(-1)}><ArrowLeft size={17}/> 뒤로</button>
      {error && <div className="worker-filter-banner danger">{error}</div>}
      {loading && !record ? <div className="panel sos-detail-card">서버의 SOS 기록을 확인하는 중입니다.</div> : record && <>
        <section className="panel sos-detail-card">
          <div className="sos-detail-heading"><ShieldAlert size={26}/><div><h2>{record.requesterName || '작업자'} 긴급 구조 요청</h2><p>서버 SOS #{record.sosId ?? record.id}</p></div><span className={record.status === 'RESOLVED' ? 'resolved' : 'requested'}>{record.status === 'RESOLVED' ? '처리완료' : '미처리'}</span></div>
          <div className="sos-detail-grid">
            <div><UserRound size={17}/><span>요청 작업자</span><strong>{record.requesterName || '-'}</strong></div>
            <div><MapPin size={17}/><span>신고 시점 구역</span><strong>{record.zoneName || record.zoneCode || '위치 미확인'}</strong></div>
            <div><AlertTriangle size={17}/><span>요청 시간</span><strong>{record.createdAt ? new Date(record.createdAt).toLocaleString('ko-KR') : '-'}</strong></div>
            <div><CheckCircle2 size={17}/><span>처리 시간</span><strong>{record.resolvedAt ? new Date(record.resolvedAt).toLocaleString('ko-KR') : '미처리'}</strong></div>
          </div>
          <p className="sos-detail-note">이 SOS 기록만으로 자동 추락 요청인지 수동 관리자 호출인지 구분할 수 없습니다. 두 요청 모두 서버에 기록되어 관리자 알림함으로 전달됩니다.</p>
          {record.status !== 'RESOLVED' && <button className="sos-detail-resolve" disabled={resolving} onClick={resolve}>{resolving ? '처리 중...' : '현장 조치 확인 후 처리완료'}</button>}
        </section>
      </>}
    </div>
  </>;
}
