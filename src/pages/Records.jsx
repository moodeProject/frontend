import { Activity, Box, Droplets, Eye, Flame, HeartPulse, Search, TriangleAlert } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import TopHeader from '../components/TopHeader';
import { useDetections } from '../context/DetectionContext';

const tabs = [
  { key: 'all', label: '전체' },
  { key: 'external', label: '외부요인' },
  { key: 'health', label: '건강' },
  { key: 'fall', label: '추락' },
];

const categoryIcons = {
  fall: Activity,
  health: HeartPulse,
  external: Box,
};

function iconForDetection(item) {
  if (item.kind === 'unguarded') return TriangleAlert;
  if (item.kind === 'puddle') return Droplets;
  if (item.kind === 'heat') return Flame;
  return categoryIcons[item.category] || Activity;
}

function detailHref(item) {
  if (item.category === 'fall') return '/incident';
  if (item.category === 'external') return `/detections/${item.id}`;
  return '/detections?tab=health';
}

export default function Records() {
  const { detections } = useDetections();
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return detections.filter((item) => {
      const tabMatch = tab === 'all' || item.category === tab;
      const searchMatch = !query || [item.name, item.type, item.zone, item.process].some((value) => String(value).toLowerCase().includes(query));
      return tabMatch && searchMatch;
    });
  }, [tab, search, detections]);

  return (
    <>
      <TopHeader title="사고·알림 기록" subtitle="이벤트 처리 이력" />
      <div className="page-body records-page">
        <div className="records-toolbar">
          <div className="records-tabs">
            {tabs.map((item) => (
              <button key={item.key} className={tab === item.key ? 'active' : ''} onClick={() => setTab(item.key)}>{item.label}</button>
            ))}
          </div>
          <label className="records-search"><Search size={14}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="검색" /></label>
        </div>

        <section className="panel records-table">
          <div className="records-row records-head">
            <span>발생 시간</span><span>작업자</span><span>감지 유형</span><span>위치</span><span>위험도</span><span>처리 상태</span><span></span>
          </div>
          {rows.map((item) => {
            const Icon = iconForDetection(item);
            return (
              <div className={`records-row ${item.level}`} key={item.id}>
                <time>08.09&nbsp; {item.time}</time>
                <strong>{item.name}</strong>
                <span className={`record-type ${item.level} ${item.kind}`}><Icon size={13}/>{item.type}</span>
                <span className="record-zone">{item.zone}</span>
                <span><span className={`record-risk ${item.level}`}>● {item.level === 'danger' ? '위험' : '주의'}</span></span>
                <span><span className={`record-process ${item.processClass}`}>{item.process}</span></span>
                <Link className="record-detail" to={detailHref(item)}><Eye size={13}/> 상세</Link>
              </div>
            );
          })}
          {rows.length === 0 && <div className="records-empty">검색 결과가 없습니다.</div>}
        </section>
      </div>
    </>
  );
}
