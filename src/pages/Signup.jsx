import {
  useState,
} from 'react';
import {
  Link,
  useNavigate,
} from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import {
  signupApi,
} from '../api/auth';

const initial = {
  id: '',
  password: '',
  passwordConfirm: '',
  employeeNumber: '',
  name: '',
  email: '',
  phone: '',
  department: '',
};

export default function Signup() {
  const navigate =
    useNavigate();

  const [form, setForm] =
    useState(initial);

  const [error, setError] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const update =
    (key) => (e) =>
      setForm((v) => ({
        ...v,
        [key]:
          e.target.value,
      }));

  const submit =
    async (e) => {
      e.preventDefault();
      setError('');

      if (
        form.id.trim()
          .length < 4 ||
        !/^[A-Za-z0-9]+$/.test(
          form.id
        )
      ) {
        return setError(
          '아이디는 영문·숫자 조합 4자 이상으로 입력해주세요.'
        );
      }

      if (
        form.password.length <
          8 ||
        !/[A-Za-z]/.test(
          form.password
        ) ||
        !/[0-9]/.test(
          form.password
        ) ||
        !/[^A-Za-z0-9]/.test(
          form.password
        )
      ) {
        return setError(
          '비밀번호는 8자 이상이며 영문·숫자·특수문자를 포함해야 합니다.'
        );
      }

      if (
        form.password !==
        form.passwordConfirm
      ) {
        return setError(
          '비밀번호 확인이 일치하지 않습니다.'
        );
      }

      /*
       * 최초 관리자 계정이 아직 없는 상태에서도
       * 회원가입 API를 호출할 수 있어야 합니다.
       *
       * 기존 프론트에서는 auth_token이 없으면 요청 자체를 막았는데,
       * 현재 백엔드 안내상 사전 생성된 관리자 계정이 없으므로
       * 프론트에서 선제 차단하지 않고 서버에 회원가입 요청을 보냅니다.
       */
      setLoading(true);

      try {
        await signupApi({
          loginId:
            form.id.trim(),
          password:
            form.password,
          passwordConfirm:
            form.passwordConfirm,
          employeeNumber:
            form.employeeNumber.trim(),
          name:
            form.name.trim(),
          email:
            form.email.trim(),
          phone:
            form.phone.trim(),
          department:
            form.department.trim(),
        });

        alert(
          '관리자 계정이 등록되었습니다.'
        );

        navigate('/login');
      } catch (err) {
        setError(
          err?.message ||
            '회원가입 요청에 실패했습니다.'
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <AuthLayout wide>
      <form
        className="auth-card signup-card"
        onSubmit={submit}
      >
        <div className="auth-card-head">
          <h1>
            관리자 회원가입
          </h1>

          <p>
            관리자 계정을 등록하고
            로그인할 수 있습니다
          </p>
        </div>

        <div className="auth-section-title">
          계정 정보
        </div>

        <label className="auth-field">
          <span>
            아이디 *
          </span>

          <input
            value={form.id}
            onChange={
              update('id')
            }
            placeholder="영문·숫자 조합 4자 이상"
          />
        </label>

        <label className="auth-field">
          <span>
            비밀번호 *
          </span>

          <input
            type="password"
            value={
              form.password
            }
            onChange={
              update(
                'password'
              )
            }
            placeholder="8자 이상, 영문·숫자·특수문자 포함"
          />
        </label>

        <label className="auth-field">
          <span>
            비밀번호 확인 *
          </span>

          <input
            type="password"
            value={
              form.passwordConfirm
            }
            onChange={
              update(
                'passwordConfirm'
              )
            }
            placeholder="비밀번호를 다시 입력하세요"
          />
        </label>

        <div className="auth-divider" />

        <div className="auth-section-title">
          담당자 정보
        </div>

        <label className="auth-field">
          <span>
            관리자 사번
          </span>

          <input
            value={
              form.employeeNumber
            }
            onChange={
              update(
                'employeeNumber'
              )
            }
          />
        </label>

        <label className="auth-field">
          <span>이름</span>

          <input
            value={form.name}
            onChange={
              update('name')
            }
          />
        </label>

        <label className="auth-field">
          <span>이메일</span>

          <input
            type="email"
            value={form.email}
            onChange={
              update('email')
            }
          />
        </label>

        <label className="auth-field">
          <span>연락처</span>

          <input
            value={form.phone}
            onChange={
              update('phone')
            }
          />
        </label>

        <label className="auth-field">
          <span>
            소속 / 부서
          </span>

          <input
            value={
              form.department
            }
            onChange={
              update(
                'department'
              )
            }
          />
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
            ? '회원가입 중...'
            : '관리자 계정 등록'}
        </button>

        <Link
          className="auth-secondary"
          to="/login"
        >
          로그인으로 돌아가기
        </Link>
      </form>
    </AuthLayout>
  );
}
