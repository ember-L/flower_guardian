# 我的花园功能完善实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 完善 APP 端"我的花园"页面，实现数据对接后端 API，添加养护记录、生长追踪、健康记录、位置管理功能

**Architecture:**
- 后端：新增 CareRecord、GrowthRecord、HealthRecord 模型和对应的 API 端点
- 前端：增强 plantService，改造 GardenScreen，新增 PlantDetailScreen

**Tech Stack:** React Native (Expo), FastAPI, SQLAlchemy

---

## 阶段一：后端模型和 API

### Task 1: 创建后端数据库模型

**Files:**
- Modify: `backend/app/models/plant.py`

**Step 1: 添加养护记录、生长记录、健康记录模型**

在 `backend/app/models/plant.py` 文件末尾添加：

```python
class CareRecord(Base):
    __tablename__ = "care_records"

    id = Column(Integer, primary_key=True, index=True)
    user_plant_id = Column(Integer, ForeignKey("user_plants.id"))
    care_type = Column(String(50))  # 养护类型: watering/fertilizing/repotting/pruning/pest_control
    notes = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)

    user_plant = relationship("UserPlant", back_populates="care_records")


class GrowthRecord(Base):
    __tablename__ = "growth_records"

    id = Column(Integer, primary_key=True, index=True)
    user_plant_id = Column(Integer, ForeignKey("user_plants.id"))
    record_date = Column(DateTime, default=datetime.utcnow)
    height = Column(Integer)  # 高度(cm)
    leaf_count = Column(Integer)  # 叶数
    flower_count = Column(Integer)  # 花苞数
    description = Column(String(255))  # 描述
    image_url = Column(String(255))  # 照片路径
    created_at = Column(DateTime, default=datetime.utcnow)

    user_plant = relationship("UserPlant", back_populates="growth_records")


class HealthRecord(Base):
    __tablename__ = "health_records"

    id = Column(Integer, primary_key=True, index=True)
    user_plant_id = Column(Integer, ForeignKey("user_plants.id"))
    health_status = Column(String(20))  # health/good/fair/sick/critical
    pest_info = Column(String(255))  # 病虫害信息
    treatment = Column(String(255))  # 治疗措施
    created_at = Column(DateTime, default=datetime.utcnow)

    user_plant = relationship("UserPlant", back_populates="health_records")
```

**Step 2: 更新 UserPlant 模型添加关系**

在 UserPlant 类中添加：

```python
# 在 reminders 和 diaries 关系后添加
care_records = relationship("CareRecord", back_populates="user_plant")
growth_records = relationship("GrowthRecord", back_populates="user_plant")
health_records = relationship("HealthRecord", back_populates="user_plant")
```

**Step 3: 运行数据库迁移**

Run: `cd backend && alembic revision --autogenerate -m "add care growth health records"`
Run: `cd backend && alembic upgrade head`

---

### Task 2: 创建 Pydantic Schemas

**Files:**
- Modify: `backend/app/schemas/plant.py`

**Step 1: 添加新的 Schema**

在 `backend/app/schemas/plant.py` 文件末尾添加：

```python
# 养护记录
class CareRecordCreate(BaseModel):
    care_type: str
    notes: Optional[str] = None


class CareRecordResponse(CareRecordCreate):
    id: int
    user_plant_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# 生长记录
class GrowthRecordCreate(BaseModel):
    height: Optional[int] = None
    leaf_count: Optional[int] = None
    flower_count: Optional[int] = None
    description: Optional[str] = None
    image_url: Optional[str] = None


class GrowthRecordResponse(GrowthRecordCreate):
    id: int
    user_plant_id: int
    record_date: datetime
    created_at: datetime

    class Config:
        from_attributes = True


# 健康记录
class HealthRecordCreate(BaseModel):
    health_status: str
    pest_info: Optional[str] = None
    treatment: Optional[str] = None


class HealthRecordResponse(HealthRecordCreate):
    id: int
    user_plant_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# 用户植物更新
class UserPlantUpdate(BaseModel):
    plant_name: Optional[str] = None
    plant_type: Optional[str] = None
    nickname: Optional[str] = None
    image_url: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None
```

