import { Coffee, DoorOpen, HeartPulse, ShieldAlert, TriangleAlert } from 'lucide-react';
import { useMemo, useState } from 'react';
import { WorkerScaffold } from '../../components/WorkerMobileUI';

const todayRecords = [
  ['08:58','출근','B구역 3층','green',DoorOpen],
  ['09:12','장애물 감지','이동 경로 주의','orange',TriangleAlert],
  ['09:45','심박 이상 감지','110 bpm','blue',HeartPulse],
  ['10:00','휴식 시작','', 'gray',Coffee],
  ['10:15','휴식 종료','', 'gray',Coffee],
  ['10:24','물웅덩이 감지','B구역 3층 북측','orange',TriangleAlert],
  ['10:26','난간 없는 구간 접근','위험 구역','red',ShieldAlert],
  ['10:27','피로도 2단계 경고','', 'blue',HeartPulse],
  ['10:28','추락 감지','긴급 알림 전송됨','red',ShieldAlert],
  ['13:30','점심 휴식','', 'gray',Coffee],
];

const recentRecords = [
  ...todayRecords.map((item) => ['오늘', ...item]),
  ['08.28','18:12','퇴근','정상 근무 완료','green',DoorOpen],
  ['08.28','15:42','피로도 1단계','휴식 권고','blue',HeartPulse],
  ['08.27','11:18','장애물 감지','B구역 2층','orange',TriangleAlert],
  ['08.26','09:03','출근','B구역 3층','green',DoorOpen],
];

export default function WorkerRecords(){
  const [tab, setTab] = useState('today');
  const rows = useMemo(() => tab === 'today' ? todayRecords : recentRecords, [tab]);

  return <WorkerScaffold active="home" title="내 기록" back>
    <section className="worker-white-card worker-week-summary"><h3>이번 주 요약</h3><div><span><b>5</b>전체 경고</span><span><b>2</b>피로도</span><span><b>3</b>외부요인</span></div></section>
    <div className="worker-record-tabs"><button className={tab === 'today' ? 'active' : ''} onClick={() => setTab('today')}>오늘</button><button className={tab === 'week' ? 'active' : ''} onClick={() => setTab('week')}>최근 7일</button></div>
    <section className="worker-white-card worker-timeline">
      {tab === 'today' ? rows.map(([time,title,sub,color,Icon])=><div className="worker-timeline-row" key={time+title}><i className={color}><Icon size={16}/></i><time>{time}</time><p className={color}><strong>{title}</strong>{sub && <small>{sub}</small>}</p></div>) : rows.map(([date,time,title,sub,color,Icon], index)=><div className="worker-timeline-row week" key={`${date}-${time}-${title}-${index}`}><i className={color}><Icon size={16}/></i><time><small>{date}</small>{time}</time><p className={color}><strong>{title}</strong>{sub && <small>{sub}</small>}</p></div>)}
    </section>
  </WorkerScaffold>
}
