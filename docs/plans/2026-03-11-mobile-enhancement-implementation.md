# 移动端商城增强与病虫害诊断优化实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 完善移动端商城功能（购物车、订单追踪、支付预留）和病虫害诊断增强

**Architecture:**
- 后端: FastAPI + SQLAlchemy，新增购物车、支付、诊断记录API
- 移动端: React Native + KittenUI，新增购物车、订单增强、诊断历史页面

**Tech Stack:** React Native 0.74.6 + FastAPI + SQLAlchemy + AsyncStorage

---

## Phase 1: 购物车模块

### Task 1.1: 创建购物车模型

**Files:**
- Create: `backend/app/models/cart.py`
- Modify: `backend/app/models/__init__.py`

**Step 1: 创建购物车模型**

```python
# backend/app/models/cart.py
from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base


class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", backref="cart_items")
    product = relationship("Product", backref="cart_items")
```

**Step 2: 更新 models/__init__.py**

```python
from app.models.user import User
from app.models.product import Product
from app.models.order import Order, OrderItem
from app.models.plant import Plant, UserPlant
from app.models.diary import Diary
from app.models.reminder import Reminder
from app.models.cart import CartItem  # 新增
```

---

### Task 1.2: 创建购物车 Schema

**Files:**
- Create: `backend/app/schemas/cart.py`

**Step 1: 创建 cart schemas**

```python
# backend/app/schemas/cart.py
from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal
from datetime import datetime


class CartItemCreate(BaseModel):
    product_id: int
    quantity: int = 1


class CartItemUpdate(BaseModel):
    quantity: int


class CartItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_image: str
    price: str
    quantity: int
    stock: int
    subtotal: str

    class Config:
        from_attributes = True


class CartResponse(BaseModel):
    items: List[CartItemResponse]
    total_amount: str
    item_count: int
```

---

### Task 1.3: 创建购物车 API

**Files:**
- Create: `backend/app/api/endpoints/cart.py`
- Modify: `backend/app/api/router.py`

**Step 1: 创建 cart API**

```python
# backend/app/api/endpoints/cart.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.product import Product
from app.models.cart import CartItem
from app.schemas.cart import (
    CartItemCreate, CartItemUpdate, CartItemResponse, CartResponse
)

router = APIRouter(prefix="/api/cart", tags=["cart"])


@router.get("", response_model=CartResponse)
def get_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cart_items = db.query(CartItem).filter(
        CartItem.user_id == current_user.id
    ).all()

    items = []
    total_amount = 0

    for item in cart_items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            continue

        subtotal = float(product.price) * item.quantity
        total_amount += subtotal

        items.append(CartItemResponse(
            id=item.id,
            product_id=product.id,
            product_name=product.name,
            product_image=product.image_url or '',
            price=str(product.price),
            quantity=item.quantity,
            stock=product.stock,
            subtotal=f"{subtotal:.2f}"
        ))

    return CartResponse(
        items=items,
        total_amount=f"{total_amount:.2f}",
        item_count=len(items)
    )


@router.post("/items", response_model=CartItemResponse)
def add_to_cart(
    item: CartItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == item.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.status != "active":
        raise HTTPException(status_code=400, detail="Product not available")

    # 检查是否已存在
    existing = db.query(CartItem).filter(
        CartItem.user_id == current_user.id,
        CartItem.product_id == item.product_id
    ).first()

    if existing:
        existing.quantity += item.quantity
        db.commit()
        db.refresh(existing)
    else:
        existing = CartItem(
            user_id=current_user.id,
            product_id=item.product_id,
            quantity=item.quantity
        )
        db.add(existing)
        db.commit()
        db.refresh(existing)

    subtotal = float(product.price) * existing.quantity
    return CartItemResponse(
        id=existing.id,
        product_id=product.id,
        product_name=product.name,
        product_image=product.image_url or '',
        price=str(product.price),
        quantity=existing.quantity,
        stock=product.stock,
        subtotal=f"{subtotal:.2f}"
    )


@router.put("/items/{item_id}", response_model=CartItemResponse)
def update_cart_item(
    item_id: int,
    item_update: CartItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cart_item = db.query(CartItem).filter(
        CartItem.id == item_id,
        CartItem.user_id == current_user.id
    ).first()

    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    product = db.query(Product).filter(Product.id == cart_item.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if item_update.quantity > product.stock:
        raise HTTPException(status_code=400, detail="Insufficient stock")

    cart_item.quantity = item_update.quantity
    db.commit()
    db.refresh(cart_item)

    subtotal = float(product.price) * cart_item.quantity
    return CartItemResponse(
        id=cart_item.id,
        product_id=product.id,
        product_name=product.name,
        product_image=product.image_url or '',
        price=str(product.price),
        quantity=cart_item.quantity,
        stock=product.stock,
        subtotal=f"{subtotal:.2f}"
    )


@router.delete("/items/{item_id}")
def delete_cart_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cart_item = db.query(CartItem).filter(
        CartItem.id == item_id,
        CartItem.user_id == current_user.id
    ).first()

    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    db.delete(cart_item)
    db.commit()
    return {"message": "Item removed from cart"}


@router.delete("/clear")
def clear_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db.query(CartItem).filter(CartItem.user_id == current_user.id).delete()
    db.commit()
    return {"message": "Cart cleared"}
```

