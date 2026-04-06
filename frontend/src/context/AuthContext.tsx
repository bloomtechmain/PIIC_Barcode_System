import { createContext, useContext, useState, ReactNode } from 'react'
import { User } from '../types'

interface AuthState {
  token: string | null
  user: User | null
}

interface AuthContextType extends AuthState {
  login: (token: string, user: User) => void
  logout: () => void
  isAdmin: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [auth, setAuth] = useState<AuthState>(() => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    return {
      token,
      user: userStr ? (JSON.parse(userStr) as User) : null
    }
  })

  const login = (token: string, user: User) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setAuth({ token, user })
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setAuth({ token: null, user: null })
  }

  return (
    <AuthContext.Provider
      value={{
        ...auth,
        login,
        logout,
        isAdmin: auth.user?.role === 'ADMIN',
        isAuthenticated: !!auth.token
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
