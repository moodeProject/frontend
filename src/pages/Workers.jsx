import { Plus, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AddWorkerModal from '../components/AddWorkerModal';
import TopHeader from '../components/TopHeader';
import WorkerCard from '../components/WorkerCard';
import { useWorkers } from '../context/WorkerContext';

const STATUS_ORDER = { danger: 0, warning: 1, normal: 2 };
const STATUS_LABEL = { danger: '위험', warning: '주의', normal: '정상' };

export default function Workers() {
  const { workers, addWorker, refreshWorkerStatuses, sensorLoading, sensorError } = useWorkers();
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') || 'all';

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    let matched = statusFilter === 'all' ? workers : workers.filter((worker) => worker.status === statusFilter);
    if (query) {
      matched = matched.filter((worker) => [
        worker.name,
        worker.id,
        worker.workerCode,
        worker.employeeNumber,
        worker.phone,
        worker.zone,
      ].some((value) => String(value || '').toLowerCase().includes(query)));
    }

    return matched
      .map((worker, index) => ({ worker, index }))
      .sort((a, b) => (STATUS_ORDER[a.worker.status] ?? 99) - (STATUS_ORDER[b.worker.status] ?? 99) || a.index - b.index)
      .map(({ worker }) => worker);
  }, [search, workers, statusFilter]);

  const counts = workers.reduce((acc, worker) => ({ ...acc, [worker.status]: (acc[worker.status] || 0) + 1 }), {});

  return (
    <>
      <TopHeader title="작업자 상태" subtitle="전체 작업자 현황" onRefresh={refreshWorkerStatuses} />
      <div className="page-body workers-page">
        <div className="worker-toolbar">
          <div className="search-box"><Search size={15}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="작업자 이름 또는 ID 검색" /></div>
          <div className="worker-count"><b>{workers.length}명</b> 등록 중 · <span className="red">위험 {counts.danger || 0}</span> <span className="orange">주의 {counts.warning || 0}</span> <span className="green">정상 {counts.normal || 0}</span></div>
          <button className="primary-btn" onClick={() => setAddOpen(true)}><Plus size={17}/> 작업자 추가</button>
        </div>
        {(sensorLoading || sensorError) && (
          <div className={`worker-filter-banner ${sensorError ? 'danger' : 'normal'}`}>
            <span>
              {sensorLoading
                ? '실시간 센서 상태를 불러오는 중입니다.'
                : `센서 연동 실패: ${sensorError}`}
            </span>
          </div>
        )}
        {statusFilter !== 'all' && (
          <div className={`worker-filter-banner ${statusFilter}`}>
            <span>{STATUS_LABEL[statusFilter]} 작업자만 표시 중</span>
            <button type="button" onClick={() => setSearchParams({})}><X size={13}/> 필터 해제</button>
          </div>
        )}
        <section className="workers-grid">
          {filtered.map((worker) => <WorkerCard key={worker.id} worker={worker}/>) }
        </section>
        {filtered.length === 0 && <div className="empty-workers">검색 결과가 없습니다.</div>}
      </div>
      <AddWorkerModal open={addOpen} onClose={() => setAddOpen(false)} onAdd={addWorker} workers={workers}/>
    </>
  );
}
