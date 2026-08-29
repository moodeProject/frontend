import { Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import AddWorkerModal from '../components/AddWorkerModal';
import TopHeader from '../components/TopHeader';
import WorkerCard from '../components/WorkerCard';
import { useWorkers } from '../context/WorkerContext';

const STATUS_ORDER = { danger: 0, warning: 1, normal: 2 };

export default function Workers() {
  const { workers, addWorker } = useWorkers();
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matched = query
      ? workers.filter((worker) => [
          worker.name,
          worker.id,
          worker.workerCode,
          worker.employeeNumber,
          worker.phone,
          worker.zone,
        ].some((value) => String(value || '').toLowerCase().includes(query)))
      : workers;

    // 위험 → 주의 → 정상(건강) 순으로 우선 노출
    return matched
      .map((worker, index) => ({ worker, index }))
      .sort((a, b) => (STATUS_ORDER[a.worker.status] ?? 99) - (STATUS_ORDER[b.worker.status] ?? 99) || a.index - b.index)
      .map(({ worker }) => worker);
  }, [search, workers]);

  const counts = workers.reduce((acc, worker) => ({ ...acc, [worker.status]: (acc[worker.status] || 0) + 1 }), {});

  return (
    <>
      <TopHeader title="작업자 상태" subtitle="전체 작업자 현황" />
      <div className="page-body workers-page">
        <div className="worker-toolbar">
          <div className="search-box"><Search size={15}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="작업자 이름 또는 ID 검색" /></div>
          <div className="worker-count"><b>{workers.length}명</b> 등록 중 · <span className="red">위험 {counts.danger || 0}</span> <span className="orange">주의 {counts.warning || 0}</span> <span className="green">정상 {counts.normal || 0}</span></div>
          <button className="primary-btn" onClick={() => setAddOpen(true)}><Plus size={17}/> 작업자 추가</button>
        </div>
        <section className="workers-grid">
          {filtered.map((worker) => <WorkerCard key={worker.id} worker={worker}/>) }
        </section>
        {filtered.length === 0 && <div className="empty-workers">검색 결과가 없습니다.</div>}
      </div>
      <AddWorkerModal open={addOpen} onClose={() => setAddOpen(false)} onAdd={addWorker} workers={workers}/>
    </>
  );
}
