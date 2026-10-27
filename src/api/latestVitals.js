import { api } from './client';
const cache = new Map();
// Cache per signed-in session/device; polling and parallel pages share one read.
export function getLatestVitals(deviceId) {
  const role = window.location.pathname.startsWith('/worker') ? 'worker' : 'admin';
  const token = localStorage.getItem(`safehelmet_${role}_token`) || '';
  const key = `${token}:${deviceId}`;
  const existing = cache.get(key);
  if (existing && Date.now() < existing.expires) return existing.promise;
  const entry = { expires: Date.now() + 30000, promise: null };
  entry.promise = api.get(`/api/workers/${encodeURIComponent(deviceId)}/vitals/latest`)
    .then(response => ({ ...(response?.data ?? response ?? {}), deviceId: String(deviceId) }));
  cache.set(key, entry);
  while (cache.size > 200) cache.delete(cache.keys().next().value);
  return entry.promise;
}
