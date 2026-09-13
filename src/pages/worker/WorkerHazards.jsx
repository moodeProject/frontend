import { Ban, Flame, MapPin, TriangleAlert } from 'lucide-react';
import { WorkerScaffold } from '../../components/WorkerMobileUI';

const hazards=[
 {title:'물웅덩이 감지',time:'10:24',loc:'B구역 3층 북측 복도',desc:'작업 구역 바닥에 미끄럼 위험이 있습니다.',action:'주의해서 이동하세요',level:'warning',icon:Flame},
 {title:'장애물 감지',time:'09:12',loc:'B구역 3층 동측 이동로',desc:'이동 경로에 장애물이 감지되었습니다.',action:'우회 경로를 이용하세요',level:'warning',icon:TriangleAlert},
 {title:'난간 없는 구간',time:'10:26',loc:'B구역 3층 서측 엣지',desc:'추락 위험 구역에 접근 중입니다.',action:'즉시 위험 구역에서 벗어나세요',level:'danger',icon:Ban},
];

export default function WorkerHazards(){return <WorkerScaffold active="home" title="주변 위험요인 상세" back>
  <div className="worker-hazard-detail-list">{hazards.map(({title,time,loc,desc,action,level,icon:Icon})=><article key={title} className={level}><div className="worker-hazard-detail-head"><i><Icon size={20}/></i><p><strong>{title}</strong><small>{time}</small></p><b>● {level==='danger'?'위험':'주의'}</b></div><span><MapPin size={14}/>{loc}</span><p>{desc}</p><em>{level==='danger'?'⊘':'⚠'} {action}</em></article>)}</div>
</WorkerScaffold>}
