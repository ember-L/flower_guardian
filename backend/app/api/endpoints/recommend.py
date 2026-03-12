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
    if light_match and plant.light_requirement:
        light_text = {"full": "充足光照", "partial": "半阴环境", "low": "弱光环境"}
        reasons.append(f"适合{light_text.get(plant.light_requirement, plant.light_requirement)}")
    if watering_match and plant.water_requirement:
        water_text = {"frequent": "经常浇水", "weekly": "每周浇水", "biweekly": "两周一次", "monthly": "一个月一次"}
        reasons.append(f"浇水{water_text.get(plant.water_requirement, plant.water_requirement)}")
    if plant.beginner_friendly and plant.beginner_friendly >= 4:
        reasons.append("新手友好")
    if plant.features:
        if "净化空气" in plant.features:
            reasons.append("净化空气")
        elif "易养护" in plant.features:
            reasons.append("易养护")
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

        # 光照匹配 (30%)
        light_match = plant.light_requirement in LIGHT_MAP.get(request.light, ["partial"]) if plant.light_requirement else False
        if light_match:
            score += 30

        # 浇水匹配 (25%)
        watering_match = plant.water_requirement in WATERING_MAP.get(request.watering, ["weekly"]) if plant.water_requirement else False
        if watering_match:
            score += 25

        # 经验匹配 (20%)
        exp_range = DIFFICULTY_MAP.get(request.experience, [1, 3])
        if plant.care_level in exp_range:
            score += 20

        # 目的匹配 (15%)
        if request.purpose == "air-purify" and plant.features:
            if "净化空气" in plant.features:
                score += 15
        elif request.purpose == "decoration":
            if plant.features and "观赏" in plant.features:
                score += 10
        elif request.purpose == "hobby":
            score += 10

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
