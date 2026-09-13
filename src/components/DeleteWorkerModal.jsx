import { AlertTriangle, X } from 'lucide-react';

export default function DeleteWorkerModal({ worker, open, onClose, onDelete }) {
  if (!open || !worker) return null;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="worker-modal delete-worker-modal">
        <button className="modal-close" type="button" onClick={onClose} aria-label="닫기"><X size={17}/></button>
        <div className="delete-icon"><AlertTriangle size={22}/></div>
        <h2>작업자를 삭제할까요?</h2>
        <p><b>{worker.name}</b> 작업자를 삭제하면 작업자 목록에서 제거됩니다.<br/>현재 데모에서는 새로고침 후에도 삭제 상태가 유지됩니다.</p>
        <div className="delete-summary"><span>{worker.workerCode}</span><strong>{worker.name}</strong><em>{worker.helmetId}</em></div>
        <div className="modal-actions"><button type="button" className="secondary-modal-btn" onClick={onClose}>취소</button><button type="button" className="danger-modal-btn" onClick={onDelete}>삭제</button></div>
      </div>
    </div>
  );
}
