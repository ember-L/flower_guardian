# 植物图片显示功能实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 百科页面和首页今日推荐的植物卡片显示真实植物图片，优先使用网络图片URL，无法访问时使用本地图标

**Architecture:**
- 后端：在 API 返回植物数据时确保包含图片 URL（优先网络图片，数据库无则构造）
- 前端：百科页面和首页推荐加载显示植物图片，失败时 Fallback 到本地图标

**Tech Stack:** React Native (Expo), FastAPI, PostgreSQL

---

## Task 1: 检查后端 Plant 模型和 API 响应

**Files:**
- Modify: `backend/app/models/plant.py:14`
- Modify: `backend/app/api/endpoints/plants.py:83-94`

**Step 1: 检查 Plant 模型**

确认 Plant 模型已有 `image_url` 字段：

```python
# backend/app/models/plant.py:14
image_url = Column(String(500))  # 植物图片URL
```

**Step 2: 检查热门植物 API 返回**

```python
# backend/app/api/endpoints/plants.py:83-94
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

**Step 3: 验证数据返回包含 image_url**

确认 API 响应已包含 `image_url` 字段（SQLAlchemy 会自动序列化所有列）。

---

## Task 2: 为数据库植物添加网络图片 URL

**Files:**
- Modify: `backend/app/api/endpoints/plants.py`
- Database: 添加图片 URL 数据

**Step 1: 添加图片 URL 映射函数**

在 `plants.py` 顶部添加：

```python
# 植物图片 URL 映射（网络图片优先，数据库无数据时使用）
PLANT_IMAGE_URLS = {
    "绿萝": "https://images.unsplash.com/photo-1598880940080-ff9a29891b85?w=400",
    "吊兰": "https://images.unsplash.com/photo-1598880940080-ff9a29891b85?w=400",
    "龟背竹": "https://images.unsplash.com/photo-1598880940080-ff9a29891b85?w=400",
    "发财树": "https://images.unsplash.com/photo-1598880940080-ff9a29891b85?w=400",
    "虎皮兰": "https://images.unsplash.com/photo-1598880940080-ff9a29891b85?w=400",
    "芦荟": "https://images.unsplash.com/photo-1598880940080-ff9a29891b85?w=400",
    "文竹": "https://images.unsplash.com/photo-1598880940080-ff9a29891b85?w=400",
    "非洲紫罗兰": "https://images.unsplash.com/photo-1598880940080-ff9a29891b85?w=400",
    "红掌": "https://images.unsplash.com/photo-1598880940080-ff9a29891b85?w=400",
    "散尾葵": "https://images.unsplash.com/photo-1598880940080-ff9a29891b85?w=400",
    "秋海棠": "https://images.unsplash.com/photo-1598880940080-ff9a29891b85?w=400",
    "天堂鸟": "https://images.unsplash.com/photo-1598880940080-ff9a29891b85?w=400",
    "鸟巢蕨": "https://images.unsplash.com/photo-1598880940080-ff9a29891b85?w=400",
    "波士顿蕨": "https://images.unsplash.com/photo-1598880940080-ff9a29891b85?w=400",
    "竹芋": "https://images.unsplash.com/photo-1598880940080-ff9a29891b85?w=400",
}
```

**Step 2: 修改热门植物 API 添加图片**

```python
@router.get("/popular")
def get_popular_plants(
    limit: int = Query(10, ge=1, le=20),
    db: Session = Depends(get_db)
):
    """获取热门植物列表"""
    plants = db.query(Plant).order_by(
        Plant.survival_rate.desc(),
        Plant.beginner_friendly.desc()
    ).limit(limit).all()

    # 为每个植物添加图片 URL
    result = []
    for plant in plants:
        plant_dict = {
            "id": plant.id,
            "name": plant.name,
            "image_url": plant.image_url or PLANT_IMAGE_URLS.get(plant.name),
            # ... 其他字段
        }
        result.append(plant_dict)

    return {"items": result}
```

**Step 3: 同样修改植物列表 API**

修改 `GET /api/plants` 端点，确保返回数据包含图片 URL。

---

## Task 3: 修改百科页面显示植物图片

**Files:**
- Modify: `APP/src/screens/EncyclopediaScreen.tsx:282-330`

**Step 1: 查看当前植物卡片渲染**

```tsx
// 当前代码 (line 282-330)
<View style={styles.plantImageContainer}>
  {plant.image_url ? (
    <Image source={{ uri: plant.image_url }} style={styles.plantImage} />
  ) : (
    <View style={styles.plantImagePlaceholder}>
      <Icons.Plant size={40} color={plantColor} />
    </View>
  )}
</View>
```

**Step 2: 添加图片加载失败状态**

修改为：

```tsx
const [imageError, setImageError] = useState(false);

<View style={styles.plantImageContainer}>
  {plant.image_url && !imageError ? (
    <Image
      source={{ uri: plant.image_url }}
      style={styles.plantImage}
      onError={() => setImageError(true)}
    />
  ) : (
    <View style={styles.plantImagePlaceholder}>
      <Icons.Plant size={40} color={plantColor} />
    </View>
  )}
</View>
```

需要在组件中添加 `useState` 状态。

---

## Task 4: 修改首页今日推荐显示植物图片

**Files:**
- Modify: `APP/src/screens/IdentifyScreen.tsx:642-670`

**Step 1: 查看当前推荐卡片渲染**

```tsx
// 当前代码 (line 658-660)
<View style={[styles.recommendImage, { backgroundColor: plantColor + '20' }]}>
  <Icons.Plant size={40} color={plantColor} />
</View>
```

**Step 2: 修改为显示图片**

```tsx
const [imageError, setImageError] = useState(false);

<View style={[styles.recommendImage, { backgroundColor: plantColor + '20' }]}>
  {plant.image_url && !imageError ? (
    <Image
      source={{ uri: plant.image_url }}
      style={styles.recommendImageInner}
      onError={() => setImageError(true)}
    />
  ) : (
    <Icons.Plant size={40} color={plantColor} />
  )}
</View>
```

**Step 3: 添加 Image 组件导入**

确保已导入 `Image` 组件。

---

## Task 5: 测试验证

**Step 1: 启动后端**

```bash
cd backend && uvicorn app.main:app --reload
```

**Step 2: 测试 API**

```bash
curl "http://localhost:8000/api/plants/popular?limit=8"
```

验证返回数据包含 `image_url` 字段。

**Step 3: 测试前端**

启动 React Native 开发服务器，重启应用，检查百科页面和首页推荐是否显示图片。

---

## 执行选项

**Plan complete and saved to `docs/plans/2026-03-31-plant-images-design.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**