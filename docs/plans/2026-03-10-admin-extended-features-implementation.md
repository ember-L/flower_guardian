# 管理员后台扩展功能实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为管理员后台添加用户管理、植物百科管理和数据统计功能。

**Architecture:** 后端扩展用户/植物统计 API；Web 端新增用户管理、植物管理、数据统计页面。

**Tech Stack:** FastAPI + SQLAlchemy, Next.js 14 + Tailwind CSS

---

## Phase 1: 后端 API

### Task 1: 创建用户管理 API

**Files:**
- Create: `backend/app/api/endpoints/admin_users.py`

**Step 1: 创建用户管理 API**

```python
# backend/app/api/endpoints/admin_users.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.order import Order
from app.schemas.user import UserResponse
from app.schemas.order import OrderResponse

router = APIRouter(prefix="/api/admin/users", tags=["admin-users"])


def get_current_admin_user(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    if current_user.role != "admin":
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


from pydantic import BaseModel
from datetime import datetime


class UserWithOrdersResponse(BaseModel):
    id: int
    username: str
    email: str
    avatar_url: Optional[str]
    bio: Optional[str]
    role: str
    created_at: datetime
    orders: list = []

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    total: int
    items: list


@router.get("", response_model=UserListResponse)
def list_users(
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    query = db.query(User)
    if search:
        query = query.filter(
            (User.username.contains(search)) | (User.email.contains(search))
        )
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    return {"total": total, "items": items}


@router.get("/{user_id}", response_model=UserWithOrdersResponse)
def get_user_detail(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="User not found")

    orders = db.query(Order).filter(Order.user_id == user_id).order_by(Order.created_at.desc()).all()

    return UserWithOrdersResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        avatar_url=user.avatar_url,
        bio=user.bio,
        role=user.role,
        created_at=user.created_at,
        orders=orders
    )


@router.get("/{user_id}/orders")
def get_user_orders(
    user_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    from app.schemas.order import OrderListResponse
    query = db.query(Order).filter(Order.user_id == user_id)
    total = query.count()
    items = query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
    return {"total": total, "items": items}
```

**Step 2: 注册路由**

```python
# backend/app/api/router.py
from app.api.endpoints.admin_users import router as admin_users_router
api_router.include_router(admin_users_router)
```

**Step 3: 提交**

```bash
git add backend/app/api/endpoints/admin_users.py backend/app/api/router.py
git commit -m "feat: add admin users API"
```

---

### Task 2: 创建植物百科管理 API

**Files:**
- Create: `backend/app/api/endpoints/admin_plants.py`

**Step 1: 创建植物管理 API**

```python
# backend/app/api/endpoints/admin_plants.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.plant import Plant
from app.schemas.plant import PlantResponse, PlantListResponse
from pydantic import BaseModel


class PlantCreate(BaseModel):
    name: str
    scientific_name: Optional[str] = None
    category: Optional[str] = None
    care_level: int = 1
    description: Optional[str] = None
    light_requirement: Optional[str] = None
    water_requirement: Optional[str] = None
    temperature_range: Optional[str] = None
    humidity_range: Optional[str] = None
    fertilization: Optional[str] = None
    repotting: Optional[str] = None
    common_mistakes: Optional[str] = None
    tips: Optional[str] = None


class PlantUpdate(BaseModel):
    name: Optional[str] = None
    scientific_name: Optional[str] = None
    category: Optional[str] = None
    care_level: Optional[int] = None
    description: Optional[str] = None
    light_requirement: Optional[str] = None
    water_requirement: Optional[str] = None
    temperature_range: Optional[str] = None
    humidity_range: Optional[str] = None
    fertilization: Optional[str] = None
    repotting: Optional[str] = None
    common_mistakes: Optional[str] = None
    tips: Optional[str] = None


router = APIRouter(prefix="/api/admin/plants", tags=["admin-plants"])


def get_current_admin_user(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.get("", response_model=PlantListResponse)
def list_plants(
    category: Optional[str] = None,
    care_level: Optional[int] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    query = db.query(Plant)
    if category:
        query = query.filter(Plant.category == category)
    if care_level:
        query = query.filter(Plant.care_level == care_level)
    if search:
        query = query.filter(Plant.name.contains(search))

    total = query.count()
    items = query.offset(skip).limit(limit).all()
    return {"total": total, "items": items}


@router.post("", response_model=PlantResponse)
def create_plant(
    plant: PlantCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    new_plant = Plant(**plant.model_dump())
    db.add(new_plant)
    db.commit()
    db.refresh(new_plant)
    return new_plant


@router.get("/{plant_id}", response_model=PlantResponse)
def get_plant(
    plant_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
    return plant


@router.put("/{plant_id}", response_model=PlantResponse)
def update_plant(
    plant_id: int,
    plant_update: PlantUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    update_data = plant_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(plant, field, value)

    db.commit()
    db.refresh(plant)
    return plant


@router.delete("/{plant_id}")
def delete_plant(
    plant_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    db.delete(plant)
    db.commit()
    return {"message": "Plant deleted successfully"}
```

