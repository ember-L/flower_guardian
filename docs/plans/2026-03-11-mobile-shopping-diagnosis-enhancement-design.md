# 移动端商城增强与病虫害诊断优化方案

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:writing-plans to create implementation plan.

**Goal:** 完善移动端商城功能（购物车、订单追踪、支付预留）和病虫害诊断增强（历史记录、AI建议）

**Architecture:**
- 移动端：React Native + KittenUI
- 后端：FastAPI + PostgreSQL
- 预留支付接口，支持微信/支付宝按需接入

**Tech Stack:** React Native 0.74.6 + KittenUI + FastAPI

---

## 1. 购物车模块

### 1.1 功能需求

| 功能 | 描述 |
|------|------|
| 加入购物车 | 从商品详情页加入，支持选择数量 |
| 购物车列表 | 查看所有已添加商品，支持编辑数量 |
| 删除商品 | 单个删除、清空购物车 |
| 数量修改 | +/- 按钮调整，支持批量选择 |
| 小计计算 | 自动计算商品小计和总计 |
| 库存检查 | 下单前检查库存状态 |

### 1.2 数据结构

```typescript
// 购物车项
interface CartItem {
  id: number;
  product_id: number;
  product_name: string;
  product_image: string;
  price: string;
  quantity: number;
  stock: number;  // 实时库存
  subtotal: string;  // 小计
}

// 购物车
interface Cart {
  items: CartItem[];
  total_amount: string;
  item_count: number;
}
```

### 1.3 API 设计

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/cart` | GET | 获取购物车 |
| `/api/cart/items` | POST | 添加商品到购物车 |
| `/api/cart/items/{id}` | PUT | 更新商品数量 |
| `/api/cart/items/{id}` | DELETE | 删除购物车项 |
| `/api/cart/clear` | DELETE | 清空购物车 |

---

## 2. 订单追踪模块

### 2.1 功能需求

| 功能 | 描述 |
|------|------|
| 订单列表 | 显示所有订单，带状态筛选 |
| 订单详情 | 完整的订单信息、物流状态 |
| 订单状态流转 | pending → confirmed → shipped → completed |
| 取消订单 | 待确认状态可取消 |
| 再次购买 | 一键将订单商品加入购物车 |
| 物流信息 | 展示物流进度（预留接口） |

### 2.2 订单状态

```
pending (待确认) → confirmed (已确认) → shipped (已发货) → completed (已完成)
       ↓                              ↓
   cancelled (已取消)
```

### 2.3 API 增强

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/orders/{id}/cancel` | POST | 取消订单 |
| `/api/orders/{id}/reorder` | POST | 再次购买 |

---

## 3. 支付预留模块

### 3.1 功能需求

| 功能 | 描述 |
|------|------|
| 支付方式选择 | 预留微信、支付宝、线下支付 |
| 支付状态 | pendingpaid, paid, failed |
| 支付回调 | 预留回调接口（模拟） |
| 支付记录 | 订单支付历史 |

### 3.2 数据结构

```python
class Payment(Base):
    id: int
    order_id: int
    amount: Decimal
    payment_method: str  # wechat, alipay, offline
    status: str  # pending, paid, failed, refunded
    transaction_id: str  # 第三方交易号
    paid_at: datetime
    created_at: datetime
```

### 3.3 API 设计

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/payments` | POST | 创建支付 |
| `/api/payments/{id}` | GET | 支付状态查询 |
| `/api/payments/{id}/callback` | POST | 支付回调（第三方调用） |

---

## 4. 病虫害诊断增强

### 4.1 功能需求

| 功能 | 描述 |
|------|------|
| 诊断历史 | 查看所有历史诊断记录 |
| 诊断详情 | 详细的诊断结果、治疗建议 |
| 再次诊断 | 基于历史图片快速重新诊断 |
| AI 建议 | 结合 Qwen API 提供详细治疗方案 |
| 收藏功能 | 收藏常见病虫害处理方案 |

### 4.2 数据结构

```python
class DiagnosisRecord(Base):
    id: int
    user_id: int
    image_url: str
    disease_name: str
    confidence: float
    description: str  # 病因描述
    treatment: str  # 治疗建议
    prevention: str  # 预防措施
    created_at: datetime
    is_favorite: bool
