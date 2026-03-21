# 我的花园页面完善设计

**日期**: 2026-03-17

## 需求概述

完善 APP 端"我的花园"页面，实现：
1. 数据对接后端 API（读写用户植物数据）
2. 添加养护记录、生长追踪、健康记录、位置管理功能

## 整体架构

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   GardenScreen │────▶│   plantService  │────▶│  Backend API   │
│   (UI层)       │◀────│   (数据层)      │◀────│  /api/plants/* │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## 核心功能设计

### 1. 植物卡片增强
- 显示位置标签（可点击筛选）
- 健康状态指示器（健康/需关注/生病）
- 下次养护操作提示（浇水/施肥/换盆）
- 快速操作按钮（已浇水/编辑/删除）

### 2. 养护记录模块
- 点击植物进入详情页
- 记录类型：浇水、施肥、换盆、修剪、杀虫
- 记录时间轴（按日期倒序）
- 预计下次养护时间自动计算

### 3. 生长追踪模块
- 记录日期
- 生长数据：高度(cm)、叶数、花苞数、状态描述
- 可选拍照（本地存储路径）

### 4. 健康记录模块
- 健康状态选择：健康/一般/生病/濒死
- 病虫害描述
- 治疗措施记录

### 5. 位置管理
- 预设位置：南阳台、北卧室、客厅、办公室、其他
- 按位置筛选植物
- 位置统计（每个位置植物数量）

## 页面结构

```
GardenScreen (我的花园)
├── Header - 标题 + 添加按钮 + 位置筛选
├── StatsBar - 统计：植物总数、需浇水、需关注
├── PlantList - 植物卡片列表
│   └── PlantCard - 植物卡片（点击进入详情）
│
PlantDetailScreen (植物详情) [新页面]
├── Header - 植物图片 + 基本信息
├── CareTab - 养护记录
│   ├── Timeline - 养护时间轴
│   └── AddCareButton - 添加记录
├── GrowthTab - 生长追踪
│   ├── GrowthChart - 生长趋势
│   └── AddGrowthButton - 添加记录
├── HealthTab - 健康记录
│   ├── HealthStatus - 当前状态
│   └── HealthHistory - 历史记录
└── Settings - 编辑/删除植物
```

## 后端 API 设计

### 新增接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/plants/my/{id}/care-records | 获取养护记录 |
| POST | /api/plants/my/{id}/care-records | 添加养护记录 |
| GET | /api/plants/my/{id}/growth-records | 获取生长记录 |
| POST | /api/plants/my/{id}/growth-records | 添加生长记录 |
| GET | /api/plants/my/{id}/health-records | 获取健康记录 |
| POST | /api/plants/my/{id}/health-records | 添加健康记录 |
| PUT | /api/plants/my/{id} | 更新植物信息 |

### 数据库模型扩展

需要新增模型：
- CareRecord - 养护记录
- GrowthRecord - 生长记录
- HealthRecord - 健康记录
