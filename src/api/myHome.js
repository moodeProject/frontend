import { api } from './client';

// Worker-authorized self-service endpoint. No admin-wide worker/helmet calls.
export async function getMyHome() {
  const response = await api.get('/api/me/home');
  return response?.data ?? response ?? {};
}

export function normalizeMyHome(payload = {}) {
  const data = payload?.data ?? payload;
  const worker = data.worker ?? data.me ?? data.profile ?? data.workerInfo ?? {};
  const helmet = data.helmet ?? data.assignedHelmet ?? data.helmetInfo ?? {};
  const sensor = data.sensor ?? data.sensorData ?? data.latestSensorData ?? data.latestSensor ?? data.sensorStatusDetail ?? {};
  const health = data.health ?? data.healthStatus ?? {};
  const communication = data.lastCommunicationAt ?? helmet.lastCommunicationAt ?? sensor.lastCommunicationAt ?? null;
  const stamp = communication ? new Date(communication).getTime() : NaN;
  const connected = Number.isFinite(stamp) && Date.now() - stamp >= -30000 && Date.now() - stamp <= 30000;
  const valid = value => value === undefined || value === null || value === '' || !Number.isFinite(Number(value)) || Number(value) <= 0 ? null : Number(value);
  const employeeNo = worker.employeeNo ?? data.employeeNo ?? '';
  const id = worker.workerId ?? worker.id ?? data.workerId ?? data.id ?? '';
  const helmetNo = helmet.helmetNo ?? helmet.helmetId ?? data.helmetNo ?? data.helmetId ?? '';
  const deviceId = helmet.deviceId ?? data.deviceId ?? sensor.deviceId ?? '';
  return {
    ...worker,
    id: String(id),
    workerId: String(id),
    employeeNumber: employeeNo,
    employeeNo,
    name: worker.name ?? worker.workerName ?? data.workerName ?? data.name ?? '작업자',
    helmetId: helmetNo,
    helmetNo,
    deviceId,
    zone: worker.zone?.name ?? worker.zoneName ?? data.zone?.name ?? data.zoneName ?? '위치 미확인',
    lastCommunicationAt: communication,
    recordedAt: sensor.recordedAt ?? data.recordedAt ?? communication,
    sensorConnected: connected,
    serverDataConnected: connected,
    heartRate: valid(sensor.heartRate ?? health.heartRate ?? data.heartRate),
    spo2: valid(sensor.spo2 ?? health.spo2 ?? data.spo2),
    hrv: valid(sensor.hrv ?? health.hrv ?? data.hrv),
    posture: connected ? sensor.posture ?? data.posture ?? '' : '',
    fallState: connected ? sensor.fallState ?? data.fallState ?? null : null,
    healthState: sensor.healthState ?? health.healthState ?? data.healthState ?? null,
    fatigueAbnormal: sensor.fatigueAbnormal ?? health.fatigueAbnormal ?? false,
    heatRiskAbnormal: sensor.heatRiskAbnormal ?? health.heatRiskAbnormal ?? false,
    status: connected && ['DANGER','CAUTION'].includes(String(sensor.fallState ?? data.fallState ?? '').toUpperCase()) ? 'danger' :
      connected && ['DANGER','CAUTION'].includes(String(sensor.healthState ?? health.healthState ?? '').toUpperCase()) ? 'warning' : 'normal',
    issue: connected ? '센서 데이터 수신 중' : '센서 수신 지연',
  };
}
