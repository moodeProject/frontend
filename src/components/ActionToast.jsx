import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { useEffect } from 'react';

const icons = {
  success: CheckCircle2,
  warning: TriangleAlert,
  info: Info,
};

export default function ActionToast({ message, type = 'success', onClose, duration = 2600 }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(() => onClose?.(), duration);
    return () => window.clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;
  const Icon = icons[type] || CheckCircle2;

  return (
    <div className={`action-toast ${type}`} role="status" aria-live="polite">
      <Icon size={17} />
      <span>{message}</span>
      <button type="button" onClick={onClose} aria-label="메시지 닫기"><X size={14}/></button>
    </div>
  );
}
