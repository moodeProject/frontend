import { useMemo } from 'react';
import { ArrowLeft, AlertTriangle, Clock3, MapPin, ShieldAlert } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import TopHeader from '../components/TopHeader';
import { useNotifications } from '../context/NotificationContext';
import '../styles/fallRescueDetail.css';

export default function FallRescueDetail() {
  const { source, notificationId } = useParams();
  const navigate = useNavigate();
  const { notifications } = useNotifications();
  const alert = useMemo(() => notifications.find(item =>
    String(item.id) === String(notificationId) &&
    String(item.source || 'manual') === String(source)
  ), [notifications, notificationId, source]);
  const message = alert?.message || '';
  const parts = message.split(' · ').map(x => x.trim()).filter(Boolean);
  const zone = parts.find(value => /구역|위치/.test(value)) || '위치 미확인';
  const workerName = parts.find(value => /작업자|WK-/.test(value)) || '작업자 정보 확인 필요';

  return <>
    <TopHeader title="추락 자동 구조요청 상세" subtitle="관리자 긴급 알림 내역" />
    <div className="page-body fall-rescue-detail-page">
      <button type="button" className="fall-rescue-back" onClick={() => navigate(-1)}><ArrowLeft size={17}/> 알림으로 돌아가기</button>
      {!alert ? (
        <section className="panel fall-rescue-detail-card">
          <h2>알림 상세를 확인할 수 없습니다</h2>
          <p>이 알림은 현재 브라우저에 저장된 이전 기록일 수 있습니다. 관리자 알림 목록에서 다시 선택해 주세요.</p>
          <Link to="/notifications">알림 목록 보기</Link>
        </section>
      ) : (
        <section className="panel fall-rescue-detail-card">
          <header className="fall-rescue-detail-heading"><div className="fall-rescue-icon"><ShieldAlert size={25}/></div><div><p>긴급 상황 알림</p><h2>{alert.title || '추락 자동 구조 요청'}</h2></div></header>
          <p className="fall-rescue-detail-message">{message || '추락 관련 자동 구조 요청 알림입니다.'}</p>
          <div className="fall-rescue-detail-grid">
            <div><span><AlertTriangle size={16}/> 작업자</span><strong>{workerName}</strong></div>
            <div><span><MapPin size={16}/> 알림에 기록된 구역</span><strong>{zone}</strong></div>
            <div><span><Clock3 size={16}/> 알림 발생 시각</span><strong>{alert.occurredAt ? new Date(alert.occurredAt).toLocaleString('ko-KR') : `${alert.date || '--.--'} ${alert.time || '--:--'}`}</strong></div>
            <div><span>알림 확인</span><strong>{alert.read ? '확인함' : '미확인'}</strong></div>
          </div>
          <p className="fall-rescue-detail-note">이 화면은 관리자 알림에 기록된 정보를 표시합니다. 과거 로컬 알림에는 서버 SOS 번호·처리 상태가 없어 실제 구조요청 접수나 처리완료를 증명하지 않습니다. 서버 SOS 기록은 관리자 홈의 SOS 미처리 목록에서 확인해 주세요.</p>
        </section>
      )}
    </div>
  </>;
}
