# 新手推荐页面与植物百科完善 - 设计文档

**版本**: 1.1
**日期**: 2026-03-12
**状态**: 待审批

## 更新日志

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| 1.0 | 2026-03-12 | 初始版本：新手推荐功能设计 |
| 1.1 | 2026-03-12 | 新增：植物百科APP端对接后端API |

---

## 1. 背景与目标

### 1.1 项目背景

护花使者APP的新手推荐功能目前存在以下问题：
- 问题数量较少（仅3个），无法充分了解用户需求
- 推荐结果为静态数据，未根据用户回答动态计算
- "添加到花园"按钮无实际功能
- 后端无植物基础数据，需支持YOLO模型识别的47种植物

### 1.2 目标

1. 扩展问题数量（3题→5题），更精准了解用户需求
2. 实现后端智能推荐算法，根据用户答案动态计算推荐
3. 实现"添加到花园"功能（本地+后端API）
4. 初始化47种植物基础数据到数据库
5. 支持管理员在Web端编辑植物数据

---

## 2. 功能架构

```
┌─────────────────────────────────────────────────────────────┐
│                         APP 端                                │
├─────────────────────────────────────────────────────────────┤
│  用户回答问题 ──> 提交答案 ──>  后端推荐API  ──>  展示推荐  │
│         │                                    │              │
│         │                                    ▼              │
│         │                          显示植物列表 + 详情        │
│         │                                    │              │
│         ▼                                    ▼              │
│  扩展问题 (5题)                    添加到花园               │
│  - 光照条件                              │                  │
│  - 浇水频率                              │                  │
│  - 养植目的                         本地存储                  │
│  - 是否有小孩/宠物                  POST /api/plants/my    │
│  - 经验水平                                                │
└─────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend                                │
├─────────────────────────────────────────────────────────────┤
│  新增 API:                                                    │
│  - POST /api/recommend     根据用户答案返回推荐植物          │
│                                                                 │
│  扩展功能:                                                    │
│  - Plant 模型增加推荐相关字段                                  │
│  - 数据初始化脚本（47种植物）                                 │
│  - 管理员Web端植物管理                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 后端设计

### 3.1 数据模型扩展

#### Plant 表扩展

```python
# backend/app/models/plant.py

class Plant(Base):
    __tablename__ = "plants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    scientific_name = Column(String(150))          # 拉丁学名
    category = Column(String(50))                  # 类别：室内/开花/多肉/草本
    yolo_class_id = Column(Integer, unique=True)   # YOLO模型类别ID (0-46)

    care_level = Column(Integer, default=1)       # 养护难度 1-5
    beginner_friendly = Column(Integer, default=3) # 新手友好度 1-5

    light_requirement = Column(String(20))         # 光照需求: full/partial/low
    water_requirement = Column(String(20))          # 浇水频率: frequent/weekly/biweekly/monthly
    watering_tip = Column(String(100))              # 浇水提示

    temperature_range = Column(String(50))          # 适宜温度
    humidity_range = Column(String(50))             # 适宜湿度
    is_toxic = Column(Boolean, default=False)      # 是否有毒（对宠物/小孩）

    description = Column(Text)                       # 描述
    care_tips = Column(Text)                        # 养护技巧
    features = Column(JSON)                          # 特点标签: ["净化空气", "耐阴"]

    survival_rate = Column(Integer, default=90)     # 存活率

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

#### UserPlant 表扩展

```python
class UserPlant(Base):
    __tablename__ = "user_plants"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    plant_id = Column(Integer, ForeignKey("plants.id"))      # 关联基础植物表

    nickname = Column(String(50))                             # 用户给植物起的名字
    image_url = Column(String(255))                           # 用户上传的图片
    location = Column(String(50))                             # 摆放位置
    acquired_from = Column(String(50))                        # 来源: recommendation/garden/manual
    notes = Column(Text)                                     # 备注

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="user_plants")
    plant = relationship("Plant")
```

### 3.2 API 设计

#### 3.2.1 推荐接口

