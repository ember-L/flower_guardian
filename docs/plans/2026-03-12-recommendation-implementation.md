# 新手推荐页面与植物百科完善 - 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 完善新手推荐页面功能（扩展问题、智能推荐、添加到花园），初始化47种植物数据，对接植物百科APP端到后端API

**Architecture:** 后端扩展Plant/UserPlant模型 + 推荐API + 数据初始化；APP端新增问题、对接推荐API、百科页面对接后端

**Tech Stack:** FastAPI (Python), React Native, SQLAlchemy, Axios

---

## 实施概览

| 阶段 | 任务数 | 预计时间 |
|------|--------|----------|
| Phase 1: 后端模型扩展 | 3 | 30分钟 |
| Phase 2: 后端API开发 | 4 | 45分钟 |
| Phase 3: 植物数据初始化 | 2 | 20分钟 |
| Phase 4: APP端-推荐功能 | 3 | 35分钟 |
| Phase 5: APP端-百科对接 | 3 | 35分钟 |
| Phase 6: 测试验证 | 2 | 20分钟 |

---

## Phase 1: 后端模型扩展

### Task 1: 扩展 Plant 模型

**Files:**
- Modify: `backend/app/models/plant.py:1-25`

**Step 1: 添加新字段到 Plant 模型**

```python
# backend/app/models/plant.py - 在 Plant 类中添加以下字段

# 在 care_level = Column(Integer, default=1) 后添加：
yolo_class_id = Column(Integer, unique=True, index=True)  # YOLO模型类别ID (0-46)
beginner_friendly = Column(Integer, default=3)  # 新手友好度 1-5
watering_tip = Column(String(100))  # 浇水提示
is_toxic = Column(Boolean, default=False)  # 是否有毒
features = Column(JSON)  # 特点标签: ["净化空气", "耐阴"]
survival_rate = Column(Integer, default=90)  # 存活率
updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)  # 更新时间
```

**Step 2: 保存文件**

保存修改后的 `backend/app/models/plant.py`

---

### Task 2: 扩展 UserPlant 模型

**Files:**
- Modify: `backend/app/models/plant.py:27-41`

**Step 1: 添加新字段到 UserPlant 模型**

```python
# backend/app/models/plant.py - 在 UserPlant 类中添加以下字段

# 在 user_id = Column(Integer, ForeignKey("users.id")) 后添加：
plant_id = Column(Integer, ForeignKey("plants.id"))  # 关联基础植物表
nickname = Column(String(50))  # 用户给植物起的名字
acquired_from = Column(String(50))  # 来源: recommendation/garden/manual
notes = Column(Text)  # 备注

# 添加关系
plant = relationship("Plant")
```

**Step 2: 保存文件**

保存修改后的 `backend/app/models/plant.py`

---

### Task 3: 扩展 Plant Schema

**Files:**
- Modify: `backend/app/schemas/plant.py:1-42`

**Step 1: 更新 Pydantic Schema**

```python
# backend/app/schemas/plant.py

# 更新 PlantBase
class PlantBase(BaseModel):
    name: str
    scientific_name: Optional[str] = None
    category: Optional[str] = None
    care_level: int = 1
    description: Optional[str] = None
    yolo_class_id: Optional[int] = None
    beginner_friendly: Optional[int] = 3
    light_requirement: Optional[str] = None
    water_requirement: Optional[str] = None
    watering_tip: Optional[str] = None
    temperature_range: Optional[str] = None
    humidity_range: Optional[str] = None
    is_toxic: Optional[bool] = False
    features: Optional[List[str]] = None
    survival_rate: Optional[int] = 90

# 更新 PlantResponse
class PlantResponse(PlantBase):
    id: int
    tips: Optional[str] = None
    common_mistakes: Optional[str] = None

    class Config:
        from_attributes = True

# 更新 UserPlantCreate
class UserPlantCreate(BaseModel):
    plant_name: Optional[str] = None
    plant_type: Optional[str] = None
    plant_id: Optional[int] = None  # 新增：关联基础植物
    nickname: Optional[str] = None
    image_url: Optional[str] = None
    location: Optional[str] = None
    acquired_from: Optional[str] = "manual"
    notes: Optional[str] = None

# 更新 UserPlantResponse
class UserPlantResponse(UserPlantCreate):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
```

**Step 2: 保存文件**

保存修改后的 `backend/app/schemas/plant.py`

---

## Phase 2: 后端API开发

### Task 4: 开发推荐API

**Files:**
- Create: `backend/app/api/endpoints/recommend.py`
- Modify: `backend/app/api/router.py`

**Step 1: 创建推荐API端点**

