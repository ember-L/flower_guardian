import { View, Text, ScrollView, Image, Input } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useEffect, useCallback } from 'react'
import Icon from '../../components/Icon'
import CustomTabBar from '../../components/CustomTabBar'
import { getFullImageUrl } from '../../services/request'
import { Product, getProducts } from '../../services/storeService'
import './index.scss'

export default function Store() {
  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')

  const loadStoreItems = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getProducts()
      setItems(data)
    } catch (err) {
      console.error('加载商品失败:', err)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useDidShow(() => {
    loadStoreItems()
  })

  useEffect(() => {
    loadStoreItems()
  }, [loadStoreItems])

  const handleSearch = () => {
    if (searchText.trim()) {
      const filtered = items.filter(item => item.name.includes(searchText.trim()))
      // 实际上搜索应该在后端进行，这里做前端过滤
      setItems(filtered)
    } else {
      loadStoreItems()
    }
  }

  const handleItemPress = (item: Product) => {
    Taro.navigateTo({ url: `/pages/storeDetail/index?id=${item.id}` })
  }

  const navigateToOrders = () => {
    Taro.navigateTo({ url: '/pages/orders/index' })
  }

  const navigateToCart = () => {
    Taro.navigateTo({ url: '/pages/cart/index' })
  }

  const filteredItems = searchText
    ? items.filter(item => item.name.includes(searchText))
    : items

  return (
    <View className='page-container'>
      {/* Header Gradient */}
      <View className='header-gradient'>
        <View className='header'>
          <Text className='header-title'>植物商城</Text>
          <View className='header-buttons'>
            <View className='header-btn' onClick={navigateToOrders}>
              <Icon name="file-text" size={20} color="#fff" />
            </View>
            <View className='header-btn' onClick={navigateToCart}>
              <Icon name="shopping-cart" size={20} color="#fff" />
            </View>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View className='search-container'>
        <View className='search-icon'>
          <Icon name="search" size={18} color="#f46" />
        </View>
        <Input
          className='search-input'
          placeholder='搜索商品'
          placeholderClass='search-placeholder'
          value={searchText}
          onInput={(e) => setSearchText(e.detail.value)}
          onConfirm={handleSearch}
          confirmType='search'
        />
      </View>

      {/* Products Grid */}
      <ScrollView scrollY className='scroll-view'>
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
                </View>
                <View className='product-info'>
                  <Text className='product-name' numberOfLines={1}>{item.name}</Text>
                  <Text className='product-price'>¥{item.price}</Text>
                  <Text className='product-stock'>
                    {item.stock > 0 ? `库存: ${item.stock}` : '缺货'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className='empty-container'>
            <Icon name="shopping-cart" size={48} color="#999" />
            <Text className='empty-text'>暂无商品</Text>
          </View>
        )}
      </ScrollView>
      <CustomTabBar />
    </View>
  )
}