```
POST /api/recommend

请求体:
{
    "light": "full" | "partial" | "low",
    "watering": "frequent" | "weekly" | "biweekly" | "monthly",
    "purpose": "air-purify" | "decoration" | "hobby",
    "has_pets_kids": boolean,
    "experience": "beginner" | "intermediate" | "expert"
}

响应:
{
    "recommendations": [
        {
            "plant_id": 35,
            "name": "绿萝",
            "match_score": 95,
            "reason": "非常适合新手，光线弱也能存活",
            "survival_rate": 98,
            "features": ["净化空气", "耐阴", "易养护"],
            "light_requirement": "low",
            "water_requirement": "weekly",
            "care_level": 1,
            "is_toxic": false
        },
        ...
    ]
}
```

#### 3.2.2 植物列表接口（扩展）

```
GET /api/plants

参数:
- category: 类别筛选
- care_level: 养护难度筛选
- beginner_friendly: 新手友好度筛选
- light: 光照需求筛选
- search: 名称搜索
- skip, limit: 分页

响应: (现有接口扩展)
```

#### 3.2.3 添加到花园接口（扩展）

```
POST /api/plants/my

请求体:
{
    "plant_id": 35,              # 必填，关联基础植物
    "nickname": "我的绿萝",       # 可选
    "location": "客厅",           # 可选
    "acquired_from": "recommendation"  # 来源标记
}

响应: UserPlantResponse
```

### 3.3 推荐算法

#### 评分规则

| 匹配维度 | 权重 | 说明 |
|----------|------|------|
| 光照匹配 | 30% | 用户光照 vs 植物需求 |
| 浇水匹配 | 25% | 用户浇水频率 vs 植物需求 |
| 经验匹配 | 20% | 用户经验 vs 植物难度 |
| 目的匹配 | 15% | 植物特点是否满足用户目的 |
| 安全性 | 10% | 有小孩/宠物时排除有毒植物 |

#### 光照映射

| 用户选择 | 对应值 | 匹配的植物光照 |
|----------|--------|----------------|
| 充足 | full | full, partial |
| 一般 | partial | full, partial, low |
| 较弱 | low | partial, low |

#### 浇水频率映射

| 用户选择 | 对应值 | 匹配的植物浇水 |
|----------|--------|----------------|
| 经常忘记 | monthly | monthly, biweekly |
| 一周一次 | weekly | weekly, biweekly, monthly |
| 想起来就浇 | frequent | frequent, weekly |

### 3.4 数据初始化

#### 47种植物基础数据

