const upper = value => String(value ?? '').trim().toUpperCase();
const yes = value => value === true || upper(value) === 'TRUE';
const abnormal = value => Boolean(upper(value)) && !['NORMAL','UNKNOWN','WAITING','NO_DATA','UNMEASURED','DISCONNECTED'].includes(upper(value));
export function recent(value, now = Date.now(), age = 60000) {
  const stamp = Date.parse(value);
  return Number.isFinite(stamp) && now - stamp >= -30000 && now - stamp <= age;
}
export function sameWorker(item, profile) {
  const id = item.workerId ?? item.rawEvent?.worker?.id;
  const ownId = profile.workerId ?? profile.id;
  if (id != null && ownId != null) return String(id) === String(ownId);
  const employee = item.employeeNo ?? item.rawEvent?.worker?.employeeNo;
  return Boolean(employee && profile.employeeNo && String(employee) === String(profile.employeeNo));
}
export function alertCopy(kind) {
  return {
    puddle: ['물웅덩이 주의', '물웅덩이가 감지되었습니다. 젖은 바닥을 피해 우회하세요.'],
    obstacle: ['장애물 주의', '장애물이 감지되었습니다. 이동을 멈추고 안전한 동선을 확인하세요.'],
    unguarded: ['난간 없는 구간 주의', '난간 없는 구간이 감지되었습니다. 접근을 멈추고 주변을 확인하세요.'],
    health: ['건강 이상 감지', '작업을 멈추고 안전한 곳에서 몸 상태를 확인하세요. 이상이 지속되면 도움을 요청하세요.'],
    heat: ['온열질환 위험 신호', '작업을 멈추고 시원한 곳에서 몸 상태를 확인하세요. 증상이 있으면 도움을 요청하세요.'],
    posture: ['휘청거림·자세 이상', '작업과 이동을 멈추고 안전한 곳에서 자세와 몸 상태를 확인하세요.'],
    fall: ['추락·쓰러짐 감지', '즉시 작업자 상태를 확인하고 도움이 필요하면 구조를 요청하세요.'],
    sos: ['SOS 긴급 요청', '작업자가 도움을 요청했습니다. 작업자와 위치를 확인하고 즉시 대응하세요.'],
  }[kind] || ['위험요인 감지', '작업을 잠시 멈추고 주변 위험요인을 확인하세요.'];
}
export function eventAlert(event) {
  if (['RESOLVED','COMPLETED','CLOSED','DONE'].includes(upper(event.status)) || event.processClass === 'completed') return null;
  const label = `${event.type || ''} ${event.rawEvent?.hazardType || ''}`;
  let kind = event.category === 'health' ? (event.kind === 'heat' ? 'heat' : 'health') : event.kind;
  if (event.category === 'fall') kind = /stumble|휘청|recommend|관찰/i.test(label) ? 'posture' : 'fall';
  const priority = kind === 'fall' ? 3 : ['health','heat','posture'].includes(kind) ? 2 : 1;
  return { ...event, key: `event:${event.id}`, kind, priority,
    target: event.category === 'fall' ? `/incident/${encodeURIComponent(event.id)}` : event.category === 'health'
      ? `/detections/health/${encodeURIComponent(event.id)}` : `/detections/${encodeURIComponent(event.id)}` };
}
export function sensorAlerts(worker, now = Date.now()) {
  if (!worker.serverDataConnected || !recent(worker.recordedAt, now, 30000)) return [];
  const kinds = [];
  const fallState = upper(worker.fallState);
  if (['FALLING','FALLEN','UNCONSCIOUS','DANGER'].includes(fallState) || (yes(worker.postureAbnormal) && upper(worker.posture) === 'COLLAPSE')) kinds.push('fall');
  else if (yes(worker.postureAbnormal) || abnormal(fallState)) kinds.push('posture');
  if (yes(worker.heatRiskAbnormal) || yes(worker.externalHeatWarning) || abnormal(worker.heatRiskLevel)) kinds.push('heat');
  if (abnormal(worker.healthState) || yes(worker.fatigueAbnormal)) kinds.push('health');
  return kinds.map(kind => ({ kind, priority: kind === 'fall' ? 3 : 2,
    episode: `sensor:${worker.workerId ?? worker.id}:${kind}`, workerId: worker.workerId ?? worker.id,
    employeeNo: worker.employeeNumber || worker.employeeNo, name: worker.name, zone: worker.zone,
    occurredAt: worker.recordedAt, target: `/workers/${encodeURIComponent(worker.workerId ?? worker.id)}` }));
}
export function notificationAlert(item) {
  if (item.source !== 'server' || item.read || item.hazardEventId != null || ['RESOLVED','COMPLETED','CLOSED','DONE'].includes(upper(item.status))) return null;
  const label = `${item.title || ''} ${item.message || ''}`;
  const sos = item.sosId != null || /SOS|구조.*요청|긴급.*요청/i.test(label);
  const health = /건강 이상|온열|피로/.test(label);
  if (!sos && !health) return null;
  return { ...item, key: `notification:${item.id}`, kind: sos ? 'sos' : 'health', priority: sos ? 3 : 2,
    name: item.requesterName || item.workerName || item.message?.split(' · ')[0] || '작업자 확인 필요',
    zone: item.zoneName || item.message?.split(' · ')[1] || '위치 확인 필요' };
}
export function createAlertTracker(startedAt = Date.now(), saved = []) {
  const seen = new Set(saved);
  return {
    take(items, now = Date.now()) {
      const fresh = [];
      for (const item of items) {
        if (!item || seen.has(item.key) || !recent(item.occurredAt, now)) continue;
        const liveSensor = item.episode && recent(item.occurredAt, now, 30000);
        if (!liveSensor && Date.parse(item.occurredAt) < startedAt - 5000) continue;
        seen.add(item.key);
        fresh.push(item);
      }
      while (seen.size > 500) seen.delete(seen.values().next().value);
      return fresh;
    },
    saved: () => [...seen],
  };
}
export function mergeAlertQueue(current, incoming) {
  const unique = new Map(current.map(item => [item.key, item]));
  for (const item of incoming) {
    // Sensor readings and their server event can describe the same incident.
    const duplicate = [...unique.values()].some(other => other.kind === item.kind &&
      sameWorker(other, { workerId: item.workerId, employeeNo: item.employeeNo }) &&
      Math.abs(Date.parse(other.occurredAt) - Date.parse(item.occurredAt)) < 15000);
    if (!duplicate) unique.set(item.key, item);
  }
  return [...unique.values()].sort((a,b) => b.priority - a.priority || Date.parse(b.occurredAt) - Date.parse(a.occurredAt)).slice(0, 30);
}