**Step 2: 注册路由**

```python
# backend/app/api/router.py
from app.api.endpoints.admin_plants import router as admin_plants_router
api_router.include_router(admin_plants_router)
```

**Step 3: 提交**

```bash
git add backend/app/api/endpoints/admin_plants.py backend/app/api/router.py
git commit -m "feat: add admin plants API"
```

---

### Task 3: 创建数据统计 API

**Files:**
- Create: `backend/app/api/endpoints/admin_stats.py`

**Step 1: 创建数据统计 API**

```python
# backend/app/api/endpoints/admin_stats.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime, timedelta
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.order import Order, OrderItem
from app.models.product import Product
from pydantic import BaseModel


router = APIRouter(prefix="/api/admin/stats", tags=["admin-stats"])


def get_current_admin_user(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    if current_user.role != "admin":
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


class OverviewResponse(BaseModel):
    total_sales: float
    order_count: int
    avg_order_value: float
    user_count: int


class TrendItem(BaseModel):
    date: str
    sales: float
    orders: int


class TrendResponse(BaseModel):
    labels: list
    sales: list
    orders: list


class ProductStatItem(BaseModel):
    product_id: int
    product_name: str
    sales_count: int
    sales_amount: float


class ProductsResponse(BaseModel):
    items: list


@router.get("/overview", response_model=OverviewResponse)
def get_overview(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    query = db.query(Order)

    if start_date:
        query = query.filter(Order.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Order.created_at <= datetime.fromisoformat(end_date))

    orders = query.all()
    total_sales = sum(float(o.total_amount) for o in orders)
    order_count = len(orders)
    avg_order_value = total_sales / order_count if order_count > 0 else 0

    # 新增用户数
    user_query = db.query(User)
    if start_date:
        user_query = user_query.filter(User.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        user_query = user_query.filter(User.created_at <= datetime.fromisoformat(end_date))
    user_count = user_query.count()

    return OverviewResponse(
        total_sales=total_sales,
        order_count=order_count,
        avg_order_value=avg_order_value,
        user_count=user_count
    )


@router.get("/trend", response_model=TrendResponse)
def get_trend(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    group_by: str = Query("day", regex="^(day|week|month)$"),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    query = db.query(Order)

    if start_date:
        query = query.filter(Order.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Order.created_at <= datetime.fromisoformat(end_date))

    orders = query.all()

    # 按日期分组
    trend_dict = {}
    for order in orders:
        if group_by == "day":
            key = order.created_at.strftime("%Y-%m-%d")
        elif group_by == "week":
            key = order.created_at.strftime("%Y-W%W")
        else:  # month
            key = order.created_at.strftime("%Y-%m")

        if key not in trend_dict:
            trend_dict[key] = {"sales": 0, "orders": 0}
        trend_dict[key]["sales"] += float(order.total_amount)
        trend_dict[key]["orders"] += 1

    # 排序
    sorted_keys = sorted(trend_dict.keys())

    return TrendResponse(
        labels=sorted_keys,
        sales=[trend_dict[k]["sales"] for k in sorted_keys],
        orders=[trend_dict[k]["orders"] for k in sorted_keys]
    )


@router.get("/products", response_model=ProductsResponse)
def get_product_stats(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    # 查询订单项
    query = db.query(
        OrderItem.product_id,
        OrderItem.product_name,
        func.sum(OrderItem.quantity).label("sales_count"),
        func.sum(OrderItem.subtotal).label("sales_amount")
    ).join(Order).filter(Order.status.in_(["completed", "shipped"]))

    if start_date:
        query = query.filter(Order.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Order.created_at <= datetime.fromisoformat(end_date))

    results = query.group_by(OrderItem.product_id, OrderItem.product_name).order_by(
        func.sum(OrderItem.quantity).desc()
    ).limit(limit).all()

    items = [
        ProductStatItem(
            product_id=r.product_id,
            product_name=r.product_name,
            sales_count=r.sales_count or 0,
            sales_amount=float(r.sales_amount or 0)
        )
        for r in results
    ]

    return ProductsResponse(items=items)
```

