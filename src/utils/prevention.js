// Operational display rules only; sensor health judgments come from the server.
export const SENSOR_WINDOW_MS = 30_000;
export const EVENT_WINDOW_MS = 10 * 60_000;
export const SUSTAINED_MS = 30_000;
const yes = value => value === true || String(value).toLowerCase() === 'true';
const abnormal = value => {
  const state = String(value ?? '').trim().toUpperCase();
  return Boolean(state) && !['NORMAL', 'UNKNOWN', 'WAITING', 'NO_DATA', 'UNMEASURED', 'DISCONNECTED'].includes(state);
};

export function isRecent(value, now, windowMs) {
  const stamp = Date.parse(value);
  return Number.isFinite(stamp) && now - stamp >= -30_000 && now - stamp <= windowMs;
}

export function belongsTo(item, worker) {
  const id = item.workerId ?? item.rawEvent?.worker?.id;
  const workerId = worker.workerId ?? worker.id;
  if (id != null && workerId != null) return String(id) === String(workerId);
  const employee = item.employeeNo ?? item.rawEvent?.worker?.employeeNo;
  const workerEmployee = worker.employeeNo || worker.employeeNumber;
  if (employee && workerEmployee) return String(employee) === String(workerEmployee);
  // Never match names or a previous helmet assignment for safety alerts.
  return false;
}

export function guidance(kind) {
  return {
    puddle: ['물웅덩이 주의', '젖은 바닥을 밟지 말고 안전한 동선으로 우회하세요.'],
    unguarded: ['난간 없는 구간 주의', '접근을 멈추고 안전 경계와 주변을 확인하세요.'],
    obstacle: ['장애물 주의', '이동을 잠시 멈추고 장애물을 피해 이동하세요.'],
    heat: ['온열질환 위험 신호', '작업을 멈추고 시원한 곳에서 상태를 확인하세요. 증상이 있으면 도움을 요청하세요.'],
    fatigue: ['피로 이상 신호', '안전한 곳에서 휴식하고 몸 상태를 확인하세요.'],
    health: ['건강 이상 신호', '작업을 멈추고 몸 상태를 확인하세요. 이상이 지속되면 도움을 요청하세요.'],
    posture: ['자세 이상 감지', '이동과 작업을 멈추고 안전한 곳에서 자세와 몸 상태를 확인하세요.'],
    fall: ['추락·쓰러짐 확인 필요', '움직이기 어려우면 무리하게 이동하지 말고 즉시 구조를 요청하세요.'],
  }[kind] || ['위험요인 확인 필요', '작업을 잠시 멈추고 주변 위험요인을 확인하세요.'];
}

export function sensorSignals(worker, now) {
  if (!worker.serverDataConnected || !isRecent(worker.recordedAt, now, SENSOR_WINDOW_MS)) return [];
  const kinds = [];
  if (abnormal(worker.fallState) || (yes(worker.postureAbnormal) && worker.posture === 'COLLAPSE')) kinds.push('fall');
  else if (yes(worker.postureAbnormal)) kinds.push('posture');
  if (yes(worker.heatRiskAbnormal) || yes(worker.externalHeatWarning) || abnormal(worker.heatRiskLevel)) kinds.push('heat');
  if (yes(worker.fatigueAbnormal)) kinds.push('fatigue');
  if (abnormal(worker.healthState) && !kinds.includes('heat') && !kinds.includes('fatigue')) kinds.push('health');
  return kinds;
}

export function activeEvents(events, now) {
  return events.filter(event => event.id != null &&
    !['RESOLVED', 'COMPLETED', 'CLOSED', 'DONE'].includes(String(event.status || '').toUpperCase()) &&
    event.processClass !== 'completed' && isRecent(event.occurredAt, now, EVENT_WINDOW_MS));
}

export function buildPreventionItems(workers, events, observations, now) {
  const recent = activeEvents(events, now).map(event => {
    const label = `${event.type || ''} ${event.rawEvent?.hazardType || ''}`;
    // The legacy mapper uses fatigue as a fallback for every health event.
    // Keep generic health warnings distinct from confirmed fatigue signals.
    if (event.category === 'health' && event.kind === 'fatigue' && !/fatigue|피로/i.test(label)) {
      return { ...event, kind: 'health' };
    }
    if (event.category === 'fall' && /stumble|휘청/i.test(label)) return { ...event, kind: 'posture' };
    return event;
  });
  const items = recent.map(event => {
    const worker = workers.find(row => belongsTo(event, row));
    const count = new Set(recent.filter(row => row.kind === event.kind &&
      (worker ? belongsTo(row, worker) : row.id === event.id)).map(row => String(row.id))).size;
    return { ...event, key: `event-${event.id}`, repeatCount: count, sustained: false,
      workerId: event.workerId ?? worker?.workerId ?? worker?.id,
      priority: event.level === 'danger' || count >= 2,
      target: event.category === 'fall' ? `/incident/${encodeURIComponent(event.id)}` :
        event.category === 'health' ? `/detections/health/${encodeURIComponent(event.id)}` : `/detections/${encodeURIComponent(event.id)}` };
  });
  for (const worker of workers) {
    for (const kind of sensorSignals(worker, now)) {
      const observation = observations.get(`${worker.workerId ?? worker.id}:${kind}`);
      const sustained = Boolean(observation && now - observation.firstAt >= SUSTAINED_MS);
      // A live sensor signal is kept even when its historical event was resolved.
      items.push({ key: `sensor-${worker.workerId ?? worker.id}-${kind}-${observation?.firstAt ?? worker.recordedAt}`,
        workerId: worker.workerId ?? worker.id, employeeNo: worker.employeeNumber || worker.employeeNo,
        name: worker.name, zone: worker.zone, kind, category: kind === 'fall' ? 'fall' : 'health',
        type: guidance(kind)[0], level: kind === 'fall' ? 'danger' : 'warning',
        occurredAt: worker.recordedAt, sustained, repeatCount: 1, priority: kind === 'fall' || sustained,
        target: `/workers/${encodeURIComponent(worker.workerId ?? worker.id)}` });
    }
  }
  return items.sort((a, b) => Number(b.priority) - Number(a.priority) || Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
}
