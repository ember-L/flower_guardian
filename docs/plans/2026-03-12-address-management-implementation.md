# 统一地址管理实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为用户提供统一的收货地址管理，用户可添加/编辑/删除多个地址，下单时选择已有地址

**Architecture:** 后端创建地址模型和API，前端创建地址管理页面并改造下单流程

**Tech Stack:** Python (FastAPI/SQLAlchemy), React Native, TypeScript

---

## 任务概览

- [ ] Task 1: 创建后端地址模型
- [ ] Task 2: 创建后端地址 API
- [ ] Task 3: 注册地址 API 路由
- [ ] Task 4: 创建前端地址服务
- [ ] Task 5: 创建地址列表页面
- [ ] Task 6: 创建地址编辑页面
- [ ] Task 7: 改造下单页面使用地址选择

---

### Task 1: 创建后端地址模型

**Files:**
- Create: `backend/app/models/address.py`
- Modify: `backend/app/models/__init__.py`

**Step 1: 创建地址模型**

创建 `backend/app/models/address.py`:

```python
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base


class Address(Base):
    __tablename__ = "addresses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(50), nullable=False)  # 收货人姓名
    phone = Column(String(20), nullable=False)  # 联系电话
    province = Column(String(50))  # 省份
    city = Column(String(50))  # 城市
    district = Column(String(50))  # 区/县
    detail_address = Column(String(255), nullable=False)  # 详细地址
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="addresses")
```

**Step 2: 更新 models/__init__.py**

添加:
```python
from app.models.address import Address
```

---

### Task 2: 创建后端地址 API

**Files:**
- Create: `backend/app/api/endpoints/addresses.py`
- Create: `backend/app/schemas/address.py`

**Step 1: 创建地址 Schema**

创建 `backend/app/schemas/address.py`:

```python
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AddressBase(BaseModel):
    name: str
    phone: str
    province: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    detail_address: str
    is_default: bool = False


class AddressCreate(AddressBase):
    pass


class AddressUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    province: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    detail_address: Optional[str] = None
    is_default: Optional[bool] = None


class AddressResponse(AddressBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
```

**Step 2: 创建地址 API**

创建 `backend/app/api/endpoints/addresses.py`:

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.address import Address
from app.schemas.address import AddressCreate, AddressUpdate, AddressResponse

router = APIRouter(prefix="/api/addresses", tags=["addresses"])