**Step 2: 注册 router**

在 `backend/app/api/router.py` 添加:
```python
api_router.include_router(cart.router)
```

---

### Task 1.4: 创建移动端购物车服务

**Files:**
- Modify: `APP/src/services/storeService.ts`

**Step 1: 添加购物车 API**

```typescript
// APP/src/services/storeService.ts 添加

// 购物车类型
export interface CartItem {
  id: number;
  product_id: number;
  product_name: string;
  product_image: string;
  price: string;
  quantity: number;
  stock: number;
  subtotal: string;
}

export interface Cart {
  items: CartItem[];
  total_amount: string;
  item_count: number;
}

// 获取购物车
export const getCart = async (): Promise<Cart> => {
  const response = await api.get('/api/cart');
  return response.data;
};

// 添加到购物车
export const addToCart = async (productId: number, quantity: number = 1): Promise<CartItem> => {
  const response = await api.post('/api/cart/items', { product_id: productId, quantity });
  return response.data;
};

// 更新购物车数量
export const updateCartItem = async (itemId: number, quantity: number): Promise<CartItem> => {
  const response = await api.put(`/api/cart/items/${itemId}`, { quantity });
  return response.data;
};

// 删除购物车项
export const deleteCartItem = async (itemId: number): Promise<void> => {
  await api.delete(`/api/cart/items/${itemId}`);
};

// 清空购物车
export const clearCart = async (): Promise<void> => {
  await api.delete('/api/cart/clear');
};
```

---

### Task 1.5: 创建购物车页面

**Files:**
- Create: `APP/src/screens/CartScreen.tsx`
- Modify: `APP/src/navigation/AppNavigator.tsx`

**Step 1: 创建 CartScreen**

