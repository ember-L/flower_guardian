import { View, Text, ScrollView, Image, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import Icon from '../../components/Icon'
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

interface StoreItem {
  id: number
  name: string
  image_url: string
  price: number
  original_price?: number
  description: string
  category: string
  stock: number
  sales: number
  rating: number
}

interface StoreCategory {
  value: string
  name: string
  count: number
}

const defaultCategories: StoreCategory[] = [
  { value: 'all', name: '全部', count: 0 },
  { value: 'tools', name: '园艺工具', count: 0 },
  { value: 'fertilizer', name: '肥料', count: 0 },
  { value: 'soil', name: '土壤', count: 0 },
  { value: 'seeds', name: '种子', count: 0 },
  { value: 'pots', name: '花盆', count: 0 },
]

export default function Store() {
  const [items, setItems] = useState<StoreItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [categories, setCategories] = useState<StoreCategory[]>(defaultCategories)

  useEffect(() => {
    loadStoreItems()
  }, [])

  const loadStoreItems = () => {
    setLoading(true)
    Taro.request({
      url: `${API_BASE_URL}/api/store/items`,
      method: 'GET',
      success: (res) => {
        const data = res.data as any
        const list = data?.items || data?.list || []
        setItems(list)
        // Update category counts
        const cats = [...defaultCategories]
        cats[0].count = list.length
        list.forEach((item: StoreItem) => {
          const cat = cats.find(c => c.value === item.category)
          if (cat) cat.count++
        })
        setCategories(cats)
      },
      fail: () => {
        // Fallback mock data
        const mockItems: StoreItem[] = [
          { id: 1, name: '通用营养土', image_url: '', price: 29.9, original_price: 39.9, description: '适合大多数室内植物', category: 'soil', stock: 100, sales: 256, rating: 4.8 },
          { id: 2, name: '植物生长灯', image_url: '', price: 89, original_price: 129, description: '全光谱LED补光灯', category: 'tools', stock: 50, sales: 128, rating: 4.6 },
          { id: 3, name: '有机缓释肥', image_url: '', price: 19.9, original_price: 29.9, description: '180天长效缓释', category: 'fertilizer', stock: 200, sales: 512, rating: 4.9 },
          { id: 4, name: '陶瓷花盆套装', image_url: '', price: 59, original_price: 79, description: '北欧简约风格', category: 'pots', stock: 80, sales: 96, rating: 4.7 },
          { id: 5, name: '多肉种子合集', image_url: '', price: 15.9, original_price: 25.9, description: '10种多肉种子', category: 'seeds', stock: 150, sales: 320, rating: 4.5 },
          { id: 6, name: '园艺剪刀套装', image_url: '', price: 35, original_price: 49, description: '3件套不锈钢', category: 'tools', stock: 60, sales: 180, rating: 4.8 },
        ]
        setItems(mockItems)
        const cats = [...defaultCategories]
        cats[0].count = mockItems.length
        mockItems.forEach(item => {
          const cat = cats.find(c => c.value === item.category)
          if (cat) cat.count++
        })
        setCategories(cats)
      },
      complete: () => {
        setLoading(false)
      }
    })
  }

  const handleSearch = () => {
    if (searchText.trim()) {
      setLoading(true)
      Taro.request({
        url: `${API_BASE_URL}/api/store/items?search=${searchText.trim()}`,
        method: 'GET',
        success: (res) => {
          const data = res.data as any
          setItems(data?.items || data?.list || [])
        },
        fail: () => {},
        complete: () => { setLoading(false) }
      })
    } else {
      loadStoreItems()
    }
  }

  const handleCategoryPress = (categoryValue: string) => {
    setSelectedCategory(categoryValue)
    if (categoryValue === 'all') {
      loadStoreItems()
    } else {
      setLoading(true)
      Taro.request({
        url: `${API_BASE_URL}/api/store/items?category=${categoryValue}`,
        method: 'GET',
        success: (res) => {
          const data = res.data as any
          setItems(data?.items || data?.list || [])
        },
        fail: () => {},
        complete: () => { setLoading(false) }
      })
    }
  }

  const handleItemPress = (item: StoreItem) => {
    Taro.navigateTo({ url: `/pages/storeDetail/index?id=${item.id}` })
  }

  const filteredItems = selectedCategory === 'all'
    ? items
    : items.filter(item => item.category === selectedCategory)

  return (
    <View className='page-container'>
      {/* Header Gradient */}
      <View className='header-gradient'>
        <View className='header'>
          <View className='header-content'>
            <View className='header-icon'>
              <Icon name="shopping-cart" size={24} color="#fff" />
            </View>
            <View className='header-text-container'>
              <Text className='header-title'>植物商城</Text>
              <Text className='header-subtitle'>精选好物，养护必备</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView scrollY className='scroll-view'>
        <View className='content'>
          {/* Search Bar - Floating */}
          <View className='search-container'>
            <View className='search-icon-wrapper'>
              <Icon name="search" size={18} color="#999" />
            </View>
            <Input
              className='search-input'
              placeholder='搜索商品...'
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

          {/* Categories */}
          <View className='section'>
            <ScrollView scrollX className='category-scroll'>
              <View className='category-container'>
                {categories.map((cat) => (
                  <View
                    key={cat.value}
                    className={`category-chip ${selectedCategory === cat.value ? 'active' : ''}`}
                    onClick={() => handleCategoryPress(cat.value)}
                  >
                    <Text className={`category-chip-text ${selectedCategory === cat.value ? 'active' : ''}`}>
                      {cat.name}
                    </Text>
                    <Text className={`category-chip-count ${selectedCategory === cat.value ? 'active' : ''}`}>
                      {cat.count}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Products Grid */}
          <View className='section'>
            {loading ? (
              <View className='loading-container'>
                <Text className='loading-text'>加载中...</Text>
              </View>
            ) : filteredItems.length > 0 ? (
              <View className='products-grid'>
                {filteredItems.map((item) => (
                  <View
                    key={item.id}
                    className='product-card'
                    onClick={() => handleItemPress(item)}
                  >
                    <View className='product-image-container'>
                      {item.image_url ? (
                        <Image className='product-image' src={getFullImageUrl(item.image_url)} mode='aspectFill' />
                      ) : (
                        <View className='product-image-placeholder'>
                          <Icon name="leaf" size={32} color="#10b981" />
                        </View>
                      )}
                      {item.original_price && item.original_price > item.price && (
                        <View className='discount-badge'>
                          <Text className='discount-text'>
                            {Math.round((1 - item.price / item.original_price) * 100)}% OFF
                          </Text>
                        </View>
                      )}
                    </View>
                    <View className='product-info'>
                      <Text className='product-name'>{item.name}</Text>
                      <Text className='product-desc'>{item.description}</Text>
                      <View className='product-meta'>
                        <View className='product-rating'>
                          <Icon name="star" size={14} color="#faad14" />
                          <Text className='rating-value'>{item.rating || '4.5'}</Text>
                        </View>
                        <Text className='product-sales'>已售 {item.sales || 0}</Text>
                      </View>
                      <View className='product-price-row'>
                        <View className='price-group'>
                          <Text className='price-symbol'>{'\u00A5'}</Text>
                          <Text className='price-value'>{item.price}</Text>
                        </View>
                        {item.original_price && item.original_price > item.price && (
                          <Text className='original-price'>{'\u00A5'}{item.original_price}</Text>
                        )}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View className='empty-container'>
                <Icon name="shopping-cart" size={48} color="#ccc" />
                <Text className='empty-title'>暂无商品</Text>
                <Text className='empty-desc'>换个关键词试试</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
