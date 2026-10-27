import { ShieldCheck, WifiOff, ArrowLeft, TriangleAlert, MapPin, Clock3, Activity } from 'lucide-react';
import { useMemo } from 'react';
import '../../styles/workerFallHistory.css';
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
    const state = String(selectedEvent.status || '').toUpperCase();
    const resolved = ['RESOLVED', 'COMPLETED', 'CLOSED'].includes(state) || selectedEvent.processClass === 'completed';
    const status = resolved ? '처리완료' : selectedEvent.statusLabel || selectedEvent.process || '확인 필요';
    return (
      <WorkerScaffold active="alerts" title="추락 감지 상세" back>
        <section className="worker-white-card worker-health-detail-card worker-fall-history-card">
          <div className="worker-card-title">
            <strong>추락 감지 기록</strong>
            <span className="worker-count-pill">{resolved ? '처리완료' : '위험'}</span>
          </div>
          <div className="worker-fatigue-big worker-fall-history-bars">
            <i /><i /><i />
          </div>
          <p>추락 이상 징후가 감지되었습니다. 안전 상태를 확인하세요.</p>
          <hr />
          <div className="worker-health-detail-item">
            <i><Activity size={22} /></i>
            <p><span>감지 유형</span><strong>{selectedEvent.type || '추락 감지'}</strong></p>
            <b>{selectedEvent.fallState || '센서 감지'}</b>
          </div>
          <div className="worker-health-detail-item">
            <i><Clock3 size={22} /></i>
            <p><span>발생 시각</span><strong>{time}</strong></p>
          </div>
          <div className="worker-health-detail-item">
            <i><MapPin size={22} /></i>
            <p><span>발생 위치</span><strong>{selectedEvent.zone || '위치 미확인'}</strong></p>
          </div>
          <div className="worker-health-detail-item">
            <i><ShieldCheck size={22} /></i>
            <p><span>처리 상태</span><strong>{status}</strong></p>
          </div>
          {selectedEvent.posture && <div className="worker-health-detail-item">
            <i><TriangleAlert size={22} /></i>
            <p><span>감지 자세</span><strong>{postureLabel(selectedEvent.posture)}</strong></p>
          </div>}
        </section>
        <section className="worker-recommend-card">
          <h3>권장 행동</h3>
          <p>✓ 안전한 장소로 이동하고 몸 상태를 확인하세요.</p>
          <p>✓ 통증이나 어지러움이 있다면 즉시 작업을 중단하세요.</p>
          <p>✓ 도움이 필요하다면 관리자에게 상황을 알려주세요.</p>
        </section>
        <div className="worker-two-actions">
          <button type="button" onClick={() => navigate('/worker/alerts')}>
            <ArrowLeft size={18} /> 알림 목록
          </button>
          <button type="button" className="secondary" onClick={() => navigate('/worker/sos')}>
            <TriangleAlert size={18} /> SOS
          </button>
        </div>
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