```tsx
// APP/src/screens/CartScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { getCart, updateCartItem, deleteCartItem, clearCart, Cart, CartItem } from '../services/storeService';
import { colors, spacing, shadows } from '../constants/theme';
import { NavigationProps } from '../navigation/AppNavigator';

interface CartScreenProps extends Partial<NavigationProps> {}

export function CartScreen({ onNavigate }: CartScreenProps) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const data = await getCart();
      setCart(data);
    } catch (error) {
      console.error('Failed to load cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (item: CartItem, delta: number) => {
    const newQty = item.quantity + delta;
    if (newQty < 1) return;
    if (newQty > item.stock) {
      Alert.alert('库存不足');
      return;
    }
    try {
      await updateCartItem(item.id, newQty);
      loadCart();
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  };

  const handleDelete = async (itemId: number) => {
    Alert.alert('确认删除', '确定要从购物车中删除该商品吗?', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: async () => {
        await deleteCartItem(itemId);
        loadCart();
      }}
    ]);
  };

  const handleClearCart = async () => {
    Alert.alert('确认清空', '确定要清空购物车吗?', [
      { text: '取消', style: 'cancel' },
      { text: '清空', style: 'destructive', onPress: async () => {
        await clearCart();
        loadCart();
      }}
    ]);
  };

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <Image
        source={{ uri: item.product_image || 'https://via.placeholder.com/80' }}
        style={styles.productImage}
      />
      <View style={styles.itemInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.product_name}</Text>
        <Text style={styles.productPrice}>¥{item.price}</Text>
        <View style={styles.quantityRow}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => handleUpdateQuantity(item, -1)}
          >
            <Text style={styles.qtyBtnText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.quantity}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => handleUpdateQuantity(item, 1)}
          >
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.itemRight}>
        <Text style={styles.subtotal}>¥{item.subtotal}</Text>
        <TouchableOpacity onPress={() => handleDelete(item.id)}>
          <Text style={styles.deleteBtn}>删除</Text>
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>购物车</Text>
        {cart && cart.items.length > 0 && (
          <TouchableOpacity onPress={handleClearCart}>
            <Text style={styles.clearBtn}>清空</Text>
          </TouchableOpacity>
        )}
      </View>

      {(!cart || cart.items.length === 0) ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>购物车是空的</Text>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => onNavigate?.('Store')}
          >
            <Text style={styles.shopBtnText}>去逛逛</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cart.items}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
          />
          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>共 {cart.item_count} 件</Text>
              <Text style={styles.totalAmount}>¥{cart.total_amount}</Text>
            </View>
            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={() => onNavigate?.('Checkout')}
            >
              <Text style={styles.checkoutBtnText}>去结算</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.md, backgroundColor: colors.white,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  clearBtn: { color: colors.primary, fontSize: 14 },
  listContent: { padding: spacing.md },
  cartItem: {
    flexDirection: 'row', backgroundColor: colors.white, borderRadius: 12,
    padding: spacing.sm, marginBottom: spacing.sm, ...shadows.sm,
  },
  productImage: { width: 80, height: 80, borderRadius: 8, backgroundColor: colors.background },
  itemInfo: { flex: 1, marginLeft: spacing.sm },
  productName: { fontSize: 14, fontWeight: '600', color: colors.text },
  productPrice: { fontSize: 14, color: colors.primary, marginTop: 4 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  quantity: { marginHorizontal: 12, fontSize: 14 },
  itemRight: { alignItems: 'flex-end', justifyContent: 'space-between' },
  subtotal: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
  deleteBtn: { color: colors.error, fontSize: 12 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: colors['text-tertiary'] },
  shopBtn: { marginTop: spacing.md, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: colors.primary, borderRadius: 24 },
  shopBtnText: { color: colors.white, fontWeight: '600' },
  footer: { backgroundColor: colors.white, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.background },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  totalLabel: { fontSize: 14, color: colors['text-secondary'] },
  totalAmount: { fontSize: 20, fontWeight: 'bold', color: colors.primary },
  checkoutBtn: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 24, alignItems: 'center' },
  checkoutBtnText: { color: colors.white, fontSize: 16, fontWeight: '600' },
});
```

**Step 2: 注册导航 (AppNavigator.tsx)**

添加 Cart 和 Checkout 页面到导航。

---

## Phase 2: 订单追踪增强

### Task 2.1: 增强订单 API

**Files:**
- Modify: `backend/app/api/endpoints/orders.py`

**Step 1: 添加取消订单和再次购买 API**

```python
@router.post("/orders/{order_id}/cancel")
def cancel_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id
    ).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status != "pending":
        raise HTTPException(status_code=400, detail="Only pending orders can be cancelled")

    # 恢复库存
    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            product.stock += item.quantity

    order.status = "cancelled"
    db.commit()

    return {"message": "Order cancelled successfully"}


@router.post("/orders/{order_id}/reorder")
def reorder(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id
    ).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # 将订单商品添加到购物车
    for item in order.items:
        existing = db.query(CartItem).filter(
            CartItem.user_id == current_user.id,
            CartItem.product_id == item.product_id
        ).first()

        if existing:
            existing.quantity += item.quantity
        else:
            cart_item = CartItem(
                user_id=current_user.id,
                product_id=item.product_id,
                quantity=item.quantity
            )
            db.add
    db.commit(cart_item)
()
    return {"message": "Items added to cart"}
```

---

### Task 2.2: 增强移动端订单服务

**Files:**
- Modify: `APP/src/services/storeService.ts`

**Step 1: 添加订单增强 API**

```typescript
// 取消订单
export const cancelOrder = async (orderId: number): Promise<void> => {
  const response = await api.post(`/api/orders/${orderId}/cancel`);
  return response.data;
};

// 再次购买
export const reorder = async (orderId: number): Promise<void> => {
  const response = await api.post(`/api/orders/${orderId}/reorder`);
  return response.data;
};

// 筛选订单
export const getOrdersByStatus = async (status: string): Promise<Order[]> => {
  const response = await api.get('/api/orders', { params: { status } });
  return response.data.items;
};
```

---

### Task 2.3: 增强订单列表页面

**Files:**
- Modify: `APP/src/screens/OrdersScreen.tsx`

**Step 1: 添加状态筛选**

```tsx
// 添加 tabs 筛选: [全部] [待确认] [配送中] [已完成]
const [filter, setFilter] = useState('all');

const filteredOrders = filter === 'all'
  ? orders
  : orders.filter(o => o.status === filter);
```

---

### Task 2.4: 创建订单详情页

**Files:**
- Create: `APP/src/screens/OrderDetailScreen.tsx`

**Step 1: 创建 OrderDetailScreen**

```tsx
// APP/src/screens/OrderDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { getOrderDetail, cancelOrder, reorder, Order } from '../services/storeService';
import { colors, spacing, shadows } from '../constants/theme';
import { NavigationProps } from '../navigation/AppNavigator';

interface OrderDetailScreenProps extends NavigationProps {}

export function OrderDetailScreen({ route, onNavigate }: OrderDetailScreenProps) {
  const { orderId } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadOrder(); }, [orderId]);

  const loadOrder = async () => {
    try {
      const data = await getOrderDetail(orderId);
      setOrder(data);
    } catch (error) {
      console.error('Failed to load order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert('确认取消', '确定要取消此订单吗?', [
      { text: '否', style: 'cancel' },
      { text: '是', style: 'destructive', onPress: async () => {
        await cancelOrder(orderId);
        loadOrder();
      }}
    ]);
  };

  const handleReorder = async () => {
    await reorder(orderId);
    onNavigate?.('Cart');
  };

  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: '待确认', color: colors.warning },
    confirmed: { label: '已确认', color: colors.info },
    shipped: { label: '已发货', color: colors.success },
    completed: { label: '已完成', color: colors.success },
    cancelled: { label: '已取消', color: colors.error },
  };

  if (!order) return null;

  const statusInfo = statusMap[order.status] || { label: order.status, color: colors.text };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.orderNo}>{order.order_no}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>商品信息</Text>
          {order.items.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.product_name}</Text>
              <Text style={styles.itemQty}>x{item.quantity}</Text>
              <Text style={styles.itemPrice}>¥{item.subtotal}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>合计</Text>
            <Text style={styles.totalAmount}>¥{order.total_amount}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>配送信息</Text>
          <Text style={styles.infoText}>配送方式: {order.delivery_type === 'express' ? '快递' : '自提'}</Text>
          {order.delivery_address && <Text style={styles.infoText}>地址: {order.delivery_address}</Text>}
          <Text style={styles.infoText}>联系人: {order.contact_name}</Text>
          <Text style={styles.infoText}>电话: {order.contact_phone}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>订单信息</Text>
          <Text style={styles.infoText}>下单时间: {new Date(order.created_at).toLocaleString()}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {order.status === 'pending' && (
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
            <Text style={styles.cancelBtnText}>取消订单</Text>
          </TouchableOpacity>
        )}
        {order.status === 'completed' && (
          <TouchableOpacity style={styles.reorderBtn} onPress={handleReorder}>
            <Text style={styles.reorderBtnText}>再次购买</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.md, backgroundColor: colors.white },
  orderNo: { fontSize: 16, fontFamily: 'monospace', color: colors.text },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: spacing.xs },
  statusText: { fontSize: 14, fontWeight: '600' },
  section: { backgroundColor: colors.white, marginTop: spacing.sm, padding: spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  itemRow: { flexDirection: 'row', paddingVertical: spacing.xs },
  itemName: { flex: 1, fontSize: 14, color: colors.text },
  itemQty: { fontSize: 14, color: colors['text-secondary'], marginRight: spacing.md },
  itemPrice: { fontSize: 14, fontWeight: '600' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.background },
  totalLabel: { fontSize: 16, fontWeight: '600' },
  totalAmount: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
  infoText: { fontSize: 14, color: colors['text-secondary'], marginBottom: 4 },
  footer: { flexDirection: 'row', padding: spacing.md, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.background },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 24, borderWidth: 1, borderColor: colors.error, marginRight: spacing.sm },
  cancelBtnText: { color: colors.error, textAlign: 'center', fontWeight: '600' },
  reorderBtn: { flex: 1, paddingVertical: 12, borderRadius: 24, backgroundColor: colors.primary },
  reorderBtnText: { color: colors.white, textAlign: 'center', fontWeight: '600' },
});
```

