import { ArrowDownRight, Camera, ChevronLeft, Cpu, HardHat, Heart, MapPin, Package, Phone, RefreshCw, Trash2, Wifi } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ActionToast from '../components/ActionToast';
import DeleteWorkerModal from '../components/DeleteWorkerModal';
import StatusBadge from '../components/StatusBadge';
import TopHeader from '../components/TopHeader';
import { useWorkers } from '../context/WorkerContext';
import { getWorkerStatus } from '../api/workerStatus';

const labels = { normal: '정상', warning: '주의', danger: '위험' };

function isAbnormal(value) {
  return Boolean(value) && String(value).toUpperCase() !== 'NORMAL';
}

function statusPatchFromSensor(worker, sensor) {
  const fallAbnormal = isAbnormal(sensor?.fallState);
  const healthAbnormal = isAbnormal(sensor?.healthState);

  let status = 'normal';
  let issue = '정상 작업 중';

  if (fallAbnormal) {
    status = 'danger';
    issue = '추락 감지됨';
  } else if (healthAbnormal) {
    status = 'warning';
    issue = `건강 이상 · ${sensor.healthState}`;
  }

  const heartRate = Number(sensor?.heartRate);

  return {
    deviceId: sensor?.deviceId || worker.deviceId,
    status,
    issue,
    heartRate: Number.isFinite(heartRate) && heartRate > 0 ? heartRate : worker.heartRate,
    spo2: sensor?.spo2 ?? worker.spo2,
    fallState: sensor?.fallState ?? worker.fallState,
    healthState: sensor?.healthState ?? worker.healthState,
    fallConfidence: sensor?.fallConfidence ?? worker.fallConfidence,
    recordedAt: sensor?.recordedAt ?? worker.recordedAt,
    ax: sensor?.ax ?? worker.ax,
    ay: sensor?.ay ?? worker.ay,
    az: sensor?.az ?? worker.az,
    gx: sensor?.gx ?? worker.gx,
    gy: sensor?.gy ?? worker.gy,
    gz: sensor?.gz ?? worker.gz,
    sensorConnected: true,
    serverDataConnected: true,
  };
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function StatusCard({ type, level, title, value, worker }) {
  const icons = { external: Package, health: Heart, fall: ArrowDownRight };
  const Icon = icons[type];
  return (
    <section className={`worker-status-card ${level}`}>
      <div className="worker-status-title"><span className={`status-card-icon ${level}`}><Icon size={18}/></span><strong>{title}</strong></div>
      <StatusBadge level={level}>{labels[level]}</StatusBadge>
      {type === 'health' ? (
        <>
          <strong className={`status-card-value ${level}`}>{worker.heartRate} bpm</strong>
          <div className="detail-fatigue"><div className={`fatigue-bar level-${worker.fatigue}`}><i/><i/><i/></div><b>{worker.fatigue}단계</b></div>
        </>
      ) : <strong className={`status-card-value ${level}`}>{value}</strong>}
    </section>
  );
}

export default function WorkerDetail() {
  const { workerId } = useParams();
  const navigate = useNavigate();
  const { workers, updateWorker, deleteWorker } = useWorkers();
  const worker = workers.find((item) => item.id === decodeURIComponent(workerId));
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [imageError, setImageError] = useState('');
  const [reconnectingHelmet, setReconnectingHelmet] = useState(false);
  const [toast, setToast] = useState('');
  const imageInput = useRef(null);
  const [sensorLoading, setSensorLoading] = useState(false);
  const [sensorError, setSensorError] = useState('');

  const refreshDetailStatus = useCallback(async () => {
    if (!worker?.deviceId) return null;

    setSensorLoading(true);
    setSensorError('');

    try {
      const sensor = await getWorkerStatus(worker.deviceId);
      updateWorker(worker.id, statusPatchFromSensor(worker, sensor));
      return sensor;
    } catch (error) {
      console.error('작업자 상세 센서 상태 조회 실패:', error);
      setSensorError(error?.message || '작업자 상세 상태를 불러오지 못했습니다.');
      throw error;
    } finally {
      setSensorLoading(false);
    }
  }, [worker?.id, worker?.deviceId, updateWorker]);

  useEffect(() => {
    if (!worker?.deviceId) return;
    refreshDetailStatus().catch(() => {});
  }, [worker?.id, worker?.deviceId]);

  if (!worker) {
    return <><TopHeader title="작업자 상태" subtitle="전체 작업자 현황"/><div className="page-body"><div className="panel worker-not-found">삭제되었거나 존재하지 않는 작업자입니다.<Link to="/workers">작업자 목록으로</Link></div></div></>;
  }

  const healthLevel = worker.heartRate >= 85 || worker.fatigue >= 2 ? 'warning' : 'normal';
  const fallLevel = worker.status === 'danger' && worker.issue.includes('추락') ? 'danger' : 'normal';
  const externalLevel = worker.issue.includes('물웅덩이') || worker.issue.includes('장애물') ? 'warning' : 'normal';

  const changeImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return setImageError('이미지 파일만 선택해 주세요.');
    if (file.size > 3 * 1024 * 1024) return setImageError('3MB 이하 이미지를 선택해 주세요.');
    const profileImage = await fileToDataUrl(file);
    updateWorker(worker.id, { profileImage });
    setImageError('');
    event.target.value = '';
  };

  const handleDelete = () => {
    deleteWorker(worker.id);
    setDeleteOpen(false);
    navigate('/workers');
  };

  const reconnectHelmet = () => {
    if (!worker.helmetId || reconnectingHelmet) return;
    setReconnectingHelmet(true);
    setToast(`${worker.helmetId} 헬멧 연결을 다시 확인하고 있습니다.`);
    window.setTimeout(() => {
      try {
        const key = 'safehelmet-helmets-v1';
        const helmets = JSON.parse(localStorage.getItem(key) || '[]');
        const next = helmets.map((helmet) => helmet.helmetNumber === worker.helmetId ? {
          ...helmet,
          workerId: worker.id,
          workerName: worker.name,
          sensorConnected: true,
          lastCommunication: '방금 전',
          status: 'inUse',
        } : helmet);
        if (helmets.length) localStorage.setItem(key, JSON.stringify(next));
        const currentWorker = JSON.parse(localStorage.getItem('safehelmet_worker_profile') || '{}');
        if (currentWorker.helmetNo === worker.helmetId) {
          const updatedProfile = { ...currentWorker, helmetConnected: true, sensorConnected: true, helmetLastConnectedAt: new Date().toISOString() };
          localStorage.setItem('safehelmet_worker_profile', JSON.stringify(updatedProfile));
          window.dispatchEvent(new CustomEvent('safehelmet-worker-profile-updated', { detail: updatedProfile }));
        }
      } catch {}
      updateWorker(worker.id, { sensorConnected: true });
      window.dispatchEvent(new Event('safehelmet-helmets-updated'));
      setReconnectingHelmet(false);
      setToast(`${worker.helmetId} 헬멧과 센서가 재연결되었습니다.`);
    }, 650);
  };

  return (
    <>
      <TopHeader title="작업자 상태" subtitle="전체 작업자 현황" onRefresh={refreshDetailStatus} />
      <div className="page-body worker-detail-page">
        <div className="worker-detail-actions">
          <Link className="detail-back" to="/workers"><ChevronLeft size={16}/> 작업자 목록</Link>
          <div className="worker-detail-action-buttons"><button className="reconnect-worker-helmet-btn" onClick={reconnectHelmet} disabled={reconnectingHelmet || !worker.helmetId}><RefreshCw size={14} className={reconnectingHelmet ? 'spin' : ''}/> {reconnectingHelmet ? '재연결 중' : '헬멧 재연결'}</button><button className="delete-worker-btn" onClick={() => setDeleteOpen(true)}><Trash2 size={14}/> 작업자 삭제</button></div>
        </div>

        {(sensorLoading || sensorError) && (
          <div className={`worker-filter-banner ${sensorError ? 'danger' : 'normal'}`}>
            <span>
              {sensorLoading
                ? `${worker.deviceId} 최신 센서 상태를 불러오는 중입니다.`
                : `상세 센서 연동 실패: ${sensorError}`}
            </span>
          </div>
        )}

        <section className="panel worker-profile-panel">
          <div className={`detail-profile-avatar ${worker.status}`} onClick={() => imageInput.current?.click()} title="프로필 사진 변경">
            {worker.profileImage ? <img src={worker.profileImage} alt={`${worker.name} 프로필`}/> : <span>{worker.name.slice(0, 1)}</span>}
            <span className="detail-avatar-dot"/>
            <span className="photo-edit-badge"><Camera size={12}/></span>
          </div>
          <input ref={imageInput} className="hidden-file-input" type="file" accept="image/*" onChange={changeImage}/>
          <div className="worker-profile-copy">
            <div className="profile-name-row"><h2>{worker.name}</h2><StatusBadge level={worker.status}>{labels[worker.status]}</StatusBadge></div>
            <div className="worker-meta-row">
              <span><Cpu size={13}/> 사번 {worker.employeeNumber || worker.workerCode}</span>
              <span><MapPin size={13}/> {worker.zone}</span>
              <span><HardHat size={13}/> {worker.helmetId}</span>
              <span><Phone size={13}/> {worker.phone || '연락처 미등록'}</span>
              <span className={worker.serverDataConnected ? 'sensor-ok' : 'sensor-waiting'}>
                <Wifi size={13}/>
                {worker.serverDataConnected ? '실시간 센서 데이터 연결됨' : '서버 센서 데이터 대기'}
              </span>
              {worker.deviceId && <span><Cpu size={13}/> {worker.deviceId}</span>}
              {worker.spo2 != null && <span>SpO₂ {worker.spo2}</span>}
              {worker.recordedAt && <span>센서 갱신 {new Date(worker.recordedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>}
            </div>
            <button className="change-photo-text" onClick={() => imageInput.current?.click()}><Camera size={12}/> 프로필 사진 변경</button>
            {imageError && <small className="profile-image-error">{imageError}</small>}
          </div>
        </section>

        <div className="worker-status-grid">
          <StatusCard type="external" title="외부요인" level={externalLevel} value={externalLevel === 'normal' ? '위험 요소 없음' : worker.issue} worker={worker}/>
          <StatusCard type="health" title="건강" level={healthLevel} worker={worker}/>
          <StatusCard type="fall" title="추락" level={fallLevel} value={fallLevel === 'danger' ? '추락 감지됨' : '감지 없음'} worker={worker}/>
        </div>
      </div>
      <DeleteWorkerModal worker={worker} open={deleteOpen} onClose={() => setDeleteOpen(false)} onDelete={handleDelete}/>
      <ActionToast message={toast} onClose={() => setToast('')} />
    </>
  );
}