```python
# backend/app/api/endpoints/recommend.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.core.database import get_db
from app.models.plant import Plant

router = APIRouter(prefix="/api/recommend", tags=["recommend"])

# 请求模型
class RecommendRequest(BaseModel):
    light: str  # full, partial, low
    watering: str  # frequent, weekly, biweekly, monthly
    purpose: str  # air-purify, decoration, hobby
    has_pets_kids: bool
    experience: str  # beginner, intermediate, expert

# 推荐结果模型
class RecommendResponse(BaseModel):
    plant_id: int
    name: str
    match_score: int
    reason: str
    survival_rate: int
    features: List[str]
    light_requirement: str
    water_requirement: str
    care_level: int
    is_toxic: bool

# 光照映射
LIGHT_MAP = {
    "full": ["full", "partial"],
    "partial": ["full", "partial", "low"],
    "low": ["partial", "low"]
}

# 浇水映射
WATERING_MAP = {
    "frequent": ["frequent", "weekly"],
    "weekly": ["frequent", "weekly", "biweekly"],
    "biweekly": ["weekly", "biweekly", "monthly"],
    "monthly": ["biweekly", "monthly"]
}

# 难度映射
DIFFICULTY_MAP = {
    "beginner": [1, 2],
    "intermediate": [2, 3],
    "expert": [3, 4, 5]
}

# 推荐原因生成
def generate_reason(plant: Plant, light_match: bool, watering_match: bool) -> str:
    reasons = []
    if light_match:
        reasons.append(f"适合{plant.light_requirement}光照环境")
    if watering_match:
        reasons.append(f"浇水频率{plant.water_requirement}")
    if plant.beginner_friendly and plant.beginner_friendly >= 4:
        reasons.append("新手友好")
    if plant.features and "净化空气" in plant.features:
        reasons.append("净化空气")
    return "，".join(reasons) if reasons else "适合您的养护条件"

@router.post("", response_model=List[RecommendResponse])
def get_recommendations(
    request: RecommendRequest,
    db: Session = Depends(get_db)
):
    # 获取所有植物
    plants = db.query(Plant).all()

    recommendations = []
    for plant in plants:
        score = 0
        reasons = []

        # 光照匹配 (30%)
        light_match = plant.light_requirement in LIGHT_MAP.get(request.light, ["partial"])
        if light_match:
            score += 30

        # 浇水匹配 (25%)
        watering_match = plant.water_requirement in WATERING_MAP.get(request.watering, ["weekly"])
        if watering_match:
            score += 25

        # 经验匹配 (20%)
        exp_range = DIFFICULTY_MAP.get(request.experience, [1, 3])
        if plant.care_level in exp_range:
            score += 20

        # 目的匹配 (15%)
        if request.purpose == "air-purify" and plant.features:
            if "净化空气" in plant.features or plant.is_toxic == False:
                score += 15

        # 安全性匹配 (10%)
        if request.has_pets_kids and not plant.is_toxic:
            score += 10
        elif not request.has_pets_kids:
            score += 10

        # 筛选高分推荐
        if score >= 30:
            reason = generate_reason(plant, light_match, watering_match)
            recommendations.append(RecommendResponse(
                plant_id=plant.id,
                name=plant.name,
                match_score=score,
                reason=reason,
                survival_rate=plant.survival_rate or 90,
                features=plant.features or [],
                light_requirement=plant.light_requirement or "partial",
                water_requirement=plant.water_requirement or "weekly",
                care_level=plant.care_level or 1,
                is_toxic=plant.is_toxic or False
            ))

    # 按匹配度排序，返回前5个
    recommendations.sort(key=lambda x: x.match_score, reverse=True)
    return recommendations[:5]
```

**Step 2: 注册路由**

```python
# backend/app/api/router.py - 添加导入和路由

from app.api.endpoints.recommend import router as recommend_router

# 在 create_api_router 函数中添加：
router.include_router(recommend_router)
```

---

### Task 5: 扩展植物列表API

**Files:**
- Modify: `backend/app/api/endpoints/plants.py`

**Step 1: 更新植物列表API**

```python
# backend/app/api/endpoints/plants.py - 修改 list_plants 函数

@router.get("", response_model=PlantListResponse)
def list_plants(
    category: Optional[str] = None,
    care_level: Optional[int] = None,
    beginner_friendly: Optional[int] = None,
    light: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Plant)
    if category:
        query = query.filter(Plant.category == category)
    if care_level:
        query = query.filter(Plant.care_level == care_level)
    if beginner_friendly:
        query = query.filter(Plant.beginner_friendly >= beginner_friendly)
    if light:
        query = query.filter(Plant.light_requirement == light)
    if search:
        query = query.filter(Plant.name.contains(search))

    total = query.count()
    items = query.offset(skip).limit(limit).all()
    return {"total": total, "items": items}
```

**Step 2: 保存文件**

---

### Task 6: 扩展添加到花园API

**Files:**
- Modify: `backend/app/api/endpoints/plants.py`

**Step 1: 更新添加花园API**

```python
# backend/app/api/endpoints/plants.py - 修改 add_user_plant 函数

@router.post("/my", response_model=UserPlantResponse)
def add_user_plant(
    plant: UserPlantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 如果提供了 plant_id，获取植物名称
    plant_name = plant.plant_name
    if plant.plant_id:
        base_plant = db.query(Plant).filter(Plant.id == plant.plant_id).first()
        if base_plant:
            plant_name = base_plant.name

    new_user_plant = UserPlant(
        user_id=current_user.id,
        plant_name=plant_name,
        plant_type=plant.plant_type,
        plant_id=plant.plant_id,
        nickname=plant.nickname,
        image_url=plant.image_url,
        location=plant.location,
        acquired_from=plant.acquired_from or "manual",
        notes=plant.notes
    )
    db.add(new_user_plant)
    db.commit()
    db.refresh(new_user_plant)
    return new_user_plant
```

**Step 2: 保存文件**

---

### Task 7: 扩展用户植物列表API

**Files:**
- Modify: `backend/app/api/endpoints/plants.py`

**Step 1: 更新获取花园植物API**

```python
# backend/app/api/endpoints/plants.py - 添加获取详情参数

@router.get("/my", response_model=list[UserPlantResponse])
def get_my_plants(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    plants = db.query(UserPlant).filter(
        UserPlant.user_id == current_user.id
    ).offset(skip).limit(limit).all()
    return plants
```

**Step 2: 保存文件**

---

## Phase 3: 植物数据初始化

### Task 8: 创建植物数据种子脚本

**Files:**
- Create: `backend/app/db/seed_plants.py`

**Step 1: 创建种子数据脚本**

