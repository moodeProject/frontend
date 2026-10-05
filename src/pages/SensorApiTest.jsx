import { useState } from 'react'
import { sendSensorData } from '../api/sensorData'
import {
  getWorkerHeatRisk,
  getWorkerStatus,
} from '../api/workerStatus'

const POSTURE_TESTS = {
  STABLE: {
    label: '정상 자세',
    expectedAbnormal: false,
    form: {
      ax: '0.1',
      ay: '0.1',
      az: '9.8',
      gx: '0.1',
      gy: '0.1',
      gz: '0.1',
      heartRate: '78',
      spo2: '98',
      hrv: '42',
      posture: 'STABLE',
      healthAbnormal: false,
      fatigueAbnormal: false,
      heatRiskAbnormal: false,
      level: 'NORMAL',
    },
  },
  STUMBLE: {
    label: '휘청거림',
    expectedAbnormal: true,
    form: {
      ax: '1.6',
      ay: '1.1',
      az: '8.9',
      gx: '1.8',
      gy: '1.2',
      gz: '0.9',
      heartRate: '88',
      spo2: '97',
      hrv: '31',
      posture: 'STUMBLE',
      healthAbnormal: false,
      fatigueAbnormal: false,
      heatRiskAbnormal: false,
      level: 'NORMAL',
    },
  },
  COLLAPSE: {
    label: '쓰러짐',
    expectedAbnormal: true,
    form: {
      ax: '3.2',
      ay: '2.4',
      az: '4.8',
      gx: '3.1',
      gy: '2.7',
      gz: '2.1',
      heartRate: '94',
      spo2: '96',
      hrv: '26',
      posture: 'COLLAPSE',
      healthAbnormal: false,
      fatigueAbnormal: false,
      heatRiskAbnormal: false,
      level: 'NORMAL',
    },
  },
}

const HEALTH_TESTS = {
  FATIGUE: {
    label: '피로도 이상',
    patch: {
      heartRate: '96',
      spo2: '96',
      hrv: '20',
      healthAbnormal: true,
      fatigueAbnormal: true,
      heatRiskAbnormal: false,
      posture: 'STABLE',
      level: 'WARNING',
    },
  },
  HEAT: {
    label: '온열질환 위험',
    patch: {
      heartRate: '104',
      spo2: '95',
      hrv: '18',
      healthAbnormal: true,
      fatigueAbnormal: true,
      heatRiskAbnormal: true,
      posture: 'STABLE',
      level: 'WARNING',
    },
  },
}

