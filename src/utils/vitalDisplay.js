const positive = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value)) && Number(value) > 0;
export function vitalDisplay(worker, metric = 'heartRate', now = Date.now()) {
  const latest = worker?.lastValidVitals;
  const bound = latest && worker?.deviceId && String(latest.deviceId) === String(worker.deviceId);
  const raw = worker?.[metric];
  const liveAt = worker?.[`${metric}RecordedAt`] || worker?.recordedAt || null;
  const value = positive(raw) ? Number(raw) : bound && positive(latest[metric]) ? Number(latest[metric]) : null;
  const recordedAt = positive(raw) ? liveAt : value != null ? latest[`${metric}RecordedAt`] || null : null;
  const age = recordedAt ? now - Date.parse(recordedAt) : NaN;
  const lastValid = value != null && (!positive(raw) || !Number.isFinite(age) || age > 30000);
  return { value, recordedAt, lastValid };
}
export function measurementAge(value, now = Date.now()) {
  if (!value || !Number.isFinite(Date.parse(value))) return '측정 시각 미확인';
  const seconds = Math.max(0, Math.floor((now - Date.parse(value)) / 1000));
  if (seconds < 60) return '방금 측정';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}분 전 측정`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}시간 전 측정`;
  return new Date(value).toLocaleString('ko-KR');
}