---

### Task 3: 创建后端 API 端点

**Files:**
- Modify: `backend/app/api/endpoints/plants.py`

**Step 1: 更新 import**

```python
from app.schemas.plant import (
    PlantResponse, UserPlantCreate, UserPlantResponse, PlantListResponse,
    CareRecordCreate, CareRecordResponse,
    GrowthRecordCreate, GrowthRecordResponse,
    HealthRecordCreate, HealthRecordResponse,
    UserPlantUpdate
)
from app.models.plant import Plant, UserPlant, CareRecord, GrowthRecord, HealthRecord
```

**Step 2: 添加获取单个用户植物的 API**

在 `plants.py` 添加：

```python
@router.get("/my/{user_plant_id}", response_model=UserPlantResponse)
def get_user_plant(
    user_plant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_plant = db.query(UserPlant).filter(
        UserPlant.id == user_plant_id,
        UserPlant.user_id == current_user.id
    ).first()
    if not user_plant:
        raise HTTPException(status_code=404, detail="Plant not found")
    return user_plant


@router.put("/my/{user_plant_id}", response_model=UserPlantResponse)
def update_user_plant(
    user_plant_id: int,
    plant_update: UserPlantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_plant = db.query(UserPlant).filter(
        UserPlant.id == user_plant_id,
        UserPlant.user_id == current_user.id
    ).first()
    if not user_plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    update_data = plant_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user_plant, key, value)

    db.commit()
    db.refresh(user_plant)
    return user_plant
```

**Step 3: 添加养护记录 API**

```python
@router.get("/my/{user_plant_id}/care-records", response_model=list[CareRecordResponse])
def get_care_records(
    user_plant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_plant = db.query(UserPlant).filter(
        UserPlant.id == user_plant_id,
        UserPlant.user_id == current_user.id
    ).first()
    if not user_plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    records = db.query(CareRecord).filter(
        CareRecord.user_plant_id == user_plant_id
    ).order_by(CareRecord.created_at.desc()).all()
    return records


@router.post("/my/{user_plant_id}/care-records", response_model=CareRecordResponse)
def add_care_record(
    user_plant_id: int,
    care_record: CareRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_plant = db.query(UserPlant).filter(
        UserPlant.id == user_plant_id,
        UserPlant.user_id == current_user.id
    ).first()
    if not user_plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    new_record = CareRecord(
        user_plant_id=user_plant_id,
        care_type=care_record.care_type,
        notes=care_record.notes
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return new_record
```

**Step 4: 添加生长记录 API**

```python
@router.get("/my/{user_plant_id}/growth-records", response_model=list[GrowthRecordResponse])
def get_growth_records(
    user_plant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_plant = db.query(UserPlant).filter(
        UserPlant.id == user_plant_id,
        UserPlant.user_id == current_user.id
    ).first()
    if not user_plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    records = db.query(GrowthRecord).filter(
        GrowthRecord.user_plant_id == user_plant_id
    ).order_by(GrowthRecord.record_date.desc()).all()
    return records


@router.post("/my/{user_plant_id}/growth-records", response_model=GrowthRecordResponse)
def add_growth_record(
    user_plant_id: int,
    growth_record: GrowthRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_plant = db.query(UserPlant).filter(
        UserPlant.id == user_plant_id,
        UserPlant.user_id == current_user.id
    ).first()
    if not user_plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    new_record = GrowthRecord(
        user_plant_id=user_plant_id,
        height=growth_record.height,
        leaf_count=growth_record.leaf_count,
        flower_count=growth_record.flower_count,
        description=growth_record.description,
        image_url=growth_record.image_url
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return new_record
```

**Step 5: 添加健康记录 API**