---

## Phase 3: 支付预留

### Task 3.1: 创建支付模型

**Files:**
- Create: `backend/app/models/payment.py`
- Modify: `backend/app/models/__init__.py`

**Step 1: 创建支付模型**

```python
# backend/app/models/payment.py
from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    payment_method = Column(String(20), default="offline")  # wechat, alipay, offline
    status = Column(String(20), default="pending")  # pending, paid, failed, refunded
    transaction_id = Column(String(100))
    paid_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", backref="payments")
```

---

### Task 3.2: 创建支付 API

**Files:**
- Create: `backend/app/api/endpoints/payments.py`

**Step 1: 创建支付 API**

```python
# backend/app/api/endpoints/payments.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.order import Order
from app.models.payment import Payment

router = APIRouter(prefix="/api/payments", tags=["payments"])


@router.post("")
def create_payment(
    order_id: int,
    payment_method: str = "offline",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id
    ).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # 检查是否已有支付记录
    existing = db.query(Payment).filter(Payment.order_id == order_id).first()
    if existing:
        return existing

    payment = Payment(
        order_id=order_id,
        amount=order.total_amount,
        payment_method=payment_method,
        status="pending"
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    return payment


@router.get("/{payment_id}")
def get_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()

    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    if payment.order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    return payment


@router.post("/{payment_id}/callback")
def payment_callback(
    payment_id: int,
    status: str,
    transaction_id: str = None,
    db: Session = Depends(get_db)
):
    """支付回调接口 (模拟)"""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()

    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    payment.status = status
    if transaction_id:
        payment.transaction_id = transaction_id
    if status == "paid":
        payment.paid_at = datetime.utcnow()

    db.commit()
    db.refresh(payment)

    return payment
```

---

## Phase 4: 病虫害诊断增强

### Task 4.1: 创建诊断记录模型

**Files:**
- Create: `backend/app/models/diagnosis.py`
- Modify: `backend/app/models/__init__.py`

**Step 1: 创建诊断记录模型**

```python
# backend/app/models/diagnosis.py
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base


class DiagnosisRecord(Base):
    __tablename__ = "diagnosis_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    image_url = Column(String(500))
    disease_name = Column(String(100), nullable=False)
    confidence = Column(Float)
    description = Column(Text)
    treatment = Column(Text)  # 治疗建议
    prevention = Column(Text)  # 预防措施
    recommended_products = Column(Text)  # 推荐产品 (JSON)
    is_favorite = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="diagnosis_records")
```

---

### Task 4.2: 创建诊断记录 Schema

**Files:**
- Create: `backend/app/schemas/diagnosis.py`

**Step 1: 创建 diagnosis schemas**

