import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export default function AddHelmetModal({ open, onClose, onAdd, helmets, workers, initialHelmet = null }) {
  const [helmetNumber, setHelmetNumber] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [workerId, setWorkerId] = useState('');
  const [memo, setMemo] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const editing = Boolean(initialHelmet);

  useEffect(() => {
    if (!open) return;
    setHelmetNumber(initialHelmet?.helmetNumber || '');
    setDeviceId(initialHelmet?.deviceId || '');
    setWorkerId('');
    setMemo(initialHelmet?.memo || '');
    setError('');
  }, [open, initialHelmet]);

  const availableWorkers = useMemo(() => {
    const assigned = new Set(helmets.filter((helmet) => helmet.workerId).map((helmet) => String(helmet.workerId)));
    return workers.filter((worker) => !assigned.has(String(worker.id)));
  }, [helmets, workers]);

  if (!open) return null;

  const close = () => {
    if (!saving) onClose();
  };

  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    const helmet = helmetNumber.trim().toUpperCase();
    const device = deviceId.trim();
    if (!helmet || !device) {
      setError('헬멧 번호와 기기 ID를 입력해주세요.');
      return;
    }
    if (!editing && helmets.some((item) => item.helmetNumber.toUpperCase() === helmet)) {
      setError('이미 등록된 헬멧 번호입니다.');
      return;
    }
    if (!editing && helmets.some((item) => item.deviceId === device)) {
      setError('이미 등록된 기기 ID입니다.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onAdd({ helmetNumber: helmet, deviceId: device, workerId, memo: memo.trim() });
      onClose();
    } catch (error) {
      setError(error?.message || '헬멧 정보를 저장하지 못했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && close()}>
      <form className="worker-modal helmet-register-modal" onSubmit={submit}>
        <button type="button" className="modal-close" onClick={close} disabled={saving} aria-label="닫기"><X size={16}/></button>
        <div className="modal-heading">
          <h2>{editing ? '헬멧 메모 수정' : '헬멧 등록'}</h2>
          <p>{editing ? '헬멧의 관리 메모를 수정합니다.' : '새 스마트 안전모를 등록합니다.'}</p>
        </div>
        <fieldset disabled={saving} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
          <label className="form-field">헬멧 번호 <b>*</b>
            <input value={helmetNumber} disabled={editing} onChange={(e) => setHelmetNumber(e.target.value)} placeholder="예: H-008" />
          </label>
          <label className="form-field">기기 ID <b>*</b>
            <input value={deviceId} disabled={editing} onChange={(e) => setDeviceId(e.target.value)} placeholder="센서에 설정한 기기 ID" />
          </label>
          {!editing && <label className="form-field">작업자 연결 <span>(선택)</span>
            <select value={workerId} onChange={(e) => setWorkerId(e.target.value)}>
              <option value="">미연결</option>
              {availableWorkers.map((worker) => <option key={worker.id} value={worker.id}>{worker.name} · {worker.employeeNumber}</option>)}
            </select>
          </label>}
          <label className="form-field">메모 <span>(선택)</span>
            <textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="메모를 입력하세요" />
          </label>
        </fieldset>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="secondary-modal-btn" onClick={close} disabled={saving}>취소</button>
          <button type="submit" className="primary-modal-btn" disabled={saving}>{saving ? '저장 중…' : editing ? '저장' : '헬멧 등록'}</button>
        </div>
      </form>
    </div>
  );
}
