import request, { getFullImageUrl } from './request'

// 商品类型
export interface Product {
  id: number
  name: string
  description?: string
  price: string
  stock: number
  image_url?: string
  status: string
  plant_id?: number
  created_at: string
}

// 订单项类型
export interface OrderItem {
  id: number
  product_id: number
  product_name: string
  quantity: number
  unit_price: string
  subtotal: string
}

// 订单类型
export interface Order {
  id: number
  order_no: string
  user_id: number
  total_amount: string
  status: string
  delivery_type: string
  delivery_address?: string
  contact_name: string
  contact_phone: string
  remark?: string
  created_at: string
  items: OrderItem[]
}

// 购物车类型
export interface CartItem {
  id: number
  product_id: number
  product_name: string
  product_image: string
  price: string
  quantity: number
  stock: number
  subtotal: string
}

export interface Cart {
  items: CartItem[]
  total_amount: string
  item_count: number
}

// 支付类型
export interface Payment {
  id: number
  order_id: number
  amount: string
  payment_method: string
  status: string
  transaction_id?: string
  paid_at?: string
  created_at: string
}

// 获取商品列表
export const getProducts = async (): Promise<Product[]> => {
  const data = await request<{ items: Product[] }>({ url: '/api/products' })
  return data.items || data
}

// 获取商品详情
export const getProductDetail = async (id: number): Promise<Product> => {
  return request<Product>({ url: `/api/products/${id}` })
}

// 获取购物车
export const getCart = async (): Promise<Cart> => {
  return request<Cart>({ url: '/api/cart' })
}

// 添加到购物车
export const addToCart = async (productId: number, quantity = 1): Promise<CartItem> => {
  return request<CartItem>({ url: '/api/cart/items', method: 'POST', data: { product_id: productId, quantity } })
}

// 更新购物车数量
export const updateCartItem = async (itemId: number, quantity: number): Promise<CartItem> => {
  return request<CartItem>({ url: `/api/cart/items/${itemId}`, method: 'PUT', data: { quantity } })
}

// 删除购物车项
export const deleteCartItem = async (itemId: number): Promise<void> => {
  return request({ url: `/api/cart/items/${itemId}`, method: 'DELETE' })
}

// 清空购物车
export const clearCart = async (): Promise<void> => {
  return request({ url: '/api/cart/clear', method: 'DELETE' })
}

// 创建订单
export const createOrder = async (orderData: {
  items: { product_id: number; quantity: number }[]
  delivery_type: string
  delivery_address?: string
  contact_name: string
  contact_phone: string
  remark?: string
}): Promise<Order> => {
  return request<Order>({ url: '/api/orders', method: 'POST', data: orderData })
}

// 获取我的订单列表
export const getMyOrders = async (): Promise<Order[]> => {
  const data = await request<{ items: Order[] }>({ url: '/api/orders' })
  return data.items || data
}

// 筛选订单
export const getOrdersByStatus = async (status: string): Promise<Order[]> => {
  const data = await request<{ items: Order[] }>({ url: '/api/orders', data: { status } })
  return data.items || data
}

// 获取订单详情
export const getOrderDetail = async (id: number): Promise<Order> => {
  return request<Order>({ url: `/api/orders/${id}` })
}

// 取消订单
export const cancelOrder = async (orderId: number): Promise<void> => {
  return request({ url: `/api/orders/${orderId}/cancel`, method: 'POST' })
}

// 再次购买
export const reorder = async (orderId: number): Promise<void> => {
  return request({ url: `/api/orders/${orderId}/reorder`, method: 'POST' })
}

// 创建支付
export const createPayment = async (orderId: number, paymentMethod = 'offline'): Promise<Payment> => {
  return request<Payment>({ url: '/api/payments', method: 'POST', data: { order_id: orderId, payment_method: paymentMethod } })
}

// 获取支付状态
export const getPayment = async (paymentId: number): Promise<Payment> => {
  return request<Payment>({ url: `/api/payments/${paymentId}` })
}
