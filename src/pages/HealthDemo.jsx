import { useState } from 'react';
import { HeartPulse, ArrowLeft, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import TopHeader from '../components/TopHeader';

const stages = [
  { label: '정상', heartRate: 78, spo2: 98, hrv: 48, tone: '#15966a', action: '평소 상태를 유지하고 작업을 진행합니다.' },
  { label: '주의', heartRate: 112, spo2: 96, hrv: 29, tone: '#d08918', action: '작업자의 상태를 확인하고 휴식을 권고합니다.' },
  { label: '조치 필요', heartRate: 132, spo2: 92, hrv: 18, tone: '#d73746', action: '작업 중단 후 안전한 장소에서 상태를 확인하고 필요시 긴급 대응합니다.' },
];

export default function HealthDemo() {
  const [step, setStep] = useState(0);
  const [handled, setHandled] = useState(false);
  const stage = stages[step];
  const buttonStyle = (active) => ({
    padding: '12px 18px', borderRadius: 12, border: active ? '2px solid #182e43' : '1px solid #d8e0e8',
    background: active ? '#edf4fb' : '#fff', color: '#182e43', fontWeight: 700, cursor: 'pointer',
  });

  return (
    <>
      <TopHeader title="건강 상태 체험" subtitle="건강 상태 변화 및 관리자 대응" />
      <div className="page-body" style={{ maxWidth: 1250, margin: '0 auto' }}>
        <Link className="back-link detail-back" to="/workers"><ArrowLeft size={15} /> 작업자 목록</Link>
        <div className="panel" style={{ padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
            <div>
              <h2 style={{ margin: '0 0 7px' }}>건강 상태 변화</h2>
              <p style={{ margin: 0, color: '#687888' }}>테스트 작업자의 건강 상태 변화와 초기 대응을 확인합니다.</p>
            </div>
            <span style={{ fontSize: 12, padding: '6px 10px', background: '#edf1f5', borderRadius: 6, color: '#596676' }}>예시 데이터</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 24 }}>
            {stages.map((item, i) => (
              <button key={item.label} type="button" onClick={() => { setStep(i); setHandled(false); }} style={buttonStyle(step === i)}>{i + 1}. {item.label}</button>
            ))}
            <button type="button" onClick={() => { setStep(0); setHandled(false); }} style={{...buttonStyle(false), marginLeft: 'auto'}}><RotateCcw size={14} style={{verticalAlign:'middle'}} /> 처음으로</button>
          </div>
        </div>
        <div className="panel" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><HeartPulse size={24} color={stage.tone} /><h3 style={{ margin: 0 }}>테스트 작업자 · 건강 상태</h3></div>
            <strong style={{ color: stage.tone, border: '1px solid currentColor', padding: '7px 13px', borderRadius: 20 }}>{stage.label}</strong>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginTop: 22 }}>
            {[['심박수', stage.heartRate, 'bpm'], ['SpO₂', stage.spo2, '%'], ['HRV', stage.hrv, 'ms']].map(([label, value, unit]) => (
              <div key={label} style={{ background: '#f5f8fb', padding: 20, borderRadius: 12 }}>
                <div style={{ color: '#718093', fontSize: 13 }}>{label}</div>
                <div style={{ marginTop: 12, fontSize: 30, fontWeight: 750, color: '#172c42' }}>{value}<span style={{ fontSize: 13, fontWeight: 500, marginLeft: 6 }}>{unit}</span></div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, padding: 18, background: step === 2 ? '#fff2f2' : '#f1f7fc', borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: stage.tone, fontWeight: 750 }}>
              {step === 0 ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              {step === 0 ? '정상 상태' : step === 1 ? '건강 상태 확인 권고' : '건강 이상 대응 필요'}
            </div>
            <p style={{ margin: '10px 0 0', color: '#344456' }}>{stage.action}</p>
          </div>
          {step > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setHandled(true)} style={{ border: 0, borderRadius: 10, padding: '13px 20px', color: '#fff', background: '#172c42', cursor: 'pointer' }}>{handled ? '조치 확인 완료' : '관리자 조치 확인'}</button>
            {handled && <span style={{ color: '#15966a' }}>화면에서 조치 확인 완료 · 실제 서버 알림은 전송되지 않았습니다.</span>}
          </div>}
          <p style={{ marginTop: 20, color: '#87919c', fontSize: 12 }}>표시된 수치는 건강 센서의 실시간 측정값이 아니며, 실제 서버·알림 데이터는 변경하지 않습니다.</p>
        </div>
      </div>
    </>
  );
}
