# 管理员 Web 端及订单系统设计方案

**日期**: 2026-03-10

## 1. 背景与目标

为护花使者项目新增管理员 Web 端（Next.js）和订单系统，支持室内植物销售。

## 2. 架构设计

### 2.1 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                      FastAPI Backend                     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐  │
│  │ Users   │ │ Plants  │ │ Orders  │ │ Products    │  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────────┘  │
└─────────────────────────────────────────────────────────┘
          ▲                   ▲
          │                   │
    ┌─────┴─────┐       ┌─────┴─────┐
    │           │       │           │
┌───▼───┐   ┌───▼───┐ ┌───▼───┐ ┌───▼───┐
│ Admin │   │  App  │ │  Web  │ │  App  │
│  Web  │   │ Store │ │ Store │ │ Main  │
│(Next) │   │(Admin)│ │(User) │ │(User) │
└───────┘   └───────┘ └───────┘ └───────┘
```

- **Web 端 (Next.js)**: 管理员专用后台
- **RN 移动端**: 保留现有功能 + 新增商城
- **后端 (FastAPI)**: 共享，扩展订单 API

### 2.2 技术选型

| 组件 | 技术 | 说明 |
|------|------|------|
| Web 框架 | Next.js 14 (App Router) | React 全栈框架 |
| UI 库 | Tailwind CSS + shadcn/ui | 与 RN 端共用设计规范 |
| 后端 API | FastAPI | 扩展现有后端 |
| 数据库 | PostgreSQL | 复用现有数据库 |

### 2.3 代码复用策略

- UI 组件独立实现
- 共用设计规范文档（色彩、间距、组件风格）
- API 层复用，通过权限控制访问

## 3. 数据模型设计

### 3.1 新增表结构

**Product (商品表)**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键 |
| name | String | 商品名称 |
| description | Text | 商品描述 |
| price | Decimal | 价格 |
| stock | Integer | 库存数量 |
| image_url | String | 商品图片 |
| plant_id | Integer (FK) | 关联的植物 ID |
| status | String | 状态: active, inactive |
| created_at | DateTime | 创建时间 |
| updated_at | DateTime | 更新时间 |

**Order (订单表)**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键 |
| order_no | String | 订单号 |
| user_id | Integer (FK) | 客户 ID |
| total_amount | Decimal | 订单总金额 |
| status | String | 状态: pending, confirmed, shipped, completed, cancelled |
| delivery_type | String | 配送方式: express, pickup |
| delivery_address | String | 收货地址 |
| contact_name | String | 联系人 |
| contact_phone | String | 联系电话 |
| remark | String | 备注 |
| created_at | DateTime | 创建时间 |
| updated_at | DateTime | 更新时间 |

**OrderItem (订单项表)**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键 |
| order_id | Integer (FK) | 订单 ID |
| product_id | Integer (FK) | 商品 ID |
| product_name | String | 商品名称（冗余） |
| quantity | Integer | 数量 |
| unit_price | Decimal | 单价 |
| subtotal | Decimal | 小计 |

### 3.2 现有表扩展

- **User**: 增加 `role` 字段，区分 admin/user
- **Plant**: 保持不变，作为养护知识库

## 4. API 设计

### 4.1 商品管理 (Admin)

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | /api/admin/products | 获取商品列表 |
| POST | /api/admin/products | 创建商品 |
| GET | /api/admin/products/{id} | 获取商品详情 |
| PUT | /api/admin/products/{id} | 更新商品 |
| DELETE | /api/admin/products/{id} | 删除商品 |

### 4.2 商品浏览 (Public)

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | /api/products | 获取商品列表（仅 active） |
| GET | /api/products/{id} | 获取商品详情 |

### 4.3 订单管理 (Admin)

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | /api/admin/orders | 获取订单列表 |
| GET | /api/admin/orders/{id} | 获取订单详情 |
| PUT | /api/admin/orders/{id} | 更新订单状态 |

### 4.4 客户订单 (User)

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | /api/orders | 创建订单 |
| GET | /api/orders | 我的订单列表 |
| GET | /api/orders/{id} | 订单详情 |

## 5. 功能清单

### 5.1 管理员 Web 端

- [ ] 登录/鉴权
- [ ] 商品管理（增删改查、上下架）
- [ ] 订单管理（查看、确认、发货、完成）
- [ ] 客户管理（查看客户列表、订单历史）

### 5.2 RN 移动端（扩展）

- [ ] 商城首页（商品列表）
- [ ] 商品详情页
- [ ] 购物车（可选，MVP 直接下单）
- [ ] 下单页面（选择商品、数量、配送方式）
- [ ] 我的订单（订单列表、状态）
- [ ] 订单详情

## 6. MVP 范围

### 6.1 不包含

- 线上支付（线下支付）
- 购物车（直接下单）
- 优惠券/促销
- 评价/售后
- 物流追踪

### 6.2 交付标准

1. 管理员可在 Web 端添加商品
2. 客户可在 RN 端浏览商品、下单
3. 管理员可处理订单（确认、发货、完成）
4. 支持快递和自提两种方式
5. 订单状态可追踪

## 7. 实施计划

详见实施计划文档。
