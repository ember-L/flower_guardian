from pydantic import BaseModel
from typing import Optional, List


class SimilarSpecies(BaseModel):
    id: str
    name: str
    image_url: Optional[str] = None
    difference: str


class RecognitionResponse(BaseModel):
    id: str
    name: str
    scientific_name: str
    confidence: float
    description: str
    care_level: int
    light_requirement: str
    water_requirement: str
    image_url: Optional[str] = None
    similar_species: Optional[List[SimilarSpecies]] = None


class DiagnosisResponse(BaseModel):
    id: str
    symptom: str
    possible_causes: List[str]
    severity: str
    treatment: str
    prevention: str
