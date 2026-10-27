import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { sendSensorData } from '../api/sensorData';
import { getHelmets } from '../api/helmets';
import { getWorkerStatus } from '../api/workerStatus';
import TopHeader from '../components/TopHeader';

const CASES = {
  WAITING: { title: '데이터 대기 · 미측정', heartRate: 0, spo2: 0, hrv: 0, healthAbnormal: false, fatigueAbnormal: false, heatRiskAbnormal: false, level: 'NORMAL' },
  NORMAL: { title: '정상', heartRate: 78, spo2: 98, hrv: 48, healthAbnormal: false, fatigueAbnormal: false, heatRiskAbnormal: false, level: 'NORMAL' },
  RECOMMEND: { title: '주의 · 휴식 권고', heartRate: 112, spo2: 96, hrv: 29, healthAbnormal: true, fatigueAbnormal: true, heatRiskAbnormal: false, level: 'RECOMMEND' },
  ACTION_REQUIRED: { title: '조치 필요 · 건강 이상', heartRate: 132, spo2: 92, hrv: 18, healthAbnormal: true, fatigueAbnormal: true, heatRiskAbnormal: true, level: 'ACTION_REQUIRED' },
};
const inputStyle = { boxSizing:'border-box', width:'100%', border:'1px solid #dce4ed', borderRadius:9, padding:'11px 12px', marginTop:7 };
const panelStyle = { background:'#fff', border:'1px solid #e4e9f0', borderRadius:14, padding:22, marginBottom:16 };
const sampleMotion = { ax:0.1, ay:0.1, az:9.8, gx:0.1, gy:0.1, gz:0.1, posture:'STABLE', fallDetected:false, fallConfidence:0, unconscious:false };

