# 商城页面后端连接设计

## 概述

将商城页面（商品列表、购物车、订单）连接到实际后端数据。

## 目标

1. 添加示例商品数据到数据库
2. 购物车页面连接后端
3. 订单页面连接后端
4. 商品详情页面连接后端

## 当前状态

### 已实现
- 后端 `/api/products` 公开 API - 已存在
- 后端 `/api/cart` 购物车 API - 已存在
- 前端 `storeService.ts` - 已定义 API 调用
- 前端 `StoreScreen` - 已调用 getProducts()

### 需要实现
- 商品种子数据
- CartScreen 连接
- OrderDetailScreen 连接
- StoreDetailScreen 连接

## 实现方案

### 1. 商品种子数据

创建 `backend/app/db/seed_products.py`：
- 插入 12 个示例商品
- 类别：花盆、肥料、园艺工具、种子、土壤
- 包含图片 URL、价格、库存等

### 2. 购物车页面 (CartScreen)

- 使用 `getCart()` 获取购物车
- 使用 `addToCart()` 添加商品
- 使用 `updateCartItem()` 修改数量
- 使用 `deleteCartItem()` 删除商品
- 使用 `createOrder()` 创建订单

### 3. 订单页面 (OrderDetailScreen)

- 使用 `getMyOrders()` 获取订单列表
- 使用 `getOrderDetail()` 获取订单详情
- 使用 `cancelOrder()` 取消订单

### 4. 商品详情页面 (StoreDetailScreen)

- 使用 `getProductDetail()` 获取商品详情
- 添加"加入购物车"和"立即购买"按钮

## 数据流

```
用户操作 -> storeService API -> 后端 API -> 数据库
                    ↓
              更新 React State -> UI 刷新
```

## 错误处理

- 网络错误：显示提示，允许重试
- 认证错误：跳转登录页面
- 库存不足：提示用户