**Step 2: 注册路由**

```python
# backend/app/api/router.py
from app.api.endpoints.admin_stats import router as admin_stats_router
api_router.include_router(admin_stats_router)
```

**Step 3: 提交**

```bash
git add backend/app/api/endpoints/admin_stats.py backend/app/api/router.py
git commit -m "feat: add admin stats API"
```

---

## Phase 2: Web 端页面

### Task 4: 创建用户管理页面

**Files:**
- Create: `web/src/app/admin/users/page.tsx`

**Step 1: 创建用户列表页面**

```typescript
// web/src/app/admin/users/page.tsx
'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    try {
      const params = search ? { search } : {};
      const response = await api.get('/api/admin/users', { params });
      setUsers(response.data.items);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  if (loading) return <div>加载中...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">用户管理</h1>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              placeholder="搜索用户名或邮箱"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">
              搜索
            </button>
          </form>
        </div>

        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">用户名</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">邮箱</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">角色</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">注册时间</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="px-4 py-3">{user.id}</td>
                <td className="px-4 py-3">{user.username}</td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                    {user.role === 'admin' ? '管理员' : '用户'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

**Step 2: 添加到导航**

```typescript
// web/src/app/admin/layout.tsx - 添加导航项
{ href: '/admin/users', label: '用户管理' },
```

**Step 3: 提交**

```bash
git add web/src/app/admin/users/
git commit -m "feat: add users management page"
```

---

### Task 5: 创建植物百科管理页面

**Files:**
- Create: `web/src/app/admin/plants/page.tsx`

**Step 1: 创建植物管理页面**

```typescript
// web/src/app/admin/plants/page.tsx
'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Plant {
  id: number;
  name: string;
  scientific_name?: string;
  category?: string;
  care_level: number;
  description?: string;
}

export default function AdminPlantsPage() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);

  const fetchPlants = async () => {
    try {
      const params = search ? { search } : {};
      const response = await api.get('/api/admin/plants', { params });
      setPlants(response.data.items);
    } catch (error) {
      console.error('Failed to fetch plants:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlants();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除该植物吗？')) return;
    try {
      await api.delete(`/api/admin/plants/${id}`);
      fetchPlants();
    } catch (error) {
      console.error('Failed to delete plant:', error);
    }
  };

  const handleSave = async (plant: Partial<Plant>) => {
    try {
      if (plant.id) {
        await api.put(`/api/admin/plants/${plant.id}`, plant);
      } else {
        await api.post('/api/admin/plants', plant);
      }
      setShowForm(false);
      setEditingPlant(null);
      fetchPlants();
    } catch (error) {
      console.error('Failed to save plant:', error);
    }
  };

  if (loading) return <div>加载中...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">植物百科管理</h1>
        <button
          onClick={() => { setEditingPlant(null); setShowForm(true); }}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          添加植物
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">名称</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">学名</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">分类</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">养护难度</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {plants.map((plant) => (
              <tr key={plant.id} className="border-t">
                <td className="px-4 py-3">{plant.id}</td>
                <td className="px-4 py-3">{plant.name}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{plant.scientific_name || '-'}</td>
                <td className="px-4 py-3">{plant.category || '-'}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                    {plant.care_level} 级
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditingPlant(plant); setShowForm(true); }}
                      className="text-blue-500 hover:underline text-sm"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(plant.id)}
                      className="text-red-500 hover:underline text-sm"
                    >
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <PlantForm
          plant={editingPlant}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingPlant(null); }}
        />
      )}
    </div>
  );
}