export default function SensorApiTest() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [verifyResult, setVerifyResult] = useState(null)
  const [heatRiskResult, setHeatRiskResult] = useState(null)
  const [testStatus, setTestStatus] = useState(null)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    deviceId: 'DEV-001',
    zoneId: 'ZONE-01',
    ...POSTURE_TESTS.STABLE.form,
  })

  const update = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

  const verifyLatest = async (
    deviceId,
    expectedPosture = null,
    expectedAbnormal = null
  ) => {
    await wait(500)

    const [latest, heatRisk] = await Promise.all([
      getWorkerStatus(deviceId),
      getWorkerHeatRisk(deviceId).catch(() => null),
    ])

    setVerifyResult(latest)
    setHeatRiskResult(heatRisk)

    if (!expectedPosture) return latest

    const actualPosture = String(latest?.posture || '').toUpperCase()
    const actualAbnormal =
      latest?.postureAbnormal === true ||
      String(latest?.postureAbnormal).toLowerCase() === 'true'

    const passed =
      actualPosture === expectedPosture &&
      actualAbnormal === expectedAbnormal

    setTestStatus({
      passed,
      expectedPosture,
      expectedAbnormal,
      actualPosture,
      actualAbnormal,
    })

    return latest
  }

  const send = async (
    payload,
    expectedPosture = null,
    expectedAbnormal = null
  ) => {
    setLoading(true)
    setError('')
    setResult(null)
    setVerifyResult(null)
    setHeatRiskResult(null)
    setTestStatus(null)

    try {
      const data = await sendSensorData(payload)
      setResult(data)

      await verifyLatest(
        payload.deviceId,
        expectedPosture,
        expectedAbnormal
      )
    } catch (err) {
      setError(err.message || '센서 데이터 전송/검증에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const posture = String(form.posture || '').toUpperCase()
    const preset = POSTURE_TESTS[posture]

    await send(
      form,
      preset ? posture : null,
      preset ? preset.expectedAbnormal : null
    )
  }

  const runPosturePreset = async (posture) => {
    const preset = POSTURE_TESTS[posture]
    const payload = {
      ...form,
      ...preset.form,
      posture,
    }

    setForm(payload)

    await send(
      payload,
      posture,
      preset.expectedAbnormal
    )
  }

  const runHealthPreset = async (type) => {
    const preset = HEALTH_TESTS[type]
    const payload = {
      ...form,
      ...POSTURE_TESTS.STABLE.form,
      ...preset.patch,
    }

    setForm(payload)
    await send(payload, 'STABLE', false)
  }

  const inputStyle = {
    width: '100%',
    boxSizing: 'border-box',
    marginTop: 6,
    padding: '9px 10px',
    border: '1px solid #d7dde5',
    borderRadius: 8,
  }

  const presetButtonStyle = {
    flex: 1,
    minWidth: 130,
    padding: '12px 14px',
    border: '1px solid #d7dde5',
    borderRadius: 10,
    background: '#fff',
    cursor: loading ? 'not-allowed' : 'pointer',
    fontWeight: 700,
  }

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 24, fontFamily: 'sans-serif' }}>
      <h1>센서 API 테스트</h1>
      <p>
        최신 API의 자세·HRV·피로도·온열질환 필드를 함께 전송합니다.
        전송 후 <code>GET /api/workers/{'{deviceId}'}</code>와{' '}
        <code>GET /api/workers/{'{deviceId}'}/heat-risk</code>를 다시 호출합니다.
      </p>

      <section
        style={{
          margin: '22px 0',
          padding: 18,
          border: '1px solid #e5e7eb',
          borderRadius: 14,
          background: '#f8fafc',
        }}
      >
        <strong>DEV-001 박민수 테스트</strong>
        <p style={{ margin: '7px 0 14px', color: '#64748b', fontSize: 14 }}>
          버튼 하나로 센서 전송 → 최신 상태 조회 → 건강 상세 조회까지 진행합니다.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <button type="button" disabled={loading} style={presetButtonStyle} onClick={() => runPosturePreset('STABLE')}>
            정상 복구<br /><small>STABLE / 정상</small>
          </button>
          <button type="button" disabled={loading} style={presetButtonStyle} onClick={() => runPosturePreset('STUMBLE')}>
            휘청거림 테스트<br /><small>STUMBLE / true</small>
          </button>
          <button type="button" disabled={loading} style={presetButtonStyle} onClick={() => runPosturePreset('COLLAPSE')}>
            쓰러짐 테스트<br /><small>COLLAPSE / true</small>
          </button>
          <button type="button" disabled={loading} style={presetButtonStyle} onClick={() => runHealthPreset('FATIGUE')}>
            피로도 테스트<br /><small>fatigueAbnormal = true</small>
          </button>
          <button type="button" disabled={loading} style={presetButtonStyle} onClick={() => runHealthPreset('HEAT')}>
            온열위험 테스트<br /><small>heatRiskAbnormal = true</small>
          </button>
        </div>
      </section>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
        <label>
          Device ID
          <input style={inputStyle} value={form.deviceId} onChange={e => update('deviceId', e.target.value)} />
        </label>

        <label>
          비콘 구역 (zoneId)
          <input
            style={inputStyle}
            list="sensor-zone-options"
            value={form.zoneId}
            onChange={e => update('zoneId', e.target.value)}
            placeholder="예: ZONE-01"
          />
          <datalist id="sensor-zone-options">
            <option value="ZONE-01" />
            <option value="ZONE-02" />
            <option value="ZONE-03" />
          </datalist>
          <small style={{ display: 'block', marginTop: 6, color: '#64748b' }}>
            BLE 비콘에서 판별한 구역 ID를 함께 전송합니다.
          </small>
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {['ax', 'ay', 'az'].map(key => (
            <label key={key}>
              {key}
              <input style={inputStyle} value={form[key]} onChange={e => update(key, e.target.value)} />
            </label>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {['gx', 'gy', 'gz'].map(key => (
            <label key={key}>
              {key}
              <input style={inputStyle} value={form[key]} onChange={e => update(key, e.target.value)} />
            </label>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <label>
            심박수
            <input style={inputStyle} value={form.heartRate} onChange={e => update('heartRate', e.target.value)} />
          </label>
          <label>
            SpO2
            <input style={inputStyle} value={form.spo2} onChange={e => update('spo2', e.target.value)} />
          </label>
          <label>
            HRV
            <input style={inputStyle} value={form.hrv} onChange={e => update('hrv', e.target.value)} />
          </label>
        </div>

        <label>
          자세
          <select style={inputStyle} value={form.posture} onChange={e => update('posture', e.target.value)}>
            <option value="STABLE">STABLE - 정상 자세</option>
            <option value="STUMBLE">STUMBLE - 휘청거림</option>
            <option value="COLLAPSE">COLLAPSE - 쓰러짐</option>
          </select>
        </label>

        <label>
          Level
          <input style={inputStyle} value={form.level} onChange={e => update('level', e.target.value)} />
        </label>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="checkbox" checked={form.healthAbnormal} onChange={e => update('healthAbnormal', e.target.checked)} />
            건강 이상
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="checkbox" checked={form.fatigueAbnormal} onChange={e => update('fatigueAbnormal', e.target.checked)} />
            피로도 이상
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="checkbox" checked={form.heatRiskAbnormal} onChange={e => update('heatRiskAbnormal', e.target.checked)} />
            온열질환 위험
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px 16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            border: 0,
            borderRadius: 9,
            background: '#2563eb',
            color: '#fff',
            fontWeight: 700,
          }}
        >
          {loading ? '전송 및 검증 중...' : '현재 값으로 센서 데이터 전송'}
        </button>
      </form>

      {error && (
        <pre style={{ marginTop: 24, padding: 16, background: '#fff1f2', whiteSpace: 'pre-wrap', borderRadius: 10 }}>
          ❌ {error}
        </pre>
      )}

      {testStatus && (
        <div
          style={{
            marginTop: 24,
            padding: 18,
            borderRadius: 12,
            background: testStatus.passed ? '#ecfdf3' : '#fff1f2',
            border: `1px solid ${testStatus.passed ? '#bbf7d0' : '#fecdd3'}`,
          }}
        >
          <h2 style={{ marginTop: 0 }}>
            {testStatus.passed ? '✅ 자세 API 테스트 PASS' : '❌ 자세 API 테스트 FAIL'}
          </h2>
          <div>
            기대값: <b>{testStatus.expectedPosture}</b> / postureAbnormal{' '}
            <b>{String(testStatus.expectedAbnormal)}</b>
          </div>
          <div style={{ marginTop: 6 }}>
            실제값: <b>{testStatus.actualPosture || '-'}</b> / postureAbnormal{' '}
            <b>{String(testStatus.actualAbnormal)}</b>
          </div>
        </div>
      )}

      {result && (
        <div style={{ marginTop: 24 }}>
          <h2>POST 응답 결과</h2>
          <div style={{ marginBottom: 10, padding: '10px 12px', borderRadius: 8, background: '#eff6ff', color: '#1e3a8a' }}>
            전송 zoneId: <b>{form.zoneId || '-'}</b> · 서버 응답 zoneId:{' '}
            <b>{result?.zoneId ?? result?.data?.zoneId ?? '-'}</b>
          </div>
          <pre style={{ padding: 16, background: '#f3f4f6', overflow: 'auto', borderRadius: 10 }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      {verifyResult && (
        <div style={{ marginTop: 24 }}>
          <h2>GET 최신 상태 검증 결과</h2>
          <pre style={{ padding: 16, background: '#eef6ff', overflow: 'auto', borderRadius: 10 }}>
            {JSON.stringify(verifyResult, null, 2)}
          </pre>
        </div>
      )}

      {heatRiskResult && (
        <div style={{ marginTop: 24 }}>
          <h2>GET 온열질환·피로도 상세 결과</h2>
          <pre style={{ padding: 16, background: '#fff7ed', overflow: 'auto', borderRadius: 10 }}>
            {JSON.stringify(heatRiskResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
