import { Link } from 'react-router-dom';
import darkLogo from '../assets/brand/safeon-dark.webp';
import lightLogo from '../assets/brand/safeon-light.webp';
import '../styles/brand.css';

/**
 * SAFE:ON 공통 브랜드 로고.
 * - sidebar: 네이비 배경용 화이트 로고
 * - auth: 밝은 배경용 네이비 로고
 *
 * 로고 전체를 클릭하면 관리자 홈(통합 모니터링)으로 이동합니다.
 */
export default function SafeHelmetBrand({
  variant = 'sidebar',
  className = '',
  to = '/',
}) {
  const logo = variant === 'sidebar' ? darkLogo : lightLogo;

  return (
    <Link
      to={to}
      className={`safehelmet-brand safehelmet-brand--${variant} ${className}`.trim()}
      aria-label="SAFE:ON 통합 모니터링으로 이동"
      title="통합 모니터링으로 이동"
    >
      <img
        className="safehelmet-brand__logo"
        src={logo}
        alt="SAFE:ON"
        draggable="false"
      />
      <span className="safehelmet-brand__subtitle">
        SAFETY MANAGEMENT SYSTEM
      </span>
    </Link>
  );
}
