# 管理员 Web 端及订单系统实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为护花使者项目新增管理员 Web 端（Next.js）和订单系统，支持室内植物销售。管理员可管理商品和订单，客户可在 RN 端下单购买。

**Architecture:** 后端扩展 Product/Order/OrderItem 模型和 API；Web 端使用 Next.js App Router 实现管理员后台；RN 端扩展商城功能。UI 组件独立实现，通过设计规范保持一致性。

**Tech Stack:** FastAPI + SQLAlchemy + PostgreSQL, Next.js 14 + Tailwind CSS, React Native + Tailwind

---

## Phase 1: 后端扩展

### Task 1: 扩展 User 模型增加 role 字段

**Files:**
- Modify: `backend/app/models/user.py`

**Step 1: 修改 User 模型添加 role 字段**

```python
# backend/app/models/user.py - 在 User 类中添加
role = Column(String(20), default="user")  # admin 或 user
```

**Step 2: 修改 UserResponse schema 添加 role 字段**

```python
# backend/app/schemas/user.py - 在 UserResponse 中添加
role: str = "user"
```

**Step 3: 提交**

```bash
git add backend/app/models/user.py backend/app/schemas/user.py
git commit -m "feat: add role field to User model"
```

---

### Task 2: 创建 Product 模型和 Schema

**Files:**
- Create: `backend/app/models/product.py`
- Create: `backend/app/schemas/product.py`

**Step 1: 创建 Product 模型**

```python
# backend/app/models/product.py
from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text)
    price = Column(Numeric(10, 2), nullable=False)
    stock = Column(Integer, default=0)
    image_url = Column(String(500))
    plant_id = Column(Integer, ForeignKey("plants.id"), nullable=True)
    status = Column(String(20), default="active")  # active, inactive
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    plant = relationship("Plant", backref="products")
    order_items = relationship("OrderItem", back_populates="product")
```

**Step 2: 创建 Product Schema**

```python
# backend/app/schemas/product.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal


class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: Decimal
    stock: int = 0
    image_url: Optional[str] = None
    plant_id: Optional[int] = None
    status: str = "active"


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    stock: Optional[int] = None
    image_url: Optional[str] = None
    plant_id: Optional[int] = None
    status: Optional[str] = None


class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    total: int
    items: list[ProductResponse]
```

**Step 3: 注册模型到 base**

```python
# backend/app/db/base.py - 添加导入
from app.models.product import Product
```

**Step 4: 提交**

```bash
git add backend/app/models/product.py backend/app/schemas/product.py backend/app/db/base.py
git commit -m "feat: add Product model and schema"
```

---

### Task 3: 创建 Order 和 OrderItem 模型和 Schema

**Files:**
- Create: `backend/app/models/order.py`
- Create: `backend/app/schemas/order.py`

**Step 1: 创建 Order 和 OrderItem 模型**

```python
# backend/app/models/order.py
from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)
    status = Column(String(20), default="pending")  # pending, confirmed, shipped, completed, cancelled
    delivery_type = Column(String(20))  # express, pickup
    delivery_address = Column(String(255))
    contact_name = Column(String(50))
    contact_phone = Column(String(20))
    remark = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", backref="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    product_name = Column(String(100), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    subtotal = Column(Numeric(10, 2), nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product", backref="order_items")
```

**Step 2: 创建 Order Schema**

```python
# backend/app/schemas/order.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


class OrderItemBase(BaseModel):
    product_id: int
    quantity: int


class OrderItemCreate(OrderItemBase):
    pass


class OrderItemResponse(OrderItemBase):
    id: int
    product_name: str
    unit_price: Decimal
    subtotal: Decimal

    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    items: List[OrderItemCreate]
    delivery_type: str  # express, pickup
    delivery_address: Optional[str] = None
    contact_name: str
    contact_phone: str
    remark: Optional[str] = None


class OrderUpdate(BaseModel):
    status: Optional[str] = None
    delivery_type: Optional[str] = None
    delivery_address: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    remark: Optional[str] = None


class OrderResponse(BaseModel):
    id: int
    order_no: str
    user_id: int
    total_amount: Decimal
    status: str
    delivery_type: str
    delivery_address: Optional[str]
    contact_name: str
    contact_phone: str
    remark: Optional[str]
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse] = []

    class Config:
        from_attributes = True


class OrderListResponse(BaseModel):
    total: int
    items: List[OrderResponse]
```

