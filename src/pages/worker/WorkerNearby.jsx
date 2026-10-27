import { AlertTriangle, Bell, MapPin, Radar, RefreshCw, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WorkerScaffold } from '../../components/WorkerMobileUI';
import { getMyHome, normalizeMyHome } from '../../api/myHome';
import '../../styles/workerNearbyReal.css';

const ALERT_KEY = 'safeon_worker_nearby_danger_alerts_v1';

function loadSavedAlerts() {
  try {
    const value = JSON.parse(localStorage.getItem(ALERT_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch { return []; }
}

export default function WorkerNearby() {
  const navigate = useNavigate();
  const [myHome, setMyHome] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState(loadSavedAlerts);

  const load = useCallback(async () => {
    try {
      const home = normalizeMyHome(await getMyHome());
      setMyHome(home);
      setError('');
    } catch (e) {
      setError(e?.message || '내 구역 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 15000);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    try {
      const saved = loadSavedAlerts().map(item => ({ ...item, read: true }));
      localStorage.setItem(ALERT_KEY, JSON.stringify(saved));
      setAlerts(saved);
      window.dispatchEvent(new CustomEvent('safeon-worker-nearby-alerts-updated'));
    } catch {}
    const sync = () => setAlerts(loadSavedAlerts());
    window.addEventListener('storage', sync);
    window.addEventListener('safeon-worker-nearby-alerts-updated', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('safeon-worker-nearby-alerts-updated', sync);
    };
  }, []);

  return (
    <WorkerScaffold active="nearby" title="주변 안전">
      <section className="worker-white-card nearby-real-header">
        <div className="worker-card-title">
          <strong>내 작업 구역</strong>
          <button type="button" className="nearby-refresh" onClick={() => { setLoading(true); load(); }} aria-label="구역 정보 새로고침"><RefreshCw size={17} /></button>
        </div>
        <div className="nearby-zone-line">
          <span className="nearby-zone-icon"><MapPin size={22}/></span>
          <div><small>서버 등록 위치</small><strong>{loading && !myHome ? '조회 중' : myHome?.zone || '위치 미확인'}</strong></div>
        </div>
        {error && <p className="nearby-error">구역 정보 조회 실패: {error}</p>}
        <p className="nearby-zone-note">작업자 본인의 서버 등록 구역입니다. GPS나 실시간 위치 추적 정보는 아닙니다.</p>
      </section>

      <section className="worker-white-card nearby-real-status">
        <div className="worker-card-title"><strong>주변 작업자 현황</strong></div>
        <div className="nearby-placeholder-icon"><Radar size={30}/></div>
        <h3>실시간 주변 거리 정보 준비 중</h3>
        <p>현재 연결된 근로자 API에는 다른 작업자의 실시간 위치나 거리 정보가 제공되지 않습니다. 따라서 임의의 거리와 레이더 위치를 표시하지 않습니다.</p>
        <div className="nearby-capability-row"><ShieldCheck size={17}/><span>내 작업 구역 정보는 서버 API로 확인 가능</span></div>
        <div className="nearby-capability-row muted"><AlertTriangle size={17}/><span>주변 작업자·거리·비콘 위치는 별도 API 연동 필요</span></div>
      </section>

      <section className="worker-white-card nearby-real-alerts">
        <div className="worker-card-title"><strong>주변 위험 알림</strong><span className="nearby-alert-count">{alerts.length}건</span></div>
        {alerts.length ? alerts.slice(0, 5).map((alert, index) => (
          <button type="button" className="nearby-alert-row" key={alert.id || index} onClick={() => navigate('/worker/alerts')}>
            <span className="nearby-alert-icon"><AlertTriangle size={18}/></span>
            <span className="nearby-alert-copy"><strong>{alert.title || '주변 위험 알림'}</strong><small>{[alert.zone, alert.message].filter(Boolean).join(' · ') || '알림 상세를 확인해 주세요.'}</small></span>
          </button>
        )) : <div className="nearby-empty"><Bell size={20}/><span>표시할 주변 위험 알림이 없습니다.</span></div>}
        <button type="button" className="nearby-alert-link" onClick={() => navigate('/worker/alerts')}>전체 알림 확인 →</button>
      </section>
      <p className="worker-last-update">주변 위험 알림은 기기에 저장된 내역으로, 실시간 주변 인원 조회 결과가 아닙니다.</p>
    </WorkerScaffold>
  );
}
