# 今日小贴士功能实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在首页显示今日小贴士，通过GPS获取位置，调用天气API获取气候数据，由AI生成个性化植物养护建议

**Architecture:** 前端获取GPS -> 后端调用天气API -> AI生成建议 -> 前端展示

**Tech Stack:** React Native, FastAPI, 和风天气API, Qwen AI

---

### Task 1: 后端 - 新增天气和AI建议API

**Files:**
- Create: `backend/app/api/endpoints/weather.py`

**Step 1: 创建天气API端点**

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import httpx
import logging
from app.core.config import settings

router = APIRouter(prefix="/api/weather", tags=["weather"])
logger = logging.getLogger(__name__)

# 和风天气API配置
HEFENG_KEY = "你的和风天气API密钥"  # 可从 https://dev.qweather.com/ 获取
HEFENG_BASE = "https://devapi.qweather.com/v7"

class LocationRequest(BaseModel):
    latitude: float
    longitude: float

class WeatherTipResponse(BaseModel):
    weather: dict
    tip: str

@router.post("/tips", response_model=WeatherTipResponse)
async def get_weather_tips(request: LocationRequest):
    """根据经纬度获取天气并生成AI小贴士"""
    # 1. 调用和风天气API获取天气数据
    # 2. 调用AI生成小贴士
    # 3. 返回结果
```

**Step 2: 注册路由**

修改 `backend/app/api/router.py` 添加:
```python
from app.api.endpoints import weather
router.include_router(weather.router)
```

---

### Task 2: 后端 - AI生成小贴士逻辑

**Files:**
- Modify: `backend/app/api/endpoints/weather.py`

**Step 1: 添加AI生成小贴士函数**

在 weather.py 中添加：

```python
async def generate_tip_with_ai(weather_data: dict) -> str:
    """调用AI生成植物养护小贴士"""
    # 使用现有的DASHSCOPE_API_KEY调用AI
    # 构建提示词包含天气数据
    # 返回AI生成的小贴士
```

---

### Task 3: 前端 - 安装定位和天气库

**Step 1: 安装依赖**

```bash
cd APP
npm install react-native-geolocation-service @react-native-community/geolocation
```

---

### Task 4: 前端 - 创建天气服务

**Files:**
- Create: `APP/src/services/weatherService.ts`

**Step 1: 创建天气服务**

```typescript
import { API_BASE_URL } from './config';

export interface WeatherData {
  temp: number;
  humidity: number;
  condition: string;
  airQuality: string;
  uvIndex: number;
  windSpeed: number;
}

export interface WeatherTipResponse {
  weather: WeatherData;
  tip: string;
}

export const getWeatherTips = async (latitude: number, longitude: number): Promise<WeatherTipResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/weather/tips`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ latitude, longitude }),
  });

  if (!response.ok) {
    throw new Error('获取天气失败');
  }

  return response.json();
};
```

---

### Task 5: 前端 - 首页集成今日小贴士

**Files:**
- Modify: `APP/src/screens/IdentifyScreen.tsx`

**Step 1: 添加定位和天气逻辑**

```typescript
// 引入定位和天气服务
import { getWeatherTips } from '../services/weatherService';
import Geolocation from 'react-native-geolocation-service';

// 添加状态
const [weatherTip, setWeatherTip] = useState<string>('');
const [weatherData, setWeatherData] = useState<any>(null);
const [loading, setLoading] = useState(false);

// 获取位置和天气
const fetchWeatherTip = () => {
  setLoading(true);
  Geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      getWeatherTips(latitude, longitude)
        .then(data => {
          setWeatherData(data.weather);
          setWeatherTip(data.tip);
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    },
    (error) => {
      console.error('定位失败', error);
      setLoading(false);
    },
    { enableHighAccuracy: true, timeout: 15000 }
  );
};

// 页面加载时获取
useEffect(() => {
  fetchWeatherTip();
}, []);
```

**Step 2: 修改小贴士显示区域**

替换原有的静态 tips 为动态天气小贴士：

```tsx
{/* 今日小贴士 - 天气卡片 */}
<View style={styles.weatherCard}>
  {loading ? (
    <ActivityIndicator color={colors.primary} />
  ) : weatherData ? (
    <>
      <View style={styles.weatherHeader}>
        <Text style={styles.weatherTemp}>{weatherData.temp}°C</Text>
        <Text style={styles.weatherCondition}>{weatherData.condition}</Text>
      </View>
      <Text style={styles.tipText}>{weatherTip}</Text>
    </>
  ) : (
    <Text style={styles.tipText}>点击获取今日小贴士</Text>
  )}
</View>
```

---

### Task 6: 测试完整流程

**Step 1: 测试后端API**

```bash
curl -X POST http://localhost:8000/api/weather/tips \
  -H "Content-Type: application/json" \
  -d '{"latitude": 39.9042, "longitude": 116.4074}'
```

**Step 2: 测试APP**

1. 打开APP首页
2. 允许定位权限
3. 查看天气小贴士显示

---

### 执行顺序

1. Task 1: 后端天气API
2. Task 2: AI生成逻辑
3. Task 3: 前端定位库
4. Task 4: 天气服务
5. Task 5: 首页集成
6. Task 6: 测试
