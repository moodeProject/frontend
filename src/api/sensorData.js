import { api } from './client'

export async function sendSensorData(sensorData) {
  const response = await api.post('/api/sensor-data', {
    deviceId: sensorData.deviceId,
    ax: Number(sensorData.ax),
    ay: Number(sensorData.ay),
    az: Number(sensorData.az),
    gx: Number(sensorData.gx),
    gy: Number(sensorData.gy),
    gz: Number(sensorData.gz),
    heartRate: Number(sensorData.heartRate),
    spo2: Number(sensorData.spo2),
    posture: sensorData.posture,
    healthAbnormal: Boolean(sensorData.healthAbnormal),
    level: sensorData.level,
    zoneId: sensorData.zoneId || undefined,
  })

  return response?.data ?? response
}