```python
# backend/app/db/seed_plants.py

from sqlalchemy.orm import Session
from app.models.plant import Plant

# 47种植物基础数据
PLANT_DATA = [
    {"yolo_class_id": 0, "name": "非洲紫罗兰", "scientific_name": "Saintpaulia ionantha", "category": "室内", "care_level": 2, "beginner_friendly": 4, "light_requirement": "partial", "water_requirement": "weekly", "watering_tip": "保持土壤湿润，避免叶片浇水", "temperature_range": "18-24°C", "humidity_range": "40-60%", "is_toxic": False, "features": ["开花", "耐阴"], "survival_rate": 85, "description": "非洲紫罗兰株型小巧，花色丰富，是非常受欢迎的室内开花植物。"},
    {"yolo_class_id": 1, "name": "芦荟", "scientific_name": "Aloe vera", "category": "多肉", "care_level": 1, "beginner_friendly": 5, "light_requirement": "full", "water_requirement": "biweekly", "watering_tip": "干透再浇，避免积水", "temperature_range": "13-27°C", "humidity_range": "30-50%", "is_toxic": True, "features": ["药用", "净化空气"], "survival_rate": 95, "description": "芦荟是多肉植物，叶片肥厚储水能力强，非常耐旱，适合新手。"},
    {"yolo_class_id": 2, "name": "红掌", "scientific_name": "Anthurium andraeanum", "category": "室内", "care_level": 2, "beginner_friendly": 3, "light_requirement": "partial", "water_requirement": "weekly", "watering_tip": "保持土壤湿润但不要积水", "temperature_range": "18-30°C", "humidity_range": "60-80%", "is_toxic": True, "features": ["开花", "净化空气"], "survival_rate": 80, "description": "红掌花姿奇特，佛焰苞红色鲜艳，是高档室内观花植物。"},
    {"yolo_class_id": 3, "name": "散尾葵", "scientific_name": "Dypsis lutescens", "category": "室内", "care_level": 2, "beginner_friendly": 4, "light_requirement": "partial", "water_requirement": "weekly", "watering_tip": "保持土壤湿润，经常喷水", "temperature_range": "20-30°C", "humidity_range": "50-70%", "is_toxic": False, "features": ["净化空气", "加湿"], "survival_rate": 85, "description": "散尾葵是常见的大型室内观叶植物，姿态优美。"},
    {"yolo_class_id": 4, "name": "文竹", "scientific_name": "Asparagus setaceus", "category": "室内", "care_level": 2, "beginner_friendly": 4, "light_requirement": "partial", "water_requirement": "weekly", "watering_tip": "保持土壤湿润，避免干旱", "temperature_range": "15-25°C", "humidity_range": "50-70%", "is_toxic": False, "features": ["净化空气", "观赏"], "survival_rate": 80, "description": "文竹枝叶纤细秀丽，姿态优雅，是著名的室内观叶植物。"},
    {"yolo_class_id": 5, "name": "秋海棠", "scientific_name": "Begonia", "category": "开花", "care_level": 2, "beginner_friendly": 4, "light_requirement": "partial", "water_requirement": "weekly", "watering_tip": "保持土壤湿润但不要积水", "temperature_range": "18-25°C", "humidity_range": "50-70%", "is_toxic": True, "features": ["开花", "观赏"], "survival_rate": 80, "description": "秋海棠花色丰富，叶形优美，是常见的室内观赏花卉。"},
    {"yolo_class_id": 6, "name": "天堂鸟", "scientific_name": "Strelitzia reginae", "category": "室内", "care_level": 3, "beginner_friendly": 3, "light_requirement": "full", "water_requirement": "weekly", "watering_tip": "生长期保持土壤湿润", "temperature_range": "20-30°C", "humidity_range": "50-70%", "is_toxic": False, "features": ["开花", "大型"], "survival_rate": 75, "description": "天堂鸟叶片硕大，花姿奇特，是高端室内观叶植物。"},
    {"yolo_class_id": 7, "name": "鸟巢蕨", "scientific_name": "Asplenium nidus", "category": "室内", "care_level": 2, "beginner_friendly": 4, "light_requirement": "low", "water_requirement": "weekly", "watering_tip": "保持土壤湿润，经常喷水", "temperature_range": "18-28°C", "humidity_range": "60-80%", "is_toxic": False, "features": ["净化空气", "耐阴"], "survival_rate": 85, "description": "鸟巢蕨叶片呈放射状生长，形似鸟巢，非常美观。"},
    {"yolo_class_id": 8, "name": "波士顿蕨", "scientific_name": "Nephrolepis exaltata", "category": "室内", "care_level": 2, "beginner_friendly": 4, "light_requirement": "partial", "water_requirement": "frequent", "watering_tip": "保持土壤湿润，经常喷水", "temperature_range": "18-24°C", "humidity_range": "60-80%", "is_toxic": False, "features": ["净化空气", "垂吊"], "survival_rate": 80, "description": "波士顿蕨枝叶下垂，姿态优美，是很好的垂吊观叶植物。"},
    {"yolo_class_id": 9, "name": "竹芋", "scientific_name": "Maranta leuconeura", "category": "室内", "care_level": 2, "beginner_friendly": 4, "light_requirement": "low", "water_requirement": "weekly", "watering_tip": "保持土壤湿润，避免干旱", "temperature_range": "18-28°C", "humidity_range": "60-80%", "is_toxic": False, "features": ["净化空气", "耐阴"], "survival_rate": 85, "description": "竹芋叶片有美丽斑纹，是著名的室内观叶植物。"},
    {"yolo_class_id": 10, "name": "一叶兰", "scientific_name": "Aspidistra elatior", "category": "室内", "care_level": 1, "beginner_friendly": 5, "light_requirement": "low", "water_requirement": "biweekly", "watering_tip": "干透再浇，耐干旱", "temperature_range": "10-25°C", "humidity_range": "40-60%", "is_toxic": False, "features": ["耐阴", "易养护"], "survival_rate": 95, "description": "一叶兰极耐阴，是最易养护的室内观叶植物之一。"},
    {"yolo_class_id": 11, "name": "金钱草", "scientific_name": "Lysimachia christinae", "category": "草本", "care_level": 1, "beginner_friendly": 5, "light_requirement": "partial", "water_requirement": "frequent", "watering_tip": "保持土壤湿润，喜水", "temperature_range": "15-25°C", "humidity_range": "60-80%", "is_toxic": False, "features": ["净化空气", "水培"], "survival_rate": 90, "description": "金钱草叶片圆形似钱币，寓意好，易于养护。"},
    {"yolo_class_id": 12, "name": "万年青", "scientific_name": "Dieffenbachia seguine", "category": "室内", "care_level": 2, "beginner_friendly": 4, "light_requirement": "partial", "water_requirement": "weekly", "watering_tip": "保持土壤湿润", "temperature_range": "18-28°C", "humidity_range": "50-70%", "is_toxic": True, "features": ["净化空气", "观赏"], "survival_rate": 85, "description": "万年青叶片宽大翠绿，是常见的室内观叶植物。"},
    {"yolo_class_id": 13, "name": "蟹爪兰", "scientific_name": "Schlumbergera truncata", "category": "开花", "care_level": 3, "beginner_friendly": 3, "light_requirement": "partial", "water_requirement": "biweekly", "watering_tip": "花期控制浇水，避免积水", "temperature_range": "15-25°C", "humidity_range": "50-70%", "is_toxic": False, "features": ["开花", "冬季"], "survival_rate": 75, "description": "蟹爪兰花期在冬季，枝条下垂，花朵鲜艳。"},
    {"yolo_class_id": 14, "name": "菊花", "scientific_name": "Chrysanthemum morifolium", "category": "开花", "care_level": 2, "beginner_friendly": 4, "light_requirement": "full", "water_requirement": "weekly", "watering_tip": "保持土壤湿润但不积水", "temperature_range": "15-25°C", "humidity_range": "50-70%", "is_toxic": False, "features": ["开花", "药用"], "survival_rate": 80, "description": "菊花是中国传统名花，花色丰富，花期长。"},
    {"yolo_class_id": 15, "name": "浪星竹芋", "scientific_name": "Calathea orbifolia", "category": "室内", "care_level": 2, "beginner_friendly": 4, "light_requirement": "low", "water_requirement": "weekly", "watering_tip": "保持土壤湿润，经常喷水", "temperature_range": "18-28°C", "humidity_range": "60-80%", "is_toxic": False, "features": ["观赏", "耐阴"], "survival_rate": 80, "description": "浪星竹芋叶片大而有美丽斑纹，非常美观。"},
    {"yolo_class_id": 16, "name": "水仙", "scientific_name": "Narcissus tazetta", "category": "开花", "care_level": 2, "beginner_friendly": 3, "light_requirement": "full", "water_requirement": "weekly", "watering_tip": "保持水分充足", "temperature_range": "10-20°C", "humidity_range": "50-70%", "is_toxic": True, "features": ["开花", "冬季"], "survival_rate": 75, "description": "水仙是中国传统名花，花香浓郁，花期在春节。"},
    {"yolo_class_id": 17, "name": "龙血树", "scientific_name": "Dracaena fragrans", "category": "室内", "care_level": 2, "beginner_friendly": 4, "light_requirement": "partial", "water_requirement": "biweekly", "watering_tip": "干透再浇，避免积水", "temperature_range": "18-28°C", "humidity_range": "50-70%", "is_toxic": False, "features": ["净化空气", "大型"], "survival_rate": 85, "description": "龙血树株型优美，是常见的大型室内观叶植物。"},
    {"yolo_class_id": 18, "name": "黛粉叶", "scientific_name": "Dieffenbachia amoena", "category": "室内", "care_level": 2, "beginner_friendly": 4, "light_requirement": "partial", "water_requirement": "weekly", "watering_tip": "保持土壤湿润", "temperature_range": "18-28°C", "humidity_range": "50-70%", "is_toxic": True, "features": ["净化空气", "观赏"], "survival_rate": 80, "description": "黛粉叶叶片有美丽斑纹，是常见的室内观叶植物。"},
    {"yolo_class_id": 19, "name": "海芋", "scientific_name": "Alocasia macrorrhiza", "category": "室内", "care_level": 3, "beginner_friendly": 2, "light_requirement": "partial", "water_requirement": "weekly", "watering_tip": "保持土壤湿润，生长期多浇水", "temperature_range": "18-28°C", "humidity_range": "60-80%", "is_toxic": True, "features": ["大型", "观赏"], "survival_rate": 70, "description": "海芋叶片硕大，姿态优美，是高端室内观叶植物。"},
    {"yolo_class_id": 20, "name": "常春藤", "scientific_name": "Hedera helix", "category": "室内", "care_level": 1, "beginner_friendly": 5, "light_requirement": "partial", "water_requirement": "weekly", "watering_tip": "保持土壤湿润", "temperature_range": "10-20°C", "humidity_range": "50-70%", "is_toxic": True, "features": ["净化空气", "垂吊"], "survival_rate": 90, "description": "常春藤是常见的垂吊观叶植物，净化空气能力强。"},
    {"yolo_class_id": 21, "name": "风信子", "scientific_name": "Hyacinthus orientalis", "category": "开花", "care_level": 2, "beginner_friendly": 3, "light_requirement": "full", "water_requirement": "weekly", "watering_tip": "保持水分充足", "temperature_range": "10-18°C", "humidity_range": "50-70%", "is_toxic": True, "features": ["开花", "花香"], "survival_rate": 75, "description": "风信子花色丰富，花香浓郁，是常见的球根花卉。"},
    {"yolo_class_id": 22, "name": "铁十字秋海棠", "scientific_name": "Begonia masoniana", "category": "室内", "care_level": 2, "beginner_friendly": 4, "light_requirement": "partial", "water_requirement": "weekly", "watering_tip": "保持土壤湿润，避免叶面浇水", "temperature_range": "18-25°C", "humidity_range": "50-70%", "is_toxic": False, "features": ["观赏", "耐阴"], "survival_rate": 80, "description": "铁十字秋海棠叶片有独特斑纹，非常美观。"},
    {"yolo_class_id": 23, "name": "玉树", "scientific_name": "Crassula ovata", "category": "多肉", "care_level": 1, "beginner_friendly": 5, "light_requirement": "full", "water_requirement": "monthly", "watering_tip": "非常耐旱，干透再浇", "temperature_range": "15-25°C", "humidity_range": "30-50%", "is_toxic": True, "features": ["多肉", "观赏"], "survival_rate": 95, "description": "玉树叶片肥厚，株型优美，是常见的多肉植物。"},
    {"yolo_class_id": 24, "name": "长寿花", "scientific_name": "Kalanchoe blossfeldiana", "category": "开花", "care_level": 1, "beginner_friendly": 4, "light_requirement": "full", "water_requirement": "biweekly", "watering_tip": "耐旱，干透再浇", "temperature_range": "15-25°C", "humidity_range": "40-60%", "is_toxic": False, "features": ["开花", "花期长"], "survival_rate": 90, "description": "长寿花花期长花色丰富，是受欢迎的室内开花植物。"},
    {"yolo_class_id": 25, "name": "萱草", "scientific_name": "Hemerocallis", "category": "开花", "care_level": 2, "beginner_friendly": 4, "light_requirement": "full", "water_requirement": "weekly", "watering_tip": "保持土壤湿润", "temperature_range": "15-30°C", "humidity_range": "50-70%", "is_toxic": False, "features": ["开花", "观赏"], "survival_rate": 85, "description": "萱草花色鲜艳，是常见的园林观赏花卉。"},
    {"yolo_class_id": 26, "name": "铃兰", "scientific_name": "Convallaria majalis", "category": "开花", "care_level": 3, "beginner_friendly": 3, "light_requirement": "partial", "water_requirement": "weekly", "watering_tip": "保持土壤湿润", "temperature_range": "10-20°C", "humidity_range": "50-70%", "is_toxic": True, "features": ["开花", "花香"], "survival_rate": 70, "description": "铃兰花小而香，是著名的香花植物。"},
    {"yolo_class_id": 27, "name": "发财树", "scientific_name": "Pachira glabra", "category": "室内", "care_level": 2, "beginner_friendly": 4, "light_requirement": "partial", "water_requirement": "biweekly", "watering_tip": "干透再浇，避免积水", "temperature_range": "18-28°C", "humidity_range": "50-70%", "is_toxic": False, "features": ["净化空气", "招财"], "survival_rate": 85, "description": "发财树寓意好，是最受欢迎的室内观叶植物之一。"},
    {"yolo_class_id": 28, "name": "龟背竹", "scientific_name": "Monstera deliciosa", "category": "室内", "care_level": 2, "beginner_friendly": 4, "light_requirement": "partial", "water_requirement": "weekly", "watering_tip": "保持土壤湿润，经常喷水", "temperature_range": "18-28°C", "humidity_range": "60-80%", "is_toxic": True, "features": ["净化空气", "大型"], "survival_rate": 85, "description": "龟背竹叶片奇特，是最受欢迎的室内观叶植物之一。"},
    {"yolo_class_id": 29, "name": "兰花", "scientific_name": "Cymbidium", "category": "开花", "care_level": 3, "beginner_friendly": 3, "light_requirement": "partial", "water_requirement": "weekly", "watering_tip": "保持植材湿润但不过湿", "temperature_range": "15-28°C", "humidity_range": "60-80%", "is_toxic": False, "features": ["开花", "花香"], "survival_rate": 75, "description": "兰花是中国传统名花，品种繁多，花香幽雅。"},
    {"yolo_class_id": 30, "name": "棕竹", "scientific_name": "Rhapis excelsa", "category": "室内", "care_level": 2, "beginner_friendly": 4, "light_requirement": "low", "water_requirement": "weekly", "watering_tip": "保持土壤湿润", "temperature_range": "15-28°C", "humidity_range": "50-70%", "is_toxic": False, "features": ["净化空气", "耐阴"], "survival_rate": 85, "description": "棕竹株型优美，是常见的大型室内观叶植物。"},
    {"yolo_class_id": 31, "name": "白掌", "scientific_name": "Spathiphyllum wallisii", "category": "室内", "care_level": 1, "beginner_friendly": 5, "light_requirement": "partial", "water_requirement": "weekly", "watering_tip": "保持土壤湿润，喜水", "temperature_range": "18-28°C", "humidity_range": "60-80%", "is_toxic": True, "features": ["开花", "净化空气"], "survival_rate": 90, "description": "白掌花洁白素雅，是常见的室内开花观叶植物。"},
    {"yolo_class_id": 32, "name": "一品红", "scientific_name": "Euphorbia pulcherrima", "category": "开花", "care_level": 2, "beginner_friendly": 3, "light_requirement": "full", "water_requirement": "weekly", "watering_tip": "保持土壤湿润", "temperature_range": "15-25°C", "humidity_range": "50-70%", "is_toxic": True, "features": ["开花", "节日"], "survival_rate": 75, "description": "一品红是著名的圣诞花卉，苞片红色鲜艳。"},
    {"yolo_class_id": 33, "name": "红斑竹叶", "scientific_name": "Calathea roseopicta", "category": "室内", "care_level": 2, "beginner_friendly": 4, "light_requirement": "low", "water_requirement": "weekly", "watering_tip": "保持土壤湿润，经常喷水", "temperature_range": "18-28°C", "humidity_range": "60-80%", "is_toxic": False, "features": ["观赏", "耐阴"], "survival_rate": 80, "description": "红斑竹叶叶片有美丽斑纹，非常美观。"},
    {"yolo_class_id": 34, "name": "酒瓶兰", "scientific_name": "Beaucarnea recurvata", "category": "多肉", "care_level": 1, "beginner_friendly": 5, "light_requirement": "full", "water_requirement": "monthly", "watering_tip": "极耐旱，干透再浇", "temperature_range": "15-28°C", "humidity_range": "30-50%", "is_toxic": False, "features": ["多肉", "观赏"], "survival_rate": 95, "description": "酒瓶兰茎部膨大，形态独特，是常见的多肉植物。"},
    {"yolo_class_id": 35, "name": "绿萝", "scientific_name": "Epipremnum aureum", "category": "室内", "care_level": 1, "beginner_friendly": 5, "light_requirement": "low", "water_requirement": "weekly", "watering_tip": "保持土壤湿润", "temperature_range": "15-30°C", "humidity_range": "50-70%", "is_toxic": True, "features": ["净化空气", "耐阴", "易养护"], "survival_rate": 98, "description": "绿萝是最受欢迎的室内绿植，净化空气能力强，易于养护。"},
    {"yolo_class_id": 36, "name": "竹节秋海棠", "scientific_name": "Begonia maculata", "category": "室内", "care_level": 2, "beginner_friendly": 4, "light_requirement": "partial", "water_requirement": "weekly", "watering_tip": "保持土壤湿润", "temperature_range": "18-25°C", "humidity_range": "50-70%", "is_toxic": False, "features": ["开花", "观赏"], "survival_rate": 80, "description": "竹节秋海棠枝条有节，叶片有斑点，非常美观。"},
    {"yolo_class_id": 37, "name": "响尾蛇竹芋", "scientific_name": "Calathea lancifolia", "category": "室内", "care_level": 2, "beginner_friendly": 4, "light_requirement": "low", "water_requirement": "weekly", "watering_tip": "保持土壤湿润，经常喷水", "temperature_range": "18-28°C", "humidity_range": "60-80%", "is_toxic": False, "features": ["观赏", "耐阴"], "survival_rate": 80, "description": "响尾蛇竹芋叶片有独特斑纹，非常美观。"},
    {"yolo_class_id": 38, "name": "橡皮树", "scientific_name": "Ficus elastica", "category": "室内", "care_level": 1, "beginner_friendly": 4, "light_requirement": "full", "water_requirement": "biweekly", "watering_tip": "干透再浇", "temperature_range": "15-28°C", "humidity_range": "50-70%", "is_toxic": True, "features": ["净化空气", "大型"], "survival_rate": 90, "description": "橡皮树叶片厚实有光泽，是常见的室内观叶植物。"},
    {"yolo_class_id": 39, "name": "苏铁", "scientific_name": "Cycas revoluta", "category": "室内", "care_level": 2, "beginner_friendly": 4, "light_requirement": "full", "water_requirement": "monthly", "watering_tip": "耐旱，干透再浇", "temperature_range": "15-28°C", "humidity_range": "40-60%", "is_toxic": True, "features": ["大型", "观赏"], "survival_rate": 85, "description": "苏铁形态古朴，是著名的观赏植物。"},
    {"yolo_class_id": 40, "name": "鹅掌柴", "scientific_name": "Schefflera octophylla", "category": "室内", "care_level": 1, "beginner_friendly": 5, "light_requirement": "partial", "water_requirement": "weekly", "watering_tip": "保持土壤湿润", "temperature_range": "15-25°C", "humidity_range": "50-70%", "is_toxic": True, "features": ["净化空气", "易养护"], "survival_rate": 92, "description": "鹅掌柴叶片掌状，是最易养护的室内观叶植物之一。"},
    {"yolo_class_id": 41, "name": "虎皮兰", "scientific_name": "Sansevieria trifasciata", "category": "室内", "care_level": 1, "beginner_friendly": 5, "light_requirement": "partial", "water_requirement": "monthly", "watering_tip": "极耐旱，2-4周浇一次", "temperature_range": "15-30°C", "humidity_range": "30-50%", "is_toxic": False, "features": ["净化空气", "耐旱"], "survival_rate": 98, "description": "虎皮兰叶片挺拔，是最适合新手的室内植物之一。"},
    {"yolo_class_id": 42, "name": "紫露草", "scientific_name": "Tradescantia pallida", "category": "室内", "care_level": 1, "beginner_friendly": 5, "light_requirement": "partial", "water_requirement": "weekly", "watering_tip": "保持土壤湿润", "temperature_range": "15-25°C", "humidity_range": "50-70%", "is_toxic": False, "features": ["垂吊", "观赏"], "survival_rate": 90, "description": "紫露草叶片紫色，枝条下垂，非常美观。"},
    {"yolo_class_id": 43, "name": "郁金香", "scientific_name": "Tulipa gesneriana", "category": "开花", "care_level": 2, "beginner_friendly": 3, "light_requirement": "full", "water_requirement": "weekly", "watering_tip": "保持土壤湿润", "temperature_range": "10-20°C", "humidity_range": "50-70%", "is_toxic": True, "features": ["开花", "观赏"], "survival_rate": 75, "description": "郁金香是世界著名花卉，花色丰富，花姿优美。"},
    {"yolo_class_id": 44, "name": "捕蝇草", "scientific_name": "Dionaea muscipula", "category": "草本", "care_level": 3, "beginner_friendly": 2, "light_requirement": "full", "water_requirement": "frequent", "watering_tip": "保持基质湿润，喜软水", "temperature_range": "15-30°C", "humidity_range": "60-80%", "is_toxic": False, "features": ["食虫", "趣味"], "survival_rate": 65, "description": "捕蝇草叶片能捕食昆虫，是有趣的食虫植物。"},
    {"yolo_class_id": 45, "name": "丝兰", "scientific_name": "Yucca filamentosa", "category": "室内", "care_level": 1, "beginner_friendly": 5, "light_requirement": "full", "water_requirement": "monthly", "watering_tip": "耐旱，干透再浇", "temperature_range": "15-30°C", "humidity_range": "30-50%", "is_toxic": True, "features": ["观赏", "耐旱"], "survival_rate": 90, "description": "丝兰叶片细长如丝，是独特的观赏植物。"},
    {"yolo_class_id": 46, "name": "金钱树", "scientific_name": "Zamioculcas zamiifolia", "category": "室内", "care_level": 1, "beginner_friendly": 5, "light_requirement": "low", "water_requirement": "biweekly", "watering_tip": "干透再浇，非常耐旱", "temperature_range": "15-28°C", "humidity_range": "40-60%", "is_toxic": True, "features": ["净化空气", "招财"], "survival_rate": 95, "description": "金钱树枝叶繁茂，寓意好，是受欢迎的室内植物。"}
]

def seed_plants(db: Session):
    """初始化植物数据"""
    for plant_data in PLANT_DATA:
        # 检查是否已存在
        existing = db.query(Plant).filter(Plant.yolo_class_id == plant_data["yolo_class_id"]).first()
        if not existing:
            db.add(Plant(**plant_data))
    db.commit()
    print(f"已初始化 {len(PLANT_DATA)} 种植物数据")

if __name__ == "__main__":
    from app.core.database import SessionLocal
    db = SessionLocal()
    try:
        seed_plants(db)
    finally:
        db.close()
```

