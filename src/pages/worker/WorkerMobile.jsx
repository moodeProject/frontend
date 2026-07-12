import { useEffect, useState } from "react";
import {
  Home,
  Clock,
  Bell,
  FileText,
  Shield,
  MapPin,
  Heart,
  Wifi,
  HardHat,
  LogOut,
  LogIn,
  Phone,
  Navigation,
  UserX,
  Activity,
  Zap,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Timer,
  CalendarDays,
  TrendingUp,
  Radio,
  Siren,
  AlertTriangle,
} from "lucide-react";
import "./WorkerMobile.css";

const worker = {
  name: "김현석",
  location: "A구역 2층 동측",
  heartRate: "78 bpm",
  lastSignal: "10초 전",
  checkIn: "08:58",
  workTime: "3시간 24분",
  expectedOut: "18:00",
};

const recentAlerts = [
  {
    time: "10:24",
    title: "추락 사고 알림",
    location: "B구역 3층 계단",
    status: "긴급",
  },
  {
    time: "10:18",
    title: "위험 구역 접근 주의",
    location: "A구역 3층",
    status: "주의",
  },
  {
    time: "09:42",
    title: "안전모 착용 확인 완료",
    location: "A구역 출입구",
    status: "정상",
  },
];

function useTime() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hour = String(time.getHours()).padStart(2, "0");
  const minute = String(time.getMinutes()).padStart(2, "0");

  return `${hour}:${minute}`;
}

function StatusBadge({ status }) {
  return <span className={`status-badge ${status}`}>{status}</span>;
}

function Card({ children, className = "" }) {
  return <section className={`worker-card ${className}`}>{children}</section>;
}

function SectionTitle({ children }) {
  return <h3 className="section-title">{children}</h3>;
}

function AppHeader({ alertCount = 0 }) {
  const now = useTime();

  return (
    <header className="worker-header">
      <div className="worker-brand">
        <div className="brand-icon">
          <HardHat size={19} />
        </div>
        <div>
          <p className="brand-title">스마트 안전모 시스템</p>
          <p className="brand-subtitle">근로자 모바일 웹</p>
        </div>
      </div>

      <div className="header-right">
        <span className="header-time">{now}</span>
        <div className="header-bell">
          <Bell size={16} />
          {alertCount > 0 && <span>{alertCount}</span>}
        </div>
      </div>
    </header>
  );
}

function PageTitle({ title }) {
  return (
    <div className="worker-page-title">
      <h1>{title}</h1>
    </div>
  );
}