```

### 4.3 API 设计

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/diagnoses` | GET | 诊断历史列表 |
| `/api/diagnoses/{id}` | GET | 诊断详情 |
| `/api/diagnoses/{id}/favorite` | POST | 收藏/取消收藏 |
| `/api/diagnoses/{id}/rediagnose` | POST | 再次诊断 |

### 4.4 AI 建议增强

结合 Qwen API 扩展诊断响应：

```python
{
    "disease_name": "叶斑病",
    "confidence": 0.92,
    "description": "由真菌引起的常见叶部病害...",
    "treatment": {
        "immediate": "剪除病叶，喷施多菌灵",
        "daily_care": "保持通风，减少浇水频率",
        "duration": "2-3周可见好转"
    },
    "prevention": [
        "定期喷洒预防性杀菌剂",
        "避免叶面积水",
        "保证充足光照"
    ],
    "recommended_products": [
        {"name": "多菌灵", "usage": "稀释500倍喷施"},
        {"name": "代森锰锌", "usage": "稀释800倍喷施"}
    ]
}
```

---

## 5. 页面设计

### 5.1 购物车页面 (CartScreen)

```
┌─────────────────────────────┐
│ ← 购物车              清空 │
├─────────────────────────────┤
│ ┌─────┐                    │
│ │ 商品 │  ×2           - + │ ← 商品卡片
│ │ 图片 │  ¥29.90     [删除] │
│ └─────┘                    │
│ ┌─────┐                    │
│ │ 商品 │  ×1           - + │
│ │ 图片 │  ¥19.90           │
│ └─────┘                    │
├─────────────────────────────┤
│          共 2 件            │
│        ¥ 49.80             │
├─────────────────────────────┤
│    [去结算 ¥49.80]          │
└─────────────────────────────┘
```

### 5.2 订单列表页面 (OrdersScreen)

```
┌─────────────────────────────┐
│ ← 我的订单                  │
├─────────────────────────────┤
│ [全部][待确认][配送中][完成]│
├─────────────────────────────┤
│ ┌─ 订单号: 20240315001 ─┐  │
│ │ 2024-03-15 14:30      │  │
│ │ 商品 ×2  ¥128.00      │  │
│ │ [待确认]    [查看详情]  │  │
│ └──────────────────────┘  │
│ ┌─ 订单号: 20240314005 ─┐  │
│ │ 2024-03-14 10:20      │  │
│ │ 商品 ×1  ¥29.90       │  │
│ │ [已完成]  [再次购买]    │  │
│ └──────────────────────┘  │
└─────────────────────────────┘
```

### 5.3 诊断历史页面 (DiagnosisHistoryScreen)

```
┌─────────────────────────────┐
│ ← 诊断历史                  │
├─────────────────────────────┤
│ ┌─ 2024-03-15 14:30 ────┐  │
│ │ [图片] 叶斑病           │  │
│ │ 置信度: 92%            │  │
│ │ [查看详情] [⭐收藏]     │  │
│ └──────────────────────┘  │
│ ┌─ 2024-03-10 09:15 ────┐  │
│ │ [图片] 蚜虫             │  │
│ │ 置信度: 88%            │  │
│ │ [查看详情] [再次诊断]    │  │
│ └──────────────────────┘  │
└─────────────────────────────┘
```

---

## 6. 技术实现要点

### 6.1 移动端

| 组件 | 技术 |
|------|------|
| 状态管理 | React Context + useReducer |
| 本地存储 | AsyncStorage 持久化购物车 |
| 图片处理 | react-native-image-picker |
| 导航 | @react-navigation/native |

### 6.2 后端

| 模块 | 技术 |
|------|------|
| ORM | SQLAlchemy |
| 验证 | Pydantic |
| 支付预留 | 支付记录表 + 回调模拟 |
| AI 增强 | Qwen API 集成 |

---

## 7. 实施顺序

1. **Phase 1: 购物车基础**
   - 后端：购物车 API
   - 移动端：购物车页面

2. **Phase 2: 订单追踪**
   - 后端：订单增强 API
   - 移动端：订单列表、详情页

3. **Phase 3: 支付预留**
   - 后端：支付接口预留
   - 移动端：支付方式选择

4. **Phase 4: 病虫害诊断增强**
   - 后端：诊断记录 API + AI 增强
   - 移动端：诊断历史、详情页

---

## 8. 待确认问题

- [ ] 支付接口是否需要真实接入？
- [ ] 诊断图片存储方式（本地/云）？
- [ ] 是否有其他移动端功能需要同步开发？
