from app.db.base import Base
from app.core.database import engine, SessionLocal
from app.models.plant import Plant

initial_plants = [
    {
        "name": "绿萝",
        "scientific_name": "Epipremnum aureum",
        "category": "观叶植物",
        "care_level": 1,
        "description": "绿萝是天南星科麒麟叶属植物，原产于印度尼西亚所罗门群岛的热带雨林。绿萝生命力顽强，易于养护，是最常见的室内观叶植物之一。",
        "light_requirement": "耐阴",
        "water_requirement": "见干见湿",
        "temperature_range": "15-30°C",
        "humidity_range": "40-60%",
        "fertilization": "春夏季每2周一次",
        "repotting": "每年春季换盆",
    },
    {
        "name": "虎皮兰",
        "scientific_name": "Sansevieria trifasciata",
        "category": "观叶植物",
        "care_level": 1,
        "description": "虎皮兰是百合科虎尾兰属多年生草本植物。叶片坚挺直立，姿态刚毅，适应性很强。",
        "light_requirement": "耐阴",
        "water_requirement": "耐旱",
        "temperature_range": "15-25°C",
        "humidity_range": "30-50%",
        "fertilization": "春夏季每月一次",
        "repotting": "每2-3年换盆",
    },
    {
        "name": "吊兰",
        "scientific_name": "Chlorophytum comosum",
        "category": "观叶植物",
        "care_level": 1,
        "description": "吊兰是百合科吊兰属多年生草本植物。叶片细长，形态优美，能吸收空气中的甲醛。",
        "light_requirement": "散光",
        "water_requirement": "见干见湿",
        "temperature_range": "15-25°C",
        "humidity_range": "40-60%",
        "fertilization": "生长期每2周一次",
        "repotting": "每年春季换盆",
    },
    {
        "name": "多肉植物",
        "scientific_name": "Succulent",
        "category": "多肉植物",
        "care_level": 2,
        "description": "多肉植物是指植物的根、茎、叶三种营养器官中至少有一种是肥厚多汁并且具备储藏大量水分功能的植物。",
        "light_requirement": "喜阳",
        "water_requirement": "耐旱",
        "temperature_range": "15-28°C",
        "humidity_range": "30-40%",
        "fertilization": "生长期每月一次",
        "repotting": "每1-2年换盆",
    },
    {
        "name": "龟背竹",
        "scientific_name": "Monstera deliciosa",
        "category": "观叶植物",
        "care_level": 2,
        "description": "龟背竹是天南星科龟背竹属攀援灌木。叶片大而独特，呈孔裂纹状，非常美观。",
        "light_requirement": "散光",
        "water_requirement": "见干见湿",
        "temperature_range": "18-28°C",
        "humidity_range": "50-70%",
        "fertilization": "生长期每2周一次",
        "repotting": "每年春季换盆",
    },
]


def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing = db.query(Plant).count()
        if existing > 0:
            print(f"Database already has {existing} plants")
            return

        for plant_data in initial_plants:
            plant = Plant(**plant_data)
            db.add(plant)

        db.commit()
        print(f"Added {len(initial_plants)} plants to database")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