**Step 3: 注册模型到 base**

```python
# backend/app/db/base.py - 添加导入
from app.models.order import Order, OrderItem
```

**Step 4: 提交**

```bash
git add backend/app/models/order.py backend/app/schemas/order.py backend/app/db/base.py
git commit -m "feat: add Order and OrderItem models and schemas"
```

---

### Task 4: 创建 Product API 端点

**Files:**
- Create: `backend/app/api/endpoints/products.py`
- Modify: `backend/app/api/router.py`

**Step 1: 创建 Product API 端点**

```python
# backend/app/api/endpoints/products.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.product import Product
from app.schemas.product import (
    ProductCreate, ProductUpdate, ProductResponse, ProductListResponse
)

router = APIRouter(prefix="/api/admin/products", tags=["admin-products"])


def get_current_admin_user(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.get("", response_model=ProductListResponse)
def list_products(
    status: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    query = db.query(Product)
    if status:
        query = query.filter(Product.status == status)
    if search:
        query = query.filter(Product.name.contains(search))

    total = query.count()
    items = query.offset(skip).limit(limit).all()
    return {"total": total, "items": items}


@router.post("", response_model=ProductResponse)
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    new_product = Product(**product.model_dump())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_update: ProductUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = product_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    db.delete(product)
    db.commit()
    return {"message": "Product deleted successfully"}


# 公开的 Product API（无需管理员权限）
public_router = APIRouter(prefix="/api/products", tags=["products"])


@public_router.get("", response_model=ProductListResponse)
def list_public_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Product).filter(Product.status == "active")
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    return {"total": total, "items": items}


@public_router.get("/{product_id}", response_model=ProductResponse)
def get_public_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.status == "active"
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
```

**Step 2: 注册路由**

```python
# backend/app/api/router.py - 添加
from app.api.endpoints.products import router as products_router, public_router as products_public_router
api_router.include_router(products_router)
api_router.include_router(products_public_router)
```

**Step 3: 提交**

```bash
git add backend/app/api/endpoints/products.py backend/app/api/router.py
git commit -m "feat: add Product API endpoints"
```

---

### Task 5: 创建 Order API 端点

**Files:**
- Create: `backend/app/api/endpoints/orders.py`

**Step 1: 创建 Order API 端点**

```python
# backend/app/api/endpoints/orders.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
import uuid
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.product import Product
from app.models.order import Order, OrderItem
from app.schemas.order import (
    OrderCreate, OrderUpdate, OrderResponse, OrderListResponse
)

router = APIRouter(prefix="/api", tags=["orders"])


def get_current_admin_user(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# ===== 管理员端订单 API =====
admin_router = APIRouter(prefix="/api/admin/orders", tags=["admin-orders"])


@admin_router.get("", response_model=OrderListResponse)
def list_orders(
    status: Optional[str] = None,
    user_id: Optional[int] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    query = db.query(Order)
    if status:
        query = query.filter(Order.status == status)
    if user_id:
        query = query.filter(Order.user_id == user_id)

    total = query.count()
    items = query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
    return {"total": total, "items": items}


@admin_router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@admin_router.put("/{order_id}", response_model=OrderResponse)
def update_order(
    order_id: int,
    order_update: OrderUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    update_data = order_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(order, field, value)

    db.commit()
    db.refresh(order)
    return order


# ===== 客户订单 API =====
@router.post("/orders", response_model=OrderResponse)
def create_order(
    order: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 生成订单号
    order_no = f"ORD{datetime.now().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6].upper()}"

    # 计算订单金额并验证库存
    total_amount = 0
    order_items_data = []

    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product or product.status != "active":
            raise HTTPException(status_code=400, detail=f"Product {item.product_id} not available")
        if product.stock < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product.name}")

        subtotal = product.price * item.quantity
        total_amount += subtotal

        order_items_data.append({
            "product_id": product.id,
            "product_name": product.name,
            "quantity": item.quantity,
            "unit_price": product.price,
            "subtotal": subtotal
        })

        # 扣减库存
        product.stock -= item.quantity

    # 创建订单
    new_order = Order(
        order_no=order_no,
        user_id=current_user.id,
        total_amount=total_amount,
        delivery_type=order.delivery_type,
        delivery_address=order.delivery_address,
        contact_name=order.contact_name,
        contact_phone=order.contact_phone,
        remark=order.remark
    )
    db.add(new_order)
    db.flush()  # 获取订单 ID

    # 创建订单项
    for item_data in order_items_data:
        order_item = OrderItem(order_id=new_order.id, **item_data)
        db.add(order_item)

    db.commit()
    db.refresh(new_order)
    return new_order


@router.get("/orders", response_model=OrderListResponse)
def list_my_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Order).filter(Order.user_id == current_user.id)
    total = query.count()
    items = query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
    return {"total": total, "items": items}


@router.get("/orders/{order_id}", response_model=OrderResponse)
def get_my_order(
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
    return order
```

