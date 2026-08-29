import { Bell } from 'lucide-react';

export default function TopHeader({ title, subtitle }) {
  return (
    <header className="top-header">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="header-right">
        <span className="date">8월 16일 (일)</span>
        <span className="clock">· 오후 06:11:13</span>
        <span className="header-pill danger">● 위험 1명</span>
        <span className="header-pill warning">● 주의 3명</span>
        <button className="bell-btn"><Bell size={16} /><span>4</span></button>
      </div>
    </header>
  );
}