```python
# backend/app/schemas/diagnosis.py
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class DiagnosisRecordCreate(BaseModel):
    image_url: str
    disease_name: str
    confidence: float
    description: str = ""
    treatment: str = ""
    prevention: str = ""
    recommended_products: str = "[]"


class DiagnosisRecordResponse(BaseModel):
    id: int
    image_url: str
    disease_name: str
    confidence: float
    description: str
    treatment: str
    prevention: str
    recommended_products: str
    is_favorite: bool
    created_at: datetime

    class Config:
        from_attributes = True


class DiagnosisRecordListResponse(BaseModel):
    total: int
    items: List[DiagnosisRecordResponse]
```

---

### Task 4.3: 创建诊断记录 API

**Files:**
- Create: `backend/app/api/endpoints/diagnoses.py`
- Modify: `backend/app/api/router.py`

**Step 1: 创建诊断记录 API**

```python
# backend/app/api/endpoints/diagnoses.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import json
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.diagnosis import DiagnosisRecord
from app.schemas.diagnosis import (
    DiagnosisRecordCreate, DiagnosisRecordResponse, DiagnosisRecordListResponse
)
from app.services.diagnosis import diagnosis_service

router = APIRouter(prefix="/api/diagnoses", tags=["diagnoses"])


@router.get("", response_model=DiagnosisRecordListResponse)
def list_diagnoses(
    favorite: Optional[bool] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(DiagnosisRecord).filter(DiagnosisRecord.user_id == current_user.id)

    if favorite is not None:
        query = query.filter(DiagnosisRecord.is_favorite == favorite)

    total = query.count()
    items = query.order_by(DiagnosisRecord.created_at.desc()).offset(skip).limit(limit).all()

    return {"total": total, "items": items}


@router.get("/{diagnosis_id}", response_model=DiagnosisRecordResponse)
def get_diagnosis(
    diagnosis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    record = db.query(DiagnosisRecord).filter(
        DiagnosisRecord.id == diagnosis_id,
        DiagnosisRecord.user_id == current_user.id
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Diagnosis record not found")

    return record


@router.post("", response_model=DiagnosisRecordResponse)
def create_diagnosis(
    diagnosis: DiagnosisRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    record = DiagnosisRecord(
        user_id=current_user.id,
        **diagnosis.model_dump()
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.post("/{diagnosis_id}/favorite")
def toggle_favorite(
    diagnosis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    record = db.query(DiagnosisRecord).filter(
        DiagnosisRecord.id == diagnosis_id,
        DiagnosisRecord.user_id == current_user.id
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Diagnosis record not found")

    record.is_favorite = not record.is_favorite
    db.commit()
    db.refresh(record)

    return {"is_favorite": record.is_favorite}


@router.post("/{diagnosis_id}/rediagnose")
def rediagnose(
    diagnosis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """基于历史诊断再次诊断"""
    original = db.query(DiagnosisRecord).filter(
        DiagnosisRecord.id == diagnosis_id,
        DiagnosisRecord.user_id == current_user.id
    ).first()

    if not original:
        raise HTTPException(status_code=404, detail="Diagnosis record not found")

    # 调用诊断服务获取新结果
    result = diagnosis_service.diagnose(original.disease_name)

    # 创建新记录
    new_record = DiagnosisRecord(
        user_id=current_user.id,
        image_url=original.image_url,
        disease_name=result.get("disease_name", original.disease_name),
        confidence=result.get("confidence", 0),
        description=result.get("description", ""),
        treatment=result.get("treatment", ""),
        prevention=result.get("prevention", ""),
        recommended_products=json.dumps(result.get("recommended_products", []))
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    return new_record
```

---

### Task 4.4: 增强诊断响应 (AI 建议)

**Files:**
- Modify: `backend/app/services/diagnosis.py`

**Step 1: 增强诊断服务返回 AI 建议**