```python
@router.get("/my/{user_plant_id}/health-records", response_model=list[HealthRecordResponse])
def get_health_records(
    user_plant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_plant = db.query(UserPlant).filter(
        UserPlant.id == user_plant_id,
        UserPlant.user_id == current_user.id
    ).first()
    if not user_plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    records = db.query(HealthRecord).filter(
        HealthRecord.user_plant_id == user_plant_id
    ).order_by(HealthRecord.created_at.desc()).all()
    return records


@router.post("/my/{user_plant_id}/health-records", response_model=HealthRecordResponse)
def add_health_record(
    user_plant_id: int,
    health_record: HealthRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_plant = db.query(UserPlant).filter(
        UserPlant.id == user_plant_id,
        UserPlant.user_id == current_user.id
    ).first()
    if not user_plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    new_record = HealthRecord(
        user_plant_id=user_plant_id,
        health_status=health_record.health_status,
        pest_info=health_record.pest_info,
        treatment=health_record.treatment
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return new_record
```

**Step 6: 测试 API**

Run: `cd backend && uvicorn app.main:app --reload`
Expected: 服务启动成功，无报错

---

## 阶段二：前端服务层

### Task 4: 更新 plantService

**Files:**
- Modify: `APP/src/services/plantService.ts`

**Step 1: 添加新的类型定义**

在文件末尾添加：

```typescript
// 养护记录
export interface CareRecord {
  id: number;
  user_plant_id: number;
  care_type: 'watering' | 'fertilizing' | 'repotting' | 'pruning' | 'pest_control';
  notes?: string;
  created_at: string;
}

// 生长记录
export interface GrowthRecord {
  id: number;
  user_plant_id: number;
  record_date: string;
  height?: number;
  leaf_count?: number;
  flower_count?: number;
  description?: string;
  image_url?: string;
  created_at: string;
}

// 健康记录
export interface HealthRecord {
  id: number;
  user_plant_id: number;
  health_status: 'good' | 'fair' | 'sick' | 'critical';
  pest_info?: string;
  treatment?: string;
  created_at: string;
}

// 更新用户植物
export interface UpdateUserPlant {
  plant_name?: string;
  plant_type?: string;
  nickname?: string;
  image_url?: string;
  location?: string;
  notes?: string;
}
```

**Step 2: 添加 API 方法**

```typescript
// 获取单个用户植物
export const getUserPlant = async (plantId: number): Promise<UserPlant> => {
  const response = await api.get(`/api/plants/my/${plantId}`);
  return response.data;
};

// 更新用户植物
export const updateUserPlant = async (plantId: number, data: UpdateUserPlant): Promise<UserPlant> => {
  const response = await api.put(`/api/plants/my/${plantId}`, data);
  return response.data;
};

// 获取养护记录
export const getCareRecords = async (plantId: number): Promise<CareRecord[]> => {
  const response = await api.get(`/api/plants/my/${plantId}/care-records`);
  return response.data;
};

// 添加养护记录
export const addCareRecord = async (plantId: number, data: {
  care_type: string;
  notes?: string;
}): Promise<CareRecord> => {
  const response = await api.post(`/api/plants/my/${plantId}/care-records`, data);
  return response.data;
};

// 获取生长记录
export const getGrowthRecords = async (plantId: number): Promise<GrowthRecord[]> => {
  const response = await api.get(`/api/plants/my/${plantId}/growth-records`);
  return response.data;
};

// 添加生长记录
export const addGrowthRecord = async (plantId: number, data: {
  height?: number;
  leaf_count?: number;
  flower_count?: number;
  description?: string;
  image_url?: string;
}): Promise<GrowthRecord> => {
  const response = await api.post(`/api/plants/my/${plantId}/growth-records`, data);
  return response.data;
};

// 获取健康记录
export const getHealthRecords = async (plantId: number): Promise<HealthRecord[]> => {
  const response = await api.get(`/api/plants/my/${plantId}/health-records`);
  return response.data;
};

// 添加健康记录
export const addHealthRecord = async (plantId: number, data: {
  health_status: string;
  pest_info?: string;
  treatment?: string;
}): Promise<HealthRecord> => {
  const response = await api.post(`/api/plants/my/${plantId}/health-records`, data);
  return response.data;
};
```

