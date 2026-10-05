import {
  useState,
} from 'react';
import {
  Eye,
  EyeOff,
  HardHat,
  HeartPulse,
  Shield,
  ShieldAlert,
} from 'lucide-react';
import {
  useLocation,
  useNavigate,
} from 'react-router-dom';
import {
  isAdminUser,
  loginApi,
  saveWorkerAuthSession,
} from '../../api/auth';
import '../../styles/passwordVisibilityToggle.css';
import {
  ensureWorkerProfile,
  saveWorkerProfile,
} from '../../utils/workerProfile';

export default function WorkerLogin() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [employeeNo, setEmployeeNo] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [show, setShow] =
    useState(false);

  const [error, setError] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const submit = async (e) => {
    e.preventDefault();

    if (
      !employeeNo.trim() ||
      !password.trim()
    ) {
      setError(
        '사번과 비밀번호를 입력해주세요.'
      );
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { user } =
        await loginApi(
          employeeNo.trim(),
          password,
          'WORKER'
        );

      const role =
        String(
          user?.role || ''
        ).toUpperCase();

      if (
        role &&
        isAdminUser(user) &&
        !role.includes('WORKER')
      ) {
        localStorage.removeItem(
          'auth_token'
        );

        setError(
          '관리자 계정입니다. 관리자 로그인 화면을 이용해주세요.'
        );
        return;
      }

      const authUser =
        saveWorkerAuthSession(
          user
        );

      const current =
        ensureWorkerProfile();

      const nextProfile = {
        ...current,
        employeeNo:
          authUser.employeeNo ||
          authUser.id ||
          employeeNo.trim(),
        name:
          authUser.name ||
          current.name,
      };

      saveWorkerProfile(
        nextProfile
      );

      navigate(
        location.state?.from ||
          '/worker/home',
        { replace: true }
      );
    } catch (err) {
      if (err?.status === 401) {
        setError(
          '사번 또는 비밀번호를 확인해주세요.'
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
    <div className="worker-login-page">
      <section className="worker-login-hero">
        <div className="worker-login-logo">
          <Shield size={44} />
        </div>

        <h1>안전지킴이</h1>

        <p>
          산업현장 작업자
          <br />
          안전관리 시스템
        </p>

        <div className="worker-login-features">
          <span>
            <HardHat size={17} />
            안전모 연동
          </span>

          <span>
            <HeartPulse size={17} />
            건강 모니터링
          </span>

          <span>
            <ShieldAlert size={17} />
            긴급 대응
          </span>
        </div>
      </section>

      <form
        className="worker-login-card"
        onSubmit={submit}
      >
        <h2>로그인</h2>

        <label>
          사번

          <input
            value={employeeNo}
            onChange={(e) =>
              setEmployeeNo(
                e.target.value
              )
            }
            placeholder="사번을 입력하세요"
            autoComplete="username"
          />
        </label>

        <label>
          비밀번호

          <div className="worker-password-field">
            <input
              type={
                show
                  ? 'text'
                  : 'password'
              }
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              placeholder="비밀번호를 입력하세요"
              autoComplete="current-password"
            />

            <button
              type="button"
              className="password-visibility-button"
              onClick={() =>
                setShow((v) => !v)
              }
              aria-label={
                show
                  ? '비밀번호 숨기기'
                  : '비밀번호 표시'
              }
              title={
                show
                  ? '비밀번호 숨기기'
                  : '비밀번호 표시'
              }
            >
              {show ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>
        </label>

        {error && (
          <p className="worker-login-error">
            {error}
          </p>
        )}

        <button
          className="worker-primary-btn"
          type="submit"
          disabled={loading}
        >
          {loading
            ? '로그인 중...'
            : '로그인'}
        </button>

        <small>
          졸전 작업자 계정:
          {' '}
          WK-20241103 /
          {' '}
          Worker!2024
        </small>
      </form>
    </div>
  );
}
