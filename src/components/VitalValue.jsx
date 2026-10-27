import { useWorkers } from '../context/WorkerContext';
import { measurementAge, vitalDisplay } from '../utils/vitalDisplay';
export default function VitalValue({ worker, metric = 'heartRate', unit = '', valueOnly = false }) {
  const { workers } = useWorkers();
  const stored = workers.find(row => worker?.deviceId && String(row.deviceId) === String(worker.deviceId));
  const source = { ...worker, lastValidVitals: worker?.lastValidVitals || stored?.lastValidVitals };
  const display = vitalDisplay(source, metric);
  return <span className="vital-value" style={{ display: 'inline-flex', flexDirection: 'column', verticalAlign: 'middle', gap: 3 }}>
    <span>{display.value ?? '측정 대기'}{display.value != null && !valueOnly ? ` ${unit}` : ''}</span>
    {display.value != null && <small title={display.recordedAt ? new Date(display.recordedAt).toLocaleString('ko-KR') : ''} style={{ fontSize: 10, lineHeight: 1.45, fontWeight: 500, color: '#64748b', whiteSpace: 'normal' }}>{display.lastValid ? '마지막 유효값 · ' : ''}{measurementAge(display.recordedAt)}</small>}
  </span>;
}
