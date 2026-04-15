import { View, Text, ScrollView, Image, Input } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import './index.scss'
import { API_BASE_URL } from '../../services/config'
import { getProductDetail, createOrder, type Product } from '../../services/storeService'
import { getAddresses, type Address } from '../../services/addressService'

// 获取完整的图片URL
const getFullImageUrl = (url: string): string => {
  if (!url || typeof url !== 'string') return ''
  const trimmed = url.trim()
  if (trimmed.length === 0) return ''
  if (trimmed.startsWith('http')) return trimmed
  return `${API_BASE_URL}${trimmed}`
}

export default function StoreDetail() {
  const router = useRouter()
  const productId = Number(router.params.id)
  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState('1')
  const [deliveryType, setDeliveryType] = useState<'express' | 'pickup'>('express')
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [remark, setRemark] = useState('')
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [showAddressList, setShowAddressList] = useState(false)

  useEffect(() => {
    if (productId) {
      loadProduct()
      loadAddresses()
    }
  }, [productId])

  const loadProduct = async () => {
    try {
      const data = await getProductDetail(productId)
      setProduct(data)
    } catch (error) {
      console.error('Failed to load product:', error)
    } finally {
      setPageLoading(false)
    }
  }

  const loadAddresses = async () => {
    try {
      const data = await getAddresses()
      setAddresses(data)
      const defaultAddr = data.find((a: Address) => a.is_default)
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id)
        setContactName(defaultAddr.name)
        setContactPhone(defaultAddr.phone)
      }
    } catch (error) {
      console.error('Failed to load addresses:', error)
    }
  }

  const handleAddressSelect = (address: Address) => {
    setSelectedAddressId(address.id)
    setContactName(address.name)
    setContactPhone(address.phone)
    setShowAddressList(false)
  }

  const getSelectedAddress = () => {
    return addresses.find((a: Address) => a.id === selectedAddressId)
  }

  const handleOrder = async () => {
    if (!contactName || !contactPhone) {
      Taro.showToast({ title: '请选择收货地址', icon: 'none' })
      return
    }

    const selectedAddress = getSelectedAddress()
    const fullAddress = selectedAddress
      ? `${selectedAddress.province || ''}${selectedAddress.city || ''}${selectedAddress.district || ''}${selectedAddress.detail_address}`
      : ''

    setLoading(true)
    try {
      await createOrder({
        items: [{ product_id: product!.id, quantity: parseInt(quantity) }],
        delivery_type: deliveryType,
        delivery_address: deliveryType === 'express' ? fullAddress : undefined,
        contact_name: contactName,
        contact_phone: contactPhone,
        remark: remark || undefined,
      })
      Taro.showToast({ title: '订单创建成功！', icon: 'success' })
      setTimeout(() => {
        Taro.navigateBack()
      }, 1000)
    } catch (error: any) {
      Taro.showToast({ title: error.message || '下单失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  if (pageLoading || !product) {
    return (
      <View className='store-detail'>
        <Text className='loading-text'>加载中...</Text>
      </View>
    )
  }

  const productImage = product.image_url && product.image_url.trim().length > 0
    ? getFullImageUrl(product.image_url)
    : 'https://via.placeholder.com/300'

  return (
    <View className='store-detail'>
      <ScrollView scrollY className='detail-scroll'>
        {/* 商品图片 */}
        <Image
          className='product-image'
          src={productImage}
          mode='aspectFill'
        />

        {/* 商品信息 */}
        <View className='info'>
          <Text className='name'>{product.name}</Text>
          <Text className='price'>¥{product.price}</Text>
          <Text className='stock'>
            {product.stock > 0 ? `库存: ${product.stock}` : '缺货'}
          </Text>
          {product.description && (
            <Text className='description'>{product.description}</Text>
          )}
        </View>

        {/* 下单表单 */}
        <View className='form'>
          <Text className='section-title'>下单信息</Text>

          {/* 数量 */}
          <View className='input-row'>
            <Text className='label'>数量</Text>
            <Input
              className='input'
              type='number'
              value={quantity}
              onInput={(e) => setQuantity(e.detail.value)}
            />
          </View>

          {/* 配送方式 */}
          <View className='input-row'>
            <Text className='label'>配送方式</Text>
            <View className='delivery-options'>
              <View
                className={`option ${deliveryType === 'express' ? 'option-active' : ''}`}
                onClick={() => setDeliveryType('express')}
              >
                <Text className={`option-text ${deliveryType === 'express' ? 'option-text-active' : ''}`}>
                  快递
                </Text>
              </View>
              <View
                className={`option ${deliveryType === 'pickup' ? 'option-active' : ''}`}
                onClick={() => setDeliveryType('pickup')}
              >
                <Text className={`option-text ${deliveryType === 'pickup' ? 'option-text-active' : ''}`}>
                  到店自提
                </Text>
              </View>
            </View>
          </View>

          {/* 收货地址 */}
          {deliveryType === 'express' && (
            <View className='input-row'>
              <Text className='label'>收货地址</Text>
              {addresses.length > 0 ? (
                <View className='address-selector' onClick={() => setShowAddressList(!showAddressList)}>
                  {selectedAddressId ? (
                    <View className='address-info'>
                      <Text className='address-text'>
                        {getSelectedAddress()?.name} {getSelectedAddress()?.phone}
                      </Text>
                      <Text className='address-detail'>
                        {getSelectedAddress()?.province}{getSelectedAddress()?.city}{getSelectedAddress()?.district}{getSelectedAddress()?.detail_address}
                      </Text>
                    </View>
                  ) : (
                    <Text className='placeholder-text'>请选择收货地址</Text>
                  )}
                  <Text className='chevron-right'>›</Text>
                </View>
              ) : (
                <View
                  className='add-address-btn'
                  onClick={() => Taro.navigateTo({ url: '/pages/addressEdit/index' })}
                >
                  <Text className='add-icon'>+</Text>
                  <Text className='add-address-text'>添加收货地址</Text>
                </View>
              )}
              {showAddressList && (
                <View className='address-list'>
                  {addresses.map((addr: Address) => (
                    <View
                      key={addr.id}
                      className={`address-item ${selectedAddressId === addr.id ? 'address-item-selected' : ''}`}
                      onClick={() => handleAddressSelect(addr)}
                    >
                      <View>
                        <Text className='address-text'>{addr.name} {addr.phone}</Text>
                        <Text className='address-detail'>
                          {addr.province}{addr.city}{addr.district}{addr.detail_address}
                        </Text>
                      </View>
                      {addr.is_default && (
                        <View className='default-tag'>
                          <Text className='default-tag-text'>默认</Text>
                        </View>
                      )}
                    </View>
                  ))}
                  <View
                    className='add-new-address'
                    onClick={() => {
                      setShowAddressList(false)
                      Taro.navigateTo({ url: '/pages/addressEdit/index' })
                    }}
                  >
                    <Text className='add-icon-sm'>+</Text>
                    <Text className='add-new-address-text'>添加新地址</Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* 联系人 */}
          <View className='input-row'>
            <Text className='label'>联系人</Text>
            <Input
              className='input'
              placeholder='请输入联系人姓名'
              placeholderClass='input-placeholder'
              value={contactName}
              onInput={(e) => setContactName(e.detail.value)}
            />
          </View>

          {/* 联系电话 */}
          <View className='input-row'>
            <Text className='label'>联系电话</Text>
            <Input
              className='input'
              type='number'
              placeholder='请输入联系电话'
              placeholderClass='input-placeholder'
              value={contactPhone}
              onInput={(e) => setContactPhone(e.detail.value)}
            />
          </View>

          {/* 备注 */}
          <View className='input-row'>
            <Text className='label'>备注</Text>
            <Input
              className='input text-area'
              placeholder='请输入备注'
              placeholderClass='input-placeholder'
              value={remark}
              onInput={(e) => setRemark(e.detail.value)}
            />
          </View>
        </View>

        {/* 底部留白 */}
        <View className='bottom-spacer' />
      </ScrollView>

      {/* 提交订单按钮 */}
      <View
        className={`order-button ${loading ? 'order-button-disabled' : ''}`}
        onClick={loading ? undefined : handleOrder}
      >
        <Text className='order-button-text'>
          {loading ? '提交中...' : '提交订单'}
        </Text>
      </View>
    </View>
  )
}