**Step 2: 保存文件**

---

### Task 9: 在启动时运行种子数据

**Files:**
- Modify: `backend/app/main.py` 或 `backend/app/db/seed.py`

**Step 1: 添加启动事件**

```python
# backend/app/main.py - 在文件末尾添加

@app.on_event("startup")
async def startup_event():
    from app.db.seed_plants import seed_plants
    from app.core.database import SessionLocal
    db = SessionLocal()
    try:
        seed_plants(db)
    finally:
        db.close()
```

---

## Phase 4: APP端-推荐功能

### Task 10: 创建植物和推荐服务

**Files:**
- Create: `APP/src/services/plantService.ts`
- Create: `APP/src/services/recommendService.ts`

**Step 1: 创建 plantService.ts**

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
  tips?: string;
  common_mistakes?: string;
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
  light?: string;
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

// 添加到我的花园
export const addToMyGarden = async (data: {
  plant_id?: number;
  plant_name?: string;
  nickname?: string;
  location?: string;
  acquired_from?: string;
}): Promise<any> => {
  const response = await api.post('/api/plants/my', data);
  return response.data;
};
```

**Step 2: 创建 recommendService.ts**

```typescript
// APP/src/services/recommendService.ts

import axios from 'axios';

const API_URL = 'http://192.168.1.100:8000';