**Step 2: 注册路由**

```python
# backend/app/api/router.py
from app.api.endpoints.orders import router as orders_router, admin_router as orders_admin_router
api_router.include_router(orders_router)
api_router.include_router(orders_admin_router)
```

**Step 3: 添加 datetime 导入**

```python
# backend/app/api/endpoints/orders.py 顶部添加
from datetime import datetime
```

**Step 4: 提交**

```bash
git add backend/app/api/endpoints/orders.py backend/app/api/router.py
git commit -m "feat: add Order API endpoints"
```

---

## Phase 2: Web 端 (Next.js)

### Task 6: 创建 Next.js 项目

**Files:**
- Create: `web/` (Next.js 项目)

**Step 1: 创建 Next.js 项目**

```bash
cd /Users/ember/Flower_Guardian
npx create-next-app@latest web --typescript --tailwind --eslint --app --src-dir --no-import-alias --use-npm
```

**Step 2: 安装 shadcn/ui**

```bash
cd web
npx shadcn-ui@latest init
# 选择默认选项

# 安装常用组件
npx shadcn-ui@latest add button input card table dialog form select label textarea badge
```

**Step 3: 配置 API 客户端**

```bash
npm install axios
```

**Step 4: 创建 API 客户端**

```typescript
// web/src/lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

**Step 5: 提交**

```bash
git add web/
git commit -m "feat: create Next.js project for admin web"
```

---

### Task 7: 实现管理员登录页面

**Files:**
- Create: `web/src/app/admin/login/page.tsx`
- Create: `web/src/app/admin/layout.tsx`

**Step 1: 创建登录页面**

```typescript
// web/src/app/admin/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const response = await api.post('/api/users/login', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      localStorage.setItem('token', response.data.access_token);
      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle className="text-center">管理员登录</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div>
              <Input
                type="text"
                placeholder="用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 2: 创建管理后台布局**

```typescript
// web/src/app/admin/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token && pathname !== '/admin/login') {
      router.push('/admin/login');
    } else {
      setLoading(false);
    }
  }, [pathname, router]);

  if (loading) return <div>Loading...</div>;

  const navItems = [
    { href: '/admin/dashboard', label: '仪表盘' },
    { href: '/admin/products', label: '商品管理' },
    { href: '/admin/orders', label: '订单管理' },
    { href: '/admin/customers', label: '客户管理' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* 侧边栏 */}
      <aside className="w-64 bg-gray-900 text-white">
        <div className="p-4">
          <h1 className="text-xl font-bold">护花使者后台</h1>
        </div>
        <nav className="mt-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2 hover:bg-gray-800 ${
                pathname === item.href ? 'bg-gray-800' : ''
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-4 px-4">
          <button
            onClick={() => {
              localStorage.removeItem('token');
              router.push('/admin/login');
            }}
            className="text-sm text-gray-400 hover:text-white"
          >
            退出登录
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
```

