import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import Icon from '../../components/Icon'
import './index.scss'
import {
  getAddresses,
  deleteAddress,
  setDefaultAddress,
  type Address,
} from '../../services/addressService'

export default function Address() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAddresses()
  }, [])

  useDidShow(() => {
    loadAddresses()
  })

  const loadAddresses = async () => {
    try {
      setLoading(true)
      const data = await getAddresses()
      setAddresses(data)
    } catch (err) {
      console.error('加载地址失败', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSetDefault = async (id: number) => {
    try {
      await setDefaultAddress(id)
      Taro.showToast({ title: '已设为默认', icon: 'success' })
      loadAddresses()
    } catch (err: any) {
      Taro.showToast({ title: err.message || '操作失败', icon: 'none' })
    }
  }

  const handleEdit = (id: number) => {
    Taro.navigateTo({ url: `/pages/addressEdit/index?id=${id}` })
  }

  const handleDelete = (id: number) => {
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除该地址吗?',
      confirmColor: '#ff4d4f',
      success: async (res) => {
        if (res.confirm) {
          try {
            await deleteAddress(id)
            Taro.showToast({ title: '已删除', icon: 'success' })
            loadAddresses()
          } catch (err: any) {
            Taro.showToast({ title: err.message || '删除失败', icon: 'none' })
          }
        }
      },
    })
  }

  const handleAdd = () => {
    Taro.navigateTo({ url: '/pages/addressEdit/index' })
  }

  return (
    <View className='address-page'>
      {/* 渐变头部 */}
      <View className='header-gradient'>
        <View className='header'>
          <View className='back-btn' onClick={() => Taro.navigateBack()}>
            <Icon name="arrow-left" size={24} color="#fff" />
          </View>
          <Text className='header-title'>收货地址</Text>
          <View className='add-btn-header' onClick={handleAdd}>
            <Icon name="plus" size={24} color="#fff" />
          </View>
        </View>
      </View>

      {loading ? (
        <View className='loading-container'>
          <Text className='loading-text'>加载中...</Text>
        </View>
      ) : addresses.length === 0 ? (
        <View className='empty'>
          <Text className='empty-text'>暂无收货地址</Text>
          <View className='add-btn' onClick={handleAdd}>
            <Text className='add-btn-text'>添加地址</Text>
          </View>
        </View>
      ) : (
        <ScrollView scrollY className='list-scroll'>
          <View className='list-content'>
            {addresses.map((item) => (
              <View key={item.id.toString()} className='address-card'>
                <View className='address-info' onClick={() => handleEdit(item.id)}>
                  {item.is_default && (
                    <View className='default-badge'>
                      <Text className='default-text'>默认</Text>
                    </View>
                  )}
                  <Text className='name'>{item.name} {item.phone}</Text>
                  <Text className='address'>
                    {item.province}{item.city}{item.district}{item.detail_address}
                  </Text>
                </View>
                <View className='actions'>
                  {!item.is_default && (
                    <Text className='action-text' onClick={() => handleSetDefault(item.id)}>
                      设为默认
                    </Text>
                  )}
                  <Text className='action-text' onClick={() => handleEdit(item.id)}>
                    编辑
                  </Text>
                  <Text className='action-text delete' onClick={() => handleDelete(item.id)}>
                    删除
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  )
}
