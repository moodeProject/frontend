import { ShieldCheck, Clock3, WifiOff, ArrowLeft } from 'lucide-react';
import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { WorkerScaffold } from '../../components/WorkerMobileUI';
import { useWorkers } from '../../context/WorkerContext';
import { getWorkerProfile } from '../../utils/workerProfile';
import { formatSensorTime, isNormalState, postureLabel } from '../../utils/workerRealtime';

export default function WorkerFallStatus() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedEvent = location.state?.fallEvent || null;
  const profile = getWorkerProfile();
  const { workers } = useWorkers();
  const worker = useMemo(() => workers.find(item =>
    (profile.employeeNo && String(item.employeeNumber || item.employeeNo || '') === String(profile.employeeNo)) ||
    (profile.workerId && String(item.id || item.workerId || '') === String(profile.workerId))
  ), [workers, profile.employeeNo, profile.workerId]);
  const current = Boolean(worker?.fallState);
  const normal = current && isNormalState(worker.fallState);
  const abnormal = current && !normal;
  const label = abnormal ? '추락 위험 확인 필요' : normal ? '추락 감지 없음' : '최신 센서 데이터 없음';
  if (selectedEvent) {
    const time = selectedEvent.occurredAt ? new Date(selectedEvent.occurredAt).toLocaleString('ko-KR') : '-';
    return (
      <WorkerScaffold active="alerts" title="추락 감지 기록" back>
        <section className="worker-white-card" style={{ padding: 24 }}>
          <h2 style={{ margin: '0 0 10px', fontSize: 22, color:'#dc2626' }}>추락 감지 이력</h2>
          <p style={{ color:'#64748b', lineHeight:1.6 }}>알림 발생 당시 서버에 저장된 추락 기록입니다.</p>
          <div style={{ background:'#f5f7fb', borderRadius:14, padding:18, lineHeight:2.2, marginTop:16 }}>
            <div>감지 유형: <strong>{selectedEvent.type || '추락 감지'}</strong></div>
            <div>발생 시각: <strong>{time}</strong></div>
            <div>작업자: <strong>{selectedEvent.name || profile.name || '-'}</strong></div>
            <div>위치: <strong>{selectedEvent.zone || '-'}</strong></div>
            <div>처리 상태: <strong>{selectedEvent.statusLabel || selectedEvent.process || '확인 필요'}</strong></div>
            {selectedEvent.fallState && <div>추락 판정: <strong>{selectedEvent.fallState}</strong></div>}
            {selectedEvent.posture && <div>자세: <strong>{postureLabel(selectedEvent.posture)}</strong></div>}
          </div>
          <button type="button" onClick={() => navigate('/worker/alerts')} style={{ marginTop:20, padding:'12px 18px', borderRadius:12, border:'1px solid #dbe3ee', background:'#fff', color:'#1767ff', fontWeight:700 }}>알림 목록으로</button>
        </section>
      </WorkerScaffold>
    );
  }
  return (
    <WorkerScaffold active="home" title="추락 감지 상태" back>
      <section className="worker-white-card" style={{padding: 24, textAlign: 'center'}}>
        {current ? <ShieldCheck size={44} color={normal ? '#16a34a' : '#ef4444'} /> : <WifiOff size={44} color="#94a3b8" />}
        <h2 style={{margin: '16px 0 8px', fontSize: 22, color: abnormal ? '#dc2626' : '#172033'}}>{label}</h2>
        <p style={{fontSize: 13, color: '#64748b', lineHeight: 1.7, marginBottom: 20}}>
          {normal ? '최근 센서 정보에서 추락이 감지되지 않았습니다.' : abnormal ? '최근 센서에 이상 상태가 기록되었습니다. 안전 여부를 확인해주세요.' : '현재 최신 센서 수신이 확인되지 않아 추락 여부를 판단할 수 없습니다.'}
        </p>
        <div style={{background: '#f5f7fb', borderRadius: 14, padding: 16, textAlign: 'left', fontSize: 14, lineHeight: 2}}>
          <div>안전모: <strong>{worker?.helmetId || '배정 정보 없음'}</strong></div>
          <div>자세: <strong>{current && worker.posture ? postureLabel(worker.posture) : '데이터 대기'}</strong></div>
          <div>최근 센서 수신: <strong>{worker?.lastCommunicationAt ? formatSensorTime(worker.lastCommunicationAt) : '기록 없음'}</strong></div>
        </div>
        {abnormal ? <button type="button" className="worker-primary-btn" style={{marginTop: 20}} onClick={() => navigate('/worker/fall-alert')}>긴급 확인 화면 열기</button> :
          <button type="button" style={{marginTop: 20, border: '1px solid #dbe3ee', borderRadius: 12, background: '#fff', padding: '12px 20px', color: '#1767ff', fontWeight: 700}} onClick={() => navigate('/worker/home')}><ArrowLeft size={16} style={{verticalAlign: 'middle'}} /> 홈으로</button>}
      </section>
    </WorkerScaffold>
  );
}
