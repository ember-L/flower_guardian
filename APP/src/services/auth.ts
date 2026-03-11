// 认证服务 - 使用 AsyncStorage + JWT Token
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, StoredUser, LoginForm, RegisterForm, AuthResponse } from '../types/auth';

const USERS_KEY = 'huaban_users';
const CURRENT_USER_KEY = 'huaban_current_user';
const TOKEN_KEY = 'huaban_token';

// Base64 编解码 (React Native 可用)
const base64Encode = (str: string): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i = 0;

  while (i < str.length) {
    const a = str.charCodeAt(i++);
    const b = i < str.length ? str.charCodeAt(i++) : 0;
    const c = i < str.length ? str.charCodeAt(i++) : 0;

    const triplet = (a << 16) | (b << 8) | c;

    result += chars[(triplet >> 18) & 0x3f];
    result += chars[(triplet >> 12) & 0x3f];
    result += i > str.length + 1 ? '=' : chars[(triplet >> 6) & 0x3f];
    result += i > str.length ? '=' : chars[triplet & 0x3f];
  }

  return result;
};

const base64Decode = (str: string): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i = 0;

  str = str.replace(/=/g, '');

  while (i < str.length) {
    const a = chars.indexOf(str[i++]);
    const b = i < str.length ? chars.indexOf(str[i++]) : 0;
    const c = i < str.length ? chars.indexOf(str[i++]) : 0;
    const d = i < str.length ? chars.indexOf(str[i++]) : 0;

    const triplet = (a << 18) | (b << 12) | (c << 6) | d;

    result += String.fromCharCode((triplet >> 16) & 0xff);
    if (c !== -1) {
      result += String.fromCharCode((triplet >> 8) & 0xff);
    }
    if (d !== -1) {
      result += String.fromCharCode(triplet & 0xff);
    }
  }

  return result;
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
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

// 保存 Token
const saveToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (e) {
    console.error('Failed to save token:', e);
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

// 登录
export const login = async (form: LoginForm): Promise<AuthResponse> => {
  const users = await getAllUsers();

  // 验证
  if (!form.email.trim()) {
    return { success: false, error: '请输入邮箱' };
  }
  if (!form.password) {
    return { success: false, error: '请输入密码' };
  }

  // 查找用户
  const user = users.find(u => u.email === form.email);
  if (!user) {
    return { success: false, error: '邮箱未注册' };
  }

  // 验证密码
  if (user.passwordHash !== simpleHash(form.password)) {
    return { success: false, error: '密码错误' };
  }

  // 生成 Token
  const token = generateToken(user);
  await saveToken(token);

  const { passwordHash, ...userWithoutPassword } = user;
  await saveCurrentUser(userWithoutPassword);

  return { success: true, token, user: userWithoutPassword };
};

// 登出
export const logout = async (): Promise<void> => {
  await saveCurrentUser(null);
  await clearToken();
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
  if (!token) return false;

  try {
    const payload = JSON.parse(base64Decode(token));
    return payload.exp > Date.now();
  } catch {
    return false;
  }
};

// 同步版本 - 返回缓存状态
let cachedAuthState: boolean | null = null;

export const checkAuthStatus = async (): Promise<boolean> => {
  if (cachedAuthState !== null) {
    return cachedAuthState;
  }
  cachedAuthState = await isAuthenticated();
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

  // 存储验证码 (实际应该发送到服务器)
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