| YOLO ID | 名称 | 光照 | 浇水 | 难度 | 友好度 | 毒性 |
|---------|------|------|------|------|--------|------|
| 0 | 非洲紫罗兰 | partial | weekly | 2 | 4 | 无 |
| 1 | 芦荟 | full | biweekly | 1 | 5 | 有毒 |
| 2 | 红掌 | partial | weekly | 2 | 3 | 有毒 |
| 3 | 散尾葵 | partial | weekly | 2 | 4 | 无 |
| 4 | 文竹 | partial | weekly | 2 | 4 | 无 |
| 5 | 秋海棠 | partial | weekly | 2 | 4 | 有毒 |
| 6 | 天堂鸟 | full | weekly | 3 | 3 | 无 |
| 7 | 鸟巢蕨 | low | weekly | 2 | 4 | 无 |
| 8 | 波士顿蕨 | partial | frequent | 2 | 4 | 无 |
| 9 | 竹芋 | low | weekly | 2 | 4 | 无 |
| 10 | 一叶兰 | low | biweekly | 1 | 5 | 无 |
| 11 | 金钱草 | partial | frequent | 1 | 5 | 无 |
| 12 | 万年青 | partial | weekly | 2 | 4 | 有毒 |
| 13 | 蟹爪兰 | partial | biweekly | 3 | 3 | 无 |
| 14 | 菊花 | full | weekly | 2 | 4 | 无 |
| 15 | 浪星竹芋 | low | weekly | 2 | 4 | 无 |
| 16 | 水仙 | full | weekly | 2 | 3 | 有毒 |
| 17 | 龙血树 | partial | biweekly | 2 | 4 | 无 |
| 18 | 黛粉叶 | partial | weekly | 2 | 4 | 有毒 |
| 19 | 海芋 | partial | weekly | 3 | 2 | 有毒 |
| 20 | 常春藤 | partial | weekly | 1 | 5 | 有毒 |
| 21 | 风信子 | full | weekly | 2 | 3 | 有毒 |
| 22 | 铁十字秋海棠 | partial | weekly | 2 | 4 | 无 |
| 23 | 玉树 | full | monthly | 1 | 5 | 有毒 |
| 24 | 长寿花 | full | biweekly | 1 | 4 | 无 |
| 25 | 萱草 | full | weekly | 2 | 4 | 无 |
| 26 | 铃兰 | partial | weekly | 3 | 3 | 有毒 |
| 27 | 发财树 | partial | biweekly | 2 | 4 | 无 |
| 28 | 龟背竹 | partial | weekly | 2 | 4 | 有毒 |
| 29 | 兰花 | partial | weekly | 3 | 3 | 无 |
| 30 | 棕竹 | low | weekly | 2 | 4 | 无 |
| 31 | 白掌 | partial | weekly | 1 | 5 | 有毒 |
| 32 | 一品红 | full | weekly | 2 | 3 | 有毒 |
| 33 | 红斑竹叶 | low | weekly | 2 | 4 | 无 |
| 34 | 酒瓶兰 | full | monthly | 1 | 5 | 无 |
| 35 | 绿萝 | low | weekly | 1 | 5 | 有毒 |
| 36 | 竹节秋海棠 | partial | weekly | 2 | 4 | 无 |
| 37 | 响尾蛇竹芋 | low | weekly | 2 | 4 | 无 |
| 38 | 橡皮树 | full | biweekly | 1 | 4 | 有毒 |
| 39 | 苏铁 | full | monthly | 2 | 4 | 有毒 |
| 40 | 鹅掌柴 | partial | weekly | 1 | 5 | 有毒 |
| 41 | 虎皮兰 | partial | monthly | 1 | 5 | 无 |
| 42 | 紫露草 | partial | weekly | 2 | 4 | 无 |
| 43 | 郁金香 | full | weekly | 2 | 3 | 有毒 |
| 44 | 捕蝇草 | full | frequent | 3 | 2 | 无 |
| 45 | 丝兰 | full | monthly | 1 | 5 | 有毒 |
| 46 | 金钱树 | low | biweekly | 1 | 5 | 有毒 |

#### 初始化脚本

```python
# backend/app/db/seed_plants.py

PLANT_DATA = [
    {"yolo_class_id": 0, "name": "非洲紫罗兰", "light_requirement": "partial", "water_requirement": "weekly", "care_level": 2, "beginner_friendly": 4, "is_toxic": False, ...},
    {"yolo_class_id": 1, "name": "芦荟", "light_requirement": "full", "water_requirement": "biweekly", "care_level": 1, "beginner_friendly": 5, "is_toxic": True, ...},
    # ... 47种
]

def seed_plants(db: Session):
    for plant_data in PLANT_DATA:
        existing = db.query(Plant).filter(Plant.yolo_class_id == plant_data["yolo_class_id"]).first()
        if not existing:
            db.add(Plant(**plant_data))
    db.commit()
```

---

## 4. APP端设计

### 4.1 问题扩展

| # | 问题 | 选项 |
|---|------|------|
| 1 | 你家的光照条件怎么样？ | 充足(ful), 一般(partial), 较弱(low) |
| 2 | 你多久浇一次水？ | 经常忘记(monthly), 一周一次(weekly), 想起来就浇(frequent) |
| 3 | 你养植物的目的是？ | 净化空气(air-purify), 装饰美观(decoration), 兴趣爱好(hobby) |
| 4 | 你家有小孩或宠物吗？ | 有(True), 没有(False) |
| 5 | 你有多少养植物经验？ | 新手(beginner), 养过几盆(intermediate), 老手(expert) |

### 4.2 前端服务层

