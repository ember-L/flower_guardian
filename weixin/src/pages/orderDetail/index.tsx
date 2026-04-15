import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import './index.scss'
import { getOrderDetail, cancelOrder, reorder, type Order } from '../../services/storeService'

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待确认', color: '#faad14' },
  confirmed: { label: '已确认', color: '#007aff' },
  shipped: { label: '已发货', color: '#52c41a' },
  completed: { label: '已完成', color: '#52c41a' },
  cancelled: { label: '已取消', color: '#ff4d4f' },
}

export default function OrderDetail() {
  const router = useRouter()
  const orderId = Number(router.params.id)
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (orderId) {
      loadOrder()
    }
  }, [orderId])

  const loadOrder = async () => {
    try {
      const data = await getOrderDetail(orderId)
      setOrder(data)
    } catch (error) {
      console.error('Failed to load order:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    Taro.showModal({
      title: '确认取消',
      content: '确定要取消此订单吗?',
      confirmColor: '#ff4d4f',
      success: async (res) => {
        if (res.confirm) {
          try {
            await cancelOrder(orderId)
            loadOrder()
          } catch (error) {
            console.error('Failed to cancel order:', error)
          }
        }
      },
    })
  }

  const handleReorder = async () => {
    try {
      await reorder(orderId)
      Taro.showToast({ title: '已重新下单', icon: 'success' })
      setTimeout(() => {
        Taro.navigateTo({ url: '/pages/cart/index' })
      }, 1000)
    } catch (error) {
      console.error('Failed to reorder:', error)
    }
  }

  if (loading || !order) {
    return (
      <View className='order-detail'>
        <View className='loading-container'>
          <Text className='loading-text'>加载中...</Text>
        </View>
      </View>
    )
  }

  const statusInfo = statusMap[order.status] || { label: order.status, color: '#333333' }

  return (
    <View className='order-detail'>
      <ScrollView scrollY className='detail-scroll'>
        {/* 头部 - 订单号和状态 */}
        <View className='header'>
          <Text className='order-no'>{order.order_no}</Text>
          <View className='status-badge' style={{ backgroundColor: statusInfo.color + '20' }}>
            <Text className='status-text' style={{ color: statusInfo.color }}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        {/* 商品信息 */}
        <View className='section'>
          <Text className='section-title'>商品信息</Text>
          {order.items.map((item, idx) => (
            <View key={idx} className='item-row'>
              <Text className='item-name'>{item.product_name}</Text>
              <Text className='item-qty'>x{item.quantity}</Text>
              <Text className='item-price'>¥{item.subtotal}</Text>
            </View>
          ))}
          <View className='total-row'>
            <Text className='total-label'>合计</Text>
            <Text className='total-amount'>¥{order.total_amount}</Text>
          </View>
        </View>

        {/* 配送信息 */}
        <View className='section'>
          <Text className='section-title'>配送信息</Text>
          <Text className='info-text'>配送方式: {order.delivery_type === 'express' ? '快递' : '自提'}</Text>
          {order.delivery_address && <Text className='info-text'>地址: {order.delivery_address}</Text>}
          <Text className='info-text'>联系人: {order.contact_name}</Text>
          <Text className='info-text'>电话: {order.contact_phone}</Text>
          {order.remark && <Text className='info-text'>备注: {order.remark}</Text>}
        </View>

        {/* 订单信息 */}
        <View className='section'>
          <Text className='section-title'>订单信息</Text>
          <Text className='info-text'>下单时间: {new Date(order.created_at).toLocaleString()}</Text>
        </View>

        {/* 底部留白 */}
        <View className='bottom-spacer' />
      </ScrollView>

      {/* 底部操作按钮 */}
      <View className='footer'>
        {order.status === 'pending' && (
          <View className='cancel-btn' onClick={handleCancel}>
            <Text className='cancel-btn-text'>取消订单</Text>
          </View>
        )}
        {order.status === 'completed' && (
          <View className='reorder-btn' onClick={handleReorder}>
            <Text className='reorder-btn-text'>再次购买</Text>
          </View>
        )}
      </View>
    </View>
  )
}
