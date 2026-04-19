from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.services.recognition import plant_recognition_service
from app.services.pest_recognition import pest_recognition_service
from app.schemas.recognition import RecognitionResponse, SimilarSpecies
import tempfile
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/recognition", tags=["recognition"])


@router.post("/plant", response_model=RecognitionResponse)
async def recognize_plant(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """植物识别API"""
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        result = plant_recognition_service.recognize(tmp_path)
        return RecognitionResponse(
            id=result.get("id", "1"),
            name=result.get("name", "绿萝"),
            scientific_name="",
            confidence=result.get("confidence", 0.95),
            description="",
            care_level=1,
            light_requirement="喜散射光",
            water_requirement="见干见湿",
            similar_species=[]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recognition failed: {str(e)}")
    finally:
        os.unlink(tmp_path)


@router.post("/full")
async def recognize_full(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """完整识别API（同时识别植物和病虫害）"""
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        plant_result = plant_recognition_service.recognize(tmp_path)
        pest_result = pest_recognition_service.recognize(tmp_path)

        return {
            "plant": plant_result,
            "pest": pest_result if pest_result.get("id", "-1") != "-1" else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recognition failed: {str(e)}")
    finally:
        os.unlink(tmp_path)


# 保留旧接口以兼容
@router.post("", response_model=RecognitionResponse)
async def recognize_plant_legacy(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """植物识别API（兼容旧接口）"""
    return await recognize_plant(file, db, current_user)


# 公开识别接口（无需认证）
@router.post("/public/plant", response_model=RecognitionResponse)
async def recognize_plant_public(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """植物识别API（公开，无需认证）"""
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        logger.info(f"收到识别请求，图片大小: {len(content)} bytes")
        result = plant_recognition_service.recognize(tmp_path)
        logger.info(f"识别结果: {result}")

        # 构建 detections 列表
        detections = result.get("detections", [])
        detection_items = []
        for det in detections:
            detection_items.append({
                "id": det.get("id", "0"),
                "name": det.get("name", ""),
                "confidence": det.get("confidence", 0),
                "bbox": det.get("bbox", []),
                "care_tips": det.get("care_tips", "")
            })

        return RecognitionResponse(
            id=result.get("id", "1"),
            name=result.get("name", "绿萝"),
            scientific_name="",
            confidence=result.get("confidence", 0.95),
            description="",
            care_level=1,
            light_requirement="喜散射光",
            water_requirement="见干见湿",
            similar_species=[],
            bbox=result.get("bbox", []),
            detections=detection_items if detection_items else None
        )
    except Exception as e:
        logger.error(f"识别失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Recognition failed: {str(e)}")
    finally:
        os.unlink(tmp_path)
