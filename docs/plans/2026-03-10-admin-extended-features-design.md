# 管理员后台扩展功能设计方案

**日期**: 2026-03-10

## 1. 背景

在现有的管理员 Web 端基础上，扩展用户管理、植物百科管理和数据统计功能。

## 2. 功能概述

| 功能 | 描述 |
|------|------|
| 用户管理 | 查看客户列表、客户详情、客户订单历史 |
| 植物百科管理 | 管理员维护植物养护知识（增删改查） |
| 数据统计 | 销售报表、订单趋势、热门商品分析 |

## 3. 用户管理

### 3.1 页面结构

- 用户列表（搜索、分页）
- 用户详情（查看信息、订单历史）

### 3.2 API 设计

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | /api/admin/users | 用户列表（支持搜索、分页） |
| GET | /api/admin/users/{id} | 用户详情 |
| GET | /api/admin/users/{id}/orders | 用户订单历史 |

### 3.3 数据模型

```python
# 响应结构
class UserListResponse(BaseModel):
    total: int
    items: List[UserResponse]

class UserDetailResponse(UserResponse):
    orders: List[OrderResponse]  # 订单历史
```

## 4. 植物百科管理

### 4.1 页面结构

- 植物列表（搜索、分类筛选、养护难度筛选）
- 植物详情/编辑表单

### 4.2 API 设计

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | /api/admin/plants | 植物列表（支持搜索、分类、养护难度筛选） |
| POST | /api/admin/plants | 添加植物 |
| PUT | /api/admin/plants/{id} | 更新植物 |
| DELETE | /api/admin/plants/{id} | 删除植物 |

### 4.3 字段说明

可管理字段：name, scientific_name, category, care_level, description, light_requirement, water_requirement, temperature_range, humidity_range, fertilization, repotting, common_mistakes, tips

## 5. 数据统计

### 5.1 页面结构

- 日期范围选择器
- 核心指标卡片
- 销售趋势折线图
- 热门商品排行榜

### 5.2 核心指标

| 指标 | 描述 |
|------|------|
| total_sales | 销售总额 |
| order_count | 订单数量 |
| avg_order_value | 客单价 |
| user_count | 新增用户数 |

### 5.3 API 设计

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | /api/admin/stats/overview | 核心指标（支持日期范围） |
| GET | /api/admin/stats/trend | 销售趋势（按天/周/月） |
| GET | /api/admin/stats/products | 热门商品排行 |

### 5.4 请求参数

```
GET /api/admin/stats/overview?start_date=2026-01-01&end_date=2026-03-10

GET /api/admin/stats/trend?start_date=2026-01-01&end_date=2026-03-10&group_by=day|week|month
```

### 5.5 响应示例

```json
// overview
{
  "total_sales": 12580.00,
  "order_count": 45,
  "avg_order_value": 279.56,
  "user_count": 12
}

// trend
{
  "labels": ["2026-01-01", "2026-01-02", ...],
  "sales": [1200, 1500, ...],
  "orders": [5, 8, ...]
}

// products
{
  "items": [
    {"product_id": 1, "product_name": "绿萝", "sales_count": 25, "sales_amount": 2500},
    {"product_id": 2, "product_name": "虎皮兰", "sales_count": 18, "sales_amount": 1800}
  ]
}
```

## 6. 实施顺序

1. **用户管理** - 最简单，直接复用现有数据
2. **植物百科管理** - 复用现有 Plant 模型
3. **数据统计** - 需要新增聚合查询

## 7. 前端页面

### 7.1 用户管理
- `/admin/users` - 用户列表页
- `/admin/users/[id]` - 用户详情页

### 7.2 植物百科管理
- `/admin/plants` - 植物列表页
- `/admin/plants/[id]` - 植物编辑页

### 7.3 数据统计
- `/admin/stats` - 数据统计首页