```typescript
// APP/src/services/recommendService.ts

export interface RecommendRequest {
  light: 'full' | 'partial' | 'low';
  watering: 'frequent' | 'weekly' | 'biweekly' | 'monthly';
  purpose: 'air-purify' | 'decoration' | 'hobby';
  has_pets_kids: boolean;
  experience: 'beginner' | 'intermediate' | 'expert';
}

export interface PlantRecommendation {
  plant_id: number;
  name: string;
  match_score: number;
  reason: string;
  survival_rate: number;
  features: string[];
  light_requirement: string;
  water_requirement: string;
  care_level: number;
  is_toxic: boolean;
}

export const recommendService = {
  // 获取推荐
  getRecommendations: (data: RecommendRequest) =>
    api.post<{ recommendations: PlantRecommendation[] }>('/api/recommend', data),

  // 添加到花园
  addToGarden: (plantId: number, nickname?: string, location?: string) =>
    api.post('/api/plants/my', {
      plant_id: plantId,
      nickname,
      location,
      acquired_from: 'recommendation'
    }),
};
```

### 4.3 页面修改

#### 4.3.1 问题展示

- 问题数量增加到5题
- 进度条显示当前进度
- 选择选项后高亮显示

#### 4.3.2 推荐结果

- 显示匹配度评分
- 突出显示推荐原因
- 安全性提示（有毒植物警示）

#### 4.3.3 添加到花园

- 未登录：提示登录，登录后自动添加
- 已登录：调用API，添加成功后显示确认
- 添加前检查是否已添加过

---

## 5. Web端设计

### 5.1 植物管理页面

管理员可在Web端：
- 查看所有植物列表
- 编辑植物信息（光照、浇水、难度等）
- 新增植物
- 查看YOLO类别映射

### 5.2 字段编辑

| 字段 | 类型 | 说明 |
|------|------|------|
| name | 文本 | 植物名称 |
| scientific_name | 文本 | 拉丁学名 |
| category | 下拉 | 类别 |
| yolo_class_id | 数字 | YOLO类别ID |
| care_level | 星级 | 养护难度 |
| beginner_friendly | 星级 | 新手友好度 |
| light_requirement | 下拉 | 光照需求 |
| water_requirement | 下拉 | 浇水频率 |
| is_toxic | 开关 | 是否有毒 |
| description | 文本域 | 描述 |
| care_tips | 文本域 | 养护技巧 |

---

## 6. 实施计划

### Phase 1: 后端基础 (1天)
1. 扩展Plant模型
2. 扩展UserPlant模型
3. 创建数据初始化脚本

### Phase 2: API开发 (1天)
1. 开发推荐API
2. 修改添加花园API
3. 测试推荐算法

### Phase 3: APP端开发 (1天)
1. 扩展问题到5题
2. 对接推荐API
3. 实现添加到花园功能

### Phase 4: Web端 (0.5天)
1. 植物管理页面扩展
2. 字段编辑功能

### Phase 5: 测试与优化 (0.5天)
1. 端到端测试
2. 优化推荐算法
3. 修复问题

---

## 7. 风险与应对

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| 植物数据不准确 | 推荐结果不理想 | 后期根据用户反馈调整 |
| 推荐算法效果一般 | 用户不满意 | 提供"重新测试"功能 |
| 有毒植物识别 | 安全风险 | 默认排除，醒目提示 |

---

## 8. 验收标准

1. 用户完成5个问题后能看到推荐结果
2. 推荐结果根据用户回答动态计算
3. 添加到花园功能正常工作（本地+API）
4. 数据库包含47种植物基础数据
5. 管理员可在Web端编辑植物信息
6. 有毒植物对有小孩/宠物的用户默认隐藏

---

## 9. 植物百科APP端对接

### 9.1 现状分析

**当前问题：**
- 植物百科页面（EncyclopediaScreen）使用静态数据
- 植物详情页（EncyclopediaDetailScreen）使用静态mock数据
- 未对接后端 `/api/plants` 接口

### 9.2 API 接口

#### 获取植物列表

```
GET /api/plants

参数:
- category: 类别筛选 (室内/开花/多肉/草本)
- care_level: 养护难度筛选 (1-5)
- beginner_friendly: 新手友好度筛选
- search: 名称搜索
- skip, limit: 分页

响应:
{
  "total": 47,
  "items": [
    {
      "id": 35,
      "name": "绿萝",
      "scientific_name": "Epipremnum aureum",
      "category": "室内",
      "care_level": 1,
      "light_requirement": "low",
      "water_requirement": "weekly",
      "description": "绿萝是...",
      "tips": "适合放在...",
      "beginner_friendly": 5,
      "is_toxic": true,
      "survival_rate": 98
    }
  ]
}
```

