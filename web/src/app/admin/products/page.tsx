'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Product {
  id: number;
  name: string;
  price: string;
  stock: number;
  status: string;
  image_url?: string;
  description?: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const fetchProducts = async () => {
    try {
      const params = search ? { search } : {};
      const response = await api.get('/api/admin/products', { params });
      setProducts(response.data.items);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除该商品吗？')) return;
    try {
      await api.delete(`/api/admin/products/${id}`);
      fetchProducts();
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await api.put(`/api/admin/products/${id}`, { status });
      fetchProducts();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleSave = async (product: Partial<Product>) => {
    try {
      if (product.id) {
        await api.put(`/api/admin/products/${product.id}`, product);
      } else {
        await api.post('/api/admin/products', product);
      }
      setShowForm(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Failed to save product:', error);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#f46]"></div>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">商品管理</h1>
        <button
          onClick={() => { setEditingProduct(null); setShowForm(true); }}
          className="bg-gradient-to-r from-[#f46] to-[#ff6b88] text-white px-4 py-2 rounded-xl hover:shadow-lg hover:shadow-[#f46]/25 transition-all duration-200 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          添加商品
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                placeholder="搜索商品名称..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f46]/20 focus:border-[#f46] transition-all"
              />
            </div>
            <button type="submit" className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl transition-colors">
              搜索
            </button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500">ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500">名称</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500">价格</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500">库存</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500">状态</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => (
                <tr key={product.id} className={`border-t border-gray-100 hover:bg-gray-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                  <td className="px-6 py-4">
                    <span className="text-gray-400 font-mono text-sm">#{product.id}</span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-800">{product.name}</td>
                  <td className="px-6 py-4">
                    <span className="text-[#f46] font-semibold">¥{product.price}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${product.stock > 10 ? 'bg-green-100 text-green-700' : product.stock > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {product.stock} 件
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${product.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {product.status === 'active' ? '上架中' : '已下架'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditingProduct(product); setShowForm(true); }}
                        className="text-[#f46] hover:bg-[#f46]/10 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleStatusChange(product.id, product.status === 'active' ? 'inactive' : 'active')}
                        className="text-gray-500 hover:bg-gray-100 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                      >
                        {product.status === 'active' ? '下架' : '上架'}
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-gray-400">暂无商品</p>
          </div>
        )}
      </div>

      {/* 商品表单弹窗 */}
      {showForm && (
        <ProductForm
          product={editingProduct}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingProduct(null); }}
        />
      )}
    </div>
  );
}

function ProductForm({ product, onSave, onClose }: { product?: Product | null; onSave: (p: any) => void; onClose: () => void }) {
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    price: string | number;
    stock: string | number;
    image_url: string;
    status: string;
  }>({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    stock: product?.stock || 0,
    image_url: product?.image_url || '',
    status: product?.status || 'active',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price as string),
      stock: parseInt(formData.stock as string),
      image_url: formData.image_url,
      status: formData.status,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-[500px] max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-[#f46] to-[#ff6b88] px-6 py-4">
          <h2 className="text-xl font-bold text-white">{product?.id ? '编辑商品' : '添加商品'}</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">商品名称</label>
            <input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f46]/20 focus:border-[#f46] transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f46]/20 focus:border-[#f46] transition-all"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">价格</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f46]/20 focus:border-[#f46] transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">库存</label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f46]/20 focus:border-[#f46] transition-all"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">图片 URL</label>
            <input
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f46]/20 focus:border-[#f46] transition-all"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-5 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              取消
            </button>
            <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-[#f46] to-[#ff6b88] text-white rounded-xl hover:shadow-lg hover:shadow-[#f46]/25 transition-all">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
