'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Order {
  id: number;
  order_no: string;
  user_id: number;
  total_amount: string;
  status: string;
  delivery_type: string;
  delivery_address?: string;
  contact_name: string;
  contact_phone: string;
  remark?: string;
  created_at: string;
}

const statusMap: Record<string, { label: string; class: string; bg: string }> = {
  pending: { label: '待确认', class: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
  confirmed: { label: '已确认', class: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  shipped: { label: '已发货', class: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
  completed: { label: '已完成', class: 'text-green-600', bg: 'bg-green-50 border-green-200' },
  cancelled: { label: '已取消', class: 'text-red-600', bg: 'bg-red-50 border-red-200' },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    try {
      const params = filterStatus ? { status: filterStatus } : {};
      const response = await api.get('/api/admin/orders', { params });
      setOrders(response.data.items);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filterStatus]);

  const handleStatusChange = async (orderId: number, status: string) => {
    try {
      await api.put(`/api/admin/orders/${orderId}`, { status });
      fetchOrders();
    } catch (error) {
      console.error('Failed to update order:', error);
    }
  };

  const nextStatuses: Record<string, string[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['shipped'],
    shipped: ['completed'],
    completed: [],
    cancelled: [],
  };

  const statusLabels: Record<string, string> = {
    confirmed: '确认',
    shipped: '发货',
    completed: '完成',
    cancelled: '取消',
  };

  const statusColors: Record<string, string> = {
    confirmed: 'bg-blue-500 hover:bg-blue-600',
    shipped: 'bg-purple-500 hover:bg-purple-600',
    completed: 'bg-green-500 hover:bg-green-600',
    cancelled: 'bg-red-500 hover:bg-red-600',
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#f46]"></div>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">订单管理</h1>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#f46]/20 focus:border-[#f46] transition-all bg-white"
        >
          <option value="">全部订单</option>
          <option value="pending">待确认</option>
          <option value="confirmed">已确认</option>
          <option value="shipped">已发货</option>
          <option value="completed">已完成</option>
          <option value="cancelled">已取消</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500">订单号</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500">客户 ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500">金额</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500">配送方式</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500">联系人</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500">状态</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500">创建时间</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => {
                const statusInfo = statusMap[order.status] || { label: order.status, class: 'text-gray-600', bg: 'bg-gray-50' };
                return (
                  <tr key={order.id} className={`border-t border-gray-100 hover:bg-gray-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">{order.order_no}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">#{order.user_id}</td>
                    <td className="px-6 py-4">
                      <span className="text-[#f46] font-semibold">¥{order.total_amount}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${order.delivery_type === 'express' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                        {order.delivery_type === 'express' ? '快递' : '自提'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{order.contact_name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusInfo.bg} ${statusInfo.class}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-[#f46] hover:bg-[#f46]/10 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                        >
                          详情
                        </button>
                        {nextStatuses[order.status]?.map((nextStatus) => (
                          <button
                            key={nextStatus}
                            onClick={() => handleStatusChange(order.id, nextStatus)}
                            className={`text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusColors[nextStatus]}`}
                          >
                            {statusLabels[nextStatus]}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {orders.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-400">暂无订单</p>
          </div>
        )}
      </div>

      {/* 订单详情弹窗 */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-[500px] overflow-hidden">
            <div className="bg-gradient-to-r from-[#f46] to-[#ff6b88] px-6 py-4">
              <h2 className="text-xl font-bold text-white">订单详情</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">订单号</p>
                  <p className="font-mono text-gray-800 bg-gray-100 px-3 py-2 rounded-xl text-sm">{selectedOrder.order_no}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">状态</p>
                  <span className={`inline-block px-3 py-2 rounded-xl text-sm font-medium border ${statusMap[selectedOrder.status]?.bg} ${statusMap[selectedOrder.status]?.class}`}>
                    {statusMap[selectedOrder.status]?.label}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">客户 ID</p>
                  <p className="text-gray-800">#{selectedOrder.user_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">订单金额</p>
                  <p className="text-[#f46] font-semibold text-lg">¥{selectedOrder.total_amount}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">配送方式</p>
                <p className="text-gray-800">{selectedOrder.delivery_type === 'express' ? '快递' : '自提'}</p>
              </div>
              {selectedOrder.delivery_address && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">收货地址</p>
                  <p className="text-gray-800 bg-gray-50 px-3 py-2 rounded-xl">{selectedOrder.delivery_address}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">联系人</p>
                  <p className="text-gray-800">{selectedOrder.contact_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">联系电话</p>
                  <p className="text-gray-800">{selectedOrder.contact_phone}</p>
                </div>
              </div>
              {selectedOrder.remark && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">备注</p>
                  <p className="text-gray-800 bg-gray-50 px-3 py-2 rounded-xl">{selectedOrder.remark}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500 mb-1">创建时间</p>
                <p className="text-gray-600">{new Date(selectedOrder.created_at).toLocaleString()}</p>
              </div>
            </div>
            <div className="px-6 pb-6">
              <button
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl transition-colors"
                onClick={() => setSelectedOrder(null)}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