#### 获取植物详情

```
GET /api/plants/{plant_id}

响应:
{
  "id": 35,
  "name": "绿萝",
  "scientific_name": "Epipremnum aureum",
  "category": "室内",
  "care_level": 1,
  "beginner_friendly": 5,
  "light_requirement": "low",
  "water_requirement": "weekly",
  "watering_tip": "保持土壤湿润，但避免积水",
  "temperature_range": "15-30°C",
  "humidity_range": "40-60%",
  "is_toxic": true,
  "description": "绿萝是天南星科...",
  "care_tips": "1. 适合放在北向窗户边\n2. 水培也很容易成活...",
  "features": ["净化空气", "耐阴", "易养护"],
  "survival_rate": 98,
  "common_mistakes": "浇水过多会导致烂根"
}
```

### 9.3 APP端服务层

```typescript
// APP/src/services/plantService.ts

import axios from 'axios';

const API_URL = 'http://192.168.1.100:8000';

const api = axios.create({
  baseURL: API_URL,
});

// 植物类型
export interface Plant {
  id: number;
  name: string;
  scientific_name?: string;
  category?: string;
  care_level: number;
  beginner_friendly?: number;
  light_requirement?: string;
  water_requirement?: string;
  watering_tip?: string;
  temperature_range?: string;
  humidity_range?: string;
  is_toxic?: boolean;
  description?: string;
  care_tips?: string;
  features?: string[];
  survival_rate?: number;
}

// 植物列表响应
export interface PlantListResponse {
  total: number;
  items: Plant[];
}

// 获取植物列表
export const getPlants = async (params?: {
  category?: string;
  care_level?: number;
  beginner_friendly?: number;
  search?: string;
  skip?: number;
  limit?: number;
}): Promise<PlantListResponse> => {
  const response = await api.get('/api/plants', { params });
  return response.data;
};

// 获取植物详情
export const getPlantDetail = async (plantId: number): Promise<Plant> => {
  const response = await api.get(`/api/plants/${plantId}`);
  return response.data;
};
```

### 9.4 页面修改

#### 9.4.1 EncyclopediaScreen 修改

1. **加载时获取数据**：
   - 调用 `getPlants()` 获取植物列表
   - 支持分类筛选、难度筛选、搜索

2. **展示逻辑**：
   - 分类数据从API获取
   - 热门植物从API获取

3. **交互**：
   - 点击植物卡片传递 `plantId` 到详情页

#### 9.4.2 EncyclopediaDetailScreen 修改

1. **加载时获取数据**：
   - 从Navigation参数获取 `plantId`
   - 调用 `getPlantDetail(plantId)` 获取详情

2. **展示逻辑**：
   - 所有植物信息从API获取
   - 养护要求、安全提示等字段动态展示

3. **交互**：
   - "添加到我的花园"按钮调用 `addToGarden` API

### 9.5 实施任务

| 任务 | 说明 |
|------|------|
| 创建 plantService.ts | 封装植物相关API |
| 修改 EncyclopediaScreen | 对接获取植物列表API |
| 修改 EncyclopediaDetailScreen | 对接获取植物详情API |
| 实现添加到花园功能 | 调用 POST /api/plants/my |

### 9.6 数据映射

| 后端字段 | 页面展示 |
|----------|----------|
| name | 植物名称 |
| scientific_name | 拉丁学名 |
| category | 分类标签 |
| care_level | 难度等级 |
| beginner_friendly | 新手友好度 |
| light_requirement | 光照要求 |
| water_requirement | 浇水要求 |
| watering_tip | 浇水提示 |
| temperature_range | 适宜温度 |
| humidity_range | 适宜湿度 |
| is_toxic | 毒性提示 |
| description | 简介 |
| care_tips | 养护小贴士 |
| features | 特点标签 |
| survival_rate | 存活率 |
