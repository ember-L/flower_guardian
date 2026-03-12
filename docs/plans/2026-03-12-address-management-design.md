# 统一地址管理方案设计

## 概述

为用户提供统一的收货地址管理，用户可添加/编辑/删除多个地址，下单时选择已有地址。

## 目标

1. 用户可以管理多个收货地址
2. 下单时可以选择已有地址，无需重复填写
3. 地址管理是用户通用的，可用于商城下单等场景

## 当前状态

- 订单模型已有 `delivery_address`、`contact_name`、`contact_phone` 字段
- 用户模型暂无地址字段
- 前端在商品详情页直接填写地址

## 实现方案

### 1. 后端 - 地址模型

新建 `backend/app/models/address.py`：

```python
class Address(Base):
    __tablename__ = "addresses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(50))          # 收货人姓名
    phone = Column(String(20))          # 联系电话
    province = Column(String(50))       # 省份
    city = Column(String(50))           # 城市
    district = Column(String(50))       # 区/县
    detail_address = Column(String(255)) # 详细地址
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="addresses")
```

### 2. 后端 - 地址 API

新建 `backend/app/api/endpoints/addresses.py`：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/addresses | 获取用户地址列表 |
| POST | /api/addresses | 添加新地址 |
| PUT | /api/addresses/{id} | 更新地址 |
| DELETE | /api/addresses/{id} | 删除地址 |
| PUT | /api/addresses/{id}/set-default | 设置默认地址 |

### 3. 前端 - 页面

1. **AddressScreen** - 地址列表页面
   - 显示所有收货地址
   - 支持设置默认地址
   - 支持删除地址
   - 支持添加新地址

2. **AddressEditScreen** - 地址编辑页面
   - 添加/编辑收货地址
   - 表单字段：收货人、电话、省份、城市、区、详细地址

3. **StoreDetailScreen 改造**
   - 移除直接填写地址的表单
   - 改为选择已有地址或添加新地址

### 4. 前端 - 服务

新建 `APP/src/services/addressService.ts`：

```typescript
export interface Address {
  id: number;
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail_address: string;
  is_default: boolean;
}

export const getAddresses = () => ...
export const createAddress = (data) => ...
export const updateAddress = (id, data) => ...
export const deleteAddress = (id) => ...
export const setDefaultAddress = (id) => ...
```

## 数据流

```
用户点击下单 -> StoreDetailScreen
                ↓
           选择地址 / 新增地址
                ↓
           提交订单（包含地址ID）
                ↓
           后端根据地址ID填充订单信息
```

## 错误处理

- 网络错误：显示提示，允许重试
- 认证错误：跳转登录页面
- 必填字段验证：前端+后端双重验证
