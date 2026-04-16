import { View, Text, ScrollView, Image, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import Icon from '../../components/Icon'
import CustomTabBar from '../../components/CustomTabBar'
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

interface Plant {
  id: number
  name: string
  image_url: string
  category: string
  care_level: number
  description: string
}

interface PlantCategory {
  value: string
  name: string
  count: number
  icon?: string
}

const difficultyLevels = [
  { id: '1', name: '入门', color: '#52c41a', value: 1 },
  { id: '2', name: '初级', color: '#8bc34a', value: 2 },
  { id: '3', name: '中级', color: '#faad14', value: 3 },
  { id: '4', name: '高级', color: '#ff9800', value: 4 },
  { id: '5', name: '专家', color: '#ff4d4f', value: 5 },
]

const pitfallsData = [
  { id: '1', title: '浇水过多', desc: '80%的植物死于浇水过多', icon: 'droplet' },
  { id: '2', title: '光照不当', desc: '喜阳植物放室内会徒长', icon: 'sun' },
  { id: '3', title: '施肥过度', desc: '薄肥勤施，切忌浓肥', icon: 'sparkles' },
]

const categoryIcons: Record<string, string> = {
  'leaf': 'leaf',
  'sprout': 'sprout',
  'flower2': 'flower2',
  'tree': 'leaf',
  'cactus': 'sprout',
  'default': 'leaf',
}

export default function Encyclopedia() {
  const [plants, setPlants] = useState<Plant[]>([])
  const [categories, setCategories] = useState<PlantCategory[]>([])
  const [popularPlants, setPopularPlants] = useState<Plant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null)

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = () => {
    setLoading(true)
    Taro.request({
      url: `${API_BASE_URL}/api/plants?limit=20`,
      method: 'GET',
      success: (res) => {
        const data = res.data as any
        setPlants(data?.items || data?.list || [])
      },
      fail: () => {
        setPlants([])
      }
    })
    Taro.request({
      url: `${API_BASE_URL}/api/plants/categories`,
      method: 'GET',
      success: (res) => {
        const data = res.data as any
        setCategories(data?.categories || [])
      },
      fail: () => {
        setCategories([])
      }
    })
    Taro.request({
      url: `${API_BASE_URL}/api/plants/popular?limit=10`,
      method: 'GET',
      success: (res) => {
        const data = res.data as any
        setPopularPlants(data?.items || data?.list || [])
      },
      fail: () => {
        setPopularPlants([])
      },
      complete: () => {
        setLoading(false)
      }
    })
  }

  const handleSearch = () => {
    if (searchText.trim()) {
      Taro.request({
        url: `${API_BASE_URL}/api/plants?limit=20&search=${searchText.trim()}`,
        method: 'GET',
        success: (res) => {
          const data = res.data as any
          setPlants(data?.items || data?.list || [])
        }
      })
    } else {
      loadAllData()
    }
  }

  const handleCategoryPress = (categoryValue: string) => {
    setSelectedCategory(categoryValue)
    Taro.request({
      url: `${API_BASE_URL}/api/plants?limit=20&category=${categoryValue}`,
      method: 'GET',
      success: (res) => {
        const data = res.data as any
        setPlants(data?.items || data?.list || [])
      }
    })
  }

  const handleAllCategoryPress = () => {
    setSelectedCategory(null)
    loadAllData()
  }

  const handleDifficultyPress = (level?: number) => {
    setSelectedDifficulty(level ?? null)
    if (level) {
      Taro.request({
        url: `${API_BASE_URL}/api/plants?limit=20&care_level=${level}`,
        method: 'GET',
        success: (res) => {
          const data = res.data as any
          setPlants(data?.items || data?.list || [])
        }
      })
    } else {
      loadAllData()
    }
  }

  const getDifficultyName = (level?: number) => {
    if (!level) return '入门'
    const diff = difficultyLevels.find(d => d.value === level)
    return diff?.name || '入门'
  }

  const getDifficultyColor = (level?: number) => {
    if (!level) return '#52c41a'
    const diff = difficultyLevels.find(d => d.value === level)
    return diff?.color || '#52c41a'
  }

  const getCategoryIcon = (iconKey?: string) => {
    return categoryIcons[iconKey || ''] || categoryIcons.default
  }

  const totalPlantCount = categories.reduce((sum, c) => sum + c.count, 0)

  return (
    <View className='page-container'>
      {/* Header Gradient */}
      <View className='header-gradient'>
        <View className='header'>
          <View className='header-content'>
            <View className='header-icon'>
              <Icon name="book-open" size={24} color="#fff" />
            </View>
            <View className='header-text-container'>
              <Text className='header-title'>养护百科</Text>
              <Text className='header-subtitle'>探索植物的奇妙世界</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView scrollY className='scroll-view'>
        <View className='content'>
          {/* Search Bar - Floating */}
          <View className='search-container'>
            <View className='search-icon-wrapper'>
              <Icon name="search" size={18} color="#f46" />
            </View>
            <Input
              className='search-input'
              placeholder='搜索植物名称或养护问题...'
              placeholderClass='search-placeholder'
              value={searchText}
              onInput={(e) => setSearchText(e.detail.value)}
              onConfirm={handleSearch}
              confirmType='search'
            />
            {searchText.length > 0 && (
              <Icon name="x" size={16} color="#999" />
            )}
          </View>

          {/* Difficulty Filter */}
          <View className='section'>
            <View className='section-header-row'>
              <Icon name="activity" size={18} color="#f46" />
              <Text className='section-title'>难度筛选</Text>
            </View>
            <ScrollView scrollX className='difficulty-scroll'>
              <View className='difficulty-container'>
                <View
                  className={`difficulty-chip ${selectedDifficulty === null ? 'active' : ''}`}
                  onClick={() => handleDifficultyPress()}
                >
                  <Text className={`difficulty-chip-text ${selectedDifficulty === null ? 'active' : ''}`}>全部</Text>
                </View>
                {difficultyLevels.map((item) => (
                  <View
                    key={item.id}
                    className={`difficulty-chip ${selectedDifficulty === item.value ? 'active' : ''}`}
                    style={selectedDifficulty === item.value ? { backgroundColor: item.color, borderColor: item.color } : {}}
                    onClick={() => handleDifficultyPress(item.value)}
                  >
                    <View className='difficulty-dot' style={{ backgroundColor: item.color }} />
                    <Text className={`difficulty-chip-text ${selectedDifficulty === item.value ? 'active' : ''}`}>{item.name}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Category Grid */}
          <View className='section'>
            <View className='section-header-row'>
              <Icon name="grid" size={18} color="#f46" />
              <Text className='section-title'>植物分类</Text>
            </View>
            <View className='category-grid'>
              <View
                className={`category-card ${selectedCategory === null ? 'selected' : ''}`}
                onClick={handleAllCategoryPress}
              >
                <View className={`category-icon-wrapper ${selectedCategory === null ? 'active' : ''}`}>
                  <Icon name="grid" size={20} color={selectedCategory === null ? '#fff' : '#666'} />
                </View>
                <Text className={`category-name ${selectedCategory === null ? 'active' : ''}`}>全部</Text>
                <Text className='category-count'>{totalPlantCount} 种</Text>
              </View>
              {categories.map((item) => (
                <View
                  key={item.value}
                  className={`category-card ${selectedCategory === item.value ? 'selected' : ''}`}
                  onClick={() => handleCategoryPress(item.value)}
                >
                  <View className={`category-icon-wrapper ${selectedCategory === item.value ? 'active' : ''}`}>
                    <Icon name={getCategoryIcon(item.icon) as any} size={20} color={selectedCategory === item.value ? '#fff' : '#666'} />
                  </View>
                  <Text className={`category-name ${selectedCategory === item.value ? 'active' : ''}`}>{item.name}</Text>
                  <Text className='category-count'>{item.count} 种</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Category Plants */}
          {selectedCategory && plants.length > 0 && (
            <View className='section'>
              <View className='section-header-row'>
                <Icon name="tag" size={18} color="#f46" />
                <Text className='section-title'>
                  {categories.find(c => c.value === selectedCategory)?.name || selectedCategory}
                </Text>
                <Text className='category-count-text'>（共 {plants.length} 种）</Text>
              </View>
              <View className='category-plants-grid'>
                {plants.slice(0, 12).map((plant) => (
                  <View
                    key={plant.id}
                    className='category-plant-card'
                    onClick={() => Taro.navigateTo({ url: `/pages/encyclopediaDetail/index?id=${plant.id}&name=${encodeURIComponent(plant.name)}` })}
                  >
                    <View className='category-plant-image-container'>
                      {plant.image_url ? (
                        <Image className='category-plant-image' src={getFullImageUrl(plant.image_url)} mode='aspectFill' lazyLoad />
                      ) : (
                        <Icon name="leaf" size={32} color="#10b981" />
                      )}
                    </View>
                    <Text className='category-plant-name'>{plant.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Popular Plants */}
          <View className='section'>
            <View className='section-header-row'>
              <Icon name="star" size={18} color="#faad14" />
              <Text className='section-title'>热门植物</Text>
              <View className='hot-badge'>
                <Icon name="trending-up" size={12} color="#fff" />
                <Text className='hot-badge-text'>TOP 10</Text>
              </View>
            </View>
            {loading ? (
              <View className='loading-container'>
                <Text className='loading-text'>加载中...</Text>
              </View>
            ) : popularPlants.length > 0 ? (
              <ScrollView scrollX className='popular-scroll'>
                <View className='popular-list'>
                  {popularPlants.slice(0, 10).map((plant, index) => (
                    <View
                      key={plant.id}
                      className='plant-card'
                      onClick={() => Taro.navigateTo({ url: `/pages/encyclopediaDetail/index?id=${plant.id}&name=${encodeURIComponent(plant.name)}` })}
                    >
                      <View className='plant-card-rank'>
                        <Text className='plant-rank-text'>#{index + 1}</Text>
                      </View>
                      <View className='plant-image-container'>
                        {plant.image_url ? (
                          <Image className='plant-image' src={getFullImageUrl(plant.image_url)} mode='aspectFill' lazyLoad />
                        ) : (
                          <View className='plant-image-placeholder'>
                            <Icon name="leaf" size={32} color="#10b981" />
                          </View>
                        )}
                      </View>
                      <Text className='plant-name'>{plant.name}</Text>
                      <View className='plant-meta-row'>
                        <Text className='plant-category'>{plant.category || '室内植物'}</Text>
                        <View className='difficulty-badge' style={{ backgroundColor: getDifficultyColor(plant.care_level) + '20' }}>
                          <Text className='difficulty-text' style={{ color: getDifficultyColor(plant.care_level) }}>
                            {getDifficultyName(plant.care_level)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            ) : (
              <View className='empty-container'>
                <Icon name="file-text" size={48} color="#999" />
                <Text className='empty-text'>暂无植物数据</Text>
              </View>
            )}
          </View>

          {/* Legend */}
          <View className='section'>
            <View className='section-header-row'>
              <Icon name="info" size={18} color="#f46" />
              <Text className='section-title'>养护图标说明</Text>
            </View>
            <View className='legend-card'>
              <View className='legend-grid'>
                <View className='legend-item'>
                  <View className='legend-icon' style={{ backgroundColor: 'rgba(250, 173, 20, 0.15)' }}>
                    <Icon name="sun" size={22} color="#faad14" />
                  </View>
                  <Text className='legend-label'>喜阳</Text>
                  <Text className='legend-desc'>喜充足光照</Text>
                </View>
                <View className='legend-item'>
                  <View className='legend-icon' style={{ backgroundColor: 'rgba(24, 144, 255, 0.15)' }}>
                    <Icon name="cloud-rain" size={22} color="#007aff" />
                  </View>
                  <Text className='legend-label'>喜湿</Text>
                  <Text className='legend-desc'>喜湿润环境</Text>
                </View>
                <View className='legend-item'>
                  <View className='legend-icon' style={{ backgroundColor: 'rgba(82, 196, 26, 0.15)' }}>
                    <Icon name="thermometer" size={22} color="#52c41a" />
                  </View>
                  <Text className='legend-label'>耐寒</Text>
                  <Text className='legend-desc'>耐低温</Text>
                </View>
                <View className='legend-item'>
                  <View className='legend-icon' style={{ backgroundColor: 'rgba(255, 77, 79, 0.15)' }}>
                    <Icon name="alert-circle" size={22} color="#ff4d4f" />
                  </View>
                  <Text className='legend-label'>有毒</Text>
                  <Text className='legend-desc'>需注意安全</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Pitfalls */}
          <View className='section last-section'>
            <View className='pitfall-header'>
              <View className='pitfall-header-icon'>
                <Icon name="alert-triangle" size={20} color="#fff" />
              </View>
              <View>
                <Text className='pitfall-title'>避坑指南</Text>
                <Text className='pitfall-subtitle'>新手必看，这些坑不要踩</Text>
              </View>
            </View>
            <View className='pitfalls-list'>
              {pitfallsData.map((pitfall, index) => (
                <View key={pitfall.id} className='pitfall-card'>
                  <View className='pitfall-number-badge'>
                    <Text className='pitfall-number'>{index + 1}</Text>
                  </View>
                  <View className='pitfall-content'>
                    <Text className='pitfall-item-title'>{pitfall.title}</Text>
                    <Text className='pitfall-item-desc'>{pitfall.desc}</Text>
                  </View>
                  <Icon name="chevron-right" size={16} color="#999" />
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
      <CustomTabBar />
    </View>
  )
}