function PlantForm({ plant, onSave, onClose }: { plant?: Plant | null; onSave: (p: any) => void; onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: plant?.name || '',
    scientific_name: plant?.scientific_name || '',
    category: plant?.category || '',
    care_level: plant?.care_level || 1,
    description: plant?.description || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(plant?.id ? { ...formData, id: plant.id } : formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[500px] max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{plant?.id ? '编辑植物' : '添加植物'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">名称</label>
            <input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">学名</label>
            <input
              value={formData.scientific_name}
              onChange={(e) => setFormData({ ...formData, scientific_name: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">分类</label>
              <input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">养护难度 (1-5)</label>
              <input
                type="number"
                min="1"
                max="5"
                value={formData.care_level}
                onChange={(e) => setFormData({ ...formData, care_level: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded">取消</button>
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">保存</button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

**Step 2: 添加到导航**

```typescript
// web/src/app/admin/layout.tsx
{ href: '/admin/plants', label: '植物管理' },
```

**Step 3: 提交**

```bash
git add web/src/app/admin/plants/
git commit -m "feat: add plants management page"
```

---

### Task 6: 创建数据统计页面

**Files:**
- Create: `web/src/app/admin/stats/page.tsx`

**Step 1: 创建数据统计页面**

```typescript
// web/src/app/admin/stats/page.tsx
'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function StatsPage() {
  const [overview, setOverview] = useState({
    total_sales: 0,
    order_count: 0,
    avg_order_value: 0,
    user_count: 0,
  });
  const [trend, setTrend] = useState({ labels: [], sales: [], orders: [] });
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [groupBy, setGroupBy] = useState('day');

  const fetchData = async () => {
    try {
      const params: any = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = end_date;

      const [overviewRes, trendRes, productsRes] = await Promise.all([
        api.get('/api/admin/stats/overview', { params }),
        api.get('/api/admin/stats/trend', { params: { ...params, group_by: groupBy } }),
        api.get('/api/admin/stats/products', { params }),
      ]);

      setOverview(overviewRes.data);
      setTrend(trendRes.data);
      setProducts(productsRes.data.items);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, end_date, groupBy]);

  if (loading) return <div>加载中...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">数据统计</h1>

      {/* 日期选择 */}
      <div className="bg-white rounded-lg p-4 mb-6">
        <div className="flex gap-4 items-center">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border rounded-md"
          />
          <span className="text-gray-500">至</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border rounded-md"
          />
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="day">按天</option>
            <option value="week">按周</option>
            <option value="month">按月</option>
          </select>
        </div>
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-6 shadow">
          <div className="text-sm text-gray-500">销售总额</div>
          <div className="text-2xl font-bold text-green-600">¥{overview.total_sales.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow">
          <div className="text-sm text-gray-500">订单数量</div>
          <div className="text-2xl font-bold text-blue-600">{overview.order_count}</div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow">
          <div className="text-sm text-gray-500">客单价</div>
          <div className="text-2xl font-bold text-purple-600">¥{overview.avg_order_value.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow">
          <div className="text-sm text-gray-500">新增用户</div>
          <div className="text-2xl font-bold text-orange-600">{overview.user_count}</div>
        </div>
      </div>

      {/* 趋势图 */}
      <div className="bg-white rounded-lg p-6 shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">销售趋势</h2>
        <div className="h-64 flex items-end gap-1">
          {trend.labels.map((label: string, index: number) => {
            const maxSales = Math.max(...trend.sales, 1);
            const height = (trend.sales[index] / maxSales) * 200;
            return (
              <div key={label} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-blue-500 rounded-t"
                  style={{ height: `${height}px` }}
                  title={`¥${trend.sales[index]}`}
                />
                <div className="text-xs text-gray-500 mt-1 rotate-45">{label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 热门商品 */}
      <div className="bg-white rounded-lg p-6 shadow">
        <h2 className="text-lg font-semibold mb-4">热门商品</h2>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">排名</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">商品名称</th>
              <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">销量</th>
              <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">销售额</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <tr key={product.product_id} className="border-t">
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded text-xs ${index < 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100'}`}>
                    {index + 1}
                  </span>
                </td>
                <td className="px-4 py-2">{product.product_name}</td>
                <td className="px-4 py-2 text-right">{product.sales_count}</td>
                <td className="px-4 py-2 text-right">¥{product.sales_amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

**Step 2: 添加到导航**

```typescript
// web/src/app/admin/layout.tsx
{ href: '/admin/stats', label: '数据统计' },
```

**Step 3: 提交**

```bash
git add web/src/app/admin/stats/
git commit -m "feat: add stats page"
```

---

## 实施顺序

1. **Task 1**: 用户管理 API
2. **Task 2**: 植物百科管理 API
3. **Task 3**: 数据统计 API
4. **Task 4**: 用户管理页面
5. **Task 5**: 植物百科管理页面
6. **Task 6**: 数据统计页面

---

## Plan complete

Plan complete and saved to `docs/plans/2026-03-10-admin-extended-features-implementation.md`.

**Two execution options:**

1. **Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

2. **Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
