# 登录状态保持 24 小时设计方案

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现 24 小时免登录功能，使用 Access Token + Refresh Token 机制

**Architecture:** 标准 JWT 双 Token 架构：
- Access Token：30 分钟有效期，用于 API 请求认证
- Refresh Token：7 天有效期，存储在数据库，用于刷新 Access Token
- 前端自动拦截 401 响应，尝试刷新 Token

**Tech Stack:** FastAPI, SQLAlchemy, React Native (AsyncStorage), JWT

---

## 1. 后端改动

### 1.1 数据库模型

- 在 `User` 模型中添加 `refresh_token_hash` 字段（可选，存储哈希值增强安全性）
- 或使用单独的 `RefreshToken` 模型（更灵活，支持 Token 吊销）

### 1.2 配置

- 新增 `REFRESH_TOKEN_EXPIRE_DAYS = 7` 配置

### 1.3 API 端点

- `POST /api/users/refresh-token`
  - 输入：refresh_token
  - 输出：新的 access_token + refresh_token
  - 验证 Refresh Token 有效性，生成新 Token 对

### 1.4 登录/注册

- 登录成功后返回 `{ access_token, refresh_token, token_type }`
- 注册成功后同样返回两个 Token

---

## 2. 前端改动

### 2.1 存储

- AsyncStorage 新增 `huaban_refresh_token` 键

### 2.2 认证服务

- 修改 `login()` 函数：解析并存储 refresh_token
- 新增 `refreshAccessToken()` 函数：调用刷新 API

### 2.3 API 拦截器

- 封装 axios 实例或 fetch 包装
- 拦截 401 响应：
  1. 尝试用 refresh_token 刷新
  2. 成功则重试原请求
  3. 失败则跳转登录页面

---

## 3. 安全考虑

- Refresh Token 使用后一次性（可选）
- 可以添加 Token 轮换：刷新时同时生成新的 Refresh Token
- 支持 Token 吊销（可选）

---

## 4. 实现顺序

1. 后端：添加 Refresh Token 配置
2. 后端：修改登录/注册 API 返回 Refresh Token
3. 后端：添加刷新 API
4. 前端：修改登录函数存储 Refresh Token
5. 前端：添加刷新函数和拦截器
