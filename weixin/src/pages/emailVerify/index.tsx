import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { auth } from '../../services/auth'
import Icon from '../../components/Icon'
import './index.scss'

export default function EmailVerify() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailAddress, setEmailAddress] = useState('')

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params
    if (params?.email) {
      setEmailAddress(params.email)
    }
  }, [])

  const handleVerify = async () => {
    if (!code.trim() || code.length !== 6) {
      Taro.showToast({ title: '请输入6位验证码', icon: 'none' })
      return
    }
    if (!emailAddress.trim()) {
      Taro.showToast({ title: '请输入邮箱地址', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      await auth.verifyEmail({ email: emailAddress, code: code.trim() })
      Taro.showToast({ title: '验证成功', icon: 'success' })
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (err: any) {
      Taro.showToast({ title: err.message || '验证失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!emailAddress.trim()) {
      Taro.showToast({ title: '请输入邮箱地址', icon: 'none' })
      return
    }
    try {
      await auth.resendVerifyCode({ email: emailAddress })
      Taro.showToast({ title: '验证码已重新发送', icon: 'success' })
    } catch (err: any) {
      Taro.showToast({ title: err.message || '发送失败', icon: 'none' })
    }
  }

  return (
    <View className='container'>
      {/* 头部 */}
      <View className='header'>
        <View className='back-button' onClick={() => Taro.navigateBack()}>
          <Text className='back-icon'>&lt;</Text>
        </View>
      </View>

      <View className='content'>
        <View className='icon-container'>
          <Icon name="mail" size={40} color="#333" />
        </View>
        <Text className='title'>邮箱验证</Text>
        <Text className='subtitle'>请输入发送到您邮箱的验证码</Text>

        <View className='form'>
          <View className='input-container'>
            <View className='input-icon'>
              <Icon name="mail" size={18} color="#999" />
            </View>
            <Input
              className='input'
              placeholder='邮箱地址'
              placeholderClass='input-placeholder'
              value={emailAddress}
              onInput={(e) => setEmailAddress(e.detail.value)}
            />
          </View>

          <View className='input-container'>
            <View className='input-icon'>
              <Icon name="shield" size={18} color="#999" />
            </View>
            <Input
              className='input'
              placeholder='6位验证码'
              placeholderClass='input-placeholder'
              type='number'
              maxlength={6}
              value={code}
              onInput={(e) => setCode(e.detail.value)}
            />
          </View>

          <View
            className={`verify-button ${loading ? 'verify-button-disabled' : ''}`}
            onClick={!loading ? handleVerify : undefined}
          >
            <Text className='verify-button-text'>
              {loading ? '验证中...' : '立即验证'}
            </Text>
          </View>

          <View className='resend-button' onClick={handleResend}>
            <Text className='resend-text'>没收到验证码？重新发送</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

definePageConfig({
  navigationBarBackgroundColor: '#fafafa',
  navigationBarTextStyle: 'black',
  navigationBarTitleText: '',
})
