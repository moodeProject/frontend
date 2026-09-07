import SafeHelmetBrand from './SafeHelmetBrand';

export default function AuthLayout({ children, wide = false }) {
  return (
    <div className={`auth-page ${wide ? 'auth-page-wide' : ''}`}>
      <div className="auth-wrap">
        <SafeHelmetBrand variant="auth" />
        {children}
      </div>
    </div>
  );
}
