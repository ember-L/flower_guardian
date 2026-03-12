# 商城页面后端连接实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 添加示例商品数据到数据库，使商城页面能够显示真实数据

**Architecture:** 创建商品种子数据脚本，直接操作数据库插入示例商品

**Tech Stack:** Python, SQLAlchemy, FastAPI

---

## 任务概览

- [ ] Task 1: 创建商品种子数据脚本
- [ ] Task 2: 运行种子脚本添加示例商品
- [ ] Task 3: 验证商品数据是否正确添加

---

### Task 1: 创建商品种子数据脚本

**Files:**
- Create: `backend/app/db/seed_products.py`

**Step 1: 创建种子数据脚本**

创建 `backend/app/db/seed_products.py`:

```python
"""
商品种子数据脚本
用法: python -m app.db.seed_products
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

# 数据库连接
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/flower_guardian")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

# 商品数据
PRODUCTS = [
    {
        "name": "陶瓷北欧风花盆",
        "description": "简约北欧风格陶瓷花盆，适合多肉植物和小型绿植。尺寸：直径12cm，高10cm",
        "price": 29.90,
        "stock": 100,
        "image_url": "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400",
        "status": "active",
        "category": "花盆"
    },
    {
        "name": "自动浇水花盆",
        "description": "智能自动浇水花盆，适合新手养花。透明设计方便观察水位",
        "price": 49.90,
        "stock": 50,
        "image_url": "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400",
        "status": "active",
        "category": "花盆"
    },
    {
        "name": "有机花肥500g",
        "description": "纯有机植物肥料，适用于花卉、蔬菜、果树。氮磷钾均衡配比",
        "price": 19.90,
        "stock": 200,
        "image_url": "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=400",
        "status": "active",
        "category": "肥料"
    },
    {
        "name": "多肉专用营养土",
        "description": "透气性好，适合多肉植物、仙人掌等肉质植物。5斤装",
        "price": 15.90,
        "stock": 150,
        "image_url": "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400",
        "status": "active",
        "category": "土壤"
    },
    {
        "name": "园艺工具套装",
        "description": "包含小铲子、耙子、剪刀三件套，适合家庭园艺使用",
        "price": 39.90,
        "stock": 80,
        "image_url": "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400",
        "status": "active",
        "category": "工具"
    },
    {
        "name": "室内绿萝盆栽",
        "description": "净化空气首选，易于养护。适合放在客厅、卧室",
        "price": 35.00,
        "stock": 30,
        "image_url": "https://images.unsplash.com/photo-1593691509543-c55fb32d8de5?w=400",
        "status": "active",
        "category": "植物"
    },
    {
        "name": "君子兰盆栽",
        "description": "高雅花卉，叶片厚实，花开艳丽。适合客厅摆放",
        "price": 68.00,
        "stock": 20,
        "image_url": "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=400",
        "status": "active",
        "category": "植物"
    },
    {
        "name": "小型喷雾壶",
        "description": "植物浇水喷雾壶，300ml容量，雾化效果好",
        "price": 12.90,
        "stock": 120,
        "image_url": "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400",
        "status": "active",
        "category": "工具"
    },
    {
        "name": "吊兰盆栽",
        "description": "垂挂式绿植，适合阳台、书房。净化空气效果好",
        "price": 25.00,
        "stock": 40,
        "image_url": "https://images.unsplash.com/photo-1593691509543-c55fb32d8de5?w=400",
        "status": "active",
        "category": "植物"
    },
    {
        "name": "发财树盆栽",
        "description": "寓意好，适合办公室、店铺摆放。招财进宝",
        "price": 88.00,
        "stock": 15,
        "image_url": "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=400",
        "status": "active",
        "category": "植物"
    },
    {
        "name": "防潮收纳箱",
        "description": "园艺工具收纳箱，防潮防尘，大容量设计",
        "price": 34.90,
        "stock": 60,
        "image_url": "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400",
        "status": "active",
        "category": "工具"
    },
    {
        "name": "绿萝专用肥",
        "description": "绿萝、吊兰等藤本植物专用液态肥，效果显著",
        "price": 22.90,
        "stock": 90,
        "image_url": "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=400",
        "status": "active",
        "category": "肥料"
    }
]


def seed_products():
    """插入商品数据"""
    from app.models.product import Product

    db = SessionLocal()
    try:
        # 检查是否已有商品
        existing = db.query(Product).count()
        if existing > 0:
            print(f"数据库中已有 {existing} 个商品，跳过插入")
            return

        # 插入商品
        for p in PRODUCTS:
            product = Product(
                name=p["name"],
                description=p["description"],
                price=p["price"],
                stock=p["stock"],
                image_url=p["image_url"],
                status=p["status"]
            )
            db.add(product)

        db.commit()
        print(f"成功插入 {len(PRODUCTS)} 个商品")

    except Exception as e:
        db.rollback()
        print(f"插入商品失败: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_products()
```

**Step 2: 提交代码**

```bash
git add backend/app/db/seed_products.py
git commit -m "feat: add product seed data script

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: 运行种子脚本添加示例商品

**Step 1: 确保数据库已启动并运行脚本**

```bash
# 方式1: 如果使用Docker
docker-compose up -d postgres

# 方式2: 直接运行Python脚本
cd backend
python -m app.db.seed_products
```

**Step 2: 验证输出**

预期输出：
```
成功插入 12 个商品
```

---

### Task 3: 验证商品数据

**Step 1: 启动后端服务**

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

**Step 2: 测试API**

```bash
curl http://localhost:8000/api/products
```

预期返回：
```json
{
  "total": 12,
  "items": [
    {
      "id": 1,
      "name": "陶瓷北欧风花盆",
      "price": "29.90",
      ...
    }
    // ... 12个商品
  ]
}
```

**Step 3: 提交**

```bash
git commit -m "docs: add store API connection plan

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## 验收标准

1. 运行 `python -m app.db.seed_products` 成功插入 12 个商品
2. 访问 `/api/products` 返回商品列表
3. 前端商城页面能够显示商品数据
