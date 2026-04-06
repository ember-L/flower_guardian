// 认证服务 - 使用后端 API + JWT Token
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, StoredUser, LoginForm, RegisterForm, AuthResponse } from '../types/auth';
import { API_BASE_URL } from './config';

const USERS_KEY = 'huaban_users';
const CURRENT_USER_KEY = 'huaban_current_user';
const TOKEN_KEY = 'huaban_token';
const REFRESH_TOKEN_KEY = 'huaban_refresh_token';

// Base64 编解码 (使用内置函数)
const base64Encode = (str: string): string => {
  return btoa(str);
};

const base64Decode = (str: string): string => {
  // 移除 padding
  const cleaned = str.replace(/-/g, '+').replace(/_/g, '/').replace(/=/g, '');
  try {
    return atob(cleaned);
  } catch {
    return '';
  }
};

// 简单的密码哈希（仅用于演示）
const simpleHash = (password: string): string => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
};

// 生成模拟 JWT Token
const generateToken = (user: StoredUser): string => {
  const payload = {
    id: user.id,
    email: user.email,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7天过期
  };
  return base64Encode(JSON.stringify(payload));
};

// 获取所有用户
export const getAllUsers = async (): Promise<StoredUser[]> => {
  try {
    const users = await AsyncStorage.getItem(USERS_KEY);
    return users ? JSON.parse(users) : [];
  } catch {
    return [];
  }
};

// 保存所有用户
const saveAllUsers = async (users: StoredUser[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save users:', e);
  }
};

// 获取当前登录用户
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const user = await AsyncStorage.getItem(CURRENT_USER_KEY);
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

// 获取当前用户ID
export const getCurrentUserId = async (): Promise<number | null> => {
  const user = await getCurrentUser();
  return user?.id || null;
};

// 保存当前用户
const saveCurrentUser = async (user: User | null): Promise<void> => {
  try {
    if (user) {
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem(CURRENT_USER_KEY);
    }
  } catch (e) {
    console.error('Failed to save current user:', e);
  }
};

// 获取 Token
export const getToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    console.log('[Auth] getToken:', token ? 'found' : 'not found');
    return token;
  } catch (e) {
    console.error('[Auth] getToken error:', e);
    return null;
  }
};

// 保存 Token
const saveToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    console.log('[Auth] saveToken: success');
  } catch (e) {
    console.error('[Auth] saveToken error:', e);
  }
};

// 清除 Token
const clearToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    console.error('Failed to clear token:', e);
  }
};

// 保存 Refresh Token
export const saveRefreshToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
  } catch (e) {
    console.error('Failed to save refresh token:', e);
  }
};

// 获取 Refresh Token
export const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
};

// 清除 Refresh Token
export const clearRefreshToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch (e) {
    console.error('Failed to clear refresh token:', e);
  }
};

// 注册
export const register = async (form: RegisterForm): Promise<AuthResponse> => {
  const users = await getAllUsers();

  // 验证
  if (!form.email.trim()) {
    return { success: false, error: '请输入邮箱' };
  }
  if (!form.password) {
    return { success: false, error: '请输入密码' };
  }
  if (form.password.length < 6) {
    return { success: false, error: '密码至少6位' };
  }
  if (form.password !== form.confirmPassword) {
    return { success: false, error: '两次密码不一致' };
  }

  // 检查邮箱是否已注册
  if (users.some(u => u.email === form.email)) {
    return { success: false, error: '该邮箱已被注册' };
  }

  // 创建用户
  const newUser: StoredUser = {
    id: `user_${Date.now()}`,
    email: form.email.trim(),
    phone: form.phone?.trim() || undefined,
    username: form.username?.trim() || form.email.split('@')[0],
    passwordHash: simpleHash(form.password),
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  await saveAllUsers(users);

  // 生成 Token
  const token = generateToken(newUser);
  await saveToken(token);

  const { passwordHash, ...userWithoutPassword } = newUser;
  await saveCurrentUser(userWithoutPassword);

  return { success: true, token, user: userWithoutPassword };
};

// 登录 - 使用后端 API
export const login = async (form: LoginForm): Promise<AuthResponse> => {
  try {
    console.log('[Login] API_BASE_URL:', API_BASE_URL);

    // 验证
    if (!form.email.trim()) {
      return { success: false, error: '请输入邮箱' };
    }
    if (!form.password) {
      return { success: false, error: '请输入密码' };
    }

    // 调用后端 API 使用 form-urlencoded 格式
    const params = new URLSearchParams();
    params.append('username', form.email.trim());
    params.append('password', form.password);

    const loginUrl = `${API_BASE_URL}/api/users/login`;
    console.log('[Login] Request URL:', loginUrl);
    console.log('[Login] Body:', params.toString());

    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    console.log('[Login] Response status:', response.status);
    const responseText = await response.text();
    console.log('[Login] Response body:', responseText);

    if (!response.ok) {
      try {
        const errorData = JSON.parse(responseText);
        const errorMessage = errorData.detail || '登录失败';
        console.log('[Login] Error:', errorMessage);
        return { success: false, error: errorMessage };
      } catch {
        return { success: false, error: responseText || '登录失败' };
      }
    }

    // 解析成功的响应
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return { success: false, error: '解析响应失败' };
    }

    const token = data.access_token;
    const refreshToken = data.refresh_token;

    // 保存 Token
    await saveToken(token);

    // 保存 Refresh Token
    if (refreshToken) {
      await saveRefreshToken(refreshToken);
    }

    // 获取用户信息
    const userResponse = await fetch(`${API_BASE_URL}/api/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!userResponse.ok) {
      const errorData = await userResponse.json().catch(() => ({}));
      return { success: false, error: errorData.detail || '获取用户信息失败' };
    }

    const userData = await userResponse.json();

    const user: User = {
      id: userData.id,
      email: userData.email,
      username: userData.username,
      avatar: userData.avatar_url,
      createdAt: userData.created_at,
    };

    await saveCurrentUser(user);

    return { success: true, token, user };
  } catch (error: any) {
    console.error('[Login] Error:', error);
    const errorMessage = error.message || '网络错误，请检查网络连接';
    return { success: false, error: errorMessage };
  }
};

// 刷新 Access Token
export const refreshAccessToken = async (): Promise<boolean> => {
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      console.log('[Refresh] No refresh token found');
      return false;
    }

    console.log('[Refresh] Attempting to refresh token...');

    const response = await fetch(`${API_BASE_URL}/api/users/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      console.log('[Refresh] Refresh failed, clearing tokens');
      await logout();
      return false;
    }

    const data = await response.json();
    await saveToken(data.access_token);
    if (data.refresh_token) {
      await saveRefreshToken(data.refresh_token);
    }
    console.log('[Refresh] Token refreshed successfully');
    return true;
  } catch (error) {
    console.error('[Refresh] Error:', error);
    return false;
  }
};

