import { useState } from 'react'
import { sendSensorData } from '../api/sensorData'
import { getWorkerStatus } from '../api/workerStatus'

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
      posture: 'STABLE',
      healthAbnormal: false,
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
      posture: 'STUMBLE',
      healthAbnormal: false,
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
      posture: 'COLLAPSE',
      healthAbnormal: false,
      level: 'NORMAL',
    },
  },
}

export default function SensorApiTest() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [verifyResult, setVerifyResult] = useState(null)
  const [testStatus, setTestStatus] = useState(null)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    deviceId: 'DEV-001',
    ...POSTURE_TESTS.STABLE.form,
  })

  const update = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

  const verifyPosture = async (deviceId, expectedPosture, expectedAbnormal) => {
    await wait(500)

    const latest = await getWorkerStatus(deviceId)
    setVerifyResult(latest)

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

  const send = async (payload, expectedPosture = null, expectedAbnormal = null) => {
    setLoading(true)
    setError('')
    setResult(null)
    setVerifyResult(null)
    setTestStatus(null)

    try {
      const data = await sendSensorData(payload)
      setResult(data)

      if (expectedPosture) {
        await verifyPosture(
          payload.deviceId,
          expectedPosture,
          expectedAbnormal
        )
      }
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

  const runPreset = async (posture) => {
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
        자세 상태 테스트용 페이지입니다.
        전송 후 <code>GET /api/workers/{'{deviceId}'}</code>를 다시 호출하여
        <b> posture / postureAbnormal</b> 값까지 자동 검증합니다.
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
        <strong>DEV-001 박민수 자세 테스트</strong>
        <p style={{ margin: '7px 0 14px', color: '#64748b', fontSize: 14 }}>
          아래 버튼 하나만 누르면 센서 전송 → 최신 상태 조회 → PASS/FAIL 확인까지 자동으로 진행합니다.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <button
            type="button"
            disabled={loading}
            style={presetButtonStyle}
            onClick={() => runPreset('STABLE')}
          >
            정상 복구
            <br />
            <small>STABLE / false</small>
          </button>

          <button
            type="button"
            disabled={loading}
            style={presetButtonStyle}
            onClick={() => runPreset('STUMBLE')}
          >
            휘청거림 테스트
            <br />
            <small>STUMBLE / true</small>
          </button>

          <button
            type="button"
            disabled={loading}
            style={presetButtonStyle}
            onClick={() => runPreset('COLLAPSE')}
          >
            쓰러짐 테스트
            <br />
            <small>COLLAPSE / true</small>
          </button>
        </div>
      </section>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
        <label>
          Device ID
          <input
            style={inputStyle}
            value={form.deviceId}
            onChange={e => update('deviceId', e.target.value)}
          />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {['ax', 'ay', 'az'].map(key => (
            <label key={key}>
              {key}
              <input
                style={inputStyle}
                value={form[key]}
                onChange={e => update(key, e.target.value)}
              />
            </label>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {['gx', 'gy', 'gz'].map(key => (
            <label key={key}>
              {key}
              <input
                style={inputStyle}
                value={form[key]}
                onChange={e => update(key, e.target.value)}
              />
            </label>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          <label>
            심박수
            <input
              style={inputStyle}
              value={form.heartRate}
              onChange={e => update('heartRate', e.target.value)}
            />
          </label>

          <label>
            SpO2
            <input
              style={inputStyle}
              value={form.spo2}
              onChange={e => update('spo2', e.target.value)}
            />
          </label>
        </div>

        <label>
          자세
          <select
            style={inputStyle}
            value={form.posture}
            onChange={e => update('posture', e.target.value)}
          >
            <option value="STABLE">STABLE - 정상 자세</option>
            <option value="STUMBLE">STUMBLE - 휘청거림</option>
            <option value="COLLAPSE">COLLAPSE - 쓰러짐</option>
          </select>
        </label>

        <label>
          Level
          <input
            style={inputStyle}
            value={form.level}
            onChange={e => update('level', e.target.value)}
          />
        </label>

        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={form.healthAbnormal}
            onChange={e => update('healthAbnormal', e.target.checked)}
          />
          건강 이상 여부
        </label>

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
        <pre
          style={{
            marginTop: 24,
            padding: 16,
            background: '#fff1f2',
            whiteSpace: 'pre-wrap',
            borderRadius: 10,
          }}
        >
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
    </div>
  )
}
