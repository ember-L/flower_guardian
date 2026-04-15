import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import './index.scss'
import Icon from '../../components/Icon'
import { API_BASE_URL } from '../../services/config'
import { getPlantDetail, addToMyGarden, type Plant } from '../../services/plantService'

// 获取完整的图片URL
const getFullImageUrl = (url: string): string => {
  if (!url || typeof url !== 'string') return ''
  const trimmed = url.trim()
  if (trimmed.length === 0) return ''
  if (trimmed.startsWith('http')) return trimmed
  return `${API_BASE_URL}${trimmed}`
}

export default function EncyclopediaDetail() {
  const router = useRouter()
  const plantId = Number(router.params.id)
  const [plant, setPlant] = useState<Plant | null>(null)
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (plantId) loadDetail()
  }, [plantId])

  const loadDetail = async () => {
    try {
      setLoading(true)
      const data = await getPlantDetail(plantId)
      setPlant(data)
    } catch (err) {
      console.error('加载植物详情失败', err)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleAddToGarden = async () => {
    if (!plant) return
    try {
      setAdding(true)
      await addToMyGarden({ plant_id: plant.id })
      Taro.showToast({ title: '已加入花园', icon: 'success' })
    } catch (err: any) {
      Taro.showToast({ title: err.message || '添加失败', icon: 'none' })
    } finally {
      setAdding(false)
    }
  }

  const renderStars = (level: number) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Icon key={i} name="star" size={16} color={i <= level ? '#F59E0B' : '#ddd'} />
      )
    }
    return stars
  }

  if (loading) {
    return (
      <View className='page-loading'>
        <Text className='loading-text'>加载中...</Text>
      </View>
    )
  }

  if (!plant) {
    return (
      <View className='page-empty'>
        <Icon name="sprout" size={40} color="#ccc" />
        <Text className='empty-text'>植物信息未找到</Text>
      </View>
    )
  }

  return (
    <View className='encyclopedia-detail'>
      <ScrollView scrollY className='detail-scroll'>
        {/* 顶部图片 */}
        <View className='hero-image-wrap'>
          <Image
            className='hero-image'
            src={getFullImageUrl(plant.image_url) || 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600'}
            mode='aspectFill'
          />
          <View className='hero-overlay' />
        </View>

        {/* 基本信息 */}
        <View className='info-card'>
          <View className='name-row'>
            <Text className='plant-name'>{plant.name}</Text>
            {plant.category && (
              <View className='category-badge'>
                <Text className='category-text'>{plant.category}</Text>
              </View>
            )}
          </View>
          {plant.scientific_name && (
            <Text className='scientific-name'>{plant.scientific_name}</Text>
          )}
          <View className='care-level-row'>
            <Text className='care-label'>养护难度</Text>
            <View className='stars'>{renderStars(plant.care_level)}</View>
            <Text className='care-text'>
              {['', '极易', '简单', '中等', '较难', '困难'][plant.care_level] || '未知'}
            </Text>
          </View>
        </View>

        {/* 养护参数卡片 */}
        <View className='params-grid'>
          <View className='param-card'>
            <Icon name="sun" size={24} color="#F59E0B" />
            <Text className='param-label'>光照</Text>
            <Text className='param-value'>{plant.light_requirement || '散射光'}</Text>
          </View>
          <View className='param-card'>
            <Icon name="droplet" size={24} color="#0891B2" />
            <Text className='param-label'>浇水</Text>
            <Text className='param-value'>{plant.water_requirement || '适中'}</Text>
          </View>
          <View className='param-card'>
            <Icon name="thermometer" size={24} color="#ef4444" />
            <Text className='param-label'>温度</Text>
            <Text className='param-value'>{plant.temperature_range || '15-25°C'}</Text>
          </View>
          <View className='param-card'>
            <Icon name="wind" size={24} color="#06B6D4" />
            <Text className='param-label'>湿度</Text>
            <Text className='param-value'>{plant.humidity_range || '50-70%'}</Text>
          </View>
        </View>

        {/* 描述 */}
        {plant.description && (
          <View className='section-card'>
            <Text className='section-title'>植物介绍</Text>
            <Text className='section-content'>{plant.description}</Text>
          </View>
        )}

        {/* 养护技巧 */}
        {(plant.care_tips || plant.tips) && (
          <View className='section-card'>
            <Text className='section-title'>养护技巧</Text>
            <Text className='section-content'>{plant.care_tips || plant.tips}</Text>
          </View>
        )}

        {/* 特点列表 */}
        {plant.features && plant.features.length > 0 && (
          <View className='section-card'>
            <Text className='section-title'>植物特点</Text>
            <View className='features-list'>
              {plant.features.map((feature, idx) => (
                <View key={idx} className='feature-item'>
                  <View className='feature-dot' />
                  <Text className='feature-text'>{feature}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 底部占位 */}
        <View className='bottom-spacer' />
      </ScrollView>

      {/* 底部按钮 */}
      <View className='bottom-bar'>
        <View
          className={`add-btn ${adding ? 'disabled' : ''}`}
          onClick={handleAddToGarden}
        >
          <Text className='add-btn-text'>{adding ? '添加中...' : '加入花园'}</Text>
        </View>
      </View>
    </View>
  )
}
