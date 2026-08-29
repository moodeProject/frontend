import { Link2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export default function ConnectHelmetModal({ open, onClose, onConnect, helmets, workers, initialHelmetNumber = '', initialWorkerId = '' }) {
  const [helmetNumber, setHelmetNumber] = useState('');
  const [workerId, setWorkerId] = useState('');
  const [error, setError] = useState('');

  const availableHelmets = useMemo(() => helmets, [helmets]);
  const availableWorkers = useMemo(() => workers, [workers]);

  useEffect(() => {
    if (!open) return;
    setHelmetNumber(initialHelmetNumber || '');
    setWorkerId(initialWorkerId || '');
    setError('');
  }, [open, initialHelmetNumber, initialWorkerId]);

  if (!open) return null;

  const close = () => {
    setHelmetNumber('');
    setWorkerId('');
    setError('');
    onClose();
  };

  const submit = (event) => {
    event.preventDefault();
    if (!helmetNumber || !workerId) {
      setError('연결할 헬멧과 작업자를 모두 선택해주세요.');
      return;
    }
    onConnect(helmetNumber, workerId);
    close();
  };

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && close()}>
      <form className="worker-modal helmet-connect-modal" onSubmit={submit}>
        <button type="button" className="modal-close" onClick={close} aria-label="닫기"><X size={16}/></button>
        <div className="modal-heading helmet-connect-heading">
          <span className="connect-modal-icon"><Link2 size={18}/></span>
          <div>
            <h2>헬멧 연결</h2>
            <p>등록된 스마트 안전모를 연결하거나 기존 연결을 재설정합니다.</p>
          </div>
        </div>

        <label className="form-field">
          <span className="form-label-line"><span>헬멧 선택 <b>*</b></span></span>
          <select value={helmetNumber} onChange={(e) => setHelmetNumber(e.target.value)}>
            <option value="">연결할 헬멧을 선택하세요</option>
            {availableHelmets.map((helmet) => (
              <option key={helmet.helmetNumber} value={helmet.helmetNumber}>
                {helmet.helmetNumber} · {helmet.deviceId} · {helmet.workerName && helmet.workerName !== '미연결' ? `현재 ${helmet.workerName}` : '미배정'}
              </option>
            ))}
          </select>
        </label>

        <label className="form-field">
          <span className="form-label-line"><span>작업자 선택 <b>*</b></span></span>
          <select value={workerId} onChange={(e) => setWorkerId(e.target.value)}>
            <option value="">연결할 작업자를 선택하세요</option>
            {availableWorkers.map((worker) => (
              <option key={worker.id} value={worker.id}>{worker.name} · {worker.employeeNumber} · {worker.zone}</option>
            ))}
          </select>
        </label>

        <div className="helmet-connect-guide">
          <Link2 size={15}/>
          <span>연결하면 헬멧 관리 목록과 작업자 정보에 즉시 반영됩니다.</span>
        </div>
                {error && <p className="form-error">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="secondary-modal-btn" onClick={close}>취소</button>
          <button type="submit" className="primary-modal-btn">연결 / 재연결</button>
        </div>
      </form>
    </div>
  );
}