```python
def diagnose(self, symptom: str) -> dict:
    # 现有诊断逻辑...

    # 增强: 添加 AI 建议
    ai_suggestion = self.get_ai_suggestion(disease_name, description)

    return {
        "disease_name": disease_name,
        "confidence": confidence,
        "description": description,
        "treatment": treatment,
        "prevention": prevention,
        "recommended_products": recommended_products,
        **ai_suggestion  # 展开 AI 增强内容
    }

def get_ai_suggestion(self, disease_name: str, description: str) -> dict:
    """调用 Qwen API 获取增强建议"""
    # 预留接口，实际调用 Qwen API
    return {
        "immediate_action": "剪除病叶，喷施多菌灵",
        "daily_care": "保持通风，减少浇水频率",
        "duration": "2-3周可见好转",
        "prevention_tips": [
            "定期喷洒预防性杀菌剂",
            "避免叶面积水",
            "保证充足光照"
        ]
    }
```

---

### Task 4.5: 创建诊断历史移动端

**Files:**
- Create: `APP/src/screens/DiagnosisHistoryScreen.tsx`
- Modify: `APP/src/navigation/AppNavigator.tsx`

**Step 1: 创建 DiagnosisHistoryScreen**

```tsx
// APP/src/screens/DiagnosisHistoryScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, SafeAreaView, ActivityIndicator } from 'react-native';
import { getDiagnoses, DiagnosisRecord } from '../services/diagnosisService';
import { colors, spacing, shadows } from '../constants/theme';
import { NavigationProps } from '../navigation/AppNavigator';

interface DiagnosisHistoryScreenProps extends Partial<NavigationProps> {}

export function DiagnosisHistoryScreen({ onNavigate }: DiagnosisHistoryScreenProps) {
  const [records, setRecords] = useState<DiagnosisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'favorite'>('all');

  useEffect(() => { loadRecords(); }, [filter]);

  const loadRecords = async () => {
    try {
      const data = await getDiagnoses(filter === 'favorite');
      setRecords(data.items);
    } catch (error) {
      console.error('Failed to load diagnoses:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: DiagnosisRecord }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onNavigate?.('DiagnosisDetail', { diagnosisId: item.id })}
    >
      <Image
        source={{ uri: item.image_url || 'https://via.placeholder.com/80' }}
        style={styles.image}
      />
      <View style={styles.info}>
        <Text style={styles.diseaseName}>{item.disease_name}</Text>
        <Text style={styles.confidence}>置信度: {(item.confidence * 100).toFixed(0)}%</Text>
        <Text style={styles.date}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.actions}>
        {item.is_favorite && <Text style={styles.favoriteIcon}>⭐</Text>}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>诊断历史</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, filter === 'all' && styles.tabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.tabText, filter === 'all' && styles.tabTextActive]}>全部</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, filter === 'favorite' && styles.tabActive]}
          onPress={() => setFilter('favorite')}
        >
          <Text style={[styles.tabText, filter === 'favorite' && styles.tabTextActive]}>收藏</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : records.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>暂无诊断记录</Text>
        </View>
      ) : (
        <FlatList
          data={records}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.md, backgroundColor: colors.white },
  title: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  tabs: { flexDirection: 'row', backgroundColor: colors.white, paddingHorizontal: spacing.md },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { fontSize: 14, color: colors['text-secondary'] },
  tabTextActive: { color: colors.primary, fontWeight: '600' },
  list: { padding: spacing.md },
  card: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: 12, padding: spacing.sm, marginBottom: spacing.sm, ...shadows.sm },
  image: { width: 60, height: 60, borderRadius: 8, backgroundColor: colors.background },
  info: { flex: 1, marginLeft: spacing.sm, justifyContent: 'center' },
  diseaseName: { fontSize: 16, fontWeight: '600', color: colors.text },
  confidence: { fontSize: 12, color: colors.primary, marginTop: 2 },
  date: { fontSize: 12, color: colors['text-tertiary'], marginTop: 2 },
  actions: { justifyContent: 'center' },
  favoriteIcon: { fontSize: 18 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: colors['text-tertiary'] },
});
```

---

## 实施顺序

1. Task 1.1 - 1.3: 后端购物车 API
2. Task 1.4 - 1.5: 移动端购物车
3. Task 2.1 - 2.4: 订单追踪增强
4. Task 3.1 - 3.2: 支付预留
5. Task 4.1 - 4.5: 病虫害诊断增强
