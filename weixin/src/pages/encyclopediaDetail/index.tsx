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

  const getLightText = (light?: string) => {
    const map: Record<string, string> = {
      'full': '喜阳 - 适合光线充足的环境',
      'partial': '半阴 - 适合散射光环境',
      'low': '耐阴 - 适合光线较弱的环境',
    }
    return map[light || ''] || '适合各种光照环境'
  }

  const getWaterText = (water?: string) => {
    const map: Record<string, string> = {
      'frequent': '经常浇水 - 保持土壤湿润',
      'weekly': '每周一次 - 保持土壤湿润',
      'biweekly': '两周一次 - 干透再浇',
      'monthly': '每月一次 - 极耐旱',
    }
    return map[water || ''] || '适量浇水'
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
        <Icon name='sprout' size={40} color='#ccc' />
        <Text className='empty-text'>植物信息未找到</Text>
      </View>
    )
  }

  return (
    <View className='encyclopedia-detail'>
      <ScrollView scrollY className='detail-scroll'>
        {/* Hero 区域 - RN: 粉色背景+居中图片 */}
        <View className='hero-section'>
          <View className='back-button' onClick={() => Taro.navigateBack()}>
            <Icon name='chevron-left' size={22} color='#fff' />
          </View>

          <View className='plant-info-container'>
            <View className='plant-image-wrapper'>
              {plant.image_url ? (
                <Image
                  className='plant-image'
                  src={getFullImageUrl(plant.image_url)}
                  mode='aspectFill'
                  lazyLoad
                />
              ) : (
                <View className='plant-image-placeholder'>
                  <Icon name='flower2' size={56} color='#fff' />
                </View>
              )}
            </View>
            <Text className='plant-name'>{plant.name}</Text>
            {plant.scientific_name && (
              <Text className='plant-scientific'>{plant.scientific_name}</Text>
            )}
            <View className='tag-row'>
              <View className='tag-primary'>
                <Icon name='tag' size={12} color='#fff' />
                <Text className='tag-text-primary'>{plant.category || '室内植物'}</Text>
              </View>
              <View className='tag-secondary'>
                <Icon name='activity' size={12} color='#52c41a' />
                <Text className='tag-text-secondary'>难度 {plant.care_level || 1}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Content - RN: paddingHorizontal lg=20px, marginTop -lg=-20px */}
        <View className='content'>
          {/* 简介 */}
          {plant.description && (
            <View className='section'>
              <View className='section-header'>
                <Icon name='file-text' size={20} color='#f46' />
                <Text className='section-title'>植物简介</Text>
              </View>
              <Text className='description'>{plant.description}</Text>
            </View>
          )}

          {/* 养护要求 */}
          <View className='section'>
            <View className='section-header'>
              <Icon name='heart' size={20} color='#f46' />
              <Text className='section-title'>养护要求</Text>
            </View>
            <View className='care-grid'>
              {/* 光照 */}
              <View className='care-card'>
                <View className='care-icon-wrapper' style={{ backgroundColor: 'rgba(250, 173, 20, 0.2)' }}>
                  <Icon name='sun' size={24} color='#faad14' />
                </View>
                <Text className='care-label'>光照需求</Text>
                <Text className='care-value'>{getLightText(plant.light_requirement)}</Text>
              </View>
              {/* 浇水 */}
              <View className='care-card'>
                <View className='care-icon-wrapper' style={{ backgroundColor: 'rgba(0, 122, 255, 0.2)' }}>
                  <Icon name='droplet' size={24} color='#007aff' />
                </View>
                <Text className='care-label'>浇水频率</Text>
                <Text className='care-value'>{getWaterText(plant.water_requirement)}</Text>
              </View>
              {/* 温度 */}
              {plant.temperature_range && (
                <View className='care-card'>
                  <View className='care-icon-wrapper' style={{ backgroundColor: 'rgba(255, 77, 79, 0.2)' }}>
                    <Icon name='thermometer' size={24} color='#ff4d4f' />
                  </View>
                  <Text className='care-label'>适宜温度</Text>
                  <Text className='care-value'>{plant.temperature_range}</Text>
                </View>
              )}
              {/* 湿度 */}
              {plant.humidity_range && (
                <View className='care-card'>
                  <View className='care-icon-wrapper' style={{ backgroundColor: 'rgba(82, 196, 26, 0.2)' }}>
                    <Icon name='cloud-rain' size={24} color='#52c41a' />
                  </View>
                  <Text className='care-label'>适宜湿度</Text>
                  <Text className='care-value'>{plant.humidity_range}</Text>
                </View>
              )}
            </View>
            {/* 浇水提示 */}
            {plant.watering_tip && (
              <View className='tip-card'>
                <View className='tip-icon-wrapper'>
                  <Icon name='lightbulb' size={18} color='#faad14' />
                </View>
                <View className='tip-content'>
                  <Text className='tip-label'>浇水小贴士</Text>
                  <Text className='tip-text'>{plant.watering_tip}</Text>
                </View>
              </View>
            )}
          </View>

          {/* 特点标签 */}
          {plant.features && plant.features.length > 0 && (
            <View className='section'>
              <View className='section-header'>
                <Icon name='star' size={20} color='#f46' />
                <Text className='section-title'>植物特点</Text>
              </View>
              <View className='feature-grid'>
                {plant.features.map((feature, index) => (
                  <View key={index} className='feature-tag'>
                    <Icon name='check' size={16} color='#52c41a' />
                    <Text className='feature-text'>{feature}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 养护小贴士 */}
          {plant.care_tips && (
            <View className='section'>
              <View className='section-header'>
                <Icon name='book-open' size={20} color='#f46' />
                <Text className='section-title'>养护小贴士</Text>
              </View>
              <View className='tips-card'>
                <Text className='tips-text'>{plant.care_tips}</Text>
              </View>
            </View>
          )}

          {/* 养护误区 */}
          {plant.common_mistakes && (
            <View className='section'>
              <View className='section-header'>
                <Icon name='alert-triangle' size={20} color='#faad14' />
                <Text className='section-title'>养护误区</Text>
              </View>
              <View className='warning-card'>
                <View className='warning-header'>
                  <Icon name='alert-circle' size={18} color='#faad14' />
                  <Text className='warning-title'>常见错误</Text>
                </View>
                <Text className='warning-text'>{plant.common_mistakes}</Text>
              </View>
            </View>
          )}

          {/* 存活率 */}
          {plant.survival_rate && (
            <View className='section'>
              <View className='survival-card'>
                <View className='survival-icon-wrapper'>
                  <Icon name='heart' size={28} color='#fff' />
                </View>
                <View className='survival-info'>
                  <Text className='survival-label'>新手存活率</Text>
                  <Text className='survival-value'>{plant.survival_rate}%</Text>
                </View>
                <View className='survival-progress'>
                  <View className='survival-progress-bar' style={{ width: `${plant.survival_rate}%` }} />
                </View>
              </View>
            </View>
          )}

          <View className='bottom-spacer' />
        </View>
      </ScrollView>

      {/* 底部按钮 */}
      <View className='bottom-button'>
        <View
          className={`submit-button ${adding ? 'disabled' : ''}`}
          onClick={handleAddToGarden}
        >
          <Icon name='plus' size={20} color='#fff' />
          <Text className='submit-button-text'>添加到我的花园</Text>
        </View>
      </View>
    </View>
  )
}