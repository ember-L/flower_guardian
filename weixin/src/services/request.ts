import Taro from '@tarojs/taro'
import { API_BASE_URL } from './config'

// 请求封装
const request = async <T = any>(options: {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  header?: Record<string, string>
  needAuth?: boolean
}): Promise<T> => {
  const { url, method = 'GET', data, header = {}, needAuth = true } = options

  if (needAuth) {
    const token = Taro.getStorageSync('huaban_token')
    if (token) {
      header['Authorization'] = `Bearer ${token}`
    }
  }

  const response = await Taro.request({
    url: url.startsWith('http') ? url : `${API_BASE_URL}${url}`,
    method,
    data,
    header: {
      'Content-Type': 'application/json',
      ...header,
    },
  })

  if (response.statusCode === 401) {
    // token 过期，尝试刷新
    const refreshToken = Taro.getStorageSync('huaban_refresh_token')
    if (refreshToken) {
      try {
        const refreshRes = await Taro.request({
          url: `${API_BASE_URL}/api/users/refresh-token`,
          method: 'POST',
          data: { refresh_token: refreshToken },
          header: { 'Content-Type': 'application/json' },
        })
        if (refreshRes.statusCode === 200) {
          const newToken = refreshRes.data.access_token
          Taro.setStorageSync('huaban_token', newToken)
          if (refreshRes.data.refresh_token) {
            Taro.setStorageSync('huaban_refresh_token', refreshRes.data.refresh_token)
          }
          // 重试原请求
          header['Authorization'] = `Bearer ${newToken}`
          const retryRes = await Taro.request({
            url: url.startsWith('http') ? url : `${API_BASE_URL}${url}`,
            method,
            data,
            header: {
              'Content-Type': 'application/json',
              ...header,
            },
          })
          return retryRes.data as T
        }
      } catch {
        // 刷新失败，清除登录状态
      }
    }
    // 刷新失败，跳转登录
    Taro.removeStorageSync('huaban_token')
    Taro.removeStorageSync('huaban_refresh_token')
    Taro.removeStorageSync('huaban_current_user')
    throw new Error('登录已过期，请重新登录')
  }

  if (response.statusCode >= 400) {
    const errorMsg = response.data?.detail || response.data?.message || '请求失败'
    throw new Error(errorMsg)
  }

  return response.data as T
}

// 上传文件封装
export const uploadFile = async (url: string, filePath: string, fieldName = 'file') => {
  const token = Taro.getStorageSync('huaban_token')
  const response = await Taro.uploadFile({
    url: url.startsWith('http') ? url : `${API_BASE_URL}${url}`,
    filePath,
    name: fieldName,
    header: {
      'Authorization': token ? `Bearer ${token}` : '',
    },
  })
  const data = JSON.parse(response.data)
  if (response.statusCode >= 400) {
    throw new Error(data?.detail || '上传失败')
  }
  return data
}

// 获取完整图片URL
export const getFullImageUrl = (url: string): string => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${API_BASE_URL}${url}`
}

export default request