const api = axios.create({
  baseURL: API_URL,
});

// 推荐请求
export interface RecommendRequest {
  light: 'full' | 'partial' | 'low';
  watering: 'frequent' | 'weekly' | 'biweekly' | 'monthly';
  purpose: 'air-purify' | 'decoration' | 'hobby';
  has_pets_kids: boolean;
  experience: 'beginner' | 'intermediate' | 'expert';
}

// 推荐结果
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

// 获取推荐
export const getRecommendations = async (data: RecommendRequest): Promise<PlantRecommendation[]> => {
  const response = await api.post('/api/recommend', data);
  return response.data;
};
```

---

### Task 11: 修改 RecommendationScreen

**Files:**
- Modify: `APP/src/screens/RecommendationScreen.tsx`

**Step 1: 更新问题数据和对接API**

```typescript
// APP/src/screens/RecommendationScreen.tsx - 替换问题数据和添加API调用

import { getRecommendations, RecommendRequest } from '../services/recommendService';
import { addToMyGarden } from '../services/plantService';

// 问题数据扩展到5题
const questions = [
  { id: 1, question: '你家的光照条件怎么样？', options: [{ label: '光线充足', value: 'full', icon: Icons.Sun }, { label: '一般光线', value: 'partial', icon: Icons.Cloud }, { label: '光线较弱', value: 'low', icon: Icons.Moon }] },
  { id: 2, question: '你多久浇一次水？', options: [{ label: '经常忘记', value: 'monthly', icon: Icons.Clock }, { label: '一周一次', value: 'weekly', icon: Icons.Calendar }, { label: '想起来就浇', value: 'frequent', icon: Icons.Droplets }] },
  { id: 3, question: '你养植物的目的是？', options: [{ label: '净化空气', value: 'air-purify', icon: Icons.Wind }, { label: '装饰美观', value: 'decoration', icon: Icons.Flower2 }, { label: '兴趣爱好', value: 'hobby', icon: Icons.Heart }] },
  { id: 4, question: '你家有小孩或宠物吗？', options: [{ label: '有', value: 'true', icon: Icons.Heart }, { label: '没有', value: 'false', icon: Icons.Check }] },
  { id: 5, question: '你有多少养植物经验？', options: [{ label: '新手', value: 'beginner', icon: Icons.Star }, { label: '养过几盆', value: 'intermediate', icon: Icons.Star }, { label: '老手', value: 'expert', icon: Icons.Star }] },
];

