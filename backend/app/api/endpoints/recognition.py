from fastapi import APIRouter, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.services.recognition import recognition_service
from app.schemas.recognition import RecognitionResponse, SimilarSpecies
import tempfile
import os

router = APIRouter(prefix="/api/recognition", tags=["recognition"])


@router.post("", response_model=RecognitionResponse)
async def recognize_plant(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        result = recognition_service.recognize(tmp_path)
        return RecognitionResponse(
            id=result.get("id", "1"),
            name=result.get("name", "绿萝"),
            scientific_name="Epipremnum aureum",
            confidence=result.get("confidence", 0.95),
            description="绿萝是天南星科麒麟叶属植物，原产于印度尼西亚所罗门群岛的热带雨林。绿萝生命力顽强，易于养护，是最常见的室内观叶植物之一。",
            care_level=1,
            light_requirement="耐阴",
            water_requirement="见干见湿",
            similar_species=[
                SimilarSpecies(id="2", name="吊兰", difference="吊兰叶片更细长"),
                SimilarSpecies(id="3", name="常春藤", difference="常春藤叶片为掌状五裂")
            ]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recognition failed: {str(e)}")
    finally:
        os.unlink(tmp_path)
