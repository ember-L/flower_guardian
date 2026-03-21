# 我的花园功能优化实现计划

> **For Claude:** 直接执行此实现计划

**Goal:** 优化"我的花园"页面，添加植物照片、智能提醒、AI病虫害识别、统计概览、养护日历功能

**Architecture:**
- 后端：新增 PlantPhoto 模型和统计 API，前端图片上传
- 前端：增强 GardenScreen 和 PlantDetailScreen，添加统计卡片和日历组件

**Tech Stack:** React Native (Expo), FastAPI, SQLAlchemy

---

## 阶段一：后端模型和 API

### Task 1: 添加 PlantPhoto 模型

**Files:**
- Modify: `backend/app/models/plant.py`

**Step 1: 添加 PlantPhoto 模型**

在文件末尾添加：

```python
class PlantPhoto(Base):
    __tablename__ = "plant_photos"

    id = Column(Integer, primary_key=True, index=True)
    user_plant_id = Column(Integer, ForeignKey("user_plants.id"))
    photo_url = Column(String(255))
    photo_type = Column(String(20))  # cover/growth/care
    description = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)

    user_plant = relationship("UserPlant", back_populates="plant_photos")
```

**Step 2: 更新 UserPlant 模型添加关系**

在 UserPlant 类中添加：

```python
plant_photos = relationship("PlantPhoto", back_populates="user_plant")
```

---

### Task 2: 添加统计和日历 API

**Files:**
- Modify: `backend/app/api/endpoints/plants.py`

**Step 1: 添加统计端点**

在 `plants.py` 文件末尾添加：

```python
from datetime import datetime, timedelta
from calendar import monthrange

@router.get("/my/stats")
def get_garden_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    """获取花园统计数据"""
    if not current_user:
        return {
            "total_plants": 0,
            "this_month_cares": 0,
            "health_distribution": {"good": 0, "fair": 0, "sick": 0},
            "location_distribution": {}
        }

    # 植物总数
    plants = db.query(UserPlant).filter(UserPlant.user_id == current_user.id).all()
    total_plants = len(plants)

    # 本月养护次数
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    care_count = db.query(CareRecord).join(UserPlant).filter(
        UserPlant.user_id == current_user.id,
        CareRecord.created_at >= month_start
    ).count()

    # 健康状态分布
    health_dist = {"good": 0, "fair": 0, "sick": 0}
    latest_health = db.query(HealthRecord).join(UserPlant).filter(
        UserPlant.user_id == current_user.id
    ).order_by(HealthRecord.created_at.desc()).all()

    # 取每个植物的最新健康状态
    latest_by_plant = {}
    for h in latest_health:
        if h.user_plant_id not in latest_by_plant:
            latest_by_plant[h.user_plant_id] = h.health_status

    for status in latest_by_plant.values():
        if status in health_dist:
            health_dist[status] += 1

    # 位置分布
    loc_dist = {}
    for p in plants:
        loc = p.location or 'other'
        loc_dist[loc] = loc_dist.get(loc, 0) + 1

    return {
        "total_plants": total_plants,
        "this_month_cares": care_count,
        "health_distribution": health_dist,
        "location_distribution": loc_dist
    }


@router.get("/my/calendar")
def get_care_calendar(
    year: int = Query(default=None),
    month: int = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    """获取养护日历数据"""
    if not current_user:
        return {"days": []}

    now = datetime.utcnow()
    year = year or now.year
    month = month or now.month

    # 获取当月第一天和最后一天
    _, last_day = monthrange(year, month)
    month_start = datetime(year, month, 1)
    month_end = datetime(year, month, last_day, 23, 59, 59)

    # 获取当月所有养护记录
    records = db.query(CareRecord).join(UserPlant).filter(
        UserPlant.user_id == current_user.id,
        CareRecord.created_at >= month_start,
        CareRecord.created_at <= month_end
    ).order_by(CareRecord.created_at.desc()).all()

    # 按日期分组
    days = {}
    for r in records:
        day = r.created_at.day
        if day not in days:
            days[day] = []
        days[day].append({
            "id": r.id,
            "care_type": r.care_type,
            "notes": r.notes
        })

    return {"year": year, "month": month, "days": days}
```

**Step 2: 添加照片上传端点**

```python
from fastapi import UploadFile, File
import os
import uuid

@router.post("/my/{user_plant_id}/photo")
async def upload_plant_photo(
    user_plant_id: int,
    photo_type: str = Query("growth"),
    description: str = Query(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    """上传植物照片"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # 验证植物归属
    plant = db.query(UserPlant).filter(
        UserPlant.id == user_plant_id,
        UserPlant.user_id == current_user.id
    ).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    # 保存文件
    upload_dir = "backend/uploads/plants"
    os.makedirs(upload_dir, exist_ok=True)

    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(upload_dir, filename)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    # 保存记录
    photo = PlantPhoto(
        user_plant_id=user_plant_id,
        photo_url=f"/uploads/plants/{filename}",
        photo_type=photo_type,
        description=description
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)

    return {"id": photo.id, "photo_url": photo.photo_url}


@router.get("/my/{user_plant_id}/photos")
def get_plant_photos(
    user_plant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    """获取植物照片列表"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    photos = db.query(PlantPhoto).filter(
        PlantPhoto.user_plant_id == user_plant_id
    ).order_by(PlantPhoto.created_at.desc()).all()

    return photos
```

---

### Task 3: 添加提醒管理 API

**Step 1: 添加提醒 CRUD**

```python
@router.get("/my/{user_plant_id}/reminders")
def get_plant_reminders(
    user_plant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    """获取植物提醒设置"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    reminders = db.query(Reminder).filter(
        Reminder.user_plant_id == user_plant_id,
        Reminder.user_id == current_user.id
    ).all()

    return reminders


@router.put("/my/{user_plant_id}/reminders")
def update_plant_reminder(
    user_plant_id: int,
    reminder_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    """更新植物提醒设置"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    reminder = db.query(Reminder).filter(
        Reminder.user_plant_id == user_plant_id,
        Reminder.user_id == current_user.id,
        Reminder.type == reminder_data.get("type")
    ).first()

    if not reminder:
        # 创建新提醒
        reminder = Reminder(
            user_id=current_user.id,
            user_plant_id=user_plant_id,
            type=reminder_data.get("type"),
            interval_days=reminder_data.get("interval_days", 7),
            enabled=reminder_data.get("enabled", True)
        )
        db.add(reminder)
    else:
        reminder.interval_days = reminder_data.get("interval_days", reminder.interval_days)
        reminder.enabled = reminder_data.get("enabled", reminder.enabled)

    db.commit()
    db.refresh(reminder)

    return reminder
```

---

## 阶段二：前端服务层

### Task 4: 更新 plantService

**Files:**
- Modify: `APP/src/services/plantService.ts`

**Step 1: 添加新类型**

在文件末尾添加：

```typescript
// 植物照片
export interface PlantPhoto {
  id: number;
  user_plant_id: number;
  photo_url: string;
  photo_type: 'cover' | 'growth' | 'care';
  description?: string;
  created_at: string;
}

// 花园统计
export interface GardenStats {
  total_plants: number;
  this_month_cares: number;
  health_distribution: {
    good: number;
    fair: number;
    sick: number;
  };
  location_distribution: Record<string, number>;
}

// 日历数据
export interface CalendarData {
  year: number;
  month: number;
  days: Record<number, Array<{
    id: number;
    care_type: string;
    notes?: string;
  }>>;
}

// 提醒设置
export interface PlantReminder {
  id: number;
  user_plant_id: number;
  type: string;
  interval_days: number;
  enabled: boolean;
  last_done?: string;
  next_due?: string;
}
```

**Step 2: 添加新 API 方法**

```typescript
// 获取花园统计
export const getGardenStats = async (): Promise<GardenStats> => {
  const response = await api.get('/api/plants/my/stats');
  return response.data;
};

// 获取养护日历
export const getCareCalendar = async (year?: number, month?: number): Promise<CalendarData> => {
  const response = await api.get('/api/plants/my/calendar', { params: { year, month } });
  return response.data;
};

// 上传植物照片
export const uploadPlantPhoto = async (plantId: number, file: FormData, photoType: string = 'growth'): Promise<PlantPhoto> => {
  const response = await api.post(`/api/plants/my/${plantId}/photo?photo_type=${photoType}`, file, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// 获取植物照片
export const getPlantPhotos = async (plantId: number): Promise<PlantPhoto[]> => {
  const response = await api.get(`/api/plants/my/${plantId}/photos`);
  return response.data;
};

// 获取植物提醒
export const getPlantReminders = async (plantId: number): Promise<PlantReminder[]> => {
  const response = await api.get(`/api/plants/my/${plantId}/reminders`);
  return response.data;
};

// 更新植物提醒
export const updatePlantReminder = async (plantId: number, data: Partial<PlantReminder>): Promise<PlantReminder> => {
  const response = await api.put(`/api/plants/my/${plantId}/reminders`, data);
  return response.data;
};
```

---

## 阶段三：前端 UI 改造

### Task 5: 增强 GardenScreen - 统计卡片和日历

**Files:**
- Modify: `APP/src/screens/GardenScreen.tsx`

**Step 1: 添加状态和导入**

在组件开头添加：

```typescript
import { GardenStats, CalendarData, getGardenStats, getCareCalendar } from '../services/plantService';

// 添加新状态
const [stats, setStats] = useState<GardenStats | null>(null);
const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
```

**Step 2: 添加数据加载**

在 `loadPlants` 函数后添加：

```typescript
const loadStats = async () => {
  try {
    const [statsData, calendarData] = await Promise.all([
      getGardenStats(),
      getCareCalendar()
    ]);
    setStats(statsData);
    setCalendarData(calendarData);
  } catch (error) {
    console.error('[Garden] Failed to load stats:', error);
  }
};

useEffect(() => {
  if (isLoggedIn) {
    loadPlants();
    loadStats();
  }
}, [isLoggedIn]);
```

**Step 3: 添加统计卡片组件**

在 header 后添加：

```typescript
{/* 统计卡片 */}
{stats && (
  <View style={styles.statsContainer}>
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{stats.total_plants}</Text>
      <Text style={styles.statLabel}>植物总数</Text>
    </View>
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{stats.this_month_cares}</Text>
      <Text style={styles.statLabel}>本月养护</Text>
    </View>
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color: colors.success }]}>
        {stats.health_distribution.good}
      </Text>
      <Text style={styles.statLabel}>健康</Text>
    </View>
  </View>
)}
```

**Step 4: 添加日历条**

在统计卡片后添加：

```typescript
{/* 日历条 */}
<View style={styles.calendarContainer}>
  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
    {calendarData?.days && Object.entries(calendarData.days).map(([day, records]) => (
      <TouchableOpacity key={day} style={styles.calendarDay}>
        <Text style={styles.calendarDayText}>{day}</Text>
        {records.length > 0 && <View style={styles.calendarDot} />}
      </TouchableOpacity>
    ))}
  </ScrollView>
</View>
```

**Step 5: 添加样式**

```typescript
statsContainer: {
  flexDirection: 'row',
  paddingHorizontal: spacing.lg,
  marginBottom: spacing.md,
  gap: spacing.sm,
},
statCard: {
  flex: 1,
  backgroundColor: colors.surface,
  borderRadius: 12,
  padding: spacing.md,
  alignItems: 'center',
},
statValue: {
  fontSize: 24,
  fontWeight: 'bold',
  color: colors.text,
},
statLabel: {
  fontSize: 12,
  color: colors['text-secondary'],
  marginTop: 2,
},
calendarContainer: {
  paddingHorizontal: spacing.lg,
  marginBottom: spacing.md,
},
calendarDay: {
  width: 40,
  height: 50,
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: spacing.xs,
  backgroundColor: colors.surface,
  borderRadius: 8,
},
calendarDayText: {
  fontSize: 14,
  color: colors.text,
},
calendarDot: {
  width: 6,
  height: 6,
  borderRadius: 3,
  backgroundColor: colors.primary,
  marginTop: 2,
},
```

---

### Task 6: 增强 PlantDetailScreen - 照片和 AI 诊断

**Files:**
- Modify: `APP/src/screens/PlantDetailScreen.tsx`

**Step 1: 添加导入和新状态**

```typescript
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { PlantPhoto, getPlantPhotos, uploadPlantPhoto, getPlantReminders, updatePlantReminder } from '../services/plantService';

// 添加新状态
const [photos, setPhotos] = useState<PlantPhoto[]>([]);
const [reminders, setReminders] = useState<any[]>([]);
const [showReminderModal, setShowReminderModal] = useState(false);
```

**Step 2: 添加照片上传功能**

```typescript
const handleTakePhoto = async () => {
  const result = await launchCamera({ mediaType: 'photo', quality: 0.8 });
  if (result.assets) {
    const file = new FormData();
    file.append('file', {
      uri: result.assets[0].uri,
      type: result.assets[0].type || 'image/jpeg',
      name: result.assets[0].fileName || 'photo.jpg',
    });
    const newPhoto = await uploadPlantPhoto(plantId, file, 'growth');
    setPhotos([newPhoto, ...photos]);
  }
};

const handlePickPhoto = async () => {
  const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
  if (result.assets) {
    const file = new FormData();
    file.append('file', {
      uri: result.assets[0].uri,
      type: result.assets[0].type || 'image/jpeg',
      name: result.assets[0].fileName || 'photo.jpg',
    });
    const newPhoto = await uploadPlantPhoto(plantId, file, 'growth');
    setPhotos([newPhoto, ...photos]);
  }
};
```

**Step 3: 添加 AI 诊断功能**

```typescript
const handleAIDiagnosis = () => {
  // 导航到诊断页面或打开相机进行诊断
  if (onNavigate) {
    onNavigate('Diagnosis', { fromPlant: plantId });
  }
};
```

**Step 4: 在 UI 中添加按钮**

在植物图片区域添加工具按钮：

```typescript
<View style={styles.photoActions}>
  <TouchableOpacity onPress={handleTakePhoto} style={styles.photoActionBtn}>
    <Icons.Camera size={20} color="#fff" />
    <Text style={styles.photoActionText}>拍照</Text>
  </TouchableOpacity>
  <TouchableOpacity onPress={handlePickPhoto} style={styles.photoActionBtn}>
    <Icons.Image size={20} color="#fff" />
    <Text style={styles.photoActionText}>相册</Text>
  </TouchableOpacity>
  <TouchableOpacity onPress={handleAIDiagnosis} style={[styles.photoActionBtn, { backgroundColor: colors.warning }]}>
    <Icons.Stethoscope size={20} color="#fff" />
    <Text style={styles.photoActionText}>AI诊断</Text>
  </TouchableOpacity>
</View>
```

**Step 5: 添加照片展示**

在 GrowthTab 中添加照片网格：

```typescript
{photos.length > 0 && (
  <View style={styles.photoGrid}>
    {photos.map(photo => (
      <Image key={photo.id} source={{ uri: photo.photo_url }} style={styles.photoItem} />
    ))}
  </View>
)}
```

---

### Task 7: 安装图片选择器依赖

**Step 1: 安装依赖**

```bash
cd APP
npm install react-native-image-picker
```

---

## 实现完成

运行以下命令测试：

```bash
# 后端
cd backend && uvicorn app.main:app --reload

# 前端
cd APP && npm start
```

确保在 iOS Info.plist 中添加相机权限：

```xml
<key>NSCameraUsageDescription</key>
<string>我们需要相机权限来拍摄植物照片</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>我们需要相册权限来选择植物照片</string>
```
