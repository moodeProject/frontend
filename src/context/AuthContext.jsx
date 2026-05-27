import { createContext, useContext, useState } from 'react'

// TODO: 실제 API 인증으로 교체 → POST /auth/login
const MOCK_USERS = [
  { id: 'admin01',    password: '1234', name: '김관리자', role: '슈퍼관리자' },
  { id: 'manager01',  password: '1234', name: '이현장',   role: '현장관리자' },
]

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('auth_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  /**
   * 로그인
   * TODO: 실제 API → POST /auth/login  { id, password }
   * 성공 시 서버에서 JWT 토큰 받아 localStorage에 저장
   */
  function login(id, password) {
    const found = MOCK_USERS.find((u) => u.id === id && u.password === password)
    if (!found) return false
    const userInfo = { id: found.id, name: found.name, role: found.role }
    setUser(userInfo)
    localStorage.setItem('auth_user', JSON.stringify(userInfo))
    return true
  }

  /**
   * 로그아웃
   * TODO: 실제 API → POST /auth/logout
   */
  function logout() {
    setUser(null)
    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_token')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