**Step 3: 提交**

```bash
git add web/src/app/admin/
git commit -f "feat: add admin login and layout pages"
```

---

### Task 8: 实现商品管理页面

**Files:**
- Create: `web/src/app/admin/products/page.tsx`
- Create: `web/src/app/admin/products/components/ProductForm.tsx`

**Step 1: 创建商品列表页面**

```typescript
// web/src/app/admin/products/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import api from '@/lib/api';

interface Product {
  id: number;
  name: string;
  price: string;
  stock: number;
  status: string;
  image_url?: string;
  created_at: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const fetchProducts = async () => {
    try {
      const params = search ? { search } : {};
      const response = await api.get('/api/admin/products', { params });
      setProducts(response.data.items);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除该商品吗？')) return;
    try {
      await api.delete(`/api/admin/products/${id}`);
      fetchProducts();
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await api.put(`/api/admin/products/${id}`, { status });
      fetchProducts();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  if (loading) return <div>加载中...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">商品管理</h1>
        <Button onClick={() => { setEditingProduct(null); setShowForm(true); }}>
          添加商品
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>商品列表</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <Input
              placeholder="搜索商品名称"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md"
            />
            <Button type="submit">搜索</Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>名称</TableHead>
                <TableHead>价格</TableHead>
                <TableHead>库存</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.id}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>¥{product.price}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>
                    <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                      {product.status === 'active' ? '上架' : '下架'}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingProduct(product);
                        setShowForm(true);
                      }}
                    >
                      编辑
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(
                        product.id,
                        product.status === 'active' ? 'inactive' : 'active'
                      )}
                    >
                      {product.status === 'active' ? '下架' : '上架'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(product.id)}
                    >
                      删除
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 2: 创建商品表单组件（简化版）**

```typescript
// web/src/app/admin/products/components/ProductForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';

interface ProductFormProps {
  product?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProductForm({ product, onClose, onSuccess }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    stock: product?.stock || 0,
    image_url: product?.image_url || '',
    status: product?.status || 'active',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
      };

