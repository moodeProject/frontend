import { Link2, MoreHorizontal, Plus, RefreshCw, Search, Wifi } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import AddHelmetModal from '../components/AddHelmetModal';
import ConnectHelmetModal from '../components/ConnectHelmetModal';
import ActionToast from '../components/ActionToast';
import TopHeader from '../components/TopHeader';
import { useWorkers } from '../context/WorkerContext';

const STORAGE_KEY = 'safehelmet-helmets-v1';
const initialHelmets = [
  { helmetNumber: 'H-001', workerId: 'H-001', workerName: '박민수', deviceId: 'DEV-001', sensorConnected: true, lastCommunication: '8초 전', status: 'inUse' },
  { helmetNumber: 'H-002', workerId: 'H-002', workerName: '김현석', deviceId: 'DEV-002', sensorConnected: true, lastCommunication: '12초 전', status: 'inUse' },
  { helmetNumber: 'H-003', workerId: 'H-003', workerName: '이수진', deviceId: 'DEV-003', sensorConnected: true, lastCommunication: '6초 전', status: 'inUse' },
  { helmetNumber: 'H-004', workerId: 'H-004', workerName: '최동훈', deviceId: 'DEV-004', sensorConnected: true, lastCommunication: '9초 전', status: 'inUse' },
  { helmetNumber: 'H-005', workerId: 'H-005', workerName: '정유진', deviceId: 'DEV-005', sensorConnected: true, lastCommunication: '5초 전', status: 'inUse' },
  { helmetNumber: 'H-006', workerId: '', workerName: '미연결', deviceId: 'DEV-006', sensorConnected: false, lastCommunication: '-', status: 'standby' },
  { helmetNumber: 'H-007', workerId: '', workerName: '미연결', deviceId: 'DEV-007', sensorConnected: false, lastCommunication: '3분 전', status: 'disconnected' },
];

function loadHelmets() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : initialHelmets;
  } catch {
    return initialHelmets;
  }
}

