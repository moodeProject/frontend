import { Plus, Search } from 'lucide-react';
import TopHeader from '../components/TopHeader';
import WorkerCard from '../components/WorkerCard';
import { workers } from '../data/mockData';

export default function Workers() {
  return (
    <>
      <TopHeader title="작업자 상태" subtitle="전체 작업자 현황" />
      <div className="page-body workers-page">
        <div className="worker-toolbar">
          <div className="search-box"><Search size={15}/><input placeholder="작업자 이름 또는 ID 검색" /></div>
          <div className="worker-count"><b>10명</b> 등록 중 · <span className="green">정상 6</span> <span className="orange">주의 3</span> <span className="red">위험 1</span></div>
          <button className="primary-btn"><Plus size={17}/> 작업자 추가</button>
        </div>
        <section className="workers-grid">
          {workers.map((w) => <WorkerCard key={w.id} worker={w}/>) }
        </section>
      </div>
    </>
  );
}
