# 植物图片显示功能设计

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:writing-plans to implement this plan task-by-task.

**Goal:** 百科页面和首页今日推荐的植物卡片显示真实植物图片，优先使用网络图片URL，无法访问时使用本地图标

**Architecture:**
- 后端：在 Plant 模型相关的 API 中添加图片 URL 处理逻辑
- 前端：百科页面和首页推荐区域加载并显示植物图片，失败时 Fallback 到本地图标
- 图片优先级：网络图片 URL > 本地占位图

**Tech Stack:** React Native (Expo), FastAPI, PostgreSQL

---

## 1. 后端设计

### 1.1 图片 URL 获取策略

在 `backend/app/api/endpoints/plants.py` 中添加辅助函数：

```python
def get_plant_image_url(plant: Plant) -> str | None:
    """获取植物图片URL"""
    # 优先使用数据库中存储的网络图片
    if plant.image_url:
        return plant.image_url

    # 可选：根据植物名称构造 Unsplash URL
    # return f"https://source.unsplash.com/featured/?plant,{plant.name}"

    return None
```

### 1.2 API 响应处理

修改以下 API 的返回数据，添加图片 URL：
- `GET /api/plants` - 植物列表
- `GET /api/plants/popular` - 热门植物
- `GET /api/plants/{plant_id}` - 植物详情

---

## 2. 前端设计

### 2.1 百科页面 (EncyclopediaScreen)

- 植物卡片使用 `Image` 组件显示 `plant.image_url`
- 设置 `onError` 事件：图片加载失败时显示占位图标

```tsx
<Image
  source={{ uri: plant.image_url }}
  style={styles.plantImage}
  onError={() => setImageError(true)}
/>
{imageError && <Icons.Plant size={40} color={plantColor} />}
```

### 2.2 首页今日推荐 (IdentifyScreen)

- 同样使用 `Image` 组件显示推荐植物图片
- Fallback 到本地图标

### 2.3 图片缓存策略

- 使用 React Native 的 `Image` 组件自带缓存
- 可选：添加占位图状态（加载中显示骨架屏）

---

## 3. 数据流

```
数据库 (Plant.image_url)
    ↓
后端 API (/api/plants, /api/plants/popular)
    ↓
前端获取数据 (getPlants, getPopularPlants)
    ↓
卡片渲染 (Image component)
    ↓
加载成功 → 显示图片
加载失败 → Fallback 到 Icons.Plant
```

---

## 4. 测试要点

1. 数据库有图片 URL 的植物正常显示
2. 无图片 URL 时显示本地图标
3. 网络图片加载失败时正确 Fallback
4. 百科页面和首页推荐都能正常显示