from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.services.pest_recognition import pest_recognition_service
import tempfile
import os
from typing import Optional

router = APIRouter(prefix="/api/diagnosis", tags=["diagnosis"])


@router.post("/pest")
async def diagnose_pest(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """病虫害识别API"""
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        result = pest_recognition_service.recognize(tmp_path)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Diagnosis failed: {str(e)}")
    finally:
        os.unlink(tmp_path)


@router.post("/full")
async def diagnose_full(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """完整诊断API（识别病虫害并返回处理建议）"""
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        result = pest_recognition_service.recognize(tmp_path)

        # 如果识别成功，返回更详细的诊断信息
        if result.get("id", "-1") != "-1":
            return {
                "diagnosis": result,
                "recommendations": {
                    "immediate": result.get("treatment", ""),
                    "prevention": _get_prevention_tips(result.get("type", "")),
                    "severity_level": result.get("severity", "low")
                }
            }
        else:
            return {
                "diagnosis": result,
                "recommendations": {
                    "immediate": "建议咨询专业人士或上传更清晰的照片",
                    "prevention": "保持良好的养护习惯",
                    "severity_level": "unknown"
                }
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Diagnosis failed: {str(e)}")
    finally:
        os.unlink(tmp_path)


def _get_prevention_tips(pest_type: str) -> str:
    """获取预防建议"""
    tips = {
        "insect": "定期检查植物叶片，保持通风，避免过度潮湿",
        "disease": "及时清除病叶，保持植株间距，加强通风",
        "physiological": "根据植物习性调整光照、浇水和施肥"
    }
    return tips.get(pest_type, "保持良好的养护习惯")