export default function HealthApiTest() {
  const [helmets,setHelmets] = useState([]);
  const [deviceId,setDeviceId] = useState('');
  const [zoneId,setZoneId] = useState('');
  const [scenario,setScenario] = useState('NORMAL');
  const [values,setValues] = useState(CASES.NORMAL);
  const [confirmed,setConfirmed] = useState(false);
  const [sending,setSending] = useState(false);
  const [response,setResponse] = useState(null);
  const [latest,setLatest] = useState(null);
  const [error,setError] = useState('');
  const [verifyError,setVerifyError] = useState('');
  const [helmetError,setHelmetError] = useState('');

  useEffect(()=>{
    getHelmets().then(data=>{
      const arr = Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : [];
      setHelmets(arr);
    }).catch(e=>setHelmetError(e.message || '헬멧 목록 조회 실패'));
  },[]);

  const applyScenario = (key) => {
    setError(''); setVerifyError(''); setScenario(key); setValues(CASES[key]); setConfirmed(false); setResponse(null); setLatest(null);
  };
  const send = async () => {
    const id = deviceId.trim();
    if (!confirmed || !id) { setError('디바이스 ID와 실제 DB 저장 확인을 체크해 주세요.'); return; }
    if (scenario !== 'WAITING' && (!Number.isFinite(Number(values.heartRate)) || Number(values.heartRate)<=0 ||
        !Number.isFinite(Number(values.spo2)) || Number(values.spo2)<=0 || Number(values.spo2)>100 ||
        !Number.isFinite(Number(values.hrv)) || Number(values.hrv)<=0)) {
      setError('건강 데이터 숫자를 확인해 주세요.'); return;
    }
    setSending(true); setError(''); setVerifyError(''); setResponse(null); setLatest(null);
    const payload = {
      deviceId:id, zoneId:zoneId.trim() || undefined, ...sampleMotion,
      heartRate:Number(values.heartRate), spo2:Number(values.spo2), hrv:Number(values.hrv),
      level:values.level, healthAbnormal:Boolean(values.healthAbnormal),
      fatigueAbnormal:Boolean(values.fatigueAbnormal), heatRiskAbnormal:Boolean(values.heatRiskAbnormal)
    };
    try {
      const result = await sendSensorData(payload);
      setResponse(result);
      try { setLatest(await getWorkerStatus(id)); }
      catch (e) { setVerifyError('저장 요청은 응답을 받았으나 최신 조회에 실패했습니다: '+(e.message || '조회 실패')); }
    } catch(e) { setError(e.message || '서버 데이터 저장 실패'); }
    finally { setSending(false); setConfirmed(false); }
  };
  return (<>
    <TopHeader title="건강 센서 API 테스트" subtitle="서버 저장 및 최신 데이터 검증" />
    <div className="page-body" style={{ maxWidth:1150,margin:'0 auto' }}>
      <Link to="/workers" className="back-link detail-back">← 작업자 목록</Link>
      <section style={panelStyle}>
        <h2 style={{margin:'0 0 10px'}}>건강 센서값 서버 전송</h2>
        <p style={{color:'#64748b',lineHeight:1.6,margin:'0 0 16px'}}>이 화면은 실제 POST /api/sensor-data 요청으로 서버 DB에 기록을 생성합니다. 아래 값은 테스트 입력값이며 실제 센서 측정치가 아닙니다. 작업자에게 연결된 헬멧의 정확한 deviceId를 선택하세요.</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:14}}>
          <label>디바이스 ID (필수)
            <input style={inputStyle} value={deviceId} onChange={e=>{setDeviceId(e.target.value);setConfirmed(false);}} placeholder="예: HELMET-001" list="health-device-options"/>
            <datalist id="health-device-options">{helmets.map((h,i)=><option key={i} value={h.deviceId || h.device?.deviceId || ''}>{h.helmetNo || h.helmetId || h.id || ''}</option>)}</datalist>
          </label>
          <label>구역 코드 (선택)
            <input style={inputStyle} value={zoneId} onChange={e=>setZoneId(e.target.value)} placeholder="예: ZONE-01"/>
          </label>
        </div>
        {helmetError && <p style={{color:'#ad4e1f'}}>헬멧 목록 조회: {helmetError} · ID를 직접 입력할 수 있습니다.</p>}
        <p style={{fontSize:12,color:'#64748b'}}>활성화된 실제 ESP32가 같은 ID로 계속 데이터를 보내면 테스트값은 곧 새 센서값으로 교체될 수 있습니다.</p>
      </section>
      <section style={panelStyle}>
        <h3 style={{marginTop:0}}>상태 선택</h3>
        <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
          {Object.entries(CASES).map(([key,c])=><button type="button" key={key} onClick={()=>applyScenario(key)} disabled={sending} style={{padding:'12px 18px',borderRadius:10,border:scenario===key?'2px solid #193d59':'1px solid #dce4ed',background:scenario===key?'#eef6fd':'white',fontWeight:700,cursor:'pointer'}}>{c.title}</button>)}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:14,marginTop:20}}>
          {[['heartRate','심박수 (bpm)'],['spo2','SpO₂ (%)'],['hrv','HRV (ms)']].map(([key,label])=><label key={key}>{label}<input type="number" disabled={sending || scenario === 'WAITING'} min={scenario === 'WAITING' ? 0 : 1} max={key==='spo2'?100:undefined} style={inputStyle} value={values[key]} onChange={e=>setValues(v=>({...v,[key]:e.target.value}))}/></label>)}
        </div>
        {scenario === 'WAITING' && <p role="status" style={{color:'#64748b',lineHeight:1.6}}>심박수·SpO₂·HRV를 0(미측정)으로 전송합니다. 건강 이상 플래그는 모두 false이며, NORMAL은 API 전송용 값입니다. 실제 센서 연결을 끊거나 기존 기록을 삭제하지 않습니다. 다른 센서의 테스트값은 그대로 전송됩니다.</p>}
        <p style={{fontSize:13,color:'#64748b',marginBottom:0}}>서버 건강 단계: <b>{values.level}</b> · 추락 데이터는 STABLE / fallDetected=false로 전송됩니다.</p>
      </section>
      <section style={panelStyle}>
        <label style={{display:'flex',gap:10,alignItems:'flex-start',fontWeight:650}}>
          <input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} />
          선택한 deviceId에 테스트 건강 데이터를 실제 서버 DB에 저장하고, 상태 및 알림에 영향을 줄 수 있음을 확인했습니다.
        </label>
        <button type="button" disabled={sending || !confirmed || !deviceId.trim()} onClick={send} style={{marginTop:16,padding:'12px 24px',background:'#17446a',color:'white',border:0,borderRadius:10,fontWeight:700,opacity:sending || !confirmed || !deviceId.trim()?.5:1,cursor:'pointer'}}>{sending?'저장 및 조회 중...':'실제 서버에 저장하고 조회'}</button>
        {error && <p role="alert" style={{color:'#ba2033'}}>저장 실패: {error}</p>}
        {response && <><h3>POST 저장 응답</h3><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',background:'#f3f6fa',padding:14,borderRadius:8}}>{JSON.stringify(response,null,2)}</pre></>}
        {verifyError && <p style={{color:'#a45514'}}>{verifyError}</p>}
        {latest && <><h3>GET 최신 상태 응답</h3><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',background:'#f3f6fa',padding:14,borderRadius:8}}>{JSON.stringify(latest,null,2)}</pre></>}
        <p style={{fontSize:12,color:'#64748b'}}>주의: HTTP 저장 성공은 테스트값의 저장을 뜻하며 실제 센서 정상 동작을 증명하지 않습니다. 작업자 할당이 없으면 건강 이상 알림이 생성되지 않을 수 있습니다.</p>
      </section>
    </div>
  </>);
}
