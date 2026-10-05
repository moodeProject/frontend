import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'
import {
  getMe,
  loginApi,
  logoutApi,
  saveAdminSession,
} from '../api/auth'

const AuthContext =
  createContext(null)

export function AuthProvider({
  children,
}) {
  const [user, setUser] =
    useState(() => {
      try {
        const saved =
          localStorage.getItem(
            'safehelmet_current_admin'
          )

        return saved
          ? JSON.parse(saved)
          : null
      } catch {
        return null
      }
    })

  const [loading, setLoading] =
    useState(false)

  useEffect(() => {
    const token =
      localStorage.getItem(
        'auth_token'
      )

    if (!token || !user) return

    getMe()
      .then((me) => {
        const next =
          saveAdminSession({
            ...user,
            ...me,
          })

        setUser(next)
      })
      .catch(() => {
        // 토큰 만료는 실제 API 호출 시
        // 401 에러로 다시 로그인하도록 처리합니다.
      })
  }, [])

  async function login(
    id,
    password
  ) {
    setLoading(true)

    try {
      const { user: loginUser } =
        await loginApi(
          id,
          password
        )

      const next =
        saveAdminSession(
          loginUser
        )

      setUser(next)

      return next
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    try {
      await logoutApi()
    } finally {
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(
    AuthContext
  )
}
