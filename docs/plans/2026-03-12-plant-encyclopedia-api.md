# 植物百科 API 扩展实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为植物百科页面添加3个后端接口，完善前端数据展示

**Architecture:** 在现有的 plants.py 中添加 3 个新接口，使用 SQLAlchemy 查询数据库，返回标准化的 JSON 响应

**Tech Stack:** FastAPI, SQLAlchemy, Python

---

## 接口设计

### 1. 分类列表接口
- **路由**: `GET /api/plants/categories`
- **功能**: 返回所有植物分类及每类数量

### 2. 热门植物接口
- **路由**: `GET /api/plants/popular?limit=10`
- **功能**: 返回热门/推荐植物，按存活率和新手友好度排序

### 3. 相关植物接口
- **路由**: `GET /api/plants/{plant_id}/related?limit=5`
- **功能**: 返回同类别其他植物

---

## 实施任务

### Task 1: 添加分类列表接口

**Files:**
- Modify: `backend/app/api/endpoints/plants.py:1-15` (添加 import)
- Modify: `backend/app/api/endpoints/plants.py` (添加 categories 路由)

**Step 1: 添加 import**

```python
from sqlalchemy import func
```

**Step 2: 在 plants.py 末尾添加新路由**

```python
@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    """获取植物分类列表及数量"""
    categories = db.query(
        Plant.category,
        func.count(Plant.id).label("count")
    ).group_by(Plant.category).all()

    category_map = {
        "室内": {"name": "观叶植物", "icon": "leaf"},
        "多肉": {"name": "多肉植物", "icon": "sprout"},
        "开花": {"name": "开花植物", "icon": "flower2"},
        "草本": {"name": "草本植物", "icon": "tree"},
    }

    result = []
    for cat, count in categories:
        info = category_map.get(cat, {"name": cat, "icon": "leaf"})
        result.append({
            "value": cat,
            "name": info["name"],
            "icon": info["icon"],
            "count": count
        })

    return {"categories": result}
```

**Step 3: 测试接口**

```bash
curl http://localhost:8000/api/plants/categories
```

预期返回：
```json
{"categories":[{"value":"室内","name":"观叶植物","icon":"leaf","count":20},...]}
```

**Step 4: 提交**
```bash
git add backend/app/api/endpoints/plants.py
git commit -m "feat: add plant categories API"
```

---

### Task 2: 添加热门植物接口

**Files:**
- Modify: `backend/app/api/endpoints/plants.py` (添加 popular 路由)

**Step 1: 在 categories 路由后添加**

```python
@router.get("/popular")
def get_popular_plants(
    limit: int = Query(10, ge=1, le=20),
    db: Session = Depends(get_db)
):
    """获取热门植物列表，按存活率和新手友好度排序"""
    plants = db.query(Plant).order_by(
        Plant.survival_rate.desc(),
        Plant.beginner_friendly.desc()
    ).limit(limit).all()

    return {"items": plants}
```

**Step 2: 测试接口**

```bash
curl "http://localhost:8000/api/plants/popular?limit=5"
```

**Step 3: 提交**
```bash
git add backend/app/api/endpoints/plants.py
git commit -m "feat: add popular plants API"
```

---

### Task 3: 添加相关植物接口

**Files:**
- Modify: `backend/app/api/endpoints/plants.py` (添加 related 路由)

**Step 1: 在 popular 路由后添加**

```python
@router.get("/{plant_id}/related")
def get_related_plants(
    plant_id: int,
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db)
):
    """获取相关植物推荐（同一类别）"""
    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    related = db.query(Plant).filter(
        Plant.category == plant.category,
        Plant.id != plant_id
    ).limit(limit).all()

    return {"items": related}
```

**Step 2: 测试接口**

```bash
curl http://localhost:8000/api/plants/1/related
```

**Step 3: 提交**
```bash
git add backend/app/api/endpoints/plants.py
git commit -m "feat: add related plants API"
```

---

### Task 4: 更新前端服务（可选）

**Files:**
- Modify: `APP/src/services/plantService.ts` (添加新接口调用)

**Step 1: 添加新函数**

```typescript
// 获取分类列表
export const getPlantCategories = async () => {
  const response = await api.get('/api/plants/categories');
  return response.data;
};

// 获取热门植物
export const getPopularPlants = async (limit = 10) => {
  const response = await api.get('/api/plants/popular', { params: { limit } });
  return response.data;
};

// 获取相关植物
export const getRelatedPlants = async (plantId: number, limit = 5) => {
  const response = await api.get(`/api/plants/${plantId}/related`, { params: { limit } });
  return response.data;
};
```

**Step 2: 提交**
```bash
git add APP/src/services/plantService.ts
git commit -m "feat: add plant encyclopedia API calls"
```

---

## 验证步骤

完成所有任务后，运行以下测试：

```bash
# 1. 启动后端
cd backend && uvicorn app.main:app --reload

# 2. 测试分类接口
curl http://localhost:8000/api/plants/categories

# 3. 测试热门接口
curl "http://localhost:8000/api/plants/popular?limit=5"

# 4. 测试相关植物接口
curl http://localhost:8000/api/plants/1/related
```

---

## 预期结果

| 接口 | 状态码 | 返回格式 |
|------|--------|----------|
| GET /api/plants/categories | 200 | {"categories": [...]} |
| GET /api/plants/popular | 200 | {"items": [...]} |
| GET /api/plants/{id}/related | 200 | {"items": [...]} |
| GET /api/plants/{id}/related (invalid id) | 404 | {"detail": "Plant not found"} |