function BottomTab({ activeTab, setActiveTab }) {
  const tabs = [
    { id: "home", label: "홈", icon: Home },
    { id: "attendance", label: "출퇴근", icon: Clock },
    { id: "alert", label: "알림", icon: Bell },
    { id: "sos", label: "SOS", icon: Siren },
    { id: "records", label: "기록", icon: FileText },
  ];

  return (
    <nav className="bottom-tab">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const isSos = tab.id === "sos";

        return (
          <button
            key={tab.id}
            className={`${isActive ? "active" : ""} ${isSos ? "sos-tab" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <Icon size={21} strokeWidth={isActive ? 2.6 : 2} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function InfoCard({ icon, label, value, highlight }) {
  return (
    <Card className="info-card">
      <div className="info-icon">{icon}</div>
      <p>{label}</p>
      <strong className={highlight ? "highlight" : ""}>{value}</strong>
    </Card>
  );
}

function InfoLine({ icon, label, value, danger }) {
  return (
    <div className="info-line">
      <div>
        {icon && <span className="line-icon">{icon}</span>}
        <span>{label}</span>
      </div>
      <strong className={danger ? "danger-text" : ""}>{value}</strong>
    </div>
  );
}

function HomeScreen() {
  return (
    <main className="worker-content">
      <div className="greeting">
        <p>👋 안녕하세요</p>
        <h2>{worker.name} 님, 오늘도 안전한 하루 되세요!</h2>
      </div>

      <section className="main-status-card">
        <div className="status-top">
          <span>현재 안전 상태</span>
          <StatusBadge status="정상" />
        </div>

        <div className="status-main">
          <div className="status-shield">
            <Shield size={34} />
          </div>
          <div>
            <h3>정상</h3>
            <strong>위험도 낮음</strong>
            <p>모든 센서 정상 작동</p>
          </div>
        </div>
      </section>

      <div className="info-grid">
        <InfoCard
          icon={<HardHat size={16} />}
          label="안전모 착용"
          value="착용 중"
          highlight
        />
        <InfoCard
          icon={<MapPin size={16} />}
          label="현재 위치"
          value={worker.location}
        />
        <InfoCard
          icon={<Heart size={16} />}
          label="심박수"
          value={worker.heartRate}
        />
        <InfoCard
          icon={<Wifi size={16} />}
          label="최근 통신"
          value={worker.lastSignal}
          highlight
        />
      </div>

      <Card className="movement-card">
        <div className="movement-left">
          <div className="blue-icon">
            <Activity size={18} />
          </div>
          <div>
            <p>움직임 상태</p>
            <strong>정상 움직임 감지</strong>
          </div>
        </div>

        <div className="mini-bars">
          {[2, 4, 6, 4, 2].map((height, index) => (
            <span key={index} style={{ height: `${height * 4}px` }} />
          ))}
        </div>
      </Card>

      <div>
        <SectionTitle>오늘 근무 현황</SectionTitle>
        <Card className="work-summary-card">
          <div>
            <p>출근 시간</p>
            <strong>{worker.checkIn}</strong>
          </div>
          <span className="divider" />
          <div>
            <p>근무 시간</p>
            <strong>3:24</strong>
            <small>시간 분</small>
          </div>
        </Card>
      </div>

      <div>
        <div className="title-row">
          <SectionTitle>최근 알림</SectionTitle>
          <button>전체 보기 →</button>
        </div>

        <Card className="alert-list-card">
          {recentAlerts.map((alert) => (
            <div className="alert-row" key={alert.time}>
              <AlertIcon status={alert.status} />
              <div>
                <div className="alert-meta">
                  <span>{alert.time}</span>
                  <StatusBadge status={alert.status} />
                </div>
                <strong>{alert.title}</strong>
                <p>{alert.location}</p>
              </div>
              <ChevronRight size={14} />
            </div>
          ))}
        </Card>
      </div>
    </main>
  );
}

function AlertIcon({ status }) {
  if (status === "긴급") return <XCircle className="red-icon" size={15} />;
  if (status === "주의") return <AlertCircle className="yellow-icon" size={15} />;
  return <CheckCircle2 className="green-icon" size={15} />;
}

function AttendanceScreen() {
  const [checkedOut, setCheckedOut] = useState(false);

  return (
    <main className="worker-content">
      <Card>
        <div className="attendance-head">
          <span>현재 근무 상태</span>
          <span className={`work-badge ${checkedOut ? "off" : ""}`}>
            {checkedOut ? "퇴근 완료" : "근무 중"}
          </span>
        </div>

        <div className="attendance-list">
          <InfoLine icon={<Clock size={14} />} label="출근 시간" value={worker.checkIn} />
          <InfoLine icon={<Timer size={14} />} label="현재 근무 시간" value={worker.workTime} />
          <InfoLine icon={<CalendarDays size={14} />} label="예상 퇴근 시간" value={worker.expectedOut} />
          <InfoLine icon={<MapPin size={14} />} label="근무 위치" value={worker.location} />
          <InfoLine icon={<HardHat size={14} />} label="안전모 상태" value="착용 중" />
        </div>
      </Card>

      <button className="checkout-button" onClick={() => setCheckedOut(!checkedOut)}>
        {checkedOut ? <LogIn size={22} /> : <LogOut size={22} />}
        {checkedOut ? "출근하기" : "퇴근하기"}
      </button>

      <div>
        <SectionTitle>오늘 근무 기록</SectionTitle>
        <Card>
          <TimelineItem time="08:58" title="출근 완료" desc="A구역 출입구" done />
          <TimelineItem time="현재" title="근무 중" desc="A구역 2층 동측" active />
          <TimelineItem time="18:00" title="퇴근 예정" desc="예상 퇴근 시간" />
        </Card>
      </div>

      <NoticeBox>
        퇴근 버튼을 누르면 근무가 종료되고 관리자에게 퇴근 정보가 전송됩니다.
      </NoticeBox>
    </main>
  );
}

function TimelineItem({ time, title, desc, active, done }) {
  return (
    <div className="timeline-item">
      <span className={`timeline-dot ${active ? "active" : ""} ${done ? "done" : ""}`} />
      <div>
        <div className="timeline-time">
          <span>{time}</span>
          {active && <em>진행 중</em>}
        </div>
        <strong>{title}</strong>
        <p>{desc}</p>
      </div>
    </div>
  );
}

function AlertScreen() {
  return (
    <main className="worker-content">
      <section className="emergency-card">
        <div className="emergency-label">
          <span />
          긴급 상황 발생
        </div>

        <div className="emergency-title">
          <AlertTriangle size={20} />
          <h2>긴급 추락 사고 발생</h2>
        </div>

        <div className="emergency-info">
          <InfoLine label="작업자" value="이준호" />
          <InfoLine label="ID" value="W-1024" />
          <InfoLine label="위치" value="B구역 3층 계단" />
          <InfoLine label="발생 시간" value="10:24 (2분 전)" />
          <InfoLine label="위험도" value="매우 높음" danger />
          <InfoLine label="상태" value="의식불명 의심" danger />
        </div>
      </section>

      <div className="action-list">
        <button className="action-button red">
          <Navigation size={19} />
          현장 확인하러 가기
        </button>
        <button className="action-button orange">
          <MapPin size={19} />
          위치 확인
        </button>
        <button className="action-button blue">
          <Phone size={19} />
          관리자에게 연락
        </button>
        <button className="action-button gray">
          <UserX size={19} />
          도움 불가
        </button>
      </div>

      <div>
        <SectionTitle>사고 정보</SectionTitle>
        <Card className="accident-info-card">
          <AccidentInfo icon={<Navigation size={14} />} text="현재 위치에서 거리 35m" />
          <AccidentInfo icon={<AlertTriangle size={14} />} text="추가 지원이 필요한 상황입니다" />
          <AccidentInfo icon={<Shield size={14} />} text="안전하게 접근하세요" />
        </Card>
      </div>
    </main>
  );
}

function AccidentInfo({ icon, text }) {
  return (
    <div className="accident-info-line">
      <span>{icon}</span>
      <p>{text}</p>
    </div>
  );
}

function SOSScreen() {
  const [selected, setSelected] = useState(null);
  const [pressed, setPressed] = useState(false);

  const situations = [
    ["⬇️", "추락 / 넘어짐"],
    ["🤒", "몸 상태 이상"],
    ["🚧", "위험 구역 고립"],
    ["⚠️", "장비 이상"],
    ["👀", "주변 작업자 사고 발견"],
    ["📋", "기타"],
  ];

  return (
    <main className="worker-content">
      <section className="sos-banner">
        <p>긴급 도움이 필요하신가요?</p>
        <h2>SOS 긴급 요청</h2>
      </section>

      <section className="sos-center">
        <button className={`sos-button ${pressed ? "pressed" : ""}`} onClick={() => setPressed(!pressed)}>
          SOS
        </button>
        <p>
          버튼을 누르면 관리자와 주변 작업자에게
          <br />
          즉시 알림이 전송됩니다.
        </p>
      </section>

      <div>
        <SectionTitle>상황을 선택해주세요</SectionTitle>
        <div className="situation-grid">
          {situations.map(([emoji, label]) => (
            <button
              key={label}
              className={selected === label ? "selected" : ""}
              onClick={() => setSelected(selected === label ? null : label)}
            >
              <span>{emoji}</span>
              <p>{label}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <SectionTitle>전송될 정보</SectionTitle>
        <Card className="send-info-card">
          <InfoLine icon={<MapPin size={14} />} label="현재 위치" value={worker.location} />
          <InfoLine icon={<Heart size={14} />} label="심박수" value={worker.heartRate} />
          <InfoLine icon={<HardHat size={14} />} label="안전모 상태" value="착용 중" />
          <InfoLine icon={<Radio size={14} />} label="센서 정보" value="가속도 · 자이로 · GPS" />
        </Card>
      </div>
    </main>
  );
}

function RecordsScreen() {
  const [tab, setTab] = useState("근무");

  const records = [
    ["2024.05.31", "08:57 ~ 18:02", "9시간 05분"],
    ["2024.05.30", "09:02 ~ 18:15", "9시간 13분"],
    ["2024.05.29", "08:55 ~ 17:58", "9시간 03분"],
  ];

  return (
    <main className="worker-content">
      <div className="record-tabs">
        {["근무", "안전", "알림"].map((item) => (
          <button
            key={item}
            className={tab === item ? "active" : ""}
            onClick={() => setTab(item)}
          >
            {item} 기록
          </button>
        ))}
      </div>

      {tab === "근무" && (
        <>
          <div>
            <div className="record-head">
              <SectionTitle>오늘 근무 기록</SectionTitle>
              <div>
                <span className="work-badge">근무 중</span>
                <strong>3시간 24분</strong>
              </div>
            </div>

            <Card>
              <TimelineItem time="08:58" title="출근" desc="A구역 출입구" done />
              <TimelineItem time="현재" title="근무 중" desc="A구역 2층 동측" active />
              <TimelineItem time="18:00" title="퇴근 예정" desc="예정" />
            </Card>
          </div>

          <div>
            <SectionTitle>최근 근무 기록</SectionTitle>
            <Card className="recent-record-card">
              {records.map(([date, time, total]) => (
                <div className="record-row" key={date}>
                  <div>
                    <strong>{date}</strong>
                    <p>{time}</p>
                  </div>
                  <div>
                    <strong>{total}</strong>
                    <span>
                      <TrendingUp size={10} />
                      정상 출퇴근
                    </span>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        </>
      )}

      {tab === "안전" && (
        <Card className="empty-record-card">
          <Shield size={34} />
          <strong>이번 주 무사고 근무 중</strong>
          <p>최근 7일간 안전 이상 없음</p>
        </Card>
      )}

      {tab === "알림" && (
        <Card className="alert-list-card">
          {recentAlerts.map((alert) => (
            <div className="alert-row" key={alert.time}>
              <AlertIcon status={alert.status} />
              <div>
                <div className="alert-meta">
                  <span>{alert.time}</span>
                  <StatusBadge status={alert.status} />
                </div>
                <strong>{alert.title}</strong>
                <p>{alert.location}</p>
              </div>
              <ChevronRight size={14} />
            </div>
          ))}
        </Card>
      )}

      <NoticeBox>
        기록은 관리자 페이지와 연동되어 정확한 근무 관리에 사용됩니다.
      </NoticeBox>
    </main>
  );
}

function NoticeBox({ children }) {
  return (
    <div className="notice-box">
      <Zap size={15} />
      <p>{children}</p>
    </div>
  );
}

export default function WorkerMobile() {
  const [activeTab, setActiveTab] = useState("home");

  const pageTitles = {
    home: "스마트 안전모 시스템",
    attendance: "출퇴근 관리",
    alert: "긴급 알림",
    sos: "SOS 요청",
    records: "내 기록",
  };

  return (
    <div className="worker-mobile-shell">
      <div className="worker-phone-frame">
        <div className="phone-top-space" />

        <AppHeader alertCount={activeTab === "alert" ? 3 : 0} />
        <PageTitle title={pageTitles[activeTab]} />

        {activeTab === "home" && <HomeScreen />}
        {activeTab === "attendance" && <AttendanceScreen />}
        {activeTab === "alert" && <AlertScreen />}
        {activeTab === "sos" && <SOSScreen />}
        {activeTab === "records" && <RecordsScreen />}

        <BottomTab activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
}