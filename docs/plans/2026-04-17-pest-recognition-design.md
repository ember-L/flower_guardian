# Flask 病虫害识别集成设计

## 概述

将病虫害识别模型集成到 Flask 应用中，实现植物识别与病虫害识别双路由。

## 架构

```
app.py
├── plant.pt 模型 (40类植物)
│   └── /detect/plant 路由
└── pest.pt 模型 (3类病虫害)
    └── /detect/pest 路由
```

## 模型配置

| 模型 | 路径 | 类别数 | 类别名称 |
|------|------|--------|---------|
| plant | `model/plant.pt` | 40 | 三叶草、仙人掌、吊兰... |
| pest | `model/pest.pt` | 3 | 叶斑病、基腐病、蚧壳虫 |

## API 设计

### POST /detect/plant
植物识别接口

**请求：** `multipart/form-data`, field: `image`

**响应：**
```json
{
  "image": "static/uploads/xxx.jpg",
  "detections": [
    {"class": "绿萝", "confidence": 0.95, "bbox": [x1, y1, x2, y2]}
  ],
  "count": 1
}
```

### POST /detect/pest
病虫害识别接口

**请求：** `multipart/form-data`, field: `image`

**响应：** 同 `/detect/plant`，但 `class` 为病虫害名称

## 实现要点

1. 启动时预加载两个模型
2. 独立路由处理不同类型识别
3. 共享上传文件夹和文件校验逻辑
4. 保持原有响应格式一致