// 登出
export const logout = async (): Promise<void> => {
  await saveCurrentUser(null);
  await clearToken();
  await clearRefreshToken();
};

// 更新用户信息
export const updateUser = async (updates: Partial<User>): Promise<AuthResponse> => {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: '未登录' };
  }

  const users = await getAllUsers();
  const userIndex = users.findIndex(u => u.id === currentUser.id);

  if (userIndex === -1) {
    return { success: false, error: '用户不存在' };
  }

  // 检查邮箱是否被其他用户使用
  if (updates.email && updates.email !== currentUser.email) {
    if (users.some(u => u.id !== currentUser.id && u.email === updates.email)) {
      return { success: false, error: '该邮箱已被使用' };
    }
  }

  const updatedUser: StoredUser = {
    ...users[userIndex],
    ...updates,
    id: users[userIndex].id,
    passwordHash: users[userIndex].passwordHash,
  };

  users[userIndex] = updatedUser;
  await saveAllUsers(users);

  const { passwordHash, ...userWithoutPassword } = updatedUser;
  await saveCurrentUser(userWithoutPassword);

  return { success: true, user: userWithoutPassword };
};

// 检查是否登录 (同步版本，用于初始检查)
export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getToken();
  console.log('[Auth] isAuthenticated - token:', token ? 'exists' : 'null');
  if (!token) return false;

  try {
    // JWT 格式: header.payload.signature，需要解码 payload 部分
    const parts = token.split('.');
    console.log('[Auth] JWT parts:', parts.length);
    if (parts.length !== 3) return false;

    // 解码 payload (第二部分)
    const payloadPart = parts[1];
    console.log('[Auth] payloadPart:', payloadPart);
    const decodedPayload = base64Decode(payloadPart);
    console.log('[Auth] decoded payload:', decodedPayload);
    const payload = JSON.parse(decodedPayload);
    console.log('[Auth] payload:', payload);

    // 检查 exp 是否过期
    if (payload.exp) {
      const isValid = payload.exp * 1000 > Date.now();
      console.log('[Auth] exp check:', payload.exp, '>', Date.now(), '=', isValid);
      return isValid;
    }
    return true;
  } catch (e) {
    console.log('[Auth] isAuthenticated error:', e);
    return false;
  }
};

// 同步版本 - 返回缓存状态
let cachedAuthState: boolean | null = null;

export const checkAuthStatus = async (): Promise<boolean> => {
  console.log('[Auth] checkAuthStatus called, cached:', cachedAuthState);
  if (cachedAuthState !== null) {
    console.log('[Auth] checkAuthStatus returning cached:', cachedAuthState);
    return cachedAuthState;
  }
  cachedAuthState = await isAuthenticated();
  console.log('[Auth] checkAuthStatus result:', cachedAuthState);
  return cachedAuthState;
};

// 清除缓存的认证状态
export const clearAuthCache = (): void => {
  cachedAuthState = null;
};

// 模拟发送验证码
export const sendVerificationCode = async (email: string): Promise<{ success: boolean; code?: string; error?: string }> => {
  // 模拟发送验证码
  await new Promise<void>((resolve) => {
    setTimeout(() => resolve(), 1000);
  });

  // 生成6位验证码
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // 存储验证码
  try {
    await AsyncStorage.setItem(`verify_${email}`, code);
  } catch (e) {
    console.error('Failed to store verification code:', e);
  }

  // 开发环境下返回验证码
  console.log(`验证码: ${code}`);

  return { success: true, code };
};

// 验证验证码
export const verifyCode = async (email: string, code: string): Promise<boolean> => {
  try {
    const storedCode = await AsyncStorage.getItem(`verify_${email}`);
    return storedCode === code;
  } catch {
    return false;
  }
};
