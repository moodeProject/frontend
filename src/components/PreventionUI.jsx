import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import { usePrevention } from '../context/PreventionContext';
import { belongsTo, guidance } from '../utils/prevention';
import '../styles/prevention.css';

export function WorkerPreventionNotice({ worker }) {
  const items = usePrevention();
  const [acknowledged, setAcknowledged] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('safeon-prevention-seen') || '[]'); } catch { return []; }
  });
  const own = worker ? items.filter(item => belongsTo(item, worker)) : [];
  const item = own.find(row => !acknowledged.includes(row.key)) || own[0];
  if (!item) return null;
  const [title, action] = guidance(item.kind);
  const seen = acknowledged.includes(item.key);
  const target = item.kind === 'fall' ? '/worker/sos' : item.category === 'external'
    ? `/worker/hazards/${encodeURIComponent(item.id)}` : '/worker/health';
  const acknowledge = () => {
    const next = [...acknowledged, item.key].slice(-200);
    setAcknowledged(next);
    try { sessionStorage.setItem('safeon-prevention-seen', JSON.stringify(next)); } catch { /* Session still works without storage. */ }
  };
  return <section className={`prevention-notice ${item.level}`} aria-label="사고 예방 안내" aria-live="polite">
    <div className="prevention-heading"><ShieldAlert size={22}/><div><small>작업 전 안전 확인 · {own.length}건</small><strong>{title}</strong></div></div>
    <p>{action}</p>
    <small>{item.zone || '위치 미확인'} · {new Date(item.occurredAt).toLocaleTimeString('ko-KR')} 감지</small>
    <div className="prevention-actions"><Link to={target}>{item.kind === 'fall' ? '구조 요청' : '상태·상세 확인'} <ArrowRight size={15}/></Link>
      <button type="button" onClick={acknowledge} disabled={seen}>{seen ? '안내 확인함' : '확인했어요'}</button></div>
    <small className="prevention-footnote">안내 확인은 위험 해제나 관리자 조치 완료를 의미하지 않습니다.</small>
  </section>;
}

export function ManagerPreventionPanel() {
  const items = usePrevention();
  const [showAll, setShowAll] = useState(false);
  // Combine duplicate sensor/history entries for the same person and risk.
  const grouped = new Map();
  for (const item of items) {
    const key = `${item.workerId ?? item.employeeNo ?? item.key}:${item.kind}`;
    const existing = grouped.get(key);
    if (!existing) grouped.set(key, item);
    else grouped.set(key, { ...existing, priority: existing.priority || item.priority,
      sustained: existing.sustained || item.sustained, repeatCount: Math.max(existing.repeatCount, item.repeatCount) });
  }
  const rows = [...grouped.values()].sort((a, b) => Number(b.priority) - Number(a.priority));
  const priorityCount = rows.filter(row => row.priority).length;
  const zones = new Map();
  for (const item of items.filter(row => row.category === 'external' && row.zone && row.zone !== '-')) {
    if (!zones.has(item.zone)) zones.set(item.zone, new Set());
    zones.get(item.zone).add(item.id);
  }
  const repeatedZones = [...zones].filter(([, ids]) => ids.size >= 2);
  return <section className="panel prevention-panel">
    <div className="prevention-panel-title"><div><span>PREVENTION</span><h2>사고 예방 · 우선 확인</h2><p>위험요인을 확인하고 작업 중단·휴식·현장 통제로 이어가세요.</p></div>
      <b>우선 확인 {priorityCount}건</b></div>
    <p className="prevention-rule">최근 10분 미해결 이벤트와 최근 30초 센서 기준 · 같은 위험 2건 이상 또는 화면에서 30초 이상 연속 관찰 시 우선 표시</p>
    {rows.length ? <div className="prevention-list">{(showAll ? rows : rows.slice(0, 5)).map(item => <article key={item.key}>
      <div><span className={`prevention-tag ${item.priority ? 'urgent' : ''}`}>{item.priority ? '우선 확인' : '주의 관찰'}</span>
        <strong>{item.name || '작업자 미확인'} · {guidance(item.kind)[0]}</strong>
        <small>{item.zone || '위치 미확인'}{item.sustained ? ' · 30초 이상 연속 관찰' : ''}{item.repeatCount >= 2 ? ` · 최근 10분 ${item.repeatCount}건` : ''}</small>
        <p>{guidance(item.kind)[1]}</p></div><Link to={item.target}>현장·상태 확인 <ArrowRight size={16}/></Link>
    </article>)}</div> : <p className="prevention-empty">현재 수신된 데이터에서 확인 대상이 없습니다. 센서 미수신은 안전 판정이 아닙니다.</p>}
    {rows.length > 5 && <button className="prevention-more" onClick={() => setShowAll(!showAll)}>{showAll ? '접기' : `전체 ${rows.length}건 보기`}</button>}
    {repeatedZones.length > 0 && <div className="prevention-zones"><strong>반복 감지 구역 · 최근 10분</strong>{repeatedZones.map(([zone, ids]) => <span key={zone}>{zone} · {ids.size}건 · 동선·현장 확인 필요</span>)}</div>}
    <small className="prevention-footnote">상세 화면에서 경고 전달·구역 통제·조치 완료를 기록하세요. 근로자의 안내 확인과 관리자 조치는 별개입니다.</small>
  </section>;
}
