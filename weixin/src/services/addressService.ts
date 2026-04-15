import request from './request'

// 地址类型
export interface Address {
  id: number
  name: string
  phone: string
  province?: string
  city?: string
  district?: string
  detail_address: string
  is_default: boolean
  created_at: string
}

// 获取地址列表
export const getAddresses = async (): Promise<Address[]> => {
  return request<Address[]>({ url: '/api/addresses' })
}

// 创建地址
export const createAddress = async (data: Omit<Address, 'id' | 'created_at'>): Promise<Address> => {
  return request<Address>({ url: '/api/addresses', method: 'POST', data })
}

// 更新地址
export const updateAddress = async (id: number, data: Partial<Address>): Promise<Address> => {
  return request<Address>({ url: `/api/addresses/${id}`, method: 'PUT', data })
}

// 删除地址
export const deleteAddress = async (id: number): Promise<void> => {
  return request({ url: `/api/addresses/${id}`, method: 'DELETE' })
}

// 设置默认地址
export const setDefaultAddress = async (id: number): Promise<Address> => {
  return request<Address>({ url: `/api/addresses/${id}/set-default`, method: 'PUT' })
}
