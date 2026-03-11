// 用户类型定义
export interface User {
  id: string;
  email: string;
  phone?: string;
  username?: string;
  avatar?: string;
  createdAt: string;
}

// 登录表单
export interface LoginForm {
  email: string;
  password: string;
}

// 注册表单
export interface RegisterForm {
  email: string;
  phone?: string;
  username?: string;
  password: string;
  confirmPassword: string;
}

// 验证码表单
export interface VerificationForm {
  email: string;
  code: string;
}

// 用户存储结构 (包含密码哈希)
export interface StoredUser extends User {
  passwordHash: string;
}

// 认证状态
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Token 响应
export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
}
