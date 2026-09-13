import { Shield } from 'lucide-react';

export default function AuthLayout({ children, wide = false }) {
  return (
    <div className={`auth-page ${wide ? 'auth-page-wide' : ''}`}>
      <div className="auth-wrap">
        <div className="auth-brand">
          <div className="auth-brand-mark"><Shield size={24} strokeWidth={2.1}/></div>
          <strong>SAFE HELMET</strong>
          <span>SAFETY MANAGEMENT SYSTEM</span>
        </div>
        {children}
      </div>
    </div>
  );
}
