import { Outlet } from 'react-router-dom';
import SafetyAlertCenter from './SafetyAlertCenter';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <SafetyAlertCenter role="admin" />
      <main className="main-shell"><Outlet /></main>
    </div>
  );
}