---

## 阶段三：前端页面改造

### Task 5: 改造 GardenScreen 连接后端

**Files:**
- Modify: `APP/src/screens/GardenScreen.tsx`

**Step 1: 添加状态和效果**

在组件开头添加：

```typescript
const [plants, setPlants] = useState<UserPlant[]>([]);
const [loading, setLoading] = useState(true);
const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

// 获取植物列表
useEffect(() => {
  loadPlants();
}, []);

const loadPlants = async () => {
  try {
    setLoading(true);
    const data = await getMyPlants();
    setPlants(data);
  } catch (error) {
    console.error('Failed to load plants:', error);
  } finally {
    setLoading(false);
  }
};

// 位置筛选
const filteredPlants = selectedLocation
  ? plants.filter(p => p.location === selectedLocation)
  : plants;

// 位置统计
const locationStats = plants.reduce((acc, plant) => {
  const loc = plant.location || 'other';
  acc[loc] = (acc[loc] || 0) + 1;
  return acc;
}, {} as Record<string, number>);
```

**Step 2: 修改植物卡片交互**

将卡片 onPress 改为导航到详情页：

```typescript
<TouchableOpacity
  onPress={() => onNavigate && onNavigate('PlantDetail', { plantId: plant.id })}
  style={styles.plantCard}
>
```

**Step 3: 替换 mock 数据为真实数据**

将 `const mockPlants = [...]` 替换为从 API 获取的数据。

**Step 4: 添加位置筛选器**

在 Header 区域添加位置筛选标签。

---

### Task 6: 创建 PlantDetailScreen

**Files:**
- Create: `APP/src/screens/PlantDetailScreen.tsx`

**Step 1: 创建植物详情页**

