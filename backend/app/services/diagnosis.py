class DiagnosisService:
    def __init__(self):
        self.symptoms = {
            "黄叶": {
                "causes": ["浇水过多", "浇水过少", "缺铁", "光照不足"],
                "severity": "medium",
                "treatment": "1. 检查土壤湿度\n2. 施加含铁肥料\n3. 改善光照",
                "prevention": "遵循见干见湿原则"
            },
            "叶片发白": {
                "causes": ["光照过强", "缺肥", "病害"],
                "severity": "medium",
                "treatment": "1. 移至散光处\n2. 适当施肥",
                "prevention": "避免强光直射"
            },
            "叶片发黑": {
                "causes": ["冻害", "浇水过多", "病害"],
                "severity": "high",
                "treatment": "1. 移至温暖处\n2. 控制浇水\n3. 使用多菌灵",
                "prevention": "冬季注意保暖"
            },
            "叶片萎蔫": {
                "causes": ["缺水", "根系腐烂", "高温"],
                "severity": "medium",
                "treatment": "1. 及时浇水\n2. 检查根系\n3. 降温处理",
                "prevention": "保持适度浇水"
            },
            "生长缓慢": {
                "causes": ["营养不足", "光照不足", "温度不适"],
                "severity": "low",
                "treatment": "1. 施加肥料\n2. 改善光照\n3. 调整温度",
                "prevention": "定期施肥"
            }
        }

    def diagnose(self, symptom: str) -> dict:
        if symptom in self.symptoms:
            data = self.symptoms[symptom]
            return {
                "id": "1",
                "symptom": symptom,
                "possible_causes": data["causes"],
                "severity": data["severity"],
                "treatment": data["treatment"],
                "prevention": data["prevention"]
            }
        return {
            "id": "0",
            "symptom": symptom,
            "possible_causes": ["需要进一步检查"],
            "severity": "low",
            "treatment": "建议咨询专业人士",
            "prevention": "保持良好养护习惯"
        }


diagnosis_service = DiagnosisService()
