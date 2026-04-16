import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useEffect, useCallback } from 'react'
import Icon from '../../components/Icon'
import './index.scss'
import { getDiaries, getMyPlants, deleteDiary, type Diary, type Plant } from '../../services/diaryService'
import { deleteMyPlant } from '../../services/plantService'
import { getFullImageUrl } from '../../services/request'

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
    label: `${date.getMonth() + 1}月${date.getDate()}日`,
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
      return plant?.name || plant?.nickname || '该植物'
    }
    return null
  }

  const currentPlantName = getCurrentPlantName()

  const renderHeader = () => (
    <View className='header'>
      <View className='header-back' onClick={() => Taro.navigateBack()}>
        <Icon name="arrow-left" size={24} color="#333" />
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
            <Icon name="plus" size={18} color="#fff" />
          </View>
        )}
      </View>
    </View>
  )

  const renderTabs = () => (
    <View className='tabs-container'>
      <View className='tabs'>
        <View
          className={`tab ${selectedTab === 0 ? 'active' : ''}`}
          onClick={() => setSelectedTab(0)}
        >
          <Icon
            name="book"
            size={16}
            color={selectedTab === 0 ? '#f46' : '#999'}
          />
          <Text className={`tab-text ${selectedTab === 0 ? 'active' : ''}`}>我的日记</Text>
        </View>
        <View
          className={`tab ${selectedTab === 1 ? 'active' : ''}`}
          onClick={() => setSelectedTab(1)}
        >
          <Icon
            name="trending-up"
            size={16}
            color={selectedTab === 1 ? '#f46' : '#999'}
          />
          <Text className={`tab-text ${selectedTab === 1 ? 'active' : ''}`}>生长记录</Text>
        </View>
      </View>
    </View>
  )

  const renderPlantFilter = () => {
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

  const renderDiaryCard = (diary: DisplayDiary) => (
    <View
      key={diary.id}
      className='diary-card'
      onClick={() => handleDiaryPress(diary)}
    >
      <View className='diary-header'>
        <View className='diary-user'>
          <View className='diary-avatar'>
            <Icon name="flower2" size={16} color="#52c41a" />
          </View>
          <View>
            <Text className='diary-plant-name'>{diary.plantName}</Text>
            <Text className='diary-date'>{diary.dateLabel}</Text>
          </View>
        </View>
        {diary.compareWithPrevious && (
          <View className='growth-badge'>
            <Icon name="trending-up" size={10} color="#52c41a" />
            <Text className='growth-badge-text'>新变化</Text>
          </View>
        )}
      </View>

      <Text className='diary-content' numberOfLines={3}>{diary.content}</Text>

      {diary.images && diary.images.length > 0 && (
        <View className='image-gallery'>
          {diary.images.slice(0, 3).map((uri, index) => (
            uri && typeof uri === 'string' && uri.trim().length > 0 ? (
              <Image
                key={index}
                className={`gallery-image ${diary.images.length === 1 ? 'single' : ''}`}
                src={getFullImageUrl(uri)}
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

      <View className='diary-footer'>
        <View className='stat-item'>
          <Icon name="heart" size={14} color="#999" />
          <Text className='stat-text'>{diary.likes}</Text>
        </View>
        <View className='stat-item'>
          <Icon name="message-circle" size={14} color="#999" />
          <Text className='stat-text'>{diary.comments}</Text>
        </View>
        <View className='delete-btn' onClick={(e) => { e.stopPropagation(); handleDeleteDiary(diary) }}>
          <Icon name="trash" size={14} color="#ff4d4f" />
        </View>
      </View>
    </View>
  )

  const renderPlantCard = (plant: Plant) => (
    <View
      key={plant.id}
      className='plant-card'
      onClick={() => handleGrowthRecordPress(plant.id)}
    >
      <View className='plant-icon'>
        <Icon name="flower2" size={24} color="#52c41a" />
      </View>
      <View className='plant-info'>
        <Text className='plant-card-name'>{plant.name}</Text>
        <Text className='plant-hint'>点击查看生长曲线</Text>
      </View>
      <View className='plant-delete-btn' onClick={(e) => { e.stopPropagation(); handleDeletePlant(plant) }}>
        <Icon name="trash" size={18} color="#ff4d4f" />
      </View>
      <Icon name="chevron-right" size={20} color="#999" />
    </View>
  )

  const renderEmptyState = (icon: string, title: string, subtitle: string, showButton = false) => (
    <View className='empty-state'>
      <View className='empty-icon-container'>
        <Icon name={icon} size={48} color="#999" />
      </View>
      <Text className='empty-title'>{title}</Text>
      <Text className='empty-subtitle'>{subtitle}</Text>
      {showButton && (
        <View className='empty-btn' onClick={handleWriteDiary}>
          <Icon name="plus" size={18} color="#fff" />
          <Text className='empty-btn-text'>写第一篇日记</Text>
        </View>
      )}
    </View>
  )

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

  // Tab 0: 我的日记
  if (selectedTab === 0) {
    return (
      <View className='diary-page'>
        {renderHeader()}
        {renderTabs()}
        {renderPlantFilter()}
        <ScrollView scrollY className='diary-scroll'>
          {diaries.length === 0 ? (
            renderEmptyState('book', '暂无日记', '开始记录植物的成长故事', true)
          ) : (
            <View className='list'>
              {diaries.map(diary => renderDiaryCard(diary))}
            </View>
          )}
          <View className='bottom-spacer' />
        </ScrollView>
        {diaries.length > 0 && (
          <View className='fab' onClick={handleWriteDiary}>
            <Icon name="plus" size={24} color="#fff" />
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
          renderEmptyState('sprout', '暂无植物', '添加植物后即可记录生长数据')
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
