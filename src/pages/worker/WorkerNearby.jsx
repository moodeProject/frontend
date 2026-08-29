import { MapPin, Phone, UserRound } from 'lucide-react';
import { WorkerScaffold } from '../../components/WorkerMobileUI';

const people = [
  { name:'이정민',initial:'이',distance:14,bpm:78,zone:'B구역 3층',state:'근무 중',className:'work',x:49,y:38 },
  { name:'박수진',initial:'박',distance:28,bpm:72,zone:'B구역 2층',state:'근무 중',className:'work',x:56,y:52 },
  { name:'최동훈',initial:'최',distance:41,bpm:65,zone:'B구역 3층',state:'휴식 중',className:'rest',x:32,y:34 },
  { name:'강민준',initial:'강',distance:67,bpm:81,zone:'A구역 1층',state:'근무 중',className:'work',x:38,y:70 },
  { name:'홍길동',initial:'홍',distance:89,bpm:118,zone:'C구역 옥상',state:'위험',className:'danger',x:74,y:22 },
];

export default function WorkerNearby(){
  return <WorkerScaffold active="nearby" title="주변 작업자">
    <section className="worker-white-card worker-radar-card"><div className="worker-card-title"><strong>주변 작업자 레이더</strong><span className="worker-live">● 실시간</span></div>
      <div className="worker-radar"><div className="worker-radar-center">나</div><span className="worker-ring-label r30">30m</span><span className="worker-ring-label r60">60m</span>{people.map(p=><div key={p.name} className={`worker-radar-dot ${p.className}`} style={{left:`${p.x}%`,top:`${p.y}%`}}><i/><small>{p.name}</small></div>)}</div>
      <div className="worker-radar-legend"><span><i className="work"/>근무 중</span><span><i className="rest"/>휴식 중</span><span><i className="danger"/>위험</span></div>
    </section>

    <section className="worker-nearest-card"><div><UserRound size={23}/><p><small>가장 가까운 작업자</small><strong>이정민 <b>14m</b></strong><span>B구역 3층 · 근무 중</span></p></div><button onClick={()=>{window.location.href='tel:01000000000'}}><Phone size={19}/>연락하기</button></section>

    <div className="worker-nearby-list">{people.map((p,i)=><article key={p.name} className={p.className==='danger'?'danger':''}><div className={`worker-person-avatar ${p.className}`}>{p.initial}{i===0&&<b>1</b>}</div><div className="worker-person-copy"><strong>{p.name} <em className={p.className}>● {p.state}</em></strong><span><MapPin size={13}/>{p.zone}</span></div><div className="worker-distance"><strong>{p.distance}m</strong><small>{p.bpm} bpm</small></div></article>)}</div>
    <p className="worker-last-update">마지막 업데이트: 13:47</p>
  </WorkerScaffold>
}
