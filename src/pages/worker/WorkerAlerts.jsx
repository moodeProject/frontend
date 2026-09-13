import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WorkerScaffold } from '../../components/WorkerMobileUI';

const items=[
 {cat:'external',level:'warning',time:'10:24',title:'물웅덩이 감지',desc:'작업 구역 바닥이 미끄럽습니다.'},
 {cat:'external',level:'danger',time:'10:26',title:'난간 없는 구간 접근',desc:'추락 위험 구역에 접근 중입니다.'},
 {cat:'health',level:'warning',time:'10:27',title:'피로도 이상',desc:'피로도 2단계가 감지되었습니다. 휴식이 필요합니다.'},
 {cat:'fall',level:'danger',time:'10:28',title:'추락 감지',desc:'추락이 감지되었습니다. 즉시 확인이 필요합니다.'},
 {cat:'health',level:'warning',time:'09:45',title:'심박 이상',desc:'심박수가 110 bpm으로 높습니다.'},
 {cat:'external',level:'warning',time:'09:12',title:'장애물 감지',desc:'이동 경로에 장애물이 감지되었습니다.'},
];

export default function WorkerAlerts(){
  const [tab,setTab]=useState('all');
  const navigate=useNavigate();
  const filtered=tab==='all'?items:items.filter(i=>i.cat===tab);
  const openItem=(item)=>{
    if(item.cat==='external') navigate('/worker/hazards');
    else if(item.cat==='health') navigate('/worker/health');
    else navigate('/worker/fall-alert');
  };
  return <WorkerScaffold active="alerts" title="알림">
    <div className="worker-alert-tabs">{[['all','전체'],['external','외부요인'],['health','건강'],['fall','추락']].map(([k,l])=><button key={k} className={tab===k?'active':''} onClick={()=>setTab(k)}>{l}</button>)}</div>
    <div className="worker-alert-list">{filtered.map((a)=><button type="button" key={a.title+a.time} className={`worker-alert-card ${a.level}`} onClick={()=>openItem(a)}><div><span>● {a.level==='danger'?'위험':'주의'}</span><time>{a.time}</time></div><strong>{a.title}</strong><p>{a.desc}</p></button>)}</div>
  </WorkerScaffold>
}
