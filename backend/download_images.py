#!/usr/bin/env python3
"""下载植物图片到本地"""

import os
import urllib.request

# 植物图片 URL 映射
PLANT_IMAGE_URLS = {
    "绿萝": "https://images.unsplash.com/photo-1598880940080-ff9a29891b85?w=400",
    "吊兰": "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400",
    "龟背竹": "https://images.unsplash.com/photo-1545241047-6083a3684587?w=400",
    "发财树": "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400",
    "虎皮兰": "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400",
    "芦荟": "https://images.unsplash.com/photo-1545241047-6083a3684587?w=400",
    "文竹": "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=400",
    "非洲紫罗兰": "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400",
    "红掌": "https://images.unsplash.com/photo-1545241047-6083a3684587?w=400",
    "散尾葵": "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400",
    "秋海棠": "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400",
    "天堂鸟": "https://images.unsplash.com/photo-1545241047-6083a3684587?w=400",
    "鸟巢蕨": "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=400",
    "波士顿蕨": "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=400",
    "竹芋": "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400",
    "一叶兰": "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400",
    "金钱草": "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400",
    "万年青": "https://images.unsplash.com/photo-1545241047-6083a3684587?w=400",
    "蟹爪兰": "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400",
    "菊花": "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400",
    "浪星竹芋": "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400",
    "水仙": "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400",
    "龙血树": "https://images.unsplash.com/photo-1545241047-6083a3684587?w=400",
    "黛粉叶": "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=400",
    "海芋": "https://images.unsplash.com/photo-1545241047-6083a3684587?w=400",
    "常春藤": "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400",
    "风信子": "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400",
    "铁十字秋海棠": "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400",
    "玉树": "https://images.unsplash.com/photo-1545241047-6083a3684587?w=400",
    "长寿花": "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400",
    "萱草": "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400",
    "铃兰": "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400",
    "棕竹": "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400",
    "白掌": "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400",
    "一品红": "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400",
    "酒瓶兰": "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=400",
    "兰花": "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400",
    "竹节秋海棠": "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400",
    "响尾蛇竹芋": "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400",
    "橡皮树": "https://images.unsplash.com/photo-1545241047-6083a3684587?w=400",
    "苏铁": "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=400",
    "鹅掌柴": "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400",
    "紫露草": "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400",
    "郁金香": "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400",
    "捕蝇草": "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=400",
    "丝兰": "https://images.unsplash.com/photo-1545241047-6083a3684587?w=400",
    "金钱树": "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400",
    "红斑竹叶": "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400",
}

BASE_DIR = "/Users/ember/Flower_Guardian/backend/static/plants"

def download_images():
    """下载所有图片"""
    os.makedirs(BASE_DIR, exist_ok=True)

    results = []

    for name, url in PLANT_IMAGE_URLS.items():
        # 生成文件名（使用植物名称拼音首字母或编号）
        safe_name = name.replace(" ", "_")
        filename = f"{safe_name}.jpg"
        filepath = os.path.join(BASE_DIR, filename)

        try:
            print(f"下载 {name}: {url}")
            urllib.request.urlretrieve(url, filepath)
            # 返回相对路径用于数据库
            local_url = f"/static/plants/{filename}"
            results.append((name, local_url))
            print(f"  -> 保存到: {local_url}")
        except Exception as e:
            print(f"  -> 下载失败: {e}")

    # 输出 SQL 语句
    print("\n\n=== 数据库更新 SQL ===")
    for name, url in results:
        print(f"UPDATE plants SET image_url = '{url}' WHERE name = '{name}';")

if __name__ == "__main__":
    download_images()