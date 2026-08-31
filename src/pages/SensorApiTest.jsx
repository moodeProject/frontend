import { useState } from 'react'
import { sendSensorData } from '../api/sensorData'

export default function SensorApiTest() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    deviceId: 'DEV-001',
    ax: '0.1',
    ay: '0.1',
    az: '9.8',
    gx: '0.1',
    gy: '0.1',
    gz: '0.1',
    heartRate: '92',
    spo2: '98',
    posture: 'STANDING',
    healthAbnormal: false,
    level: 'NORMAL',
  })

  const update = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const data = await sendSensorData(form)
      setResult(data)
    } catch (err) {
      setError(err.message || '센서 데이터 전송에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 24, fontFamily: 'sans-serif' }}>
      <h1>센서 API 테스트</h1>
      <p>POST /api/sensor-data 전송 테스트 페이지입니다.</p>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
        <label>
          Device ID
          <input value={form.deviceId} onChange={e => update('deviceId', e.target.value)} />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {['ax', 'ay', 'az'].map(key => (
            <label key={key}>
              {key}
              <input value={form[key]} onChange={e => update(key, e.target.value)} />
            </label>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {['gx', 'gy', 'gz'].map(key => (
            <label key={key}>
              {key}
              <input value={form[key]} onChange={e => update(key, e.target.value)} />
            </label>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          <label>
            심박수
            <input value={form.heartRate} onChange={e => update('heartRate', e.target.value)} />
          </label>
          <label>
            SpO2
            <input value={form.spo2} onChange={e => update('spo2', e.target.value)} />
          </label>
        </div>

        <label>
          자세
          <input value={form.posture} onChange={e => update('posture', e.target.value)} />
        </label>

        <label>
          Level
          <input value={form.level} onChange={e => update('level', e.target.value)} />
        </label>

        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={form.healthAbnormal}
            onChange={e => update('healthAbnormal', e.target.checked)}
          />
          건강 이상 여부
        </label>

        <button type="submit" disabled={loading} style={{ padding: '12px 16px', cursor: 'pointer' }}>
          {loading ? '전송 중...' : '센서 데이터 전송'}
        </button>
      </form>

      {error && (
        <pre style={{ marginTop: 24, padding: 16, background: '#fff1f2', whiteSpace: 'pre-wrap' }}>
          ❌ {error}
        </pre>
      )}

      {result && (
        <div style={{ marginTop: 24 }}>
          <h2>응답 결과</h2>
          <pre style={{ padding: 16, background: '#f3f4f6', overflow: 'auto' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
