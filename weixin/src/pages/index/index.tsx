import { View, Text, ScrollView, Image, Input } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import Icon from '../../components/Icon'
import CustomTabBar from '../../components/CustomTabBar'
import BboxOverlay, { BboxItem } from '../../components/BboxOverlay'
import { recognitionService } from '../../services/recognitionService'
import { API_BASE_URL } from '../../services/config'
import './index.scss'

// 获取完整的图片URL
const getFullImageUrl = (url: string): string => {
  if (!url || typeof url !== 'string') return ''
  const trimmed = url.trim()
  if (trimmed.length === 0) return ''
  if (trimmed.startsWith('http')) return trimmed
  return `${API_BASE_URL}${trimmed}`
}

// 检测标签类型
interface DetectionTag {
  name: string
  count: number
  color: string
}

interface WeatherData {
  temp: string
  tempMax: string
  tempMin: string
  condition: string
  location: string
  humidity: string
  windSpeed: string
  uvIndex: string
}

interface Plant {
  id: number
  name: string
  image_url: string
  description: string
  category: string
}

interface RecognitionResult {
  name: string
  confidence: number
}

export default function Index() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPlantCard, setShowPlantCard] = useState(false)
  const [recognitionResult, setRecognitionResult] = useState<RecognitionResult | null>(null)
  const [capturedImageUri, setCapturedImageUri] = useState('')
  const [recommendPlants, setRecommendPlants] = useState<Plant[]>([])
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [weatherTip, setWeatherTip] = useState('')
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [detectionBboxes, setDetectionBboxes] = useState<BboxItem[]>([])
  const [detectionTags, setDetectionTags] = useState<DetectionTag[]>([])

  useEffect(() => {
    loadRecommendPlants()
    loadCachedWeather()
    fetchWeatherTip()
  }, [])

  const loadRecommendPlants = () => {
    Taro.request({
      url: `${API_BASE_URL}/api/plants/popular`,
      method: 'GET',
      success: (res) => {
        const data = res.data as any
        if (data?.items) {
          setRecommendPlants(data.items)
        } else if (data?.list) {
          setRecommendPlants(data.list)
        } else {
          setRecommendPlants([
            { id: 1, name: '绿萝', image_url: '', description: '最易养的室内绿植', category: '室内' },
            { id: 3, name: '多肉植物', image_url: '', description: '小巧可爱的懒人植物', category: '多肉' },
            { id: 11, name: '月季', image_url: '', description: '花中皇后四季开花', category: '开花' },
            { id: 15, name: '蝴蝶兰', image_url: '', description: '高雅脱俗的兰花之王', category: '开花' },
            { id: 10, name: '龟背竹', image_url: '', description: '北欧风网红植物', category: '室内' },
          ])
        }
      },
      fail: () => {
        setRecommendPlants([
          { id: 1, name: '绿萝', image_url: '', description: '最易养的室内绿植', category: '室内' },
          { id: 3, name: '多肉植物', image_url: '', description: '小巧可爱的懒人植物', category: '多肉' },
          { id: 11, name: '月季', image_url: '', description: '花中皇后四季开花', category: '开花' },
          { id: 15, name: '蝴蝶兰', image_url: '', description: '高雅脱俗的兰花之王', category: '开花' },
          { id: 10, name: '龟背竹', image_url: '', description: '北欧风网红植物', category: '室内' },
        ])
      }
    })
  }

  const loadCachedWeather = () => {
    try {
      const cached = Taro.getStorageSync('weather_cache')
      if (cached) {
        const { weather, tip, timestamp } = JSON.parse(cached)
        const now = Date.now()
        const cacheAge = now - timestamp
        const expiryMs = 6 * 60 * 60 * 1000
        if (cacheAge < expiryMs) {
          setWeatherData(weather)
          setWeatherTip(tip)
          return
        }
      }
    } catch (e) {
      // ignore
    }
  }

  const fetchWeatherTip = () => {
    setWeatherLoading(true)
    Taro.getLocation({
      type: 'gcj02',
      success: (locRes) => {
        Taro.request({
          url: `${API_BASE_URL}/api/weather/tips`,
          method: 'POST',
          data: { latitude: locRes.latitude, longitude: locRes.longitude },
          header: { 'Content-Type': 'application/json' },
          success: (weatherRes) => {
            const data = weatherRes.data as any
            if (data?.weather) {
              const weather: WeatherData = {
                temp: data.weather.temp || data.weather.temperature || '--',
                tempMax: data.weather.tempMax || '--',
                tempMin: data.weather.tempMin || '--',
                condition: data.weather.condition || '未知',
                location: data.weather.location || '未知位置',
                humidity: data.weather.humidity || '--',
                windSpeed: data.weather.windSpeed || '--',
                uvIndex: data.weather.uvIndex || '--',
              }
              setWeatherData(weather)
              setWeatherTip(data.tip || '今天适合给植物浇水')
              try {
                Taro.setStorageSync('weather_cache', JSON.stringify({
                  weather,
                  tip: data.tip || '今天适合给植物浇水',
                  timestamp: Date.now()
                }))
              } catch (e) { /* ignore */ }
            }
          },
          fail: () => {
            setWeatherLoading(false)
          },
          complete: () => {
            setWeatherLoading(false)
          }
        })
      },
      fail: () => {
        setWeatherLoading(false)
      }
    })
  }

  const handleIdentify = (source: 'camera' | 'album') => {
    setIsLoading(true)
    Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: [source],
      success: async (res) => {
        const filePath = res.tempFilePaths[0]
        setCapturedImageUri(filePath)
        setShowPlantCard(true)

        try {
          // 使用 /api/diagnosis/full 接口，同时获取植物和病虫害检测结果
          const result = await recognitionService.diagnosePest(filePath)
          console.log('[Index] 识别结果:', JSON.stringify(result).substring(0, 500))

          // 提取检测框和标签
          const bboxes: BboxItem[] = []
          const tagMap: Record<string, { count: number; color: string }> = {}

          // 获取类型对应的颜色
          const getTypeColor = (type: string) => {
            switch (type) {
              case 'disease': return '#faad14'
              case 'insect': return '#ff4d4f'
              case 'plant': return '#52c41a'
              default: return '#52c41a'
            }
          }

          // 植物检测框
          if (result.plant) {
            if (result.plant.detections && result.plant.detections.length > 0) {
              result.plant.detections.forEach((det: any) => {
                if (det.bbox && det.bbox.length === 4) {
                  bboxes.push({
                    name: det.name || result.plant.name || '植物',
                    confidence: det.confidence || 0,
                    bbox: det.bbox,
                    type: 'plant',
                  })
                  const name = det.name || result.plant.name || '植物'
                  if (!tagMap[name]) {
                    tagMap[name] = { count: 0, color: getTypeColor('plant') }
                  }
                  tagMap[name].count++
                }
              })
            } else if (result.plant.bbox && result.plant.bbox.length === 4) {
              bboxes.push({
                name: result.plant.name || '植物',
                confidence: result.plant.confidence || 0,
                bbox: result.plant.bbox,
                type: 'plant',
              })
              const name = result.plant.name || '植物'
              if (!tagMap[name]) {
                tagMap[name] = { count: 0, color: getTypeColor('plant') }
              }
              tagMap[name].count++
            }
          }

          // 病虫害检测框
          if (result.pest) {
            if (result.pest.detections && result.pest.detections.length > 0) {
              result.pest.detections.forEach((det: any) => {
                if (det.bbox && det.bbox.length === 4) {
                  const pestType = det.type || result.pest.type || 'pest'
                  bboxes.push({
                    name: det.name || result.pest.name || '病虫害',
                    confidence: det.confidence || 0,
                    bbox: det.bbox,
                    type: pestType,
                  })
                  const name = det.name || result.pest.name || '病虫害'
                  if (!tagMap[name]) {
                    tagMap[name] = { count: 0, color: getTypeColor(pestType) }
                  }
                  tagMap[name].count++
                }
              })
            } else if (result.pest.bbox && result.pest.bbox.length === 4) {
              const pestType = result.pest.type || 'pest'
              bboxes.push({
                name: result.pest.name || '病虫害',
                confidence: result.pest.confidence || 0,
                bbox: result.pest.bbox,
                type: pestType,
              })
              const name = result.pest.name || '病虫害'
              if (!tagMap[name]) {
                tagMap[name] = { count: 0, color: getTypeColor(pestType) }
              }
              tagMap[name].count++
            }
          }

          // 转换为标签数组
          const tags: DetectionTag[] = Object.entries(tagMap).map(([name, data]) => ({
            name,
            count: data.count,
            color: data.color,
          }))

          console.log('[Index] bboxes:', bboxes.length, 'tags:', tags.length)

          // 如果没有检测到任何目标，不显示结果
          if (bboxes.length === 0) {
            console.log('[Index] 未检测到目标')
            setDetectionBboxes([])
            setDetectionTags([])
            setRecognitionResult(null)
            setShowPlantCard(false)
            Taro.showToast({ title: '未检测到植物或病虫害', icon: 'none' })
            return
          }

          setDetectionBboxes(bboxes)
          setDetectionTags(tags)
          setRecognitionResult({ name: result.diagnosis?.name || result.plant?.name || '未知', confidence: result.diagnosis?.confidence || result.plant?.confidence || 0 })
        } catch (e) {
          console.error('识别失败:', e)
          setDetectionBboxes([])
          setDetectionTags([])
          setRecognitionResult({ name: '识别失败', confidence: 0 })
        } finally {
          setIsLoading(false)
        }
      },
      fail: () => {
        setIsLoading(false)
      }
    })
  }

  const handleAddToGarden = () => {
    Taro.showToast({ title: '已添加到我的花园', icon: 'success' })
    setShowPlantCard(false)
    setRecognitionResult(null)
    setCapturedImageUri('')
    setDetectionBboxes([])
    setDetectionTags([])
  }

  const closePlantCard = () => {
    setShowPlantCard(false)
    setRecognitionResult(null)
    setCapturedImageUri('')
    setDetectionBboxes([])
    setDetectionTags([])
  }

  const quickActions = [
    { id: 'diagnose', label: '病症诊断', icon: 'stethoscope', color: '#ff9500', desc: '植物看病', url: '/pages/diagnosis/index' },
    { id: 'recommend', label: '新手推荐', icon: 'sparkles', color: '#af52de', desc: '智能推荐', url: '/pages/recommendation/index' },
    { id: 'reminder', label: '智能提醒', icon: 'bell', color: '#ff2d55', desc: '浇水施肥', url: '/pages/reminder/index' },
    { id: 'consult', label: 'AI\u95EE\u8BCA', icon: 'message-circle', color: '#34c759', desc: '在线问答', url: '/pages/consultation/index' },
  ]

  const getCategoryColor = (category?: string) => {
    const map: Record<string, string> = {
      '\u5BA4\u5185': '#10b981',
      '\u591A\u8089': '#6366f1',
      '\u5F00\u82B1': '#f59e0b',
      '\u8349\u672C': '#0ea5e9',
    }
    return map[category || '\u5BA4\u5185'] || '#10b981'
  }

  return (
    <View className='page-container'>
      <ScrollView scrollY className='main-scroll'>
        {/* Hero Section */}
        <View className='hero-section'>
          <View className='decor-circle-1' />
          <View className='decor-circle-2' />
          <View className='decor-circle-3' />

          {/* 浮动叶子装饰 - 与RN保持一致 */}
          <View className='floating-leaf-1'>
            <Icon name="leaf" size={40} color="rgba(255,255,255,0.15)" />
          </View>
          <View className='floating-leaf-2'>
            <Icon name="sprout" size={30} color="rgba(255,255,255,0.1)" />
          </View>

          <View className='hero-content'>
            <View className='brand-badge'>
              <Image src={require('../../assets/logo.png')} style={{ width: '54px', height: '54px' }} mode='aspectFit' />
            </View>
            <View className='hero-text'>
              <Text className='hero-title'>护花使者</Text>
              <Text className='hero-subtitle'>你的掌上植物管家</Text>
            </View>
          </View>

          <Text className='hero-desc'>
            从识别植物到养护指导，从病症诊断到智能提醒，
            全方位呵护你的每一株绿植
          </Text>

          {/* Stats */}
          <View className='stats-container'>
            <View className='stat-item'>
              <Text className='stat-number'>500+</Text>
              <Text className='stat-label'>植物品种</Text>
            </View>
            <View className='stat-divider' />
            <View className='stat-item'>
              <Text className='stat-number'>AI</Text>
              <Text className='stat-label'>智能识别</Text>
            </View>
            <View className='stat-divider' />
            <View className='stat-item'>
              <Text className='stat-number'>24h</Text>
              <Text className='stat-label'>养护提醒</Text>
            </View>
          </View>
        </View>

        {/* Main Content */}
        <View className='main-content'>
          {/* Identify Card */}
          <View className='identify-card'>
            {!showPlantCard ? (
              <>
                <View className='identify-header'>
                  <View className='identify-badge'>
                    <Icon name="camera" size={16} color="#fff" />
                    <Text className='identify-badge-text'>AI 智能识别</Text>
                  </View>
                  <Text className='identify-title'>拍照识别植物</Text>
                  <Text className='identify-desc'>拍一张植物照片，AI帮你识别种类和养护方法</Text>
                </View>

                <View className='button-container'>
                  {isLoading ? (
                    <View className='loading-container'>
                      <View className='loading-circle'>
                        <Icon name="refresh-cw" size={24} color="#fff" />
                      </View>
                      <Text className='loading-text'>AI 正在识别中...</Text>
                      <Text className='loading-subtext'>请稍候，正在分析植物特征</Text>
                    </View>
                  ) : (
                    <>
                      <View className='pulse-wrapper'>
                        <View className='main-button' onClick={() => handleIdentify('camera')}>
                          <View className='main-button-inner'>
                            <Icon name="camera" size={32} color="#fff" />
                          </View>
                          <View className='main-button-glow' />
                        </View>
                      </View>
                      <Text className='button-hint'>点击拍照识别</Text>

                      <View className='gallery-button'>
                        <View className='gallery-button-inner' onClick={() => handleIdentify('album')}>
                          <Icon name="image" size={20} color="#f46" />
                          <Text className='gallery-button-text'>从相册选择</Text>
                        </View>
                      </View>
                    </>
                  )}
                </View>
              </>
            ) : (
              <View>
                <View className='result-header'>
                  <View className='result-badge'>
                    <Icon name="check" size={16} color="#52c41a" />
                    <Text className='result-badge-text'>识别成功</Text>
                  </View>
                </View>

                {/* 检测结果标签（颜色圆点+名称+数量） */}
                {detectionTags.length > 0 && (
                  <View className='result-tags-card'>
                    <View className='result-tags-header'>
                      <Text className='result-tags-title'>检测结果</Text>
                      <Text className='result-tags-count'>{detectionTags.length} 个目标</Text>
                    </View>
                    <View className='result-tags-list'>
                      {detectionTags.map((tag, index) => (
                        <View key={index} className='result-tag-item'>
                          <View
                            className='result-tag-dot'
                            style={{ backgroundColor: tag.color }}
                          />
                          <Text className='result-tag-name'>{tag.name}</Text>
                          <Text className='result-tag-separator'>×</Text>
                          <Text className='result-tag-count' style={{ color: tag.color }}>{tag.count}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                <View className='result-card'>
                  {capturedImageUri ? (
                    <View className='result-image-wrapper'>
                      <Image className='result-image' src={capturedImageUri} mode='aspectFill' lazyLoad />
                      <BboxOverlay
                        imageSrc={capturedImageUri}
                        bboxes={detectionBboxes}
                        imageHeightRpx={320}
                      />
                    </View>
                  ) : (
                    <View className='result-plant-icon'>
                      <Icon name="flower2" size={32} color="#f59e0b" />
                    </View>
                  )}
                </View>

                <View className='result-buttons'>
                  <View className='retry-button' onClick={closePlantCard}>
                    <Icon name="arrow-left" size={16} color="#666" />
                    <Text className='retry-button-text'>重新识别</Text>
                  </View>
                  <View className='add-button' onClick={handleAddToGarden}>
                    <Text className='add-button-icon'>+</Text>
                    <Text className='add-button-text'>加入花园</Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Quick Actions */}
          <View className='section'>
            <Text className='section-title'>快捷功能</Text>
            <ScrollView scrollX className='quick-actions-scroll'>
              <View className='quick-actions-container'>
                {quickActions.map((action) => (
                  <View
                    key={action.id}
                    className='quick-action-card'
                    onClick={() => Taro.navigateTo({ url: action.url })}
                  >
                    <View className='quick-action-icon' style={{ backgroundColor: action.color }}>
                      <Icon name={action.icon as any} size={24} color="#fff" />
                    </View>
                    <Text className='quick-action-label'>{action.label}</Text>
                    <Text className='quick-action-desc'>{action.desc}</Text>
                    <View className='quick-action-arrow'>
                      <Icon name="chevron-right" size={16} color="#999" />
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Weather Tips */}
          <View className='section'>
            <Text className='section-title'>今日小贴士</Text>
            {weatherLoading ? (
              <View className='weather-loading'>
                <Icon name="refresh-cw" size={20} color="#999" />
                <Text className='weather-loading-text'>正在获取天气...</Text>
              </View>
            ) : weatherData ? (
              <View className='weather-card'>
                <View className='weather-gradient'>
                  <View className='weather-main-info'>
                    <View className='weather-left'>
                      <Text className='weather-temp'>{weatherData.temp}{'\u00B0'}</Text>
                      <Text className='weather-temp-range'>
                        H:{weatherData.tempMax}{'\u00B0'} L:{weatherData.tempMin}{'\u00B0'}
                      </Text>
                    </View>
                    <View className='weather-right'>
                      <Text className='weather-condition'>{weatherData.condition}</Text>
                      <View className='weather-location-row'>
                        <Icon name="map-pin" size={14} color="#fff" />
                        <Text className='weather-location'>{weatherData.location}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View className='weather-metrics'>
                  <View className='weather-metric-item'>
                    <Icon name="droplet" size={16} color="#007aff" />
                    <Text className='weather-metric-value'>{weatherData.humidity}%</Text>
                    <Text className='weather-metric-label'>湿度</Text>
                  </View>
                  <View className='weather-metric-divider' />
                  <View className='weather-metric-item'>
                    <Icon name="leaf" size={16} color="#52c41a" />
                    <Text className='weather-metric-value'>{weatherData.windSpeed}</Text>
                    <Text className='weather-metric-label'>风速</Text>
                  </View>
                  <View className='weather-metric-divider' />
                  <View className='weather-metric-item'>
                    <Icon name="sun" size={16} color="#faad14" />
                    <Text className='weather-metric-value'>UV {weatherData.uvIndex}</Text>
                    <Text className='weather-metric-label'>紫外线</Text>
                  </View>
                </View>

                <View className='weather-tip-section'>
                  <View className='weather-tip-header'>
                    <Icon name="lightbulb" size={16} color="#faad14" />
                    <Text className='weather-tip-title'>今日养护建议</Text>
                  </View>
                  <Text className='weather-tip-text'>{weatherTip}</Text>
                  <View className='refresh-button' onClick={fetchWeatherTip}>
                    <Icon name="refresh-cw" size={16} color="#999" />
                  </View>
                </View>
              </View>
            ) : (
              <View className='weather-empty' onClick={fetchWeatherTip}>
                <Icon name="lightbulb" size={32} color="#faad14" />
                <Text className='weather-empty-text'>点击获取今日小贴士</Text>
              </View>
            )}
          </View>

          {/* Recommend Plants */}
          <View className='section last-section'>
            <View className='section-header'>
              <Text className='section-title-inline'>今日推荐</Text>
              <View className='view-all-button' onClick={() => Taro.switchTab({ url: '/pages/encyclopedia/index' })}>
                <Text className='view-all-text'>查看全部</Text>
                <Icon name="chevron-right" size={16} color="#999" />
              </View>
            </View>
            <ScrollView scrollX className='recommend-scroll'>
              <View className='recommend-list'>
                {recommendPlants.map((plant, index) => {
                  const plantColor = getCategoryColor(plant.category)
                  return (
                    <View
                      key={plant.id || index}
                      className='recommend-card'
                      onClick={() => Taro.navigateTo({ url: `/pages/encyclopediaDetail/index?id=${plant.id}&name=${encodeURIComponent(plant.name)}` })}
                    >
                      <View className='recommend-image' style={{ backgroundColor: plantColor + '20' }}>
                        {plant.image_url ? (
                          <Image className='recommend-card-image' src={getFullImageUrl(plant.image_url)} mode='aspectFill' lazyLoad />
                        ) : (
                          <Icon name="leaf" size={32} color={plantColor} />
                        )}
                      </View>
                      <View className='recommend-info'>
                        <View className='recommend-name-row'>
                          <Text className='recommend-name'>{plant.name}</Text>
                          <View className='recommend-tag' style={{ backgroundColor: plantColor + '15' }}>
                            <Text className='recommend-tag-text' style={{ color: plantColor }}>{plant.category || '室内'}</Text>
                          </View>
                        </View>
                        <Text className='recommend-desc'>{plant.description || plant.category || '室内植物'}</Text>
                      </View>
                    </View>
                  )
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </ScrollView>
      <CustomTabBar />
    </View>
  )
}
