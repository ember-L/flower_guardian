import { View, Text, Input, ScrollView, Textarea } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import './index.scss'
import Icon from '../../components/Icon'
import {
  getAddresses,
  createAddress,
  updateAddress,
  type Address,
} from '../../services/addressService'

export default function AddressEdit() {
  const router = useRouter()
  const addressId = router.params.id ? Number(router.params.id) : null
  const isEdit = !!addressId

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')
  const [detailAddress, setDetailAddress] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(isEdit)

  useEffect(() => {
    if (isEdit) loadAddress()
  }, [addressId])

  const loadAddress = async () => {
    try {
      setPageLoading(true)
      const addresses = await getAddresses()
      const addr = addresses.find((a: Address) => a.id === addressId)
      if (addr) {
        setName(addr.name)
        setPhone(addr.phone)
        setProvince(addr.province || '')
        setCity(addr.city || '')
        setDistrict(addr.district || '')
        setDetailAddress(addr.detail_address)
        setIsDefault(addr.is_default)
      }
    } catch (err) {
      console.error('加载地址失败', err)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setPageLoading(false)
    }
  }

  const handleSave = async () => {
    if (!name || !phone || !detailAddress) {
      Taro.showToast({ title: '请填写收货人、电话和详细地址', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      const data = {
        name,
        phone,
        province,
        city,
        district,
        detail_address: detailAddress,
        is_default: isDefault,
      }

      if (isEdit && addressId) {
        await updateAddress(addressId, data)
      } else {
        await createAddress(data as any)
      }

      Taro.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 1000)
    } catch (error) {
      Taro.showToast({ title: '保存地址失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  if (pageLoading) {
    return (
      <View className='page-loading'>
        <Text className='loading-text'>加载中...</Text>
      </View>
    )
  }

  return (
    <View className='address-edit-page'>
      {/* 渐变头部 */}
      <View className='header-gradient'>
        <View className='header'>
          <View className='back-btn' onClick={() => Taro.navigateBack()}>
            <Icon name="arrow-left" size={24} color="#fff" />
          </View>
          <Text className='header-title'>{isEdit ? '编辑地址' : '新增地址'}</Text>
          <View className='placeholder' />
        </View>
      </View>

      <ScrollView scrollY className='form'>
        <View className='input-group'>
          <Text className='label'>收货人</Text>
          <Input
            className='input'
            placeholder='请输入收货人姓名'
            placeholderClass='input-placeholder'
            value={name}
            onInput={(e) => setName(e.detail.value)}
          />
        </View>

        <View className='input-group'>
          <Text className='label'>联系电话</Text>
          <Input
            className='input'
            placeholder='请输入联系电话'
            type='number'
            placeholderClass='input-placeholder'
            value={phone}
            onInput={(e) => setPhone(e.detail.value)}
          />
        </View>

        <View className='input-group'>
          <Text className='label'>省份</Text>
          <Input
            className='input'
            placeholder='请输入省份'
            placeholderClass='input-placeholder'
            value={province}
            onInput={(e) => setProvince(e.detail.value)}
          />
        </View>

        <View className='input-group'>
          <Text className='label'>城市</Text>
          <Input
            className='input'
            placeholder='请输入城市'
            placeholderClass='input-placeholder'
            value={city}
            onInput={(e) => setCity(e.detail.value)}
          />
        </View>

        <View className='input-group'>
          <Text className='label'>区/县</Text>
          <Input
            className='input'
            placeholder='请输入区/县'
            placeholderClass='input-placeholder'
            value={district}
            onInput={(e) => setDistrict(e.detail.value)}
          />
        </View>

        <View className='input-group'>
          <Text className='label'>详细地址</Text>
          <Textarea
            className='input text-area'
            placeholder='请输入详细地址'
            placeholderClass='input-placeholder'
            value={detailAddress}
            onInput={(e) => setDetailAddress(e.detail.value)}
            maxlength={200}
            autoHeight
          />
        </View>

        {/* 复选框 */}
        <View className='checkbox-row' onClick={() => setIsDefault(!isDefault)}>
          <View className={`checkbox ${isDefault ? 'checked' : ''}`}>
            {isDefault && <Icon name="check" size={14} color="#fff" />}
          </View>
          <Text className='checkbox-label'>设为默认地址</Text>
        </View>
      </ScrollView>

      {/* 保存按钮 */}
      <View className={`save-btn ${loading ? 'disabled' : ''}`} onClick={handleSave}>
        <Text className='save-btn-text'>{loading ? '保存中...' : '保存地址'}</Text>
      </View>
    </View>
  )
}
