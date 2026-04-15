import { View, Text, ScrollView, Input } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import './index.scss'
import {
  getUserPlant,
  getCareRecords,
  addCareRecord,
  getGrowthRecords,
  addGrowthRecord,
  getHealthRecords,
  addHealthRecord,
  updateUserPlant,
  deleteMyPlant,
  type UserPlant,
  type CareRecord,
  type GrowthRecord,
  type HealthRecord,
} from '../../services/plantService'

export default function PlantDetail() {
  const router = useRouter()
  const plantId = Number(router.params.id)
  const [plant, setPlant] = useState<UserPlant | null>(null)
  const [careRecords, setCareRecords] = useState<CareRecord[]>([])
  const [growthRecords, setGrowthRecords] = useState<GrowthRecord[]>([])
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([])
  const [activeTab, setActiveTab] = useState<'care' | 'growth' | 'health'>('care')
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addType, setAddType] = useState<'care' | 'growth' | 'health'>('care')

  // 表单状态
  const [careType, setCareType] = useState('watering')
  const [careNotes, setCareNotes] = useState('')
  const [growthHeight, setGrowthHeight] = useState('')
  const [growthLeafCount, setGrowthLeafCount] = useState('')
  const [growthDescription, setGrowthDescription] = useState('')
  const [healthStatus, setHealthStatus] = useState('good')
  const [pestInfo, setPestInfo] = useState('')
  const [treatment, setTreatment] = useState('')
  const [editLocation, setEditLocation] = useState('')

  useEffect(() => {
    if (plantId) loadData()
  }, [plantId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [plantData, careData, growthData, healthData] = await Promise.all([
        getUserPlant(plantId),
        getCareRecords(plantId),
        getGrowthRecords(plantId),
        getHealthRecords(plantId),
      ])
      setPlant(plantData)
      setCareRecords(careData)
      setGrowthRecords(growthData)
      setHealthRecords(healthData)
      setEditLocation(plantData.location || '')
    } catch (error) {
      console.error('Failed to load plant data:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleAddCareRecord = async () => {
    try {
      await addCareRecord(plantId, { care_type: careType, notes: careNotes })
      const newRecords = await getCareRecords(plantId)
      setCareRecords(newRecords)
      setShowAddModal(false)
      resetForm()
      Taro.showToast({ title: '已添加养护记录', icon: 'success' })
    } catch (error) {
      Taro.showToast({ title: '无法添加记录', icon: 'none' })
    }
  }

  const handleAddGrowthRecord = async () => {
    try {
      await addGrowthRecord(plantId, {
        height: growthHeight ? parseInt(growthHeight) : undefined,
        leaf_count: growthLeafCount ? parseInt(growthLeafCount) : undefined,
        description: growthDescription,
      })
      const newRecords = await getGrowthRecords(plantId)
      setGrowthRecords(newRecords)
      setShowAddModal(false)
      resetForm()
      Taro.showToast({ title: '已添加生长记录', icon: 'success' })
    } catch (error) {
      Taro.showToast({ title: '无法添加记录', icon: 'none' })
    }
  }

  const handleAddHealthRecord = async () => {
    try {
      await addHealthRecord(plantId, {
        health_status: healthStatus,
        pest_info: pestInfo,
        treatment: treatment,
      })
      const newRecords = await getHealthRecords(plantId)
      setHealthRecords(newRecords)
      setShowAddModal(false)
      resetForm()
      Taro.showToast({ title: '已添加健康记录', icon: 'success' })
    } catch (error) {
      Taro.showToast({ title: '无法添加记录', icon: 'none' })
    }
  }

  const handleLocationChange = async (loc: string) => {
    try {
      setEditLocation(loc)
      await updateUserPlant(plantId, { location: loc })
      setPlant({ ...plant!, location: loc })
    } catch (error) {
      console.error('Failed to update location:', error)
    }
  }

  const handleDelete = () => {
    Taro.showModal({
      title: '删除植物',
      content: '确定要删除这株植物吗？',
      confirmColor: '#ff4d4f',
      success: async (res) => {
        if (res.confirm) {
          try {
            await deleteMyPlant(plantId)
            Taro.showToast({ title: '已删除', icon: 'success' })
            setTimeout(() => Taro.navigateBack(), 1000)
          } catch (error) {
            Taro.showToast({ title: '无法删除植物', icon: 'none' })
          }
        }
      },
    })
  }

  const resetForm = () => {
    setCareType('watering')
    setCareNotes('')
    setGrowthHeight('')
    setGrowthLeafCount('')
    setGrowthDescription('')
    setHealthStatus('good')
    setPestInfo('')
    setTreatment('')
  }

  const getCareTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      watering: '浇水', fertilizing: '施肥', repotting: '换盆',
      pruning: '修剪', pest_control: '杀虫',
    }
    return map[type] || type
  }

  const getHealthStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string }> = {
      good: { label: '健康', color: '#52c41a' },
      fair: { label: '一般', color: '#faad14' },
      sick: { label: '生病', color: '#ff4d4f' },
      critical: { label: '濒死', color: '#ff4d4f' },
    }
    return configs[status] || configs.good
  }

  const careTypes = [
    { value: 'watering', label: '浇水' },
    { value: 'fertilizing', label: '施肥' },
    { value: 'repotting', label: '换盆' },
    { value: 'pruning', label: '修剪' },
    { value: 'pest_control', label: '杀虫' },
  ]

  const healthStatuses = [
    { value: 'good', label: '健康', color: '#52c41a' },
    { value: 'fair', label: '一般', color: '#faad14' },
    { value: 'sick', label: '生病', color: '#ff4d4f' },
    { value: 'critical', label: '濒死', color: '#ff4d4f' },
  ]

  const locations = [
    { value: 'south-balcony', label: '南阳台' },
    { value: 'north-bedroom', label: '北卧室' },
    { value: 'living-room', label: '客厅' },
    { value: 'office', label: '办公室' },
    { value: 'other', label: '其他' },
  ]

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`
  }

  if (loading) {
    return (
      <View className='page-loading'>
        <Text className='loading-text'>加载中...</Text>
      </View>
    )
  }

  if (!plant) return null

  return (
    <View className='plant-detail'>
      {/* 头部 */}
      <View className='header'>
        <View className='header-back' onClick={() => Taro.navigateBack()}>
          <Text className='icon-back'>&lt;</Text>
        </View>
        <Text className='header-title'>{plant.nickname || plant.plant_name}</Text>
        <View className='header-delete' onClick={handleDelete}>
          <Text className='icon-delete'>X</Text>
        </View>
      </View>

      <ScrollView scrollY className='content'>
        {/* 植物基本信息卡片 */}
        <View className='info-card'>
          <View className='plant-image'>
            <Text className='plant-image-icon'>~</Text>
          </View>
          <View className='info-row'>
            <Text className='plant-name'>{plant.plant_name}</Text>
            <Text className='plant-type'>{plant.plant_type || '未知类型'}</Text>
          </View>

          {/* 位置快捷选择 */}
          <View className='location-section'>
            <Text className='location-title'>位置</Text>
            <View className='location-chips'>
              {locations.map(loc => (
                <View
                  key={loc.value}
                  className={`location-chip ${editLocation === loc.value ? 'active' : ''}`}
                  onClick={() => handleLocationChange(loc.value)}
                >
                  <Text className={`location-chip-text ${editLocation === loc.value ? 'active' : ''}`}>
                    {loc.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Tab 切换 */}
        <View className='tabs'>
          <View
            className={`tab ${activeTab === 'care' ? 'active' : ''}`}
            onClick={() => setActiveTab('care')}
          >
            <Text className={`tab-text ${activeTab === 'care' ? 'active' : ''}`}>养护记录</Text>
          </View>
          <View
            className={`tab ${activeTab === 'growth' ? 'active' : ''}`}
            onClick={() => setActiveTab('growth')}
          >
            <Text className={`tab-text ${activeTab === 'growth' ? 'active' : ''}`}>生长追踪</Text>
          </View>
          <View
            className={`tab ${activeTab === 'health' ? 'active' : ''}`}
            onClick={() => setActiveTab('health')}
          >
            <Text className={`tab-text ${activeTab === 'health' ? 'active' : ''}`}>健康记录</Text>
          </View>
        </View>

        {/* 养护记录 Tab */}
        {activeTab === 'care' && (
          <View className='tab-content'>
            <View
              className='add-record-btn'
              onClick={() => { setAddType('care'); setShowAddModal(true) }}
            >
              <Text className='add-record-icon'>+</Text>
              <Text className='add-record-text'>添加养护记录</Text>
            </View>

            {careRecords.length === 0 ? (
              <Text className='empty-text'>暂无养护记录</Text>
            ) : (
              careRecords.map(record => (
                <View key={record.id} className='record-card'>
                  <View className='record-header'>
                    <Text className='record-type'>{getCareTypeLabel(record.care_type)}</Text>
                    <Text className='record-date'>{formatDate(record.created_at)}</Text>
                  </View>
                  {record.notes && <Text className='record-notes'>{record.notes}</Text>}
                </View>
              ))
            )}
          </View>
        )}

        {/* 生长记录 Tab */}
        {activeTab === 'growth' && (
          <View className='tab-content'>
            <View
              className='add-record-btn'
              onClick={() => { setAddType('growth'); setShowAddModal(true) }}
            >
              <Text className='add-record-icon'>+</Text>
              <Text className='add-record-text'>添加生长记录</Text>
            </View>

            {growthRecords.length === 0 ? (
              <Text className='empty-text'>暂无生长记录</Text>
            ) : (
              growthRecords.map(record => (
                <View key={record.id} className='record-card'>
                  <View className='record-header'>
                    <Text className='record-date'>{formatDate(record.record_date)}</Text>
                  </View>
                  <View className='growth-stats'>
                    {record.height && <Text className='growth-stat'>高度: {record.height}cm</Text>}
                    {record.leaf_count && <Text className='growth-stat'>叶数: {record.leaf_count}</Text>}
                    {record.flower_count && <Text className='growth-stat'>花苞: {record.flower_count}</Text>}
                  </View>
                  {record.description && <Text className='record-notes'>{record.description}</Text>}
                </View>
              ))
            )}
          </View>
        )}

        {/* 健康记录 Tab */}
        {activeTab === 'health' && (
          <View className='tab-content'>
            <View
              className='add-record-btn'
              onClick={() => { setAddType('health'); setShowAddModal(true) }}
            >
              <Text className='add-record-icon'>+</Text>
              <Text className='add-record-text'>添加健康记录</Text>
            </View>

            {healthRecords.length === 0 ? (
              <Text className='empty-text'>暂无健康记录</Text>
            ) : (
              healthRecords.map(record => {
                const statusConfig = getHealthStatusConfig(record.health_status)
                return (
                  <View key={record.id} className='record-card'>
                    <View className='record-header'>
                      <View className='status-badge' style={{ backgroundColor: statusConfig.color }}>
                        <Text className='status-badge-text'>{statusConfig.label}</Text>
                      </View>
                      <Text className='record-date'>{formatDate(record.created_at)}</Text>
                    </View>
                    {record.pest_info && <Text className='record-notes'>病虫害: {record.pest_info}</Text>}
                    {record.treatment && <Text className='record-notes'>治疗措施: {record.treatment}</Text>}
                  </View>
                )
              })
            )}
          </View>
        )}

        <View className='bottom-spacer' />
      </ScrollView>

      {/* 添加记录弹窗 */}
      {showAddModal && (
        <View className='modal-overlay' onClick={() => setShowAddModal(false)}>
          <View className='modal-content' onClick={(e) => e.stopPropagation()}>
            <View className='modal-header'>
              <Text className='modal-title'>
                添加{addType === 'care' ? '养护' : addType === 'growth' ? '生长' : '健康'}记录
              </Text>
              <View className='modal-close' onClick={() => setShowAddModal(false)}>
                <Text className='modal-close-text'>X</Text>
              </View>
            </View>

            {/* 养护记录表单 */}
            {addType === 'care' && (
              <>
                <Text className='input-label'>养护类型</Text>
                <View className='type-chips'>
                  {careTypes.map(type => (
                    <View
                      key={type.value}
                      className={`type-chip ${careType === type.value ? 'active' : ''}`}
                      onClick={() => setCareType(type.value)}
                    >
                      <Text className={`type-chip-text ${careType === type.value ? 'active' : ''}`}>
                        {type.label}
                      </Text>
                    </View>
                  ))}
                </View>
                <Text className='input-label'>备注</Text>
                <Input
                  className='form-input'
                  value={careNotes}
                  onInput={(e) => setCareNotes(e.detail.value)}
                  placeholder='可选备注'
                />
                <View className='submit-btn' onClick={handleAddCareRecord}>
                  <Text className='submit-btn-text'>保存</Text>
                </View>
              </>
            )}

            {/* 生长记录表单 */}
            {addType === 'growth' && (
              <>
                <Text className='input-label'>高度 (cm)</Text>
                <Input
                  className='form-input'
                  type='digit'
                  value={growthHeight}
                  onInput={(e) => setGrowthHeight(e.detail.value)}
                  placeholder='可选'
                />
                <Text className='input-label'>叶数</Text>
                <Input
                  className='form-input'
                  type='number'
                  value={growthLeafCount}
                  onInput={(e) => setGrowthLeafCount(e.detail.value)}
                  placeholder='可选'
                />
                <Text className='input-label'>描述</Text>
                <Input
                  className='form-input'
                  value={growthDescription}
                  onInput={(e) => setGrowthDescription(e.detail.value)}
                  placeholder='可选描述'
                />
                <View className='submit-btn' onClick={handleAddGrowthRecord}>
                  <Text className='submit-btn-text'>保存</Text>
                </View>
              </>
            )}

            {/* 健康记录表单 */}
            {addType === 'health' && (
              <>
                <Text className='input-label'>健康状态</Text>
                <View className='type-chips'>
                  {healthStatuses.map(status => (
                    <View
                      key={status.value}
                      className={`type-chip ${healthStatus === status.value ? 'active' : ''}`}
                      style={healthStatus === status.value ? { backgroundColor: status.color } : {}}
                      onClick={() => setHealthStatus(status.value)}
                    >
                      <Text className={`type-chip-text ${healthStatus === status.value ? 'active' : ''}`}>
                        {status.label}
                      </Text>
                    </View>
                  ))}
                </View>
                <Text className='input-label'>病虫害信息</Text>
                <Input
                  className='form-input'
                  value={pestInfo}
                  onInput={(e) => setPestInfo(e.detail.value)}
                  placeholder='可选'
                />
                <Text className='input-label'>治疗措施</Text>
                <Input
                  className='form-input'
                  value={treatment}
                  onInput={(e) => setTreatment(e.detail.value)}
                  placeholder='可选'
                />
                <View className='submit-btn' onClick={handleAddHealthRecord}>
                  <Text className='submit-btn-text'>保存</Text>
                </View>
              </>
            )}
          </View>
        </View>
      )}
    </View>
  )
}
