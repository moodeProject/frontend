import { AlertTriangle, Eye, HeartPulse, ShieldCheck, Users, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TopHeader from '../components/TopHeader';
import StatusBadge from '../components/StatusBadge';
import WorkerCard from '../components/WorkerCard';
import { alerts, zones } from '../data/mockData';
import { useWorkers } from '../context/WorkerContext';

const labelMap = { normal: '정상', warning: '주의', danger: '위험' };

export default function Dashboard() {
  const { workers } = useWorkers();
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const riskyWorkers = workers.filter((w) => w.status !== 'normal');
  const counts = workers.reduce((acc, w) => ({ ...acc, [w.status]: (acc[w.status] || 0) + 1 }), {});
  const summary = [
    { key: 'all', label: '현재 작업자', value: workers.length, unit: '명', icon: Users },
    { key: 'normal', label: '정상', value: counts.normal || 0, unit: '명', icon: ShieldCheck },
    { key: 'warning', label: '주의', value: counts.warning || 0, unit: '명', icon: AlertTriangle },
    { key: 'danger', label: '위험', value: counts.danger || 0, unit: '명', icon: HeartPulse },
  ];

  return (
    <>
      <TopHeader title="통합 모니터링" subtitle="현장 전체 실시간 현황" />
      <div className="page-body dashboard-page">
        <section className="summary-grid">
          {summary.map(({ key, label, value, unit, icon: Icon }) => (
            <button key={key} className={`summary-card ${key}`} onClick={() => key === 'warning' && setExpanded(true)}>
              <div>
                <span>{label}</span>
                <strong>{value}<small>{unit}</small></strong>
                {key === 'warning' && <em>목록 보기 ▲</em>}
              </div>
              <div className="summary-icon"><Icon size={19} /></div>
            </button>
          ))}
        </section>

        {expanded && (
          <section className="expanded-workers panel">
            <div className="panel-title-row">
              <div><strong>주의 작업자</strong><span>{counts.warning || 0}명</span></div>
              <div className="row-actions"><button onClick={() => navigate('/workers')}>작업자 페이지로</button><button className="icon-btn" onClick={() => setExpanded(false)}><X size={15}/></button></div>
            </div>
            <div className="expanded-worker-grid">
              {riskyWorkers.filter((w) => w.status === 'warning').map((w) => <WorkerCard key={w.id} worker={w} compact />)}
            </div>
          </section>
        )}

        <div className="dashboard-grid">
          <section className="panel alert-panel">
            <div className="panel-title-row border-bottom">
              <div className="title-with-dot"><i className="red-dot"/><strong>실시간 이상 감지</strong><span>최신순</span></div>
              <Link to="/detections">전체 보기 ›</Link>
            </div>
            <div className="alert-list">
              {alerts.map((a) => (
                <div className={`alert-row ${a.level}`} key={a.id}>
                  <div className={`alert-symbol ${a.level}`}><AlertTriangle size={18}/></div>
                  <div className="alert-content">
                    <div className="alert-heading"><StatusBadge level={a.level}>{labelMap[a.level]}</StatusBadge><b>{a.type}</b><span>·</span><strong>{a.name}</strong><span className="zone-text">⌖ {a.zone}</span></div>
                    <p>{a.description}</p>
                  </div>
                  <time>{a.time}</time>
                  <Link className="detail-btn" to={a.id === 1 ? "/incident" : `/detections/${a.id}`}><Eye size={14}/> 상세보기</Link>
                </div>
              ))}
            </div>
          </section>

          <aside className="right-stack">
            <section className="panel zone-panel">
              <h3>현장 상태</h3>
              {zones.map((z) => <div key={z.name} className={`zone-card ${z.level}`}><b><i/> {z.name}</b><span><em>정상 {z.normal}</em>{z.warning > 0 && <em>주의 {z.warning}</em>}{z.danger > 0 && <em>위험 {z.danger}</em>}</span></div>)}
            </section>
            <section className="panel risk-list-panel">
              <div className="panel-title-row border-bottom"><strong>주의·위험 작업자</strong><Link to="/workers">전체</Link></div>
              {riskyWorkers.map((w) => <div key={w.id} className="risk-list-row"><div className="mini-avatar">{w.profileImage ? <img src={w.profileImage} alt=""/> : w.name.slice(0,1)}</div><div><div><strong>{w.name}</strong> <StatusBadge level={w.status}>{labelMap[w.status]}</StatusBadge></div><p><HeartPulse size={12}/> {w.heartRate} <small>bpm</small> <span>{w.zone}</span></p></div></div>)}
            </section>
          </aside>
        </div>
      </div>
    </>
  );
}