// 添加处理添加花园的函数
const handleAddToGarden = async (plant: any) => {
  try {
    await addToMyGarden({
      plant_id: plant.plant_id,
      nickname: plant.name,
      acquired_from: 'recommendation'
    });
    // 显示成功提示
    Alert.alert('成功', '已添加到我的花园');
  } catch (error) {
    Alert.alert('提示', '请先登录后再添加');
  }
};
```

---

### Task 12: 创建推荐页面到花园的导航

**Files:**
- Modify: `APP/src/screens/RecommendationScreen.tsx`

**Step 1: 添加添加到花园按钮功能**

```typescript
// 在推荐结果卡片中添加按钮
<TouchableOpacity
  style={styles.addButton}
  activeOpacity={0.8}
  onPress={() => handleAddToGarden(plant)}
>
  <Icons.Plus size={18} color="#fff" />
  <Text style={styles.addButtonText}>添加到花园</Text>
</TouchableOpacity>
```

---

## Phase 5: APP端-百科对接

### Task 13: 修改 EncyclopediaScreen

**Files:**
- Modify: `APP/src/screens/EncyclopediaScreen.tsx`

**Step 1: 对接API获取数据**

```typescript
// APP/src/screens/EncyclopediaScreen.tsx

import { useState, useEffect } from 'react';
import { getPlants, Plant } from '../services/plantService';