export default function HelmetManagement() {
  const { workers, updateWorker } = useWorkers();
  const [helmets, setHelmets] = useState(loadHelmets);
  const [search, setSearch] = useState('');
  const [registerOpen, setRegisterOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [connectPreset, setConnectPreset] = useState({ helmetNumber: '', workerId: '' });
  const [menuFor, setMenuFor] = useState('');
  const [toast, setToast] = useState('');
  const [reconnectingFor, setReconnectingFor] = useState('');
  const menuRef = useRef(null);

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(helmets)), [helmets]);
  useEffect(() => {
    const close = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuFor('');
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  useEffect(() => {
    const syncHelmets = () => setHelmets(loadHelmets());
    const refreshPage = (event) => {
      if (!event.detail?.path || event.detail.path === '/helmets') syncHelmets();
    };
    window.addEventListener('safehelmet-worker-helmet-reconnected', syncHelmets);
    window.addEventListener('safehelmet-helmets-updated', syncHelmets);
    window.addEventListener('safehelmet-page-refresh', refreshPage);
    window.addEventListener('storage', syncHelmets);
    return () => {
      window.removeEventListener('safehelmet-worker-helmet-reconnected', syncHelmets);
      window.removeEventListener('safehelmet-helmets-updated', syncHelmets);
      window.removeEventListener('safehelmet-page-refresh', refreshPage);
      window.removeEventListener('storage', syncHelmets);
    };
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return helmets;
    return helmets.filter((item) => [item.helmetNumber, item.workerName, item.deviceId].some((value) => String(value).toLowerCase().includes(query)));
  }, [helmets, search]);

  const inUse = helmets.filter((item) => item.status === 'inUse').length;
  const disconnected = helmets.filter((item) => item.status === 'disconnected').length;

  const addHelmet = (helmet) => {
    setHelmets((prev) => [...prev, helmet]);
    if (helmet.workerId) updateWorker(helmet.workerId, { helmetId: helmet.helmetNumber, sensorConnected: helmet.sensorConnected });
    setToast(`${helmet.helmetNumber} 헬멧이 등록되었습니다.`);
  };

  const connectHelmet = (helmetNumber, workerId) => {
    const worker = workers.find((item) => item.id === workerId);
    if (!worker) return;
    const selected = helmets.find((item) => item.helmetNumber === helmetNumber);
    const previousWorkerId = selected?.workerId;
    const previousHelmetForWorker = helmets.find((item) => item.workerId === workerId && item.helmetNumber !== helmetNumber);

    if (previousWorkerId && previousWorkerId !== workerId) updateWorker(previousWorkerId, { helmetId: '', sensorConnected: false });
    if (previousHelmetForWorker) {
      setHelmets((prev) => prev.map((item) => item.helmetNumber === previousHelmetForWorker.helmetNumber
        ? { ...item, workerId: '', workerName: '미연결', status: item.sensorConnected ? 'standby' : 'disconnected' }
        : item));
    }

    setHelmets((prev) => prev.map((item) => {
      if (item.helmetNumber === helmetNumber) return {
        ...item,
        workerId,
        workerName: worker.name,
        sensorConnected: true,
        status: 'inUse',
        lastCommunication: '방금 전',
      };
      if (item.workerId === workerId && item.helmetNumber !== helmetNumber) return { ...item, workerId: '', workerName: '미연결', status: item.sensorConnected ? 'standby' : 'disconnected' };
      return item;
    }));
    updateWorker(workerId, { helmetId: helmetNumber, sensorConnected: true });
    setToast(`${helmetNumber} 헬멧을 ${worker.name} 작업자에게 재연결했습니다.`);
  };

  const reconnectDevice = (helmetNumber) => {
    const target = helmets.find((item) => item.helmetNumber === helmetNumber);
    if (!target) return;
    setReconnectingFor(helmetNumber);
    setToast(`${helmetNumber} 헬멧 연결을 다시 확인하고 있습니다.`);
    window.setTimeout(() => {
      const nextHelmets = helmets.map((item) => item.helmetNumber === helmetNumber ? {
        ...item,
        sensorConnected: true,
        lastCommunication: '방금 전',
        status: item.workerId ? 'inUse' : 'standby',
      } : item);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextHelmets));
      setHelmets(nextHelmets);
      if (target.workerId) updateWorker(target.workerId, { helmetId: helmetNumber, sensorConnected: true });
      try {
        const currentWorker = JSON.parse(localStorage.getItem('safehelmet_worker_profile') || '{}');
        if (currentWorker.helmetNo === helmetNumber) {
          const updatedProfile = { ...currentWorker, helmetConnected: true, sensorConnected: true, helmetLastConnectedAt: new Date().toISOString() };
          localStorage.setItem('safehelmet_worker_profile', JSON.stringify(updatedProfile));
          window.dispatchEvent(new CustomEvent('safehelmet-worker-profile-updated', { detail: updatedProfile }));
        }
      } catch {}
      window.dispatchEvent(new Event('safehelmet-helmets-updated'));
      setReconnectingFor('');
      setToast(`${helmetNumber} 헬멧과 센서가 재연결되었습니다.`);
    }, 650);
  };

  const unassign = (helmetNumber) => {
    const target = helmets.find((item) => item.helmetNumber === helmetNumber);
    if (target?.workerId) updateWorker(target.workerId, { helmetId: '', sensorConnected: false });
    setHelmets((prev) => prev.map((item) => item.helmetNumber === helmetNumber ? { ...item, workerId: '', workerName: '미연결', status: item.sensorConnected ? 'standby' : 'disconnected' } : item));
    setToast(`${helmetNumber} 작업자 연결을 해제했습니다.`);
  };

  const remove = (helmetNumber) => {
    const target = helmets.find((item) => item.helmetNumber === helmetNumber);
    if (target?.workerId) updateWorker(target.workerId, { helmetId: '', sensorConnected: false });
    setHelmets((prev) => prev.filter((item) => item.helmetNumber !== helmetNumber));
    setToast(`${helmetNumber} 헬멧을 삭제했습니다.`);
  };

  return (
    <>
      <TopHeader title="헬멧 관리" subtitle="스마트 안전모 등록 및 연결" />
      <div className="page-body helmets-page">
        <div className="helmet-title-row">
          <div><h2>헬멧 관리</h2><p>스마트 안전모를 등록하고 작업자와 연결합니다.</p></div>
          <div className="helmet-title-actions">
            <button className="helmet-connect-btn" onClick={() => { setConnectPreset({ helmetNumber: '', workerId: '' }); setConnectOpen(true); }}><Link2 size={16}/> 헬멧 연결</button>
            <button className="helmet-register-btn" onClick={() => setRegisterOpen(true)}><Plus size={16}/> 헬멧 등록</button>
          </div>
        </div>

        <div className="helmet-stats">
          <div className="helmet-stat"><span>전체</span><strong>{helmets.length}</strong></div>
          <div className="helmet-stat"><span>사용 중</span><strong className="blue">{inUse}</strong></div>
          <div className="helmet-stat"><span>연결 끊김</span><strong className="red">{disconnected}</strong></div>
        </div>

        <label className="helmet-search"><Search size={14}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="헬멧 번호 또는 작업자 검색" /></label>

        <section className="panel helmet-table">
          <div className="helmet-row helmet-head"><span>헬멧 번호</span><span>연결 작업자</span><span>기기 ID</span><span>센서 상태</span><span>마지막 통신</span><span>상태</span><span>관리</span></div>
          {filtered.map((helmet) => (
            <div className="helmet-row" key={helmet.helmetNumber}>
              <strong>{helmet.helmetNumber}</strong>
              <span className={helmet.workerName === '미연결' ? 'muted' : ''}>{helmet.workerName}</span>
              <code>{helmet.deviceId}</code>
              <span className={`sensor-state ${helmet.sensorConnected ? 'connected' : 'disconnected'}`}><Wifi size={13}/>{helmet.sensorConnected ? '연결' : '미연결'}</span>
              <span className="muted">{helmet.lastCommunication}</span>
              <span><span className={`helmet-status ${helmet.status}`}>{helmet.status === 'inUse' ? '사용중' : helmet.status === 'standby' ? '대기' : '연결 끊김'}</span></span>
              <div className="helmet-row-actions" ref={menuFor === helmet.helmetNumber ? menuRef : null}>
                <button className={`helmet-reconnect-inline ${reconnectingFor === helmet.helmetNumber ? 'busy' : ''}`} onClick={() => reconnectDevice(helmet.helmetNumber)} title="헬멧 센서 재연결" disabled={reconnectingFor === helmet.helmetNumber}><RefreshCw size={14}/></button>
                <div className="helmet-menu-wrap">
                <button className="helmet-menu-btn" onClick={() => setMenuFor((current) => current === helmet.helmetNumber ? '' : helmet.helmetNumber)}><MoreHorizontal size={17}/></button>
                {menuFor === helmet.helmetNumber && <div className="helmet-menu">
                  <button onClick={() => { reconnectDevice(helmet.helmetNumber); setMenuFor(''); }}>{reconnectingFor === helmet.helmetNumber ? '재연결 중...' : '센서 재연결'}</button>
                  <button onClick={() => { setConnectPreset({ helmetNumber: helmet.helmetNumber, workerId: helmet.workerId || '' }); setMenuFor(''); setConnectOpen(true); }}>{helmet.workerId ? '작업자 재배정' : '작업자 연결'}</button>
                  {helmet.workerId && <button onClick={() => { unassign(helmet.helmetNumber); setMenuFor(''); }}>작업자 연결 해제</button>}
                  <button className="danger" onClick={() => { remove(helmet.helmetNumber); setMenuFor(''); }}>헬멧 삭제</button>
                </div>}
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="records-empty">검색 결과가 없습니다.</div>}
        </section>
      </div>
      <AddHelmetModal open={registerOpen} onClose={() => setRegisterOpen(false)} onAdd={addHelmet} helmets={helmets} workers={workers}/>
      <ConnectHelmetModal open={connectOpen} onClose={() => setConnectOpen(false)} onConnect={connectHelmet} helmets={helmets} workers={workers} initialHelmetNumber={connectPreset.helmetNumber} initialWorkerId={connectPreset.workerId}/>
      <ActionToast message={toast} onClose={() => setToast('')} />
    </>
  );
}
