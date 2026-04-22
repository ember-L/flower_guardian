import Taro from '@tarojs/taro'
import { API_BASE_URL } from './config'
import { User, AuthResponse } from '../types/auth'

const TOKEN_KEY = 'huaban_token'
const REFRESH_TOKEN_KEY = 'huaban_refresh_token'
const CURRENT_USER_KEY = 'huaban_current_user'

// 获取 Token
export const getToken = (): string => {
  return Taro.getStorageSync(TOKEN_KEY) || ''
}

// 保存 Token
export const saveToken = (token: string) => {
  Taro.setStorageSync(TOKEN_KEY, token)
}

// 获取 Refresh Token
export const getRefreshToken = (): string => {
  return Taro.getStorageSync(REFRESH_TOKEN_KEY) || ''
}

// 保存 Refresh Token
export const saveRefreshToken = (token: string) => {
  Taro.setStorageSync(REFRESH_TOKEN_KEY, token)
}

// 获取当前用户
export const getCurrentUser = (): User | null => {
  const user = Taro.getStorageSync(CURRENT_USER_KEY)
  return user ? JSON.parse(user) : null
}

// 保存当前用户
export const saveCurrentUser = (user: User | null) => {
  if (user) {
    Taro.setStorageSync(CURRENT_USER_KEY, JSON.stringify(user))
  } else {
    Taro.removeStorageSync(CURRENT_USER_KEY)
  }
}

// 检查是否登录
export const isAuthenticated = (): boolean => {
  const token = getToken()
  return !!token
}

// 登录
export const login = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await Taro.request({
      url: `${API_BASE_URL}/api/users/login`,
      method: 'POST',
      header: { 'Content-Type': 'application/x-www-form-urlencoded' },
      data: `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,
    })

    if (response.statusCode !== 200) {
      const errorData = response.data as any
      return { success: false, error: errorData?.detail || '登录失败' }
    }

    const data = response.data as any
    saveToken(data.access_token)
    if (data.refresh_token) {
      saveRefreshToken(data.refresh_token)
    }

    // 获取用户信息
    const userRes = await Taro.request({
      url: `${API_BASE_URL}/api/users/me`,
      header: { 'Authorization': `Bearer ${data.access_token}` },
    })

    if (userRes.statusCode !== 200) {
      return { success: false, error: '获取用户信息失败' }
    }

    const userData = userRes.data as any
    const user: User = {
      id: userData.id,
      email: userData.email,
      username: userData.username,
      avatar: userData.avatar_url,
      created_at: userData.created_at,
    }
    saveCurrentUser(user)

    return { success: true, token: data.access_token, user }
  } catch (error: any) {
    return { success: false, error: error.message || '网络错误' }
  }
}

// 注册
export const register = async (email: string, password: string, username?: string, code?: string): Promise<AuthResponse> => {
  try {
    // 先验证邮箱验证码（RN端注册流程）
    if (code) {
      const verifyResponse = await Taro.request({
        url: `${API_BASE_URL}/api/users/verify-email`,
        method: 'POST',
        header: { 'Content-Type': 'application/json' },
        data: { email, code },
      })
      // Taro.request 对非 2xx 不会抛异常，需要手动处理
      if (verifyResponse.statusCode !== 200) {
        const errorData = verifyResponse.data as any
        return { success: false, error: errorData?.detail || '验证码验证失败' }
      }
    }

    // 再调用注册API
    const response = await Taro.request({
      url: `${API_BASE_URL}/api/users/register`,
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: { email, password, username },
    })

    if (response.statusCode !== 200) {
      const errorData = response.data as any
      return { success: false, error: errorData?.detail || '注册失败' }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || '网络错误' }
  }
}

// 登出
export const logout = () => {
  Taro.removeStorageSync(TOKEN_KEY)
  Taro.removeStorageSync(REFRESH_TOKEN_KEY)
  Taro.removeStorageSync(CURRENT_USER_KEY)
}

// 获取用户资料
export const getUserProfile = async (): Promise<any> => {
  const token = getToken()
  if (!token) {
    throw new Error('未登录')
  }
  const response = await Taro.request({
    url: `${API_BASE_URL}/api/users/me`,
    header: { 'Authorization': `Bearer ${token}` },
  })
  if (response.statusCode === 200) return response.data
  if (response.statusCode === 401) {
    // Token过期或无效，清除本地登录状态
    logout()
    throw new Error('登录已过期，请重新登录')
  }
  const errorData = response.data as any
  throw new Error(errorData?.detail || '获取用户信息失败')
}

// 检查认证状态（供外部调用）
export const checkAuthStatus = (): boolean => {
  return isAuthenticated()
}

// 忘记密码
export const forgotPassword = async (params: { email: string }): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await Taro.request({
      url: `${API_BASE_URL}/api/users/forgot-password`,
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: { email: params.email },
    })
    if (response.statusCode === 200) return { success: true }
    const errorData = response.data as any
    return { success: false, error: errorData?.detail || '重置失败' }
  } catch (error: any) {
    return { success: false, error: error.message || '网络错误' }
  }
}

// 发送邮箱验证码
export const sendVerifyCode = async (params: { email: string; purpose: string }): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await Taro.request({
      url: `${API_BASE_URL}/api/users/send-verification-code`,
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: { email: params.email, purpose: params.purpose },
    })
    if (response.statusCode === 200) return { success: true }
    const errorData = response.data as any
    return { success: false, error: errorData?.detail || '发送失败' }
  } catch (error: any) {
    return { success: false, error: error.message || '网络错误' }
  }
}

// 验证邮箱
export const verifyEmail = async (params: { email: string; code: string }): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await Taro.request({
      url: `${API_BASE_URL}/api/users/verify-email`,
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: { email: params.email, code: params.code },
    })
    if (response.statusCode === 200) return { success: true }
    const errorData = response.data as any
    return { success: false, error: errorData?.detail || '验证失败' }
  } catch (error: any) {
    return { success: false, error: error.message || '网络错误' }
  }
}

// 重新发送验证码
export const resendVerifyCode = async (params: { email: string }): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await Taro.request({
      url: `${API_BASE_URL}/api/users/resend-verify`,
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: { email: params.email },
    })
    if (response.statusCode === 200) return { success: true }
    const errorData = response.data as any
    return { success: false, error: errorData?.detail || '发送失败' }
  } catch (error: any) {
    return { success: false, error: error.message || '网络错误' }
  }
}

// 默认导出（兼容页面中的 auth.xxx 调用方式）
const auth = {
  login,
  register,
  logout,
  forgotPassword,
  verifyEmail,
  resendVerifyCode,
  sendVerifyCode,
  getCurrentUser,
  isAuthenticated,
  getToken,
  getUserProfile,
  checkAuthStatus,
}
export { auth }
export default auth