// 在组件内添加状态
const [plants, setPlants] = useState<Plant[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  loadPlants();
}, []);

const loadPlants = async () => {
  try {
    const data = await getPlants({ limit: 20 });
    setPlants(data.items);
  } catch (error) {
    console.error('加载植物数据失败', error);
  } finally {
    setLoading(false);
  }
};

// 修改热门植物数据源
const popularPlants = plants.slice(0, 6).map(p => ({
  id: String(p.id),
  name: p.name,
  careLevel: p.care_level,
  category: p.category || '室内'
}));
```

---

### Task 14: 修改 EncyclopediaDetailScreen

**Files:**
- Modify: `APP/src/screens/EncyclopediaDetailScreen.tsx`

**Step 1: 对接API获取详情**

```typescript
// APP/src/screens/EncyclopediaDetailScreen.tsx

import { useState, useEffect } from 'react';
import { getPlantDetail, Plant, addToMyGarden } from '../services/plantService';

// 从NavigationProps获取plantId
interface EncyclopediaDetailScreenProps extends Partial<NavigationProps> {
  plantId?: number;
}

// 在组件内
const [plant, setPlant] = useState<Plant | null>(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  loadPlantDetail();
}, [plantId]);

const loadPlantDetail = async () => {
  if (!plantId) return;
  try {
    const data = await getPlantDetail(plantId);
    setPlant(data);
  } catch (error) {
    console.error('加载植物详情失败', error);
  } finally {
    setLoading(false);
  }
};

