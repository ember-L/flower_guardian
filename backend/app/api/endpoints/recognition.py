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
from typing import Optional

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
