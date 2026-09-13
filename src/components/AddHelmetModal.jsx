import { X } from 'lucide-react';
import { useMemo, useState } from 'react';

export default function AddHelmetModal({ open, onClose, onAdd, helmets, workers }) {
  const [helmetNumber, setHelmetNumber] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [workerId, setWorkerId] = useState('');
  const [memo, setMemo] = useState('');
  const [error, setError] = useState('');

  const availableWorkers = useMemo(() => {
    const assigned = new Set(helmets.filter((helmet) => helmet.workerId).map((helmet) => helmet.workerId));
    return workers.filter((worker) => !assigned.has(worker.id));
  }, [helmets, workers]);

  if (!open) return null;

  const resetAndClose = () => {
    setHelmetNumber('');
    setDeviceId('');
    setWorkerId('');
    setMemo('');
    setError('');
    onClose();
  };

  const submit = (event) => {
    event.preventDefault();
    const helmet = helmetNumber.trim().toUpperCase();
    const device = deviceId.trim().toUpperCase();
    if (!helmet || !device) {
      setError('헬멧 번호와 기기 ID를 입력해주세요.');
      return;
    }
    if (helmets.some((item) => item.helmetNumber.toUpperCase() === helmet)) {
      setError('이미 등록된 헬멧 번호입니다.');
      return;
    }
    if (helmets.some((item) => item.deviceId.toUpperCase() === device)) {
      setError('이미 등록된 기기 ID입니다.');
      return;
    }

    const worker = workers.find((item) => item.id === workerId);
    onAdd({
      helmetNumber: helmet,
      deviceId: device,
      workerId: worker?.id || '',
      workerName: worker?.name || '미연결',
      sensorConnected: true,
      lastCommunication: '방금 전',
      status: worker ? 'inUse' : 'standby',
      memo: memo.trim(),
    });
    resetAndClose();
  };

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && resetAndClose()}>
      <form className="worker-modal helmet-register-modal" onSubmit={submit}>
        <button type="button" className="modal-close" onClick={resetAndClose}><X size={16}/></button>
        <div className="modal-heading">
          <h2>헬멧 등록</h2>
          <p>새 스마트 안전모를 등록합니다.</p>
        </div>

        <label className="form-field">헬멧 번호 <b>*</b>
          <input value={helmetNumber} onChange={(e) => setHelmetNumber(e.target.value)} placeholder="예: H-008" />
        </label>
        <label className="form-field">기기 ID <b>*</b>
          <input value={deviceId} onChange={(e) => setDeviceId(e.target.value)} placeholder="예: DEV-008" />
        </label>
        <label className="form-field">작업자 연결 <span>(선택)</span>
          <select value={workerId} onChange={(e) => setWorkerId(e.target.value)}>
            <option value="">미연결</option>
            {availableWorkers.map((worker) => <option key={worker.id} value={worker.id}>{worker.name} · {worker.employeeNumber}</option>)}
          </select>
        </label>
        <label className="form-field">메모 <span>(선택)</span>
          <textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="메모를 입력하세요" />
        </label>
        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="secondary-modal-btn" onClick={resetAndClose}>취소</button>
          <button type="submit" className="primary-modal-btn">헬멧 등록</button>
        </div>
      </form>
    </div>
  );
}