```typescript
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icons } from '../components/Icon';
import { colors, spacing } from '../constants/theme';
import { NavigationProps } from '../navigation/AppNavigator';
import {
  UserPlant,
  CareRecord,
  GrowthRecord,
  HealthRecord,
  getUserPlant,
  getCareRecords,
  addCareRecord,
  getGrowthRecords,
  addGrowthRecord,
  getHealthRecords,
  addHealthRecord,
  updateUserPlant,
  deleteMyPlant,
} from '../services/plantService';

interface PlantDetailScreenProps extends Partial<NavigationProps> {}

const careTypes = [
  { value: 'watering', label: '浇水', icon: 'droplets' },
  { value: 'fertilizing', label: '施肥', icon: 'leaf' },
  { value: 'repotting', label: '换盆', icon: 'package' },
  { value: 'pruning', label: '修剪', icon: 'scissors' },
  { value: 'pest_control', label: '杀虫', icon: 'bug' },
];

const healthStatuses = [
  { value: 'good', label: '健康', color: colors.success },
  { value: 'fair', label: '一般', color: colors.warning },
  { value: 'sick', label: '生病', color: colors.error },
  { value: 'critical', label: '濒死', color: colors.error },
];

const locations = [
  { value: 'south-balcony', label: '南阳台' },
  { value: 'north-bedroom', label: '北卧室' },
  { value: 'living-room', label: '客厅' },
  { value: 'office', label: '办公室' },
  { value: 'other', label: '其他' },
];

export function PlantDetailScreen({
  route,
  onNavigate,
  onTabChange,
}: PlantDetailScreenProps) {
  const plantId = (route?.params as any)?.plantId;
  const [plant, setPlant] = useState<UserPlant | null>(null);
  const [careRecords, setCareRecords] = useState<CareRecord[]>([]);
  const [growthRecords, setGrowthRecords] = useState<GrowthRecord[]>([]);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'care' | 'growth' | 'health'>('care');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<'care' | 'growth' | 'health'>('care');

  // 表单状态
  const [careType, setCareType] = useState('watering');
  const [careNotes, setCareNotes] = useState('');
  const [growthHeight, setGrowthHeight] = useState('');
  const [growthLeafCount, setGrowthLeafCount] = useState('');
  const [growthDescription, setGrowthDescription] = useState('');
  const [healthStatus, setHealthStatus] = useState('good');
  const [pestInfo, setPestInfo] = useState('');
  const [treatment, setTreatment] = useState('');
  const [editLocation, setEditLocation] = useState('');

  useEffect(() => {
    loadData();
  }, [plantId]);

  const loadData = async () => {
    try {
      const [plantData, careData, growthData, healthData] = await Promise.all([
        getUserPlant(plantId),
        getCareRecords(plantId),
        getGrowthRecords(plantId),
        getHealthRecords(plantId),
      ]);
      setPlant(plantData);
      setCareRecords(careData);
      setGrowthRecords(growthData);
      setHealthRecords(healthData);
      setEditLocation(plantData.location || '');
    } catch (error) {
      console.error('Failed to load plant data:', error);
      Alert.alert('加载失败', '无法获取植物信息');
    }
  };

  const handleAddCareRecord = async () => {
    try {
      await addCareRecord(plantId, { care_type: careType, notes: careNotes });
      const newRecords = await getCareRecords(plantId);
      setCareRecords(newRecords);
      setShowAddModal(false);
      resetForm();
      Alert.alert('成功', '已添加养护记录');
    } catch (error) {
      Alert.alert('失败', '无法添加记录');
    }
  };

  const handleAddGrowthRecord = async () => {
    try {
      await addGrowthRecord(plantId, {
        height: growthHeight ? parseInt(growthHeight) : undefined,
        leaf_count: growthLeafCount ? parseInt(growthLeafCount) : undefined,
        description: growthDescription,
      });
      const newRecords = await getGrowthRecords(plantId);
      setGrowthRecords(newRecords);
      setShowAddModal(false);
      resetForm();
      Alert.alert('成功', '已添加生长记录');
    } catch (error) {
      Alert.alert('失败', '无法添加记录');
    }
  };

  const handleAddHealthRecord = async () => {
    try {
      await addHealthRecord(plantId, {
        health_status: healthStatus,
        pest_info: pestInfo,
        treatment: treatment,
      });
      const newRecords = await getHealthRecords(plantId);
      setHealthRecords(newRecords);
      setShowAddModal(false);
      resetForm();
      Alert.alert('成功', '已添加健康记录');
    } catch (error) {
      Alert.alert('失败', '无法添加记录');
    }
  };

  const handleUpdateLocation = async () => {
    try {
      await updateUserPlant(plantId, { location: editLocation });
      setPlant({ ...plant!, location: editLocation });
      Alert.alert('成功', '位置已更新');
    } catch (error) {
      Alert.alert('失败', '无法更新位置');
    }
  };

  const handleDelete = () => {
    Alert.alert('删除植物', '确定要删除这株植物吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMyPlant(plantId);
            onTabChange && onTabChange('Garden');
          } catch (error) {
            Alert.alert('失败', '无法删除植物');
          }
        },
      },
    ]);
  };

  const resetForm = () => {
    setCareType('watering');
    setCareNotes('');
    setGrowthHeight('');
    setGrowthLeafCount('');
    setGrowthDescription('');
    setHealthStatus('good');
    setPestInfo('');
    setTreatment('');
  };

  const getCareTypeLabel = (type: string) => {
    return careTypes.find(c => c.value === type)?.label || type;
  };

  const getHealthStatusConfig = (status: string) => {
    return healthStatuses.find(h => h.value === status) || healthStatuses[0];
  };

  if (!plant) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>加载中...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onTabChange && onTabChange('Garden')} style={styles.backButton}>
          <Icons.ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{plant.nickname || plant.plant_name}</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Icons.Trash2 size={20} color={colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 植物基本信息 */}
        <View style={styles.infoCard}>
          <View style={styles.plantImage}>
            <Icons.Flower2 size={60} color="rgba(255,255,255,0.3)" />
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.plantName}>{plant.plant_name}</Text>
            <Text style={styles.plantType}>{plant.plant_type || '未知类型'}</Text>
          </View>

          {/* 位置编辑 */}
          <View style={styles.locationRow}>
            <Text style={styles.locationLabel}>位置：</Text>
            <TextInput
              value={editLocation}
              onChangeText={setEditLocation}
              onBlur={handleUpdateLocation}
              style={styles.locationInput}
              placeholder="选择位置"
            />
          </View>

          {/* 位置快捷选择 */}
          <View style={styles.locationChips}>
            {locations.map(loc => (
              <TouchableOpacity
                key={loc.value}
                onPress={() => {
                  setEditLocation(loc.value);
                  updateUserPlant(plantId, { location: loc.value }).then(() => {
                    setPlant({ ...plant, location: loc.value });
                  });
                }}
                style={[
                  styles.locationChip,
                  editLocation === loc.value && styles.locationChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.locationChipText,
                    editLocation === loc.value && styles.locationChipTextActive,
                  ]}
                >
                  {loc.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tab 切换 */}
        <View style={styles.tabs}>
          <TouchableOpacity
            onPress={() => setActiveTab('care')}
            style={[styles.tab, activeTab === 'care' && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === 'care' && styles.tabTextActive]}>
              养护记录
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('growth')}
            style={[styles.tab, activeTab === 'growth' && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === 'growth' && styles.tabTextActive]}>
              生长追踪
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('health')}
            style={[styles.tab, activeTab === 'health' && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === 'health' && styles.tabTextActive]}>
              健康记录
            </Text>
          </TouchableOpacity>
        </View>

        {/* 养护记录 Tab */}
        {activeTab === 'care' && (
          <View style={styles.tabContent}>
            <TouchableOpacity
              onPress={() => {
                setAddType('care');
                setShowAddModal(true);
              }}
              style={styles.addRecordButton}
            >
              <Icons.Plus size={18} color={colors.primary} />
              <Text style={styles.addRecordText}>添加养护记录</Text>
            </TouchableOpacity>

            {careRecords.length === 0 ? (
              <Text style={styles.emptyText}>暂无养护记录</Text>
            ) : (
              careRecords.map(record => (
                <View key={record.id} style={styles.recordCard}>
                  <View style={styles.recordHeader}>
                    <Text style={styles.recordType}>{getCareTypeLabel(record.care_type)}</Text>
                    <Text style={styles.recordDate}>
                      {new Date(record.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  {record.notes && <Text style={styles.recordNotes}>{record.notes}</Text>}
                </View>
              ))
            )}
          </View>
        )}

        {/* 生长记录 Tab */}
        {activeTab === 'growth' && (
          <View style={styles.tabContent}>
            <TouchableOpacity
              onPress={() => {
                setAddType('growth');
                setShowAddModal(true);
              }}
              style={styles.addRecordButton}
            >
              <Icons.Plus size={18} color={colors.primary} />
              <Text style={styles.addRecordText}>添加生长记录</Text>
            </TouchableOpacity>

            {growthRecords.length === 0 ? (
              <Text style={styles.emptyText}>暂无生长记录</Text>
            ) : (
              growthRecords.map(record => (
                <View key={record.id} style={styles.recordCard}>
                  <View style={styles.recordHeader}>
                    <Text style={styles.recordDate}>
                      {new Date(record.record_date).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.growthStats}>
                    {record.height && (
                      <Text style={styles.growthStat}>高度: {record.height}cm</Text>
                    )}
                    {record.leaf_count && (
                      <Text style={styles.growthStat}>叶数: {record.leaf_count}</Text>
                    )}
                    {record.flower_count && (
                      <Text style={styles.growthStat}>花苞: {record.flower_count}</Text>
                    )}
                  </View>
                  {record.description && (
                    <Text style={styles.recordNotes}>{record.description}</Text>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {/* 健康记录 Tab */}
        {activeTab === 'health' && (
          <View style={styles.tabContent}>
            <TouchableOpacity
              onPress={() => {
                setAddType('health');
                setShowAddModal(true);
              }}
              style={styles.addRecordButton}
            >
              <Icons.Plus size={18} color={colors.primary} />
              <Text style={styles.addRecordText}>添加健康记录</Text>
            </TouchableOpacity>

            {healthRecords.length === 0 ? (
              <Text style={styles.emptyText}>暂无健康记录</Text>
            ) : (
              healthRecords.map(record => {
                const statusConfig = getHealthStatusConfig(record.health_status);
                return (
                  <View key={record.id} style={styles.recordCard}>
                    <View style={styles.recordHeader}>
                      <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
                        <Text style={styles.statusBadgeText}>{statusConfig.label}</Text>
                      </View>
                      <Text style={styles.recordDate}>
                        {new Date(record.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    {record.pest_info && (
                      <Text style={styles.recordNotes}>病虫害: {record.pest_info}</Text>
                    )}
                    {record.treatment && (
                      <Text style={styles.recordNotes}>治疗措施: {record.treatment}</Text>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* 添加记录弹窗 */}
      <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                添加{addType === 'care' ? '养护' : addType === 'growth' ? '生长' : '健康'}记录
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Icons.X size={24} color={colors['text-tertiary']} />
              </TouchableOpacity>
            </View>

            {/* 养护记录表单 */}
            {addType === 'care' && (
              <>
                <Text style={styles.inputLabel}>养护类型</Text>
                <View style={styles.typeChips}>
                  {careTypes.map(type => (
                    <TouchableOpacity
                      key={type.value}
                      onPress={() => setCareType(type.value)}
                      style={[styles.typeChip, careType === type.value && styles.typeChipActive]}
                    >
                      <Text style={[styles.typeChipText, careType === type.value && styles.typeChipTextActive]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.inputLabel}>备注</Text>
                <TextInput
                  value={careNotes}
                  onChangeText={setCareNotes}
                  placeholder="可选备注"
                  style={styles.input}
                  multiline
                />
                <TouchableOpacity onPress={handleAddCareRecord} style={styles.submitButton}>
                  <Text style={styles.submitButtonText}>保存</Text>
                </TouchableOpacity>
              </>
            )}

            {/* 生长记录表单 */}
            {addType === 'growth' && (
              <>
                <Text style={styles.inputLabel}>高度 (cm)</Text>
                <TextInput
                  value={growthHeight}
                  onChangeText={setGrowthHeight}
                  placeholder="可选"
                  keyboardType="numeric"
                  style={styles.input}
                />
                <Text style={styles.inputLabel}>叶数</Text>
                <TextInput
                  value={growthLeafCount}
                  onChangeText={setGrowthLeafCount}
                  placeholder="可选"
                  keyboardType="numeric"
                  style={styles.input}
                />
                <Text style={styles.inputLabel}>描述</Text>
                <TextInput
                  value={growthDescription}
                  onChangeText={setGrowthDescription}
                  placeholder="可选描述"
                  style={styles.input}
                  multiline
                />
                <TouchableOpacity onPress={handleAddGrowthRecord} style={styles.submitButton}>
                  <Text style={styles.submitButtonText}>保存</Text>
                </TouchableOpacity>
              </>
            )}

            {/* 健康记录表单 */}
            {addType === 'health' && (
              <>
                <Text style={styles.inputLabel}>健康状态</Text>
                <View style={styles.typeChips}>
                  {healthStatuses.map(status => (
                    <TouchableOpacity
                      key={status.value}
                      onPress={() => setHealthStatus(status.value)}
                      style={[
                        styles.typeChip,
                        healthStatus === status.value && { backgroundColor: status.color },
                      ]}
                    >
                      <Text
                        style={[
                          styles.typeChipText,
                          healthStatus === status.value && styles.typeChipTextActive,
                        ]}
                      >
                        {status.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.inputLabel}>病虫害信息</Text>
                <TextInput
                  value={pestInfo}
                  onChangeText={setPestInfo}
                  placeholder="可选"
                  style={styles.input}
                />
                <Text style={styles.inputLabel}>治疗措施</Text>
                <TextInput
                  value={treatment}
                  onChangeText={setTreatment}
                  placeholder="可选"
                  style={styles.input}
                />
                <TouchableOpacity onPress={handleAddHealthRecord} style={styles.submitButton}>
                  <Text style={styles.submitButtonText}>保存</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { padding: spacing.xs },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, flex: 1, textAlign: 'center' },
  deleteButton: { padding: spacing.xs },
  content: { flex: 1 },
  infoCard: { margin: spacing.lg, backgroundColor: colors.surface, borderRadius: 16, overflow: 'hidden' },
  plantImage: { height: 180, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  infoRow: { padding: spacing.md },
  plantName: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  plantType: { fontSize: 14, color: colors['text-secondary'], marginTop: spacing.xs },
  locationRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  locationLabel: { fontSize: 14, color: colors['text-secondary'] },
  locationInput: { flex: 1, fontSize: 14, color: colors.text, padding: spacing.xs },
  locationChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, padding: spacing.md, paddingTop: 0 },
  locationChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 16, backgroundColor: colors.background },
  locationChipActive: { backgroundColor: colors.primary },
  locationChipText: { fontSize: 12, color: colors['text-secondary'] },
  locationChipTextActive: { color: '#fff' },
  tabs: { flexDirection: 'row', marginHorizontal: spacing.lg, marginBottom: spacing.md },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { fontSize: 14, color: colors['text-tertiary'] },
  tabTextActive: { color: colors.primary, fontWeight: '600' },
  tabContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl * 2 },
  addRecordButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, padding: spacing.md, borderWidth: 1, borderColor: colors.primary, borderRadius: 12, marginBottom: spacing.md },
  addRecordText: { color: colors.primary, fontWeight: '500' },
  emptyText: { textAlign: 'center', color: colors['text-tertiary'], paddingVertical: spacing.xl },
  recordCard: { backgroundColor: colors.surface, borderRadius: 12, padding: spacing.md, marginBottom: spacing.sm },
  recordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  recordType: { fontSize: 16, fontWeight: '600', color: colors.text },
  recordDate: { fontSize: 12, color: colors['text-tertiary'] },
  recordNotes: { fontSize: 14, color: colors['text-secondary'], marginTop: spacing.xs },
  growthStats: { flexDirection: 'row', gap: spacing.md },
  growthStat: { fontSize: 14, color: colors['text-secondary'] },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 8 },
  statusBadgeText: { fontSize: 12, color: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  inputLabel: { fontSize: 14, color: colors['text-secondary'], marginBottom: spacing.xs, marginTop: spacing.sm },
  input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: spacing.md, paddingVertical: spacing.md, color: colors.text, marginBottom: spacing.sm },
  typeChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  typeChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 20, backgroundColor: colors.background },
  typeChipActive: { backgroundColor: colors.primary },
  typeChipText: { fontSize: 14, color: colors['text-secondary'] },
  typeChipTextActive: { color: '#fff' },
  submitButton: { backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: 12, alignItems: 'center', marginTop: spacing.lg },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
```

---

### Task 7: 添加路由导航

**Files:**
- Modify: `APP/src/navigation/AppNavigator.tsx`

**Step 1: 导入 PlantDetailScreen**

```typescript
import { PlantDetailScreen } from '../screens/PlantDetailScreen';
```

**Step 2: 在 AppNavigator 中添加路由**

在 navigation state 处理中添加：

```typescript
case 'PlantDetail':
  return <PlantDetailScreen route={route} onNavigate={handleNavigate} onTabChange={handleTabChange} />;
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

---

**Plan complete and saved to `docs/plans/2026-03-17-garden-feature-design.md`**

Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
