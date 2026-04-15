import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useEffect, useCallback } from 'react'
import './index.scss'
import { getDiaries, getMyPlants, deleteDiary, type Diary, type Plant } from '../../services/diaryService'
import { deleteMyPlant } from '../../services/plantService'

interface DisplayDiary {
  id: number | string
  plantName: string
  date: string
  dateLabel: string
  content: string
  likes: number
  comments: number
  compareWithPrevious: boolean
  images: string[]
  userPlantId?: number
}

const formatDate = (dateString: string): { date: string; label: string } => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return { date: '今天', label: '刚刚' }
  if (diffDays === 1) return { date: '昨天', label: '昨天' }
  if (diffDays === 2) return { date: '前天', label: '前天' }
  if (diffDays < 7) return { date: `${diffDays}天前`, label: `${diffDays}天前` }

  return {
    date: `${date.getMonth() + 1}/${date.getDate()}`,
    label: `${date.getMonth()}月${date.getDate()}日`,
  }
}

export default function Diary() {
  const [selectedTab, setSelectedTab] = useState(0)
  const [diaries, setDiaries] = useState<DisplayDiary[]>([])
  const [allDiaries, setAllDiaries] = useState<DisplayDiary[]>([])
  const [plants, setPlants] = useState<Plant[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlantFilter, setSelectedPlantFilter] = useState<number | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [plantsData, diariesData] = await Promise.all([
        getMyPlants(),
        getDiaries(),
      ])

      setPlants(plantsData)

      if (diariesData && diariesData.length > 0) {
        const displayDiaries: DisplayDiary[] = diariesData.map((d) => {
          const dateInfo = formatDate(d.created_at)
          return {
            id: d.id,
            plantName: d.plant_name || '我的植物',
            date: dateInfo.date,
            dateLabel: dateInfo.label,
            content: d.content || '',
            likes: 0,
            comments: 0,
            compareWithPrevious: !!d.height || !!d.leaf_count,
            images: d.images || [],
            userPlantId: d.user_plant_id,
          }
        })
        setAllDiaries(displayDiaries)
        filterDiaries(displayDiaries, selectedPlantFilter)
      } else {
        setAllDiaries([])
        setDiaries([])
      }
    } catch (error) {
      console.error('Failed to load diaries:', error)
      setAllDiaries([])
      setDiaries([])
      setPlants([])
    } finally {
      setLoading(false)
    }
  }, [selectedPlantFilter])

  const filterDiaries = (allDiaryList: DisplayDiary[], plantId: number | null) => {
    if (plantId === null) {
      setDiaries(allDiaryList)
    } else {
      setDiaries(allDiaryList.filter(d => d.userPlantId === plantId))
    }
  }

  const handlePlantFilterChange = (plantId: number | null) => {
    setSelectedPlantFilter(plantId)
    filterDiaries(allDiaries, plantId)
  }

  useEffect(() => {
    loadData()
  }, [loadData])

  useDidShow(() => {
    loadData()
  })

  const handleWriteDiary = () => {
    Taro.navigateTo({ url: '/pages/writeDiary/index' })
  }

  const handleDiaryPress = (diary: DisplayDiary) => {
    if (typeof diary.id === 'number') {
      Taro.navigateTo({ url: `/pages/diaryDetail/index?id=${diary.id}` })
    }
  }

  const handleGrowthRecordPress = (plantId?: number) => {
    Taro.navigateTo({ url: `/pages/growthCurve/index${plantId ? `?plantId=${plantId}` : ''}` })
  }

  const handleDeletePlant = (plant: Plant) => {
    Taro.showModal({
      title: '删除植物',
      content: `确定要删除"${plant.name}"吗？删除后将无法恢复。`,
      confirmColor: '#ff4d4f',
      success: async (res) => {
        if (res.confirm) {
          try {
            await deleteMyPlant(plant.id)
            setPlants((prev) => prev.filter((p) => p.id !== plant.id))
          } catch (error) {
            Taro.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      },
    })
  }

  const handleDeleteDiary = (diary: DisplayDiary) => {
    Taro.showModal({
      title: '删除日记',
      content: '确定要删除这篇日记吗？此操作无法撤销。',
      confirmColor: '#ff4d4f',
      success: async (res) => {
        if (res.confirm) {
          try {
            if (typeof diary.id === 'number') {
              await deleteDiary(diary.id)
              setDiaries((prev) => prev.filter((d) => d.id !== diary.id))
              setAllDiaries((prev) => prev.filter((d) => d.id !== diary.id))
            }
          } catch (error) {
            Taro.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      },
    })
  }

  const getCurrentPlantName = () => {
    if (selectedTab === 0 && selectedPlantFilter !== null) {
      const plant = plants.find(p => p.id === selectedPlantFilter)
      return plant?.name || '该植物'
    }
    return null
  }

  const currentPlantName = getCurrentPlantName()

  // Loading state
  if (loading) {
    return (
      <View className='diary-page'>
        {renderHeader()}
        {renderTabs()}
        <View className='loading-container'>
          <Text className='loading-text'>加载中...</Text>
        </View>
      </View>
    )
  }

  function renderHeader() {
    return (
      <View className='header'>
        <View className='header-back'>
          <Text className='icon-back'>&lt;</Text>
        </View>
        <View className='header-center'>
          <Text className='header-title'>
            {selectedTab === 0
              ? currentPlantName || '养花日记'
              : '生长记录'}
          </Text>
          <Text className='header-subtitle'>
            {selectedTab === 0
              ? currentPlantName ? `记录${currentPlantName}的成长` : '记录植物的成长点滴'
              : '查看植物生长趋势'}
          </Text>
        </View>
        <View className='header-right'>
          {selectedTab === 0 && (
            <View className='write-btn' onClick={handleWriteDiary}>
              <Text className='write-btn-icon'>+</Text>
            </View>
          )}
        </View>
      </View>
    )
  }

  function renderTabs() {
    return (
      <View className='tabs-container'>
        <View className='tabs'>
          <View
            className={`tab ${selectedTab === 0 ? 'active' : ''}`}
            onClick={() => setSelectedTab(0)}
          >
            <Text className='tab-icon'>~</Text>
            <Text className={`tab-text ${selectedTab === 0 ? 'active' : ''}`}>我的日记</Text>
          </View>
          <View
            className={`tab ${selectedTab === 1 ? 'active' : ''}`}
            onClick={() => setSelectedTab(1)}
          >
            <Text className='tab-icon'>~</Text>
            <Text className={`tab-text ${selectedTab === 1 ? 'active' : ''}`}>生长记录</Text>
          </View>
        </View>
      </View>
    )
  }

  function renderPlantFilter() {
    if (plants.length === 0) return null
    return (
      <View className='plant-filter-container'>
        <ScrollView scrollX className='plant-filter-scroll'>
          <View className='plant-filter-chips'>
            <View
              className={`plant-filter-chip ${selectedPlantFilter === null ? 'active' : ''}`}
              onClick={() => handlePlantFilterChange(null)}
            >
              <Text className={`plant-filter-text ${selectedPlantFilter === null ? 'active' : ''}`}>
                全部
              </Text>
            </View>
            {plants.map((plant) => (
              <View
                key={plant.id}
                className={`plant-filter-chip ${selectedPlantFilter === plant.id ? 'active' : ''}`}
                onClick={() => handlePlantFilterChange(plant.id)}
              >
                <Text className={`plant-filter-text ${selectedPlantFilter === plant.id ? 'active' : ''}`}>
                  {plant.name || '植物'}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    )
  }

  function renderDiaryCard(diary: DisplayDiary) {
    return (
      <View
        key={diary.id}
        className='diary-card'
        onClick={() => handleDiaryPress(diary)}
      >
        {/* Header */}
        <View className='diary-header'>
          <View className='diary-user'>
            <View className='diary-avatar'>
              <Text className='avatar-icon'>~</Text>
            </View>
            <View>
              <Text className='diary-plant-name'>{diary.plantName}</Text>
              <Text className='diary-date'>{diary.dateLabel}</Text>
            </View>
          </View>
          {diary.compareWithPrevious && (
            <View className='growth-badge'>
              <Text className='growth-badge-text'>^ 新变化</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <Text className='diary-content'>{diary.content}</Text>

        {/* Images */}
        {diary.images && diary.images.length > 0 && (
          <View className='image-gallery'>
            {diary.images.slice(0, 3).map((uri, index) => (
              uri && typeof uri === 'string' && uri.trim().length > 0 ? (
                <Image
                  key={index}
                  className={`gallery-image ${diary.images.length === 1 ? 'single' : ''}`}
                  src={uri}
                  mode='aspectFill'
                />
              ) : null
            ))}
            {diary.images.length > 3 && (
              <View className='more-images-overlay'>
                <Text className='more-images-text'>+{diary.images.length - 3}</Text>
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <View className='diary-footer'>
          <View className='stat-item'>
            <Text className='stat-icon'>~</Text>
            <Text className='stat-text'>{diary.likes}</Text>
          </View>
          <View className='stat-item'>
            <Text className='stat-icon'>~</Text>
            <Text className='stat-text'>{diary.comments}</Text>
          </View>
          <View className='delete-btn' onClick={(e) => { e.stopPropagation(); handleDeleteDiary(diary) }}>
            <Text className='delete-icon'>X</Text>
          </View>
        </View>
      </View>
    )
  }

  function renderPlantCard(plant: Plant) {
    return (
      <View
        key={plant.id}
        className='plant-card'
        onClick={() => handleGrowthRecordPress(plant.id)}
      >
        <View className='plant-icon'>
          <Text className='plant-icon-text'>~</Text>
        </View>
        <View className='plant-info'>
          <Text className='plant-card-name'>{plant.name}</Text>
          <Text className='plant-hint'>点击查看生长曲线</Text>
        </View>
        <View className='plant-delete-btn' onClick={(e) => { e.stopPropagation(); handleDeletePlant(plant) }}>
          <Text className='plant-delete-icon'>X</Text>
        </View>
        <Text className='chevron-right'>&gt;</Text>
      </View>
    )
  }

  // Tab 0: 我的日记
  if (selectedTab === 0) {
    return (
      <View className='diary-page'>
        {renderHeader()}
        {renderTabs()}
        {renderPlantFilter()}
        <ScrollView scrollY className='diary-scroll'>
          {diaries.length === 0 ? (
            <View className='empty-state'>
              <View className='empty-icon-container'>
                <Text className='empty-icon'>~</Text>
              </View>
              <Text className='empty-title'>暂无日记</Text>
              <Text className='empty-subtitle'>开始记录植物的成长故事</Text>
              <View className='empty-btn' onClick={handleWriteDiary}>
                <Text className='empty-btn-text'>+ 写第一篇日记</Text>
              </View>
            </View>
          ) : (
            <View className='list'>
              {diaries.map(diary => renderDiaryCard(diary))}
            </View>
          )}
          <View className='bottom-spacer' />
        </ScrollView>
        {diaries.length > 0 && (
          <View className='fab' onClick={handleWriteDiary}>
            <Text className='fab-icon'>+</Text>
          </View>
        )}
      </View>
    )
  }

  // Tab 1: 生长记录
  return (
    <View className='diary-page'>
      {renderHeader()}
      {renderTabs()}
      <ScrollView scrollY className='diary-scroll'>
        {plants.length === 0 ? (
          <View className='empty-state'>
            <View className='empty-icon-container'>
              <Text className='empty-icon'>~</Text>
            </View>
            <Text className='empty-title'>暂无植物</Text>
            <Text className='empty-subtitle'>添加植物后即可记录生长数据</Text>
          </View>
        ) : (
          <View className='list'>
            {plants.map(plant => renderPlantCard(plant))}
          </View>
        )}
        <View className='bottom-spacer' />
      </ScrollView>
    </View>
  )
}
