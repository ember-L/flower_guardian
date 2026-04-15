// 用户类型定义
export interface User {
  id: string | number
  email: string
  phone?: string
  username?: string
  avatar?: string
  avatar_url?: string
  created_at?: string
}

export interface LoginForm {
  email: string
  password: string
}

export interface RegisterForm {
  email: string
  phone?: string
  username?: string
  password: string
  confirmPassword: string
}

export interface VerificationForm {
  email: string
  code: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface AuthResponse {
  success: boolean
  token?: string
  user?: User
  error?: string
}
