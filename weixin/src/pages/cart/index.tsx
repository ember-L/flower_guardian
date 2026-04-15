import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useEffect, useCallback } from 'react'
import './index.scss'
import { getCart, updateCartItem, deleteCartItem, clearCart, type Cart, type CartItem } from '../../services/storeService'

export default function Cart() {
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)

  const loadCart = useCallback(async () => {
    try {
      const data = await getCart()
      setCart(data)
    } catch (error) {
      console.error('Failed to load cart:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCart()
  }, [loadCart])

  useDidShow(() => {
    loadCart()
  })

  const handleUpdateQuantity = async (item: CartItem, delta: number) => {
    const newQty = item.quantity + delta
    if (newQty < 1) return
    if (newQty > item.stock) {
      Taro.showToast({ title: `库存不足，当前库存仅剩 ${item.stock} 件`, icon: 'none' })
      return
    }
    try {
      await updateCartItem(item.id, newQty)
      loadCart()
    } catch (error) {
      console.error('Failed to update quantity:', error)
    }
  }

  const handleDelete = (itemId: number) => {
    Taro.showModal({
      title: '确认删除',
      content: '确定要从购物车中删除该商品吗?',
      confirmColor: '#ff4d4f',
      success: async (res) => {
        if (res.confirm) {
          try {
            await deleteCartItem(itemId)
            loadCart()
          } catch (error) {
            console.error('Failed to delete item:', error)
          }
        }
      },
    })
  }

  const handleClearCart = () => {
    Taro.showModal({
      title: '确认清空',
      content: '确定要清空购物车吗?',
      confirmColor: '#ff4d4f',
      success: async (res) => {
        if (res.confirm) {
          try {
            await clearCart()
            loadCart()
          } catch (error) {
            console.error('Failed to clear cart:', error)
          }
        }
      },
    })
  }

  const navigateToCheckout = () => {
    Taro.navigateTo({ url: '/pages/checkout/index' })
  }

  const navigateToStore = () => {
    Taro.switchTab({ url: '/pages/store/index' })
  }

  if (loading) {
    return (
      <View className='cart-page'>
        <View className='loading-container'>
          <Text className='loading-text'>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='cart-page'>
      {/* 头部 - 渐变背景，与RN一致 */}
      <View className='header-gradient'>
        <View className='header'>
          <View className='back-btn' onClick={() => Taro.navigateBack()}>
            <Text className='back-icon'>&lt;</Text>
          </View>
          <Text className='header-title'>购物车</Text>
          {cart && cart.items.length > 0 ? (
            <View className='clear-btn' onClick={handleClearCart}>
              <Text className='clear-btn-text'>清空</Text>
            </View>
          ) : (
            <View className='placeholder' />
          )}
        </View>
      </View>

      {(!cart || cart.items.length === 0) ? (
        <View className='empty'>
          <Text className='empty-text'>购物车是空的</Text>
          <View className='shop-btn' onClick={navigateToStore}>
            <Text className='shop-btn-text'>去逛逛</Text>
          </View>
        </View>
      ) : (
        <>
          <ScrollView scrollY className='cart-scroll'>
            <View className='list-content'>
              {cart.items.map((item) => (
                <View key={item.id} className='cart-item'>
                  <Image
                    className='product-image'
                    src={item.product_image && item.product_image.trim().length > 0 ? item.product_image : 'https://via.placeholder.com/80'}
                    mode='aspectFill'
                  />
                  <View className='item-info'>
                    <Text className='product-name'>{item.product_name}</Text>
                    <Text className='product-price'>¥{item.price}</Text>
                    <View className='quantity-row'>
                      <View
                        className='qty-btn'
                        onClick={() => handleUpdateQuantity(item, -1)}
                      >
                        <Text className='qty-btn-text'>-</Text>
                      </View>
                      <Text className='quantity'>{item.quantity}</Text>
                      <View
                        className='qty-btn'
                        onClick={() => handleUpdateQuantity(item, 1)}
                      >
                        <Text className='qty-btn-text'>+</Text>
                      </View>
                    </View>
                  </View>
                  <View className='item-right'>
                    <Text className='subtotal'>¥{item.subtotal}</Text>
                    <View className='delete-btn' onClick={() => handleDelete(item.id)}>
                      <Text className='delete-btn-text'>删除</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
            <View className='bottom-spacer' />
          </ScrollView>

          {/* 底部总价栏 */}
          <View className='footer'>
            <View className='total-row'>
              <Text className='total-label'>共 {cart.item_count} 件</Text>
              <Text className='total-amount'>¥{cart.total_amount}</Text>
            </View>
            <View className='checkout-btn' onClick={navigateToCheckout}>
              <Text className='checkout-btn-text'>去结算</Text>
            </View>
          </View>
        </>
      )}
    </View>
  )
}
