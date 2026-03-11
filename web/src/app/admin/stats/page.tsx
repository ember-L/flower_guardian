'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function StatsPage() {
  const [overview, setOverview] = useState({
    total_sales: 0,
    order_count: 0,
    avg_order_value: 0,
    user_count: 0,
  });
  const [trend, setTrend] = useState({ labels: [] as string[], sales: [] as number[], orders: [] as number[] });
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [groupBy, setGroupBy] = useState('day');

  const fetchData = async () => {
    try {
      const params: any = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const [overviewRes, trendRes, productsRes] = await Promise.all([
        api.get('/api/admin/stats/overview', { params }),
        api.get('/api/admin/stats/trend', { params: { ...params, group_by: groupBy } }),
        api.get('/api/admin/stats/products', { params }),
      ]);

      setOverview(overviewRes.data);
      setTrend(trendRes.data);
      setProducts(productsRes.data.items);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, groupBy]);

  const metrics = [
    { label: '销售总额', value: `¥${overview.total_sales.toFixed(2)}`, change: '+12.5%', icon: 'sales', color: 'from-green-500 to-green-600', iconBg: 'bg-green-100' },
    { label: '订单数量', value: overview.order_count, change: '+8.2%', icon: 'orders', color: 'from-blue-500 to-blue-600', iconBg: 'bg-blue-100' },
    { label: '客单价', value: `¥${overview.avg_order_value.toFixed(2)}`, change: '+3.1%', icon: 'cart', color: 'from-purple-500 to-purple-600', iconBg: 'bg-purple-100' },
    { label: '新增用户', value: overview.user_count, change: '+15.3%', icon: 'users', color: 'from-orange-500 to-orange-600', iconBg: 'bg-orange-100' },
  ];

  const getIcon = (icon: string) => {
    const icons: Record<string, React.ReactNode> = {
      sales: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      orders: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      cart: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      users: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
    };
    return icons[icon] || null;
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#f46]"></div>
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">数据统计</h1>

      {/* 日期选择 */}
      <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
        <div className="flex gap-4 items-center flex-wrap">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f46]/20 focus:border-[#f46] transition-all"
            />
            <span className="text-gray-400">至</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f46]/20 focus:border-[#f46] transition-all"
            />
          </div>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f46]/20 focus:border-[#f46] transition-all bg-white"
          >
            <option value="day">按天</option>
            <option value="week">按周</option>
            <option value="month">按月</option>
          </select>
        </div>
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className={`bg-gradient-to-br ${metric.color} text-white rounded-2xl p-6 shadow-lg`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">{metric.label}</p>
                <p className="text-3xl font-bold mt-2">{metric.value}</p>
                <p className="text-white/60 text-xs mt-2">{metric.change} 较上期</p>
              </div>
              <div className={`${metric.iconBg} p-3 rounded-xl`}>
                <div className="text-gray-600">{getIcon(metric.icon)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 趋势图 */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">销售趋势</h2>
        <div className="h-64 flex items-end gap-1">
          {trend.labels.map((label: string, index: number) => {
            const maxSales = Math.max(...trend.sales, 1);
            const height = (trend.sales[index] / maxSales) * 200;
            return (
              <div key={label} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-gradient-to-t from-[#f46] to-[#ff6b88] rounded-t-lg hover:opacity-80 transition-opacity cursor-pointer"
                  style={{ height: `${height}px`, minHeight: '4px' }}
                  title={`¥${trend.sales[index]}`}
                />
                <div className="text-xs text-gray-400 mt-2 truncate max-w-full">{label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 热门商品 */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">热门商品排行榜</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500">排名</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500">商品名称</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-500">销量</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-500">销售额</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product: any, index: number) => (
                <tr key={product.product_id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-100 text-gray-600' :
                      index === 2 ? 'bg-orange-50 text-orange-700' :
                      'bg-gray-50 text-gray-400'
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{product.product_name}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                      {product.sales_count} 件
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-[#f46] font-semibold">¥{product.sales_amount.toFixed(2)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-gray-400">暂无数据</p>
          </div>
        )}
      </div>
    </div>
  );
}
