'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    productsCount: 0,
    ordersCount: 0,
    pendingOrders: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [productsRes, ordersRes] = await Promise.all([
          api.get('/api/admin/products', { params: { limit: 1 } }),
          api.get('/api/admin/orders', { params: { limit: 100 } }),
        ]);

        const pendingOrders = ordersRes.data.items.filter(
          (o: any) => o.status === 'pending'
        ).length;

        const totalRevenue = ordersRes.data.items
          .filter((o: any) => o.status === 'completed' || o.status === 'shipped')
          .reduce((sum: number, o: any) => sum + parseFloat(o.total_amount), 0);

        setStats({
          productsCount: productsRes.data.total,
          ordersCount: ordersRes.data.total,
          pendingOrders,
          totalRevenue,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#f46]"></div>
    </div>
  );

  const cards = [
    {
      title: '商品总数',
      value: stats.productsCount,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      bg: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-100'
    },
    {
      title: '订单总数',
      value: stats.ordersCount,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      bg: 'from-green-500 to-green-600',
      iconBg: 'bg-green-100'
    },
    {
      title: '待处理订单',
      value: stats.pendingOrders,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bg: 'from-orange-500 to-orange-600',
      iconBg: 'bg-orange-100'
    },
    {
      title: '总收入',
      value: `¥${stats.totalRevenue.toFixed(2)}`,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bg: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-100'
    },
  ];

  return (
    <div>
      {/* 标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">仪表盘</h1>
        <p className="text-gray-500 mt-1">欢迎回来，这里是您的数据中心</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <div
            key={index}
            className={`bg-gradient-to-br ${card.bg} text-white rounded-2xl p-6 shadow-lg`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">{card.title}</p>
                <p className="text-3xl font-bold mt-2">{card.value}</p>
              </div>
              <div className={`${card.iconBg} p-3 rounded-xl`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