      if (product?.id) {
        await api.put(`/api/admin/products/${product.id}`, data);
      } else {
        await api.post('/api/admin/products', data);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to save product:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-[500px] max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>{product?.id ? '编辑商品' : '添加商品'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">商品名称</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">描述</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">价格</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">库存</label>
                <Input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">图片 URL</label>
              <Input
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                取消
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? '保存中...' : '保存'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 3: 提交**

```bash
git add web/src/app/admin/products/
git commit -f "feat: add product management page"
```

---

### Task 9: 实现订单管理页面

**Files:**
- Create: `web/src/app/admin/orders/page.tsx`

**Step 1: 创建订单列表页面**

```typescript
// web/src/app/admin/orders/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import api from '@/lib/api';

interface Order {
  id: number;
  order_no: string;
  user_id: number;
  total_amount: string;
  status: string;
  delivery_type: string;
  contact_name: string;
  contact_phone: string;
  created_at: string;
}

const statusMap: Record<string, { label: string; variant: string }> = {
  pending: { label: '待确认', variant: 'warning' },
  confirmed: { label: '已确认', variant: 'default' },
  shipped: { label: '已发货', variant: 'default' },
  completed: { label: '已完成', variant: 'success' },
  cancelled: { label: '已取消', variant: 'destructive' },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    try {
      const params = filterStatus ? { status: filterStatus } : {};
      const response = await api.get('/api/admin/orders', { params });
      setOrders(response.data.items);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filterStatus]);

  const handleStatusChange = async (orderId: number, status: string) => {
    try {
      await api.put(`/api/admin/orders/${orderId}`, { status });
      fetchOrders();
    } catch (error) {
      console.error('Failed to update order:', error);
    }
  };

  const nextStatuses: Record<string, string[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['shipped'],
    shipped: ['completed'],
    completed: [],
    cancelled: [],
  };

  if (loading) return <div>加载中...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">订单管理</h1>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">全部订单</option>
          <option value="pending">待确认</option>
          <option value="confirmed">已确认</option>
          <option value="shipped">已发货</option>
          <option value="completed">已完成</option>
          <option value="cancelled">已取消</option>
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>订单列表</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>订单号</TableHead>
                <TableHead>客户 ID</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>配送方式</TableHead>
                <TableHead>联系人</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const statusInfo = statusMap[order.status] || { label: order.status, variant: 'secondary' };
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono">{order.order_no}</TableCell>
                    <TableCell>{order.user_id}</TableCell>
                    <TableCell>¥{order.total_amount}</TableCell>
                    <TableCell>{order.delivery_type === 'express' ? '快递' : '自提'}</TableCell>
                    <TableCell>{order.contact_name}</TableCell>
                    <TableCell>
                      <Badge variant={statusInfo.variant as any}>{statusInfo.label}</Badge>
                    </TableCell>
                    <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                        >
                          详情
                        </Button>
                        {nextStatuses[order.status]?.map((nextStatus) => (
                          <Button
                            key={nextStatus}
                            size="sm"
                            onClick={() => handleStatusChange(order.id, nextStatus)}
                          >
                            {nextStatus === 'confirmed' && '确认'}
                            {nextStatus === 'shipped' && '发货'}
                            {nextStatus === 'completed' && '完成'}
                            {nextStatus === 'cancelled' && '取消'}
                          </Button>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 订单详情弹窗 */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[500px]">
            <h2 className="text-xl font-bold mb-4">订单详情</h2>
            <div className="space-y-2 text-sm">
              <p><strong>订单号:</strong> {selectedOrder.order_no}</p>
              <p><strong>客户 ID:</strong> {selectedOrder.user_id}</p>
              <p><strong>金额:</strong> ¥{selectedOrder.total_amount}</p>
              <p><strong>配送方式:</strong> {selectedOrder.delivery_type === 'express' ? '快递' : '自提'}</p>
              <p><strong>收货地址:</strong> {selectedOrder.delivery_address || '-'}</p>
              <p><strong>联系人:</strong> {selectedOrder.contact_name}</p>
              <p><strong>联系电话:</strong> {selectedOrder.contact_phone}</p>
              <p><strong>备注:</strong> {selectedOrder.remark || '-'}</p>
              <p><strong>状态:</strong> {statusMap[selectedOrder.status]?.label}</p>
              <p><strong>创建时间:</strong> {new Date(selectedOrder.created_at).toLocaleString()}</p>
            </div>
            <Button className="mt-4 w-full" onClick={() => setSelectedOrder(null)}>
              关闭
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 2: 提交**

```bash
git add web/src/app/admin/orders/
git commit -f "feat: add order management page"
```

---

### Task 10: 实现仪表盘页面

**Files:**
- Create: `web/src/app/admin/dashboard/page.tsx`

**Step 1: 创建仪表盘页面**

```typescript
// web/src/app/admin/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    productsCount: 0,
    ordersCount: 0,
    pendingOrders: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [productsRes, ordersRes] = await Promise.all([
          api.get('/api/admin/products', { params: { limit: 1 } }),
          api.get('/api/admin/orders', { params: { limit: 1 } }),
        ]);

        const pendingOrders = ordersRes.data.items.filter(
          (o: any) => o.status === 'pending'
        ).length;

        const totalRevenue = ordersRes.data.items
          .filter((o: any) => o.status === 'completed' || o.status === 'shipped')
          .reduce((sum: number, o: any) => sum + parseFloat(o.total_amount), 0);

        setStats({
          productsCount: productsRes.data.total,
          ordersCount: ordersRes.data.total,
          pendingOrders,
          totalRevenue,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div>加载中...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">仪表盘</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">商品总数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.productsCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">订单总数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ordersCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">待处理订单</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.pendingOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">总收入</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{stats.totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

**Step 2: 提交**

```bash
git add web/src/app/admin/dashboard/
git commit -f "feat: add admin dashboard page"
```

---

## Phase 3: React Native 端扩展

### Task 11: 添加商城相关 API 服务

**Files:**
- Create: `APP/src/services/storeService.ts`

**Step 1: 创建商城 API 服务**

```typescript
// APP/src/services/storeService.ts
import axios from 'axios';

const API_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  // 从 AsyncStorage 获取 token
  return config;
});

// 商品类型
export interface Product {
  id: number;
  name: string;
  description?: string;
  price: string;
  stock: number;
  image_url?: string;
  status: string;
  plant_id?: number;
  created_at: string;
}

// 订单项类型
export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

// 订单类型
export interface Order {
  id: number;
  order_no: string;
  user_id: number;
  total_amount: string;
  status: string;
  delivery_type: 'express' | 'pickup';
  delivery_address?: string;
  contact_name: string;
  contact_phone: string;
  remark?: string;
  created_at: string;
  items: OrderItem[];
}

// 获取商品列表
export const getProducts = async (): Promise<Product[]> => {
  const response = await api.get('/api/products');
  return response.data.items;
};

// 获取商品详情
export const getProductDetail = async (id: number): Promise<Product> => {
  const response = await api.get(`/api/products/${id}`);
  return response.data;
};

// 创建订单
export const createOrder = async (orderData: {
  items: { product_id: number; quantity: number }[];
  delivery_type: string;
  delivery_address?: string;
  contact_name: string;
  contact_phone: string;
  remark?: string;
}): Promise<Order> => {
  const response = await api.post('/api/orders', orderData);
  return response.data;
};

// 获取我的订单列表
export const getMyOrders = async (): Promise<Order[]> => {
  const response = await api.get('/api/orders');
  return response.data.items;
};

// 获取订单详情
export const getOrderDetail = async (id: number): Promise<Order> => {
  const response = await api.get(`/api/orders/${id}`);
  return response.data;
};
```

**Step 2: 提交**

```bash
git add APP/src/services/storeService.ts
git commit -f "feat: add store API service"
```

---

### Task 12: 创建商城首页

**Files:**
- Create: `APP/src/screens/StoreScreen.tsx`

**Step 1: 创建商城首页**

```typescript
// APP/src/screens/StoreScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { getProducts, Product } from '../services/storeService';
import { colors, spacing } from '../constants/theme';
import { NavigationProps } from '../navigation/AppNavigator';

interface StoreScreenProps extends Partial<NavigationProps> {}

export function StoreScreen({ onNavigate }: StoreScreenProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = search
    ? products.filter((p) => p.name.includes(search))
    : products;

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => {
        if (onNavigate) {
          onNavigate('StoreDetail', { productId: item.id });
        }
      }}
    >
      <Image
        source={{ uri: item.image_url || 'https://via.placeholder.com/150' }}
        style={styles.productImage}
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.productPrice}>¥{item.price}</Text>
        <Text style={styles.productStock}>
          {item.stock > 0 ? `库存: ${item.stock}` : '缺货'}
        </Text>
      </View>
    </TouchableOpacity>
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
        <Text style={styles.headerTitle}>植物商城</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="搜索商品"
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={colors['text-tertiary']}
        />
      </View>

      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors['text-primary'],
  },
  searchContainer: {
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  searchInput: {
    backgroundColor: colors['bg-secondary'],
    borderRadius: 8,
    padding: spacing.sm,
    color: colors['text-primary'],
  },
  listContent: {
    padding: spacing.sm,
  },
  productCard: {
    flex: 1,
    margin: spacing.xs,
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: '100%',
    height: 120,
    backgroundColor: colors['bg-secondary'],
  },
  productInfo: {
    padding: spacing.sm,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors['text-primary'],
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  productStock: {
    fontSize: 12,
    color: colors['text-tertiary'],
    marginTop: 2,
  },
});
```

**Step 2: 提交**

```bash
git add APP/src/screens/StoreScreen.tsx
git commit -f "feat: add store screen"
```

---

### Task 13: 创建商品详情和下单页面

**Files:**
- Create: `APP/src/screens/StoreDetailScreen.tsx`
- Create: `APP/src/screens/OrderScreen.tsx`

**Step 1: 创建商品详情页**

```typescript
// APP/src/screens/StoreDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { getProductDetail, Product, createOrder } from '../services/storeService';
import { colors, spacing } from '../constants/theme';
import { NavigationProps } from '../navigation/AppNavigator';

interface StoreDetailScreenProps extends Partial<NavigationProps> {
  productId?: number;
}

export function StoreDetailScreen({ navigation, productId }: StoreDetailScreenProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [deliveryType, setDeliveryType] = useState<'express' | 'pickup'>('express');
  const [address, setAddress] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [remark, setRemark] = useState('');

  useEffect(() => {
    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const loadProduct = async () => {
    try {
      const data = await getProductDetail(productId!);
      setProduct(data);
    } catch (error) {
      console.error('Failed to load product:', error);
    }
  };

  const handleOrder = async () => {
    if (!contactName || !contactPhone) {
      Alert.alert('提示', '请填写联系人和电话');
      return;
    }
    if (deliveryType === 'express' && !address) {
      Alert.alert('提示', '请填写收货地址');
      return;
    }

    try {
      await createOrder({
        items: [{ product_id: product!.id, quantity: parseInt(quantity) }],
        delivery_type: deliveryType,
        delivery_address: deliveryType === 'express' ? address : undefined,
        contact_name: contactName,
        contact_phone: contactPhone,
        remark: remark || undefined,
      });
      Alert.alert('Success', '订单创建成功！', [
        { text: '确定', onPress: () => navigation?.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || '下单失败');
    }
  };

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>加载中...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Image
          source={{ uri: product.image_url || 'https://via.placeholder.com/300' }}
          style={styles.image}
        />

        <View style={styles.info}>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.price}>¥{product.price}</Text>
          <Text style={styles.stock}>
            {product.stock > 0 ? `库存: ${product.stock}` : '缺货'}
          </Text>
          {product.description && (
            <Text style={styles.description}>{product.description}</Text>
          )}
        </View>

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>下单信息</Text>

          <View style={styles.inputRow}>
            <Text style={styles.label}>数量</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.label}>配送方式</Text>
            <View style={styles.deliveryOptions}>
              <TouchableOpacity
                style={[
                  styles.option,
                  deliveryType === 'express' && styles.optionActive,
                ]}
                onPress={() => setDeliveryType('express')}
              >
                <Text
                  style={[
                    styles.optionText,
                    deliveryType === 'express' && styles.optionTextActive,
                  ]}
                >
                  快递
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.option,
                  deliveryType === 'pickup' && styles.optionActive,
                ]}
                onPress={() => setDeliveryType('pickup')}
              >
                <Text
                  style={[
                    styles.optionText,
                    deliveryType === 'pickup' && styles.optionTextActive,
                  ]}
                >
                  到店自提
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {deliveryType === 'express' && (
            <View style={styles.inputRow}>
              <Text style={styles.label}>收货地址</Text>
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholder="请输入收货地址"
              />
            </View>
          )}

          <View style={styles.inputRow}>
            <Text style={styles.label}>联系人</Text>
            <TextInput
              style={styles.input}
              value={contactName}
              onChangeText={setContactName}
              placeholder="请输入联系人姓名"
            />
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.label}>联系电话</Text>
            <TextInput
              style={styles.input}
              value={contactPhone}
              onChangeText={setContactPhone}
              keyboardType="phone-pad"
              placeholder="请输入联系电话"
            />
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.label}>备注</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={remark}
              onChangeText={setRemark}
              multiline
              placeholder="请输入备注"
            />
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.orderButton} onPress={handleOrder}>
        <Text style={styles.orderButtonText}>提交订单</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  image: {
    width: '100%',
    height: 300,
    backgroundColor: colors['bg-secondary'],
  },
  info: {
    padding: spacing.md,
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors['text-primary'],
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginVertical: spacing.sm,
  },
  stock: {
    fontSize: 14,
    color: colors['text-tertiary'],
  },
  description: {
    fontSize: 14,
    color: colors['text-secondary'],
    marginTop: spacing.md,
    lineHeight: 20,
  },
  form: {
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  inputRow: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    color: colors['text-secondary'],
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors['border-color'],
    borderRadius: 8,
    padding: spacing.sm,
    color: colors['text-primary'],
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  deliveryOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  option: {
    flex: 1,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors['border-color'],
    borderRadius: 8,
    alignItems: 'center',
  },
  optionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  optionText: {
    color: colors['text-secondary'],
  },
  optionTextActive: {
    color: colors.white,
  },
  orderButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    alignItems: 'center',
  },
  orderButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
```

**Step 2: 创建订单列表页面**

```typescript
// APP/src/screens/OrdersScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { getMyOrders, Order } from '../services/storeService';
import { colors, spacing } from '../constants/theme';
import { NavigationProps } from '../navigation/AppNavigator';

interface OrdersScreenProps extends Partial<NavigationProps> {}

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待确认', color: colors.warning },
  confirmed: { label: '已确认', color: colors.success },
  shipped: { label: '已发货', color: colors.success },
  completed: { label: '已完成', color: colors.success },
  cancelled: { label: '已取消', color: colors.error },
};

export function OrdersScreen({ onNavigate }: OrdersScreenProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await getMyOrders();
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderOrder = ({ item }: { item: Order }) => {
    const statusInfo = statusMap[item.status] || { label: item.status, color: colors['text-tertiary'] };

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => {
          if (onNavigate) {
            onNavigate('OrderDetail', { orderId: item.id });
          }
        }}
      >
        <View style={styles.orderHeader}>
          <Text style={styles.orderNo}>{item.order_no}</Text>
          <Text style={[styles.status, { color: statusInfo.color }]}>
            {statusInfo.label}
          </Text>
        </View>

        <View style={styles.orderItems}>
          {item.items.map((orderItem, index) => (
            <Text key={index} style={styles.itemText}>
              {orderItem.product_name} x{orderItem.quantity}
            </Text>
          ))}
        </View>

        <View style={styles.orderFooter}>
          <Text style={styles.totalAmount}>¥{item.total_amount}</Text>
          <Text style={styles.date}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

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
        <Text style={styles.headerTitle}>我的订单</Text>
      </View>

      {orders.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>暂无订单</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors['text-primary'],
  },
  listContent: {
    padding: spacing.md,
  },
  orderCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  orderNo: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: colors['text-secondary'],
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
  },
  orderItems: {
    marginBottom: spacing.sm,
  },
  itemText: {
    fontSize: 14,
    color: colors['text-primary'],
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  date: {
    fontSize: 12,
    color: colors['text-tertiary'],
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors['text-tertiary'],
  },
});
```

**Step 3: 提交**

```bash
git add APP/src/screens/StoreDetailScreen.tsx APP/src/screens/OrdersScreen.tsx
git commit -f "feat: add store detail and orders screens"
```

---

### Task 14: 更新导航

**Files:**
- Modify: `APP/src/navigation/AppNavigator.tsx`

**Step 1: 添加路由**

```typescript
// APP/src/navigation/AppNavigator.tsx - 添加新路由
// 在 navigation 中添加:
// 'Store' -> StoreScreen
// 'StoreDetail' -> StoreDetailScreen
// 'Orders' -> OrdersScreen
// 'OrderDetail' -> OrderDetailScreen
```

**Step 2: 在底部 Tab 添加商城入口**

```typescript
// 在 tab 数组中添加商城 Tab
{ name: 'Store', title: '商城', icon: 'shopping-cart' }
```

**Step 3: 提交**

```bash
git add APP/src/navigation/AppNavigator.tsx
git commit -f "feat: add store navigation routes"
```

---

## 实施顺序

建议按以下顺序实施：

1. **Phase 1: 后端扩展** (Task 1-5)
   - 完成后可先测试 API

2. **Phase 2: Web 端** (Task 6-10)
   - 管理员可先管理商品

3. **Phase 3: RN 端** (Task 11-14)
   - 客户可下单

---

## Plan complete

Plan complete and saved to `docs/plans/2026-03-10-admin-web-order-system-implementation.md`.

**Two execution options:**

1. **Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

2. **Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
