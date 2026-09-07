import { Shield } from 'lucide-react';
import '../styles/brand.css';

/**
 * Shared SafeHelmet brand lockup.
 *
 * Use this component everywhere the product logo is shown so the icon,
 * product name and subtitle stay consistent across login and admin UI.
 */
export default function SafeHelmetBrand({ variant = 'sidebar', className = '' }) {
  const isAuth = variant === 'auth';

  return (
    <div className={`safehelmet-brand safehelmet-brand--${variant} ${className}`.trim()}>
      <div className="safehelmet-brand__mark" aria-hidden="true">
        <Shield size={isAuth ? 24 : 18} strokeWidth={2.1} />
      </div>
      <div className="safehelmet-brand__copy">
        <div className="safehelmet-brand__title">SAFE HELMET</div>
        <div className="safehelmet-brand__subtitle">SAFETY MANAGEMENT SYSTEM</div>
      </div>
    </div>
  );
}
