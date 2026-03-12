# Access Token + Refresh Token 实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现 Access Token + Refresh Token 登录机制，Access Token 30分钟，Refresh Token 7天，前端自动刷新

**Architecture:** JWT 双 Token 架构，前端存储 Refresh Token，拦截 401 自动刷新

**Tech Stack:** FastAPI, SQLAlchemy, React Native, JWT

---

## Task 1: 后端添加 Refresh Token 配置

**Files:**
- Modify: `backend/app/core/config.py`

**Step 1: 添加配置**

```python
# backend/app/core/config.py 中添加
REFRESH_TOKEN_EXPIRE_DAYS: int = 7  # Refresh Token 7天有效期
```

**Step 2: 验证**

检查配置是否正确加载

---

## Task 2: 后端添加 Refresh Token 生成和验证函数

**Files:**
- Modify: `backend/app/core/security.py`

**Step 1: 添加 Refresh Token 函数**

```python
# backend/app/core/security.py 中添加

def create_refresh_token(data: dict) -> str:
    """创建 Refresh Token（7天有效期）"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_refresh_token(token: str) -> Optional[str]:
    """验证 Refresh Token，返回 username"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        # 验证是 refresh token
        if payload.get("type") != "refresh":
            return None
        username: str = payload.get("sub")
        return username
    except JWTError:
        return None
```

---

## Task 3: 修改登录 API 返回 Refresh Token

**Files:**
- Modify: `backend/app/api/endpoints/users.py`

**Step 1: 修改登录函数**

```python
# backend/app/api/endpoints/users.py
# 在 login 函数中，生成 Token 部分修改为：

from app.core.security import create_access_token, create_refresh_token

# 生成 Access Token（30分钟）
access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
access_token = create_access_token(
    data={"sub": user.username}, expires_delta=access_token_expires
)

# 生成 Refresh Token（7天）
refresh_token = create_refresh_token(data={"sub": user.username})

return {
    "access_token": access_token,
    "refresh_token": refresh_token,
    "token_type": "bearer"
}
```

**Step 2: 更新响应模型**

检查 Token 响应是否包含 refresh_token 字段

---

## Task 4: 修改注册 API 返回 Refresh Token

**Files:**
- Modify: `backend/app/api/endpoints/users.py`

**Step 1: 修改注册函数**

在 register 函数中添加 refresh_token 返回

---

## Task 5: 后端添加 Refresh Token 刷新 API

**Files:**
- Create: `backend/app/api/endpoints/refresh.py`

**Step 1: 创建刷新端点**

```python
# backend/app/api/endpoints/refresh.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.core.security import verify_refresh_token, create_access_token, create_refresh_token
from app.models.user import User

router = APIRouter()

class RefreshRequest(BaseModel):
    refresh_token: str

@router.post("/refresh-token")
def refresh_token(request: RefreshRequest, db: Session = Depends(get_db)):
    # 验证 refresh token
    username = verify_refresh_token(request.refresh_token)
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )

    # 获取用户
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    # 生成新的 Access Token
    from app.core.config import settings
    from datetime import timedelta
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    # 可选：也生成新的 Refresh Token（轮换）
    new_refresh_token = create_refresh_token(data={"sub": user.username})

    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }
```

**Step 2: 注册路由**

在 `backend/app/api/router.py` 中添加 refresh 路由

---

## Task 6: 前端存储 Refresh Token

**Files:**
- Modify: `APP/src/services/auth.ts`

**Step 1: 添加常量**

```typescript
const REFRESH_TOKEN_KEY = 'huaban_refresh_token';
```

**Step 2: 添加存储函数**

```typescript
export const saveRefreshToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
  } catch (e) {
    console.error('Failed to save refresh token:', e);
  }
};

export const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const clearRefreshToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch (e) {
    console.error('Failed to clear refresh token:', e);
  }
};
```

---

## Task 7: 修改登录函数处理 Refresh Token

**Files:**
- Modify: `APP/src/services/auth.ts`

**Step 1: 修改 login 函数**

```typescript
// 修改 login 函数，在获取 token 后
const data = JSON.parse(responseText);
const token = data.access_token;
const refreshToken = data.refresh_token; // 新增

// 保存 Token
await saveToken(token);
if (refreshToken) {
  await saveRefreshToken(refreshToken); // 保存 Refresh Token
}
```

---

## Task 8: 前端添加 Refresh Token 刷新函数

**Files:**
- Modify: `APP/src/services/auth.ts`

**Step 1: 添加刷新函数**

```typescript
export const refreshAccessToken = async (): Promise<boolean> => {
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    const response = await fetch(`${API_BASE_URL}/api/users/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      // Refresh Token 也过期了
      await logout();
      return false;
    }

    const data = await response.json();
    await saveToken(data.access_token);
    if (data.refresh_token) {
      await saveRefreshToken(data.refresh_token);
    }
    return true;
  } catch (error) {
    console.error('Refresh token error:', error);
    return false;
  }
};
```

---

## Task 9: 修改 logout 函数清除 Refresh Token

**Files:**
- Modify: `APP/src/services/auth.ts`

**Step 1: 修改 logout**

```typescript
export const logout = async (): Promise<void> => {
  await saveCurrentUser(null);
  await clearToken();
  await clearRefreshToken(); // 新增
};
```

---

## Task 10: 前端创建 API 拦截器（可选，实现更复杂）

**Files:**
- Create: `APP/src/services/api.ts`

**Step 1: 创建 axios 实例**

```typescript
import axios from 'axios';
import { API_BASE_URL } from './config';
import { getToken, saveToken, refreshAccessToken, logout } from './auth';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// 请求拦截器：添加 Token
api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器：处理 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const success = await refreshAccessToken();
      if (success) {
        const token = await getToken();
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } else {
        // 刷新失败，跳转登录
        await logout();
        // 可以通过 event 或 callback 通知 UI 跳转
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

**Step 2: 替换所有 axios 调用**

将项目中其他使用 axios 的地方替换为 api 实例

---

## 执行顺序

1. Task 1: 后端配置
2. Task 2: 后端安全函数
3. Task 3: 登录 API
4. Task 4: 注册 API
5. Task 5: 刷新 Token API
6. Task 6: 前端存储
7. Task 7: 登录函数
8. Task 8: 刷新函数
9. Task 9: 登出函数
10. Task 10: 拦截器（可选）

---

## 测试验证

1. 登录后检查是否返回 refresh_token
2. 检查 AsyncStorage 中是否有 huaban_refresh_token
3. 等待 Access Token 过期（或手动清除），验证是否自动刷新
4. 验证 Refresh Token 过期后是否正确跳转登录