@router.get("", response_model=List[AddressResponse])
def list_addresses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取用户地址列表"""
    addresses = db.query(Address).filter(Address.user_id == current_user.id).all()
    return addresses


@router.post("", response_model=AddressResponse)
def create_address(
    address: AddressCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """添加新地址"""
    # 如果设为默认地址，先取消其他默认地址
    if address.is_default:
        db.query(Address).filter(
            Address.user_id == current_user.id,
            Address.is_default == True
        ).update({"is_default": False})

    new_address = Address(
        user_id=current_user.id,
        **address.model_dump()
    )
    db.add(new_address)
    db.commit()
    db.refresh(new_address)
    return new_address


@router.put("/{address_id}", response_model=AddressResponse)
def update_address(
    address_id: int,
    address_update: AddressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """更新地址"""
    address = db.query(Address).filter(
        Address.id == address_id,
        Address.user_id == current_user.id
    ).first()

    if not address:
        raise HTTPException(status_code=404, detail="Address not found")

    # 如果设为默认地址，先取消其他默认地址
    if address_update.is_default and not address.is_default:
        db.query(Address).filter(
            Address.user_id == current_user.id,
            Address.is_default == True,
            Address.id != address_id
        ).update({"is_default": False})

    update_data = address_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(address, field, value)

    db.commit()
    db.refresh(address)
    return address


@router.delete("/{address_id}")
def delete_address(
    address_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """删除地址"""
    address = db.query(Address).filter(
        Address.id == address_id,
        Address.user_id == current_user.id
    ).first()

    if not address:
        raise HTTPException(status_code=404, detail="Address not found")

    db.delete(address)
    db.commit()
    return {"message": "Address deleted successfully"}


@router.put("/{address_id}/set-default", response_model=AddressResponse)
def set_default_address(
    address_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """设置默认地址"""
    address = db.query(Address).filter(
        Address.id == address_id,
        Address.user_id == current_user.id
    ).first()

    if not address:
        raise HTTPException(status_code=404, detail="Address not found")

    # 取消其他默认地址
    db.query(Address).filter(
        Address.user_id == current_user.id,
        Address.is_default == True
    ).update({"is_default": False})

    address.is_default = True
    db.commit()
    db.refresh(address)
    return address
```

---

### Task 3: 注册地址 API 路由

**Files:**
- Modify: `backend/app/api/router.py`

**Step 1: 添加路由**

在 `router.py` 中添加:
```python
from app.api.endpoints.addresses import router as addresses_router
api_router.include_router(addresses_router)
```

---

### Task 4: 创建前端地址服务

**Files:**
- Create: `APP/src/services/addressService.ts`

**Step 1: 创建地址服务**

创建 `APP/src/services/addressService.ts`:

```typescript
import axios from 'axios';
import { API_BASE_URL } from './config';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// 地址类型
export interface Address {
  id: number;
  name: string;
  phone: string;
  province?: string;
  city?: string;
  district?: string;
  detail_address: string;
  is_default: boolean;
  created_at: string;
}

// 获取地址列表
export const getAddresses = async (): Promise<Address[]> => {
  const response = await api.get('/api/addresses');
  return response.data;
};

// 创建地址
export const createAddress = async (data: Omit<Address, 'id' | 'created_at'>): Promise<Address> => {
  const response = await api.post('/api/addresses', data);
  return response.data;
};

// 更新地址
export const updateAddress = async (id: number, data: Partial<Address>): Promise<Address> => {
  const response = await api.put(`/api/addresses/${id}`, data);
  return response.data;
};

// 删除地址
export const deleteAddress = async (id: number): Promise<void> => {
  await api.delete(`/api/addresses/${id}`);
};

// 设置默认地址
export const setDefaultAddress = async (id: number): Promise<Address> => {
  const response = await api.put(`/api/addresses/${id}/set-default`);
  return response.data;
};
```

---

### Task 5: 创建地址列表页面

**Files:**
- Create: `APP/src/screens/AddressScreen.tsx`

**Step 1: 创建地址列表页面**

创建 `APP/src/screens/AddressScreen.tsx`:

```tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { getAddresses, deleteAddress, setDefaultAddress, Address } from '../services/addressService';
import { colors, spacing, shadows } from '../constants/theme';
import { NavigationProps } from '../navigation/AppNavigator';
import { Icons } from '../components/Icon';

interface AddressScreenProps extends Partial<NavigationProps> {}

export function AddressScreen({ onGoBack, onNavigate }: AddressScreenProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAddresses = async () => {
    try {
      const data = await getAddresses();
      setAddresses(data);
    } catch (error) {
      console.error('Failed to load addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const handleDelete = (id: number) => {
    Alert.alert('确认删除', '确定要删除该地址吗?', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: async () => {
        await deleteAddress(id);
        loadAddresses();
      }}
    ]);
  };

  const handleSetDefault = async (id: number) => {
    await setDefaultAddress(id);
    loadAddresses();
  };

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    }
  };

  const handleAddAddress = () => {
    if (onNavigate) {
      onNavigate('AddressEdit');
    }
  };

  const handleEditAddress = (addressId: number) => {
    if (onNavigate) {
      onNavigate('AddressEdit', { addressId });
    }
  };

  const renderItem = ({ item }: { item: Address }) => (
    <View style={styles.addressCard}>
      <TouchableOpacity style={styles.addressInfo} onPress={() => handleEditAddress(item.id)}>
        {item.is_default && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultText}>默认</Text>
          </View>
        )}
        <Text style={styles.name}>{item.name} {item.phone}</Text>
        <Text style={styles.address}>
          {item.province}{item.city}{item.district}{item.detail_address}
        </Text>
      </TouchableOpacity>
      <View style={styles.actions}>
        {!item.is_default && (
          <TouchableOpacity onPress={() => handleSetDefault(item.id)}>
            <Text style={styles.actionText}>设为默认</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => handleEditAddress(item.id)}>
          <Text style={styles.actionText}>编辑</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id)}>
          <Text style={[styles.actionText, styles.deleteText]}>删除</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerGradient}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleGoBack}>
            <Icons.ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>收货地址</Text>
          <TouchableOpacity onPress={handleAddAddress}>
            <Icons.Plus size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {addresses.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>暂无收货地址</Text>
          <TouchableOpacity style={styles.addBtn} onPress={handleAddAddress}>
            <Text style={styles.addBtnText}>添加地址</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={addresses}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerGradient: { backgroundColor: colors.primary, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, overflow: 'hidden' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.lg, paddingTop: spacing.xl * 1.5, paddingBottom: spacing.lg,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', flex: 1, textAlign: 'center' },
  listContent: { padding: spacing.md },
  addressCard: {
    backgroundColor: colors.white, borderRadius: 12, padding: spacing.md, marginBottom: spacing.md, ...shadows.sm,
  },
  defaultBadge: {
    backgroundColor: colors.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginBottom: spacing.xs,
  },
  defaultText: { color: colors.white, fontSize: 12 },
  name: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
  address: { fontSize: 14, color: colors['text-secondary'], lineHeight: 20 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: spacing.sm, gap: spacing.md },
  actionText: { color: colors.primary, fontSize: 14 },
  deleteText: { color: colors.error },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: colors['text-tertiary'] },
  addBtn: { marginTop: spacing.md, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: colors.primary, borderRadius: 24 },
  addBtnText: { color: colors.white, fontWeight: '600' },
});
```

---

### Task 6: 创建地址编辑页面

**Files:**
- Create: `APP/src/screens/AddressEditScreen.tsx`

**Step 1: 创建地址编辑页面**

创建 `APP/src/screens/AddressEditScreen.tsx`:

```tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { createAddress, updateAddress, getAddresses, Address } from '../services/addressService';
import { colors, spacing, shadows } from '../constants/theme';
import { NavigationProps } from '../navigation/AppNavigator';
import { Icons } from '../components/Icon';

interface AddressEditScreenProps extends Partial<NavigationProps> {
  addressId?: number;
}

export function AddressEditScreen({ onGoBack, addressId }: AddressEditScreenProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [detailAddress, setDetailAddress] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    if (addressId) {
      loadAddress();
    }
  }, [addressId]);

  const loadAddress = async () => {
    try {
      const addresses = await getAddresses();
      const address = addresses.find((a: Address) => a.id === addressId);
      if (address) {
        setName(address.name);
        setPhone(address.phone);
        setProvince(address.province || '');
        setCity(address.city || '');
        setDistrict(address.district || '');
        setDetailAddress(address.detail_address);
        setIsDefault(address.is_default);
        setIsEdit(true);
      }
    } catch (error) {
      console.error('Failed to load address:', error);
    }
  };

  const handleSave = async () => {
    if (!name || !phone || !detailAddress) {
      Alert.alert('提示', '请填写收货人、电话和详细地址');
      return;
    }

    setLoading(true);
    try {
      const data = {
        name,
        phone,
        province,
        city,
        district,
        detail_address: detailAddress,
        is_default: isDefault,
      };

      if (isEdit && addressId) {
        await updateAddress(addressId, data);
      } else {
        await createAddress(data);
      }

      if (onGoBack) {
        onGoBack();
      }
    } catch (error) {
      Alert.alert('错误', '保存地址失败');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerGradient}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleGoBack}>
            <Icons.ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEdit ? '编辑地址' : '新增地址'}</Text>
          <View style={styles.placeholder} />
        </View>
      </View>

      <ScrollView style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>收货人</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="请输入收货人姓名"
            placeholderTextColor={colors['text-tertiary']}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>联系电话</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="请输入联系电话"
            keyboardType="phone-pad"
            placeholderTextColor={colors['text-tertiary']}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>省份</Text>
          <TextInput
            style={styles.input}
            value={province}
            onChangeText={setProvince}
            placeholder="请输入省份"
            placeholderTextColor={colors['text-tertiary']}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>城市</Text>
          <TextInput
            style={styles.input}
            value={city}
            onChangeText={setCity}
            placeholder="请输入城市"
            placeholderTextColor={colors['text-tertiary']}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>区/县</Text>
          <TextInput
            style={styles.input}
            value={district}
            onChangeText={setDistrict}
            placeholder="请输入区/县"
            placeholderTextColor={colors['text-tertiary']}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>详细地址</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={detailAddress}
            onChangeText={setDetailAddress}
            placeholder="请输入详细地址"
            multiline
            placeholderTextColor={colors['text-tertiary']}
          />
        </View>

        <TouchableOpacity style={styles.checkboxRow} onPress={() => setIsDefault(!isDefault)}>
          <View style={[styles.checkbox, isDefault && styles.checkboxChecked]}>
            {isDefault && <Icons.Check size={14} color="#fff" />}
          </View>
          <Text style={styles.checkboxLabel}>设为默认地址</Text>
        </TouchableOpacity>
      </ScrollView>

      <TouchableOpacity
        style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={loading}
      >
        <Text style={styles.saveBtnText}>{loading ? '保存中...' : '保存地址'}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerGradient: { backgroundColor: colors.primary, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, overflow: 'hidden' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.lg, paddingTop: spacing.xl * 1.5, paddingBottom: spacing.lg,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', flex: 1, textAlign: 'center' },
  placeholder: { width: 36 },
  form: { flex: 1, padding: spacing.md },
  inputGroup: { marginBottom: spacing.md },
  label: { fontSize: 14, color: colors['text-secondary'], marginBottom: spacing.xs },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: spacing.sm, fontSize: 16, color: colors.text, backgroundColor: colors.white },
  textArea: { height: 80, textAlignVertical: 'top' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm },
  checkboxChecked: { backgroundColor: colors.primary },
  checkboxLabel: { fontSize: 14, color: colors.text },
  saveBtn: { backgroundColor: colors.primary, padding: spacing.md, margin: spacing.md, borderRadius: 24, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: colors.white, fontSize: 16, fontWeight: '600' },
});
```

---

### Task 7: 改造下单页面使用地址选择

**Files:**
- Modify: `APP/src/screens/StoreDetailScreen.tsx`
- Modify: `APP/src/navigation/AppNavigator.tsx`

**Step 1: 添加路由**

在 `AppNavigator.tsx` 中:
1. 添加 `'Address'`, `'AddressEdit'` 到 `SubPageName`
2. 添加渲染逻辑

**Step 2: 改造 StoreDetailScreen**

修改下单页面，改为选择地址：
- 显示用户已有地址列表
- 提供"添加新地址"按钮
- 选择地址后提交订单

---

## 验收标准

1. 后端 API 正常响应地址 CRUD 操作
2. 前端地址管理页面可以添加/编辑/删除地址
3. 下单时可以选择已有地址
4. 用户可以设置默认地址
