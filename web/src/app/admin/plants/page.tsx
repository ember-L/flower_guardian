'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Plant {
  id: number;
  name: string;
  scientific_name?: string;
  category?: string;
  care_level: number;
  description?: string;
}

export default function AdminPlantsPage() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);

  const fetchPlants = async () => {
    try {
      const params = search ? { search } : {};
      const response = await api.get('/api/admin/plants', { params });
      setPlants(response.data.items);
    } catch (error) {
      console.error('Failed to fetch plants:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlants();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除该植物吗？')) return;
    try {
      await api.delete(`/api/admin/plants/${id}`);
      fetchPlants();
    } catch (error) {
      console.error('Failed to delete plant:', error);
    }
  };

  const handleSave = async (plant: Partial<Plant>) => {
    try {
      if (plant.id) {
        await api.put(`/api/admin/plants/${plant.id}`, plant);
      } else {
        await api.post('/api/admin/plants', plant);
      }
      setShowForm(false);
      setEditingPlant(null);
      fetchPlants();
    } catch (error) {
      console.error('Failed to save plant:', error);
    }
  };

  const getCareLevelColor = (level: number) => {
    if (level <= 1) return 'bg-green-100 text-green-700';
    if (level <= 2) return 'bg-yellow-100 text-yellow-700';
    if (level <= 3) return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#f46]"></div>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">植物百科管理</h1>
        <button
          onClick={() => { setEditingPlant(null); setShowForm(true); }}
          className="bg-gradient-to-r from-[#f46] to-[#ff6b88] text-white px-4 py-2 rounded-xl hover:shadow-lg hover:shadow-[#f46]/25 transition-all duration-200 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          添加植物
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <form onSubmit={(e) => { e.preventDefault(); fetchPlants(); }} className="flex gap-3">
            <div className="relative flex-1">
              <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                placeholder="搜索植物名称..."
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
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500">学名</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500">分类</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500">养护难度</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {plants.map((plant, index) => (
                <tr key={plant.id} className={`border-t border-gray-100 hover:bg-gray-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                  <td className="px-6 py-4">
                    <span className="text-gray-400 font-mono text-sm">#{plant.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                      </div>
                      <span className="font-medium text-gray-800">{plant.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 italic">{plant.scientific_name || '-'}</td>
                  <td className="px-6 py-4">
                    {plant.category ? (
                      <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                        {plant.category}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getCareLevelColor(plant.care_level)}`}>
                      {plant.care_level} 级
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditingPlant(plant); setShowForm(true); }}
                        className="text-[#f46] hover:bg-[#f46]/10 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(plant.id)}
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

        {plants.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <p className="text-gray-400">暂无植物</p>
          </div>
        )}
      </div>

      {showForm && (
        <PlantForm
          plant={editingPlant}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingPlant(null); }}
        />
      )}
    </div>
  );
}

function PlantForm({ plant, onSave, onClose }: { plant?: Plant | null; onSave: (p: any) => void; onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: plant?.name || '',
    scientific_name: plant?.scientific_name || '',
    category: plant?.category || '',
    care_level: plant?.care_level || 1,
    description: plant?.description || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(plant?.id ? { ...formData, id: plant.id } : formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-[500px] max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
          <h2 className="text-xl font-bold text-white">{plant?.id ? '编辑植物' : '添加植物'}</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">名称</label>
            <input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">学名</label>
            <input
              value={formData.scientific_name}
              onChange={(e) => setFormData({ ...formData, scientific_name: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all italic"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">分类</label>
              <input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">养护难度 (1-5)</label>
              <input
                type="number"
                min="1"
                max="5"
                value={formData.care_level}
                onChange={(e) => setFormData({ ...formData, care_level: parseInt(e.target.value) })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-5 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              取消
            </button>
            <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg hover:shadow-green-500/25 transition-all">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
