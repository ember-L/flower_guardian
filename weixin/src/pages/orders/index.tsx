import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import Icon from '../../components/Icon'
import './index.scss'
import { getMyOrders, type Order } from '../../services/storeService'

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待确认', color: '#faad14' },
  confirmed: { label: '已确认', color: '#52c41a' },
  shipped: { label: '已发货', color: '#52c41a' },
  completed: { label: '已完成', color: '#52c41a' },
  cancelled: { label: '已取消', color: '#ff4d4f' },
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrders()
  }, [])

  useDidShow(() => {
    loadOrders()
  })

  const loadOrders = async () => {
    try {
      const data = await getMyOrders()
      setOrders(data)
    } catch (error) {
      console.error('Failed to load orders:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View className='orders-page'>
        <View className='loading-container'>
          <Text className='loading-text'>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='orders-page'>
      {/* 头部 - 渐变背景，与RN一致 */}
      <View className='header-gradient'>
        <View className='header'>
          <View className='back-btn' onClick={() => Taro.navigateBack()}>
            <Icon name="arrow-left" size={24} color="#fff" />
          </View>
          <Text className='header-title'>我的订单</Text>
          <View className='placeholder' />
        </View>
      </View>

      {orders.length === 0 ? (
        <View className='empty'>
          <Text className='empty-text'>暂无订单</Text>
        </View>
      ) : (
        <ScrollView scrollY className='orders-scroll'>
          <View className='list-content'>
            {orders.map((order) => {
              const statusInfo = statusMap[order.status] || { label: order.status, color: '#999999' }

              return (
                <View
                  key={order.id}
                  className='order-card'
                  onClick={() => Taro.navigateTo({ url: `/pages/orderDetail/index?id=${order.id}` })}
                >
                  <View className='order-header'>
                    <Text className='order-no'>{order.order_no}</Text>
                    <Text className='status' style={{ color: statusInfo.color }}>
                      {statusInfo.label}
                    </Text>
                  </View>

                  <View className='order-items'>
                    {order.items.map((orderItem, index) => (
                      <Text key={index} className='item-text'>
                        {orderItem.product_name} x{orderItem.quantity}
                      </Text>
                    ))}
                  </View>

                  <View className='order-footer'>
                    <Text className='total-amount'>¥{order.total_amount}</Text>
                    <Text className='date'>
                      {new Date(order.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              )
            })}
          </View>
        </ScrollView>
      )}
    </View>
  )
}
