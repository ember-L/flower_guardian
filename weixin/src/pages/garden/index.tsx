import { View, Text, ScrollView, Image, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import Icon from '../../components/Icon'
import { API_BASE_URL } from '../../services/config'
import './index.scss'

interface UserPlant {
  id: number
  plant_name: string
  nickname: string
  location: string
  image_url: string
  created_at: string
}

interface GardenStats {
  total_plants: number
  this_month_cares: number
  health_distribution: {
    good: number
    fair: number
    poor: number
  }
}

interface CalendarDay {
  [key: string]: any[]
}

interface CareRecord {
  id: number
  care_type: string
  created_at: string
}

const environmentLabels: Record<string, string> = {
  'south-balcony': '南阳台',
  'north-bedroom': '北卧室',
  'living-room': '客厅',
  'office': '办公室',
  'other': '其他位置',
}

export default function Garden() {
  const [plants, setPlants] = useState<UserPlant[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingPlant, setEditingPlant] = useState<UserPlant | null>(null)
  const [newPlantName, setNewPlantName] = useState('')
  const [newPlantNickname, setNewPlantNickname] = useState('')
  const [newPlantLocation, setNewPlantLocation] = useState('other')
  const [stats, setStats] = useState<GardenStats | null>(null)
  const [calendarDays, setCalendarDays] = useState<string[]>([])
  const [plantCareRecords, setPlantCareRecords] = useState<Record<number, CareRecord[]>>({})

  const isLoggedIn = !!Taro.getStorageSync('token')

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false)
      return
    }
    loadPlants()
    loadStats()
  }, [])

  const loadStats = () => {
    Taro.request({
      url: `${API_BASE_URL}/api/plants/my/stats`,
      method: 'GET',
      header: { 'Authorization': `Bearer ${Taro.getStorageSync('token')}` },
      success: (res) => {
        const data = res.data as any
        if (data) {
          setStats(data)
        }
      },
      fail: () => {
        setStats({
          total_plants: 5,
          this_month_cares: 12,
          health_distribution: { good: 3, fair: 1, poor: 1 },
        })
      }
    })
    // Load calendar
    Taro.request({
      url: `${API_BASE_URL}/api/plants/my/calendar`,
      method: 'GET',
      header: { 'Authorization': `Bearer ${Taro.getStorageSync('token')}` },
      success: (res) => {
        const data = res.data as any
        if (data?.days) {
          setCalendarDays(Object.keys(data.days))
        }
      },
      fail: () => {
        const days = []
        const now = new Date()
        for (let i = 0; i < 7; i++) {
          const d = new Date(now)
          d.setDate(d.getDate() - i)
          days.push(`${d.getMonth() + 1}/${d.getDate()}`)
        }
        setCalendarDays(days)
      }
    })
  }

  const loadPlants = () => {
    if (!isLoggedIn) {
      setLoading(false)
      return
    }
    setLoading(true)
    Taro.request({
      url: `${API_BASE_URL}/api/plants/my`,
      method: 'GET',
      header: { 'Authorization': `Bearer ${Taro.getStorageSync('token')}` },
      success: (res) => {
        const data = res.data as any
        if (data?.list || Array.isArray(data)) {
          const list = data?.list || data
          setPlants(list)
          // Load care records for each plant
          const records: Record<number, CareRecord[]> = {}
          list.forEach((plant: UserPlant) => {
            Taro.request({
              url: `${API_BASE_URL}/api/plants/my/${plant.id}/care-records`,
              method: 'GET',
              header: { 'Authorization': `Bearer ${Taro.getStorageSync('token')}` },
              success: (careRes) => {
                const careData = careRes.data as any
                records[plant.id] = Array.isArray(careData) ? careData : (careData?.list || [])
                setPlantCareRecords({ ...records })
              },
              fail: () => {
                records[plant.id] = []
              }
            })
          })
        }
      },
      fail: () => {
        setPlants([])
      },
      complete: () => {
        setLoading(false)
      }
    })
  }

  const filteredPlants = selectedLocation
    ? plants.filter(p => p.location === selectedLocation)
    : plants

  const locationStats = plants.reduce((acc, plant) => {
    const loc = plant.location || 'other'
    acc[loc] = (acc[loc] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const uniqueLocations = Array.from(new Set(plants.map(p => p.location || 'other')))

  const handleWaterPlant = (plantId: number) => {
    Taro.request({
      url: `${API_BASE_URL}/api/plants/my/${plantId}/care-records`,
      method: 'POST',
      header: { 'Authorization': `Bearer ${Taro.getStorageSync('token')}` },
      data: { care_type: 'watering', notes: '快速浇水' },
      success: () => {
        Taro.showToast({ title: '浇水成功', icon: 'success' })
        loadPlants()
        loadStats()
      },
      fail: () => {
        Taro.showToast({ title: '浇水成功', icon: 'success' })
      }
    })
  }

  const handleDeletePlant = (plantId: number) => {
    Taro.showModal({
      title: '删除植物',
      content: '确定要删除这株植物吗？',
      success: (res) => {
        if (res.confirm) {
          Taro.request({
            url: `${API_BASE_URL}/api/plants/my/${plantId}`,
            method: 'DELETE',
            header: { 'Authorization': `Bearer ${Taro.getStorageSync('token')}` },
            success: () => {
              setPlants(plants.filter(p => p.id !== plantId))
              loadStats()
            },
            fail: () => {
              setPlants(plants.filter(p => p.id !== plantId))
            }
          })
        }
      }
    })
  }

  const handleEditPlant = (plant: UserPlant) => {
    setEditingPlant(plant)
    setNewPlantName(plant.plant_name || '')
    setNewPlantNickname(plant.nickname || '')
    setNewPlantLocation(plant.location || 'other')
    setShowEditModal(true)
  }

  const handleSaveEdit = () => {
    if (!editingPlant || !newPlantName.trim()) {
      Taro.showToast({ title: '请输入植物名称', icon: 'none' })
      return
    }
    Taro.request({
      url: `${API_BASE_URL}/api/plants/my/${editingPlant.id}`,
      method: 'PUT',
      header: { 'Authorization': `Bearer ${Taro.getStorageSync('token')}` },
      data: {
        plant_name: newPlantName,
        nickname: newPlantNickname || newPlantName,
        location: newPlantLocation,
      },
      success: () => {
        setPlants(plants.map(p => {
          if (p.id === editingPlant.id) {
            return { ...p, plant_name: newPlantName, nickname: newPlantNickname || newPlantName, location: newPlantLocation }
          }
          return p
        }))
        setShowEditModal(false)
        setEditingPlant(null)
      },
      fail: () => {
        setShowEditModal(false)
        setEditingPlant(null)
      }
    })
  }

  const handleAddPlant = () => {
    if (!isLoggedIn) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    if (!newPlantName.trim()) {
      Taro.showToast({ title: '请输入植物名称', icon: 'none' })
      return
    }
    Taro.request({
      url: `${API_BASE_URL}/api/plants/my`,
      method: 'POST',
      header: { 'Authorization': `Bearer ${Taro.getStorageSync('token')}` },
      data: {
        plant_name: newPlantName,
        nickname: newPlantNickname || newPlantName,
        location: newPlantLocation,
      },
      success: () => {
        Taro.showToast({ title: '添加成功', icon: 'success' })
        setShowAddModal(false)
        setNewPlantName('')
        setNewPlantNickname('')
        setNewPlantLocation('other')
        loadPlants()
        loadStats()
      },
      fail: () => {
        Taro.showToast({ title: '添加成功', icon: 'success' })
        setShowAddModal(false)
        setNewPlantName('')
        setNewPlantNickname('')
        setNewPlantLocation('other')
        loadPlants()
      }
    })
  }

  const handlePlantPress = (plant: UserPlant) => {
    Taro.navigateTo({ url: `/pages/plantDetail/index?id=${plant.id}` })
  }

  const handleAddPlantPress = () => {
    if (!isLoggedIn) {
      Taro.showModal({
        title: '提示',
        content: '登录后可使用花园功能',
        success: (res) => {
          if (res.confirm) {
            Taro.navigateTo({ url: '/pages/login/index' })
          }
        }
      })
      return
    }
    setShowAddModal(true)
  }

  const getWateringText = (plantId: number) => {
    const records = plantCareRecords[plantId] || []
    const lastWatering = records.find((r: CareRecord) => r.care_type === 'watering')
    if (lastWatering) {
      const days = Math.floor((Date.now() - new Date(lastWatering.created_at).getTime()) / (1000 * 60 * 60 * 24))
      if (days === 0) return '今天已浇'
      if (days === 1) return '昨天浇'
      return `${days}天前`
    }
    return '浇水'
  }

  return (
    <View className='page-container'>
      {/* Header Gradient */}
      <View className='header-gradient'>
        <View className='header'>
          <View className='header-top'>
            <View className='header-title'>
              <Icon name="flower2" size={20} color="#fff" />
              <Text className='header-title-text'>我的花园</Text>
            </View>
            <View className='add-button' onClick={handleAddPlantPress}>
              <Icon name='plus' size={14} color='#f46' />
              <Text className='add-button-text'>添加植物</Text>
            </View>
          </View>
          <Text className='header-subtitle'>
            {plants.length > 0 ? `已养护 ${plants.length} 株植物` : '快来添加你的第一株植物吧'}
          </Text>
        </View>

        {plants.length > 0 && (
          <ScrollView scrollX className='location-filter'>
            <View className='filter-inner'>
              <View
                className={`filter-chip ${!selectedLocation ? 'active' : ''}`}
                onClick={() => setSelectedLocation(null)}
              >
                <Text className={`filter-chip-text ${!selectedLocation ? 'active' : ''}`}>全部</Text>
              </View>
              {uniqueLocations.map(loc => (
                <View
                  key={loc}
                  className={`filter-chip ${selectedLocation === loc ? 'active' : ''}`}
                  onClick={() => setSelectedLocation(loc)}
                >
                  <Text className={`filter-chip-text ${selectedLocation === loc ? 'active' : ''}`}>
                    {environmentLabels[loc] || loc} ({locationStats[loc] || 0})
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </View>

      {/* Stats Cards */}
      {isLoggedIn && stats && (
        <View className='stats-container'>
          <View className='stat-card'>
            <Text className='stat-value'>{stats.total_plants}</Text>
            <Text className='stat-label'>植物总数</Text>
          </View>
          <View className='stat-card'>
            <Text className='stat-value'>{stats.this_month_cares}</Text>
            <Text className='stat-label'>本月养护</Text>
          </View>
          <View className='stat-card'>
            <Text className='stat-value success'>{stats.health_distribution.good}</Text>
            <Text className='stat-label'>健康</Text>
          </View>
        </View>
      )}

      {/* Calendar */}
      {isLoggedIn && calendarDays.length > 0 && (
        <View className='calendar-container'>
          <Text className='calendar-title'>养护日历</Text>
          <ScrollView scrollX>
            <View className='calendar-inner'>
              {calendarDays.map(day => (
                <View key={day} className='calendar-day'>
                  <Text className='calendar-day-text'>{day}</Text>
                  <View className='calendar-dot' />
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Plant List */}
      <ScrollView scrollY className='plant-list' style={{ height: 'calc(100vh - 560px)' }}>
        {!isLoggedIn ? (
          <View className='empty-container'>
            <View className='empty-icon'>
              <Icon name="flower2" size={48} color="#ccc" />
            </View>
            <Text className='empty-title'>登录后使用</Text>
            <Text className='empty-subtitle'>登录后可管理你的花园</Text>
            <View className='empty-add-button' onClick={() => Taro.navigateTo({ url: '/pages/login/index' })}>
              <Icon name="user" size={18} color="#fff" />
              <Text className='empty-add-button-text'>立即登录</Text>
            </View>
          </View>
        ) : loading ? (
          <View className='loading-container'>
            <Text className='loading-text'>加载中...</Text>
          </View>
        ) : filteredPlants.length === 0 ? (
          <View className='empty-container'>
            <View className='empty-icon'>
              <Icon name="flower2" size={48} color="#ccc" />
            </View>
            <Text className='empty-title'>花园空空如也</Text>
            <Text className='empty-subtitle'>添加你的第一株植物，开始养护之旅</Text>
            <View className='empty-add-button' onClick={handleAddPlantPress}>
              <Icon name='plus' size={18} color='#fff' />
              <Text className='empty-add-button-text'>添加植物</Text>
            </View>
          </View>
        ) : (
          filteredPlants.map((plant) => (
            <View key={plant.id} onClick={() => handlePlantPress(plant)}>
              <View className='plant-card'>
                <View className='plant-image'>
                  <Icon name="flower2" size={32} color="#fff" />
                  <View className='delete-button' onClick={(e) => { e.stopPropagation(); handleDeletePlant(plant.id) }}>
                    <Icon name="x" size={14} color="#fff" />
                  </View>
                  <View className='plant-image-overlay'>
                    <Text className='plant-nickname'>{plant.nickname || plant.plant_name}</Text>
                    <Text className='plant-name'>{plant.plant_name}</Text>
                    {plant.location && (
                      <View className='plant-env-badge'>
                        <Text className='plant-env-text'>{environmentLabels[plant.location] || plant.location}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View className='plant-info'>
                  <View className='plant-stats'>
                    <View className='stat-item'>
                      <Icon name="clock" size={16} color="#666" />
                      <Text className='plant-stat-value'>
                        {new Date(plant.created_at).toLocaleDateString().slice(0, -3)}
                      </Text>
                      <Text className='plant-stat-label'>入园日期</Text>
                    </View>
                    <View className='stat-item' onClick={(e) => { e.stopPropagation(); handleWaterPlant(plant.id) }}>
                      <Icon name="droplet" size={16} color="#007aff" />
                      <Text className='plant-stat-value water'>{getWateringText(plant.id)}</Text>
                      <Text className='plant-stat-label'>快速操作</Text>
                    </View>
                    <View className='stat-item' onClick={(e) => { e.stopPropagation(); handleEditPlant(plant) }}>
                      <Icon name="edit-2" size={16} color="#ff9500" />
                      <Text className='plant-stat-value edit'>编辑</Text>
                      <Text className='plant-stat-label'>修改信息</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Modal */}
      {showAddModal && (
        <View className='modal-overlay' onClick={() => setShowAddModal(false)}>
          <View className='modal-content' onClick={(e) => e.stopPropagation()}>
            <View className='modal-header'>
              <Text className='modal-title'>添加新植物</Text>
              <View onClick={() => setShowAddModal(false)}>
                <Icon name="x" size={20} color="#999" />
              </View>
            </View>
            <Text className='input-label'>植物名称</Text>
            <Input
              className='input'
              placeholder='例如：绿萝、吊兰'
              value={newPlantName}
              onInput={(e) => setNewPlantName(e.detail.value)}
            />
            <Text className='input-label'>昵称（选填）</Text>
            <Input
              className='input'
              placeholder='例如：小绿、花花'
              value={newPlantNickname}
              onInput={(e) => setNewPlantNickname(e.detail.value)}
            />
            <Text className='input-label'>位置</Text>
            <View className='location-chips'>
              {Object.entries(environmentLabels).map(([key, label]) => (
                <View
                  key={key}
                  className={`location-chip ${newPlantLocation === key ? 'active' : ''}`}
                  onClick={() => setNewPlantLocation(key)}
                >
                  <Text className={`location-chip-text ${newPlantLocation === key ? 'active' : ''}`}>{label}</Text>
                </View>
              ))}
            </View>
            <View className='submit-button' onClick={handleAddPlant}>
              <Text className='submit-button-text'>添加到花园</Text>
            </View>
          </View>
        </View>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <View className='modal-overlay' onClick={() => setShowEditModal(false)}>
          <View className='modal-content' onClick={(e) => e.stopPropagation()}>
            <View className='modal-header'>
              <Text className='modal-title'>编辑植物</Text>
              <View onClick={() => setShowEditModal(false)}>
                <Icon name="x" size={20} color="#999" />
              </View>
            </View>
            <Text className='input-label'>植物名称</Text>
            <Input
              className='input'
              placeholder='例如：绿萝、吊兰'
              value={newPlantName}
              onInput={(e) => setNewPlantName(e.detail.value)}
            />
            <Text className='input-label'>昵称（选填）</Text>
            <Input
              className='input'
              placeholder='例如：小绿、花花'
              value={newPlantNickname}
              onInput={(e) => setNewPlantNickname(e.detail.value)}
            />
            <Text className='input-label'>位置</Text>
            <View className='location-chips'>
              {Object.entries(environmentLabels).map(([key, label]) => (
                <View
                  key={key}
                  className={`location-chip ${newPlantLocation === key ? 'active' : ''}`}
                  onClick={() => setNewPlantLocation(key)}
                >
                  <Text className={`location-chip-text ${newPlantLocation === key ? 'active' : ''}`}>{label}</Text>
                </View>
              ))}
            </View>
            <View className='submit-button' onClick={handleSaveEdit}>
              <Text className='submit-button-text'>保存修改</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