// 修改添加到花园函数
const handleAddToGarden = async () => {
  if (!plant) return;
  try {
    await addToMyGarden({
      plant_id: plant.id,
      nickname: plant.name,
      acquired_from: 'encyclopedia'
    });
    Alert.alert('成功', '已添加到我的花园');
  } catch (error) {
    Alert.alert('提示', '请先登录后再添加');
  }
};
```

---

### Task 15: 传递plantId到详情页

**Files:**
- Modify: `APP/src/navigation/AppNavigator.tsx`

**Step 1: 修改导航参数传递**

```typescript
// 在 EncyclopediaScreen 的 onNavigate 调用中传递 plantId
if (onNavigate) {
  onNavigate('EncyclopediaDetail', { plantId: plant.id });
}

// 在 EncyclopediaDetailScreen 接收参数
const plantId = navParams?.plantId;
```

---

## Phase 6: 测试验证

### Task 16: 后端API测试

**Step 1: 测试推荐API**

```bash
# 启动后端
cd backend && uvicorn app.main:app --reload

# 测试推荐接口
curl -X POST http://localhost:8000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{"light": "low", "watering": "weekly", "purpose": "air-purify", "has_pets_kids": false, "experience": "beginner"}'
```

**预期响应：**
```json
[
  {"plant_id": 35, "name": "绿萝", "match_score": 95, ...},
  ...
]
```

---

### Task 17: APP端测试

**Step 1: 测试植物列表**

```bash
# 测试植物列表API
curl http://localhost:8000/api/plants?limit=5
```

**Step 2: 测试添加到花园**

```bash
# 需要先登录获取token
curl -X POST http://localhost:8000/api/plants/my \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"plant_id": 35, "nickname": "我的绿萝", "acquired_from": "recommendation"}'
```

---

## 实施完成检查清单

- [ ] Task 1: Plant模型扩展
- [ ] Task 2: UserPlant模型扩展
- [ ] Task 3: Plant Schema扩展
- [ ] Task 4: 推荐API开发
- [ ] Task 5: 植物列表API扩展
- [ ] Task 6: 添加花园API扩展
- [ ] Task 7: 用户植物列表API扩展
- [ ] Task 8: 植物种子数据脚本
- [ ] Task 9: 启动时运行种子数据
- [ ] Task 10: 创建APP端服务
- [ ] Task 11: 修改推荐页面
- [ ] Task 12: 添加到花园功能
- [ ] Task 13: 百科列表页对接
- [ ] Task 14: 百科详情页对接
- [ ] Task 15: 导航参数传递
- [ ] Task 16: 后端API测试
- [ ] Task 17: APP端测试
