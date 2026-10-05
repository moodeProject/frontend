import {
  useState,
} from 'react';
import {
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import '../styles/passwordVisibilityToggle.css';
import {
  isWorkerUser,
  loginApi,
  saveAdminSession,
} from '../api/auth';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] =
    useState({
      id: '',
      password: '',
    });

  const [error, setError] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const submit = async (e) => {
    e.preventDefault();

    if (
      !form.id.trim() ||
      !form.password
    ) {
      setError(
        '아이디와 비밀번호를 입력해주세요.'
      );
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { user } =
        await loginApi(
          form.id.trim(),
          form.password,
          'ADMIN'
        );

      if (isWorkerUser(user)) {
        localStorage.removeItem(
          'auth_token'
        );

        setError(
          '작업자 계정입니다. 작업자 로그인 화면을 이용해주세요.'
        );
        return;
      }

      saveAdminSession(user);

      navigate(
        location.state?.from || '/',
        { replace: true }
      );
    } catch (err) {
      if (err?.status === 401) {
        setError(
          '아이디 또는 비밀번호를 확인해주세요.'
        );
      } else if (
        err?.status === 403
      ) {
        setError(
          '관리자 권한이 없는 계정입니다.'
        );
      } else {
        setError(
          err?.message ||
            '로그인 중 오류가 발생했습니다.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <form
        className="auth-card"
        onSubmit={submit}
      >
        <div className="auth-card-head">
          <h1>관리자 로그인</h1>
          <p>
            안전관리 시스템에
            로그인하세요
          </p>
        </div>

        <label className="auth-field">
          <span>아이디</span>

          <input
            value={form.id}
            onChange={(e) =>
              setForm((v) => ({
                ...v,
                id: e.target.value,
              }))
            }
            placeholder="관리자 아이디를 입력하세요"
            autoComplete="username"
          />
        </label>

        <label className="auth-field">
          <span>비밀번호</span>

          <div className="password-visibility-field">
            <input
              type={
                showPassword
                  ? 'text'
                  : 'password'
              }
              value={form.password}
              onChange={(e) =>
                setForm((v) => ({
                  ...v,
                  password:
                    e.target.value,
                }))
              }
              placeholder="비밀번호를 입력하세요"
              autoComplete="current-password"
            />

            <button
              type="button"
              className="password-visibility-button"
              onClick={() =>
                setShowPassword(
                  (value) => !value
                )
              }
              aria-label={
                showPassword
                  ? '비밀번호 숨기기'
                  : '비밀번호 표시'
              }
              title={
                showPassword
                  ? '비밀번호 숨기기'
                  : '비밀번호 표시'
              }
            >
              {showPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>
        </label>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <button
          className="auth-primary"
          type="submit"
          disabled={loading}
        >
          {loading
            ? '로그인 중...'
            : '로그인'}
        </button>

        <div className="auth-links auth-links-three">
          <Link to="/find-id">
            아이디 찾기
          </Link>
          <i />
          <Link to="/find-password">
            비밀번호 찾기
          </Link>
          <i />
          <Link to="/signup">
            회원가입
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
