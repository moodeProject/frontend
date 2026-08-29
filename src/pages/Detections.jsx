import {
  Activity,
  AlertTriangle,
  Droplets,
  Eye,
  HeartPulse,
  Package,
  Thermometer,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import TopHeader from '../components/TopHeader';
import { detections } from '../data/mockData';

const tabs = [
  { key: 'all', label: '전체' },
  { key: 'external', label: '외부요인' },
  { key: 'health', label: '건강' },
  { key: 'fall', label: '추락' },
];

const typeMeta = {
  fall: { Icon: Activity, className: 'danger' },
  unguarded: { Icon: AlertTriangle, className: 'danger' },
  fatigue: { Icon: HeartPulse, className: 'orange' },
  puddle: { Icon: Droplets, className: 'blue' },
  obstacle: { Icon: Package, className: 'orange' },
  heat: { Icon: Thermometer, className: 'orange' },
};

const levelLabel = { danger: '위험', warning: '주의' };

export default function Detections() {
  const [searchParams, setSearchParams] = useSearchParams();
  const active = searchParams.get('tab') || 'all';

  const counts = {
    all: detections.length,
    external: detections.filter((d) => d.category === 'external').length,
    health: detections.filter((d) => d.category === 'health').length,
    fall: detections.filter((d) => d.category === 'fall').length,
  };

  const rows = active === 'all'
    ? detections
    : detections.filter((d) => d.category === active);

  return (
    <>
      <TopHeader title="이상 감지" subtitle="외부요인 · 건강 · 추락" />
      <div className="page-body detections-page">
        <div className="detection-tabs" role="tablist" aria-label="이상 감지 분류">
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab.key}
              className={active === tab.key ? 'active' : ''}
              onClick={() => setSearchParams(tab.key === 'all' ? {} : { tab: tab.key })}
            >
              {tab.label}<span>{counts[tab.key]}</span>
            </button>
          ))}
        </div>

        <section className="panel detection-table-wrap">
          <div className="detection-table detection-table-head">
            <span>위험도</span>
            <span>감지 유형</span>
            <span>작업자</span>
            <span>위치</span>
            <span>발생 시간</span>
            <span>처리 상태</span>
            <span />
          </div>

          {rows.map((item) => {
            const { Icon, className } = typeMeta[item.kind];
            const detailTo = item.kind === 'fall' ? '/incident' : `/detections/${item.id}`;
            return (
              <div className={`detection-table detection-table-row ${item.level}`} key={item.id}>
                <div><span className={`risk-chip ${item.level}`}>● {levelLabel[item.level]}</span></div>
                <div className={`detection-type ${className}`}><Icon size={15} strokeWidth={2}/><b>{item.type}</b></div>
                <strong>{item.name}</strong>
                <span className="muted-cell">{item.zone}</span>
                <time>{item.time}</time>
                <div><span className={`process-chip ${item.processClass}`}>{item.process}</span></div>
                <Link to={detailTo} className="table-detail"><Eye size={14}/> 상세</Link>
              </div>
            );
          })}
        </section>
      </div>
    </>
  );
}
