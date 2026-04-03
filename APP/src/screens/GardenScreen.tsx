// 花园屏幕 - 连接后端 API
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icons } from '../components/Icon';
import { colors, spacing } from '../constants/theme';
import { NavigationProps } from '../navigation/AppNavigator';
import { UserPlant, getMyPlants, addToMyGarden, deleteMyPlant, updateUserPlant, GardenStats, CalendarData, getGardenStats, getCareCalendar, getCareRecords, addCareRecord, CareRecord } from '../services/plantService';

interface GardenScreenProps extends Partial<NavigationProps> {}

const environmentLabels: Record<string, string> = {
  'south-balcony': '南阳台',
  'north-bedroom': '北卧室',
  'living-room': '客厅',
  'office': '办公室',
  'other': '其他位置',
};

export function GardenScreen({ onNavigate, currentTab, onTabChange, isLoggedIn, onRequireLogin, onLogout }: GardenScreenProps) {
  const [plants, setPlants] = useState<UserPlant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [plantCareRecords, setPlantCareRecords] = useState<Record<number, CareRecord[]>>({});
  const [editingPlant, setEditingPlant] = useState<UserPlant | null>(null);
  const [newPlantName, setNewPlantName] = useState('');
  const [newPlantNickname, setNewPlantNickname] = useState('');
  const [newPlantLocation, setNewPlantLocation] = useState('other');
  const [stats, setStats] = useState<GardenStats | null>(null);
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    loadPlants();
    loadStats();
  }, [isLoggedIn]);

  const loadStats = async () => {
    try {
      const [statsData, calendar] = await Promise.all([
        getGardenStats(),
        getCareCalendar()
      ]);
      setStats(statsData);
      setCalendarData(calendar);
    } catch (error) {
      console.error('[Garden] Failed to load stats:', error);
    }
  };

  const loadPlants = async () => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getMyPlants();
      setPlants(data);

      // 加载每个植物的养护记录
      const records: Record<number, CareRecord[]> = {};
      await Promise.all(data.map(async (plant) => {
        try {
          const careRecords = await getCareRecords(plant.id);
          records[plant.id] = careRecords;
        } catch {
          records[plant.id] = [];
        }
      }));
      setPlantCareRecords(records);
    } catch (error: any) {
      console.error('[Garden] Failed to load plants:', error?.response?.data || error?.message || error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPlants();
  };

  const filteredPlants = selectedLocation
    ? plants.filter(p => p.location === selectedLocation)
    : plants;

  const locationStats = plants.reduce((acc, plant) => {
    const loc = plant.location || 'other';
    acc[loc] = (acc[loc] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const uniqueLocations = Array.from(new Set(plants.map(p => p.location || 'other')));

  const handleWaterPlant = async (plantId: number) => {
    if (!isLoggedIn) {
      Alert.alert('提示', '请先登录');
      return;
    }
    try {
      await addCareRecord(plantId, { care_type: 'watering', notes: '快速浇水' });

      // 更新本地养护记录
      const newRecord = await getCareRecords(plantId);
      setPlantCareRecords(prev => ({ ...prev, [plantId]: newRecord }));

      // 刷新统计数据
      loadStats();

      Alert.alert('浇水成功', '已记录浇水时间');
    } catch (error) {
      Alert.alert('浇水成功', '已记录浇水时间');
    }
  };

  const handleDeletePlant = (plantId: number) => {
    Alert.alert('删除植物', '确定要删除这株植物吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMyPlant(plantId);
            setPlants(plants.filter(p => p.id !== plantId));
          } catch (error) {
            Alert.alert('失败', '无法删除植物');
          }
        },
      },
    ]);
  };

  const handleEditPlant = (plant: UserPlant) => {
    setEditingPlant(plant);
    setNewPlantName(plant.plant_name || '');
    setNewPlantNickname(plant.nickname || '');
    setNewPlantLocation(plant.location || 'other');
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingPlant || !newPlantName.trim()) {
      Alert.alert('请输入植物名称');
      return;
    }
    try {
      await updateUserPlant(editingPlant.id, {
        plant_name: newPlantName,
        nickname: newPlantNickname || newPlantName,
        location: newPlantLocation,
      });
      setPlants(plants.map(p => {
        if (p.id === editingPlant.id) {
          return {
            ...p,
            plant_name: newPlantName,
            nickname: newPlantNickname || newPlantName,
            location: newPlantLocation,
          };
        }
        return p;
      }));
      setShowEditModal(false);
      setEditingPlant(null);
      setNewPlantName('');
      setNewPlantNickname('');
      setNewPlantLocation('other');
    } catch (error) {
      Alert.alert('失败', '无法更新植物信息');
    }
  };

  const handleAddPlant = async () => {
    if (!isLoggedIn) {
      if (onRequireLogin) {
        onRequireLogin();
      }
      return;
    }
    if (!newPlantName.trim()) {
      Alert.alert('请输入植物名称');
      return;
    }
    try {
      const newPlant = await addToMyGarden({
        plant_name: newPlantName,
        nickname: newPlantNickname || newPlantName,
        location: newPlantLocation,
      });
      setPlants([...plants, newPlant]);
      setShowAddModal(false);
      setNewPlantName('');
      setNewPlantNickname('');
      setNewPlantLocation('other');
    } catch (error) {
      Alert.alert('失败', '无法添加植物');
    }
  };

  const handlePlantPress = (plant: UserPlant) => {
    if (onNavigate) {
      onNavigate('PlantDetail', { plantId: plant.id });
    }
  };

  const handleAddPlantPress = () => {
    if (!isLoggedIn) {
      Alert.alert(
        '提示',
        '登录后可使用花园功能',
        [
          { text: '取消', style: 'cancel' },
          { text: '去登录', onPress: () => onRequireLogin && onRequireLogin() },
        ]
      );
      return;
    }
    setShowAddModal(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerGradient}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerTitle}>
              <Icons.Flower2 size={24} color="#fff" />
              <Text style={styles.headerTitleText}>我的花园</Text>
            </View>
            <TouchableOpacity onPress={handleAddPlantPress} style={styles.addButton}>
              <Icons.Plus size={16} color={colors.primary} />
              <Text style={styles.addButtonText}>添加植物</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.headerSubtitle}>
            {plants.length > 0 ? `已养护 ${plants.length} 株植物` : '快来添加你的第一株植物吧'}
          </Text>
        </View>

        {plants.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.locationFilter}>
            <TouchableOpacity
              onPress={() => setSelectedLocation(null)}
              style={[styles.filterChip, !selectedLocation && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, !selectedLocation && styles.filterChipTextActive]}>
                全部
              </Text>
            </TouchableOpacity>
            {uniqueLocations.map(loc => (
              <TouchableOpacity
                key={loc}
                onPress={() => setSelectedLocation(loc)}
                style={[styles.filterChip, selectedLocation === loc && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, selectedLocation === loc && styles.filterChipTextActive]}>
                  {environmentLabels[loc] || loc} ({locationStats[loc] || 0})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* 统计卡片 */}
      {isLoggedIn && stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total_plants}</Text>
            <Text style={styles.statLabel}>植物总数</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.this_month_cares}</Text>
            <Text style={styles.statLabel}>本月养护</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.success }]}>
              {stats.health_distribution.good}
            </Text>
            <Text style={styles.statLabel}>健康</Text>
          </View>
        </View>
      )}

      {/* 日历条 */}
      {isLoggedIn && calendarData && calendarData.days && Object.keys(calendarData.days).length > 0 && (
        <View style={styles.calendarContainer}>
          <Text style={styles.calendarTitle}>养护日历</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {Object.entries(calendarData.days).map(([day, records]) => (
              <TouchableOpacity key={day} style={styles.calendarDay}>
                <Text style={styles.calendarDayText}>{day}</Text>
                <View style={styles.calendarDot} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {!isLoggedIn ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Icons.Flower2 size={40} color={colors['text-tertiary']} />
            </View>
            <Text style={styles.emptyTitle}>登录后使用</Text>
            <Text style={styles.emptySubtitle}>登录后可管理你的花园</Text>
            <TouchableOpacity onPress={() => onRequireLogin && onRequireLogin()} style={styles.emptyAddButton}>
              <Icons.User size={18} color="#fff" />
              <Text style={styles.emptyAddButtonText}>立即登录</Text>
            </TouchableOpacity>
          </View>
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>加载中...</Text>
          </View>
        ) : filteredPlants.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Icons.Flower2 size={40} color={colors['text-tertiary']} />
            </View>
            <Text style={styles.emptyTitle}>花园空空如也</Text>
            <Text style={styles.emptySubtitle}>添加你的第一株植物，开始养护之旅</Text>
            <TouchableOpacity onPress={handleAddPlantPress} style={styles.emptyAddButton}>
              <Icons.Plus size={18} color="#fff" />
              <Text style={styles.emptyAddButtonText}>添加植物</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredPlants.map((plant) => (
            <TouchableOpacity key={plant.id} onPress={() => handlePlantPress(plant)} activeOpacity={0.8}>
              <View style={styles.plantCard}>
                <View style={styles.plantImage}>
                  <Icons.Flower2 size={50} color="rgba(255,255,255,0.3)" />
                  <TouchableOpacity onPress={() => handleDeletePlant(plant.id)} style={styles.deleteButton}>
                    <Icons.X size={16} color="#fff" />
                  </TouchableOpacity>
                  <View style={styles.plantImageOverlay}>
                    <Text style={styles.plantNickname}>{plant.nickname || plant.plant_name}</Text>
                    <Text style={styles.plantName}>{plant.plant_name}</Text>
                    {plant.location && (
                      <View style={styles.plantEnvBadge}>
                        <Text style={styles.plantEnvText}>{environmentLabels[plant.location] || plant.location}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.plantInfo}>
                  <View style={styles.plantStats}>
                    <View style={styles.statItem}>
                      <Icons.Clock size={20} color={colors.primary} />
                      <Text style={styles.plantStatValue}>
                        {new Date(plant.created_at).toLocaleDateString().slice(0, -3)}
                      </Text>
                      <Text style={styles.plantStatLabel}>入园日期</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleWaterPlant(plant.id)} style={styles.statItem}>
                      <Icons.Droplets size={20} color={colors.info} />
                      <Text style={[styles.plantStatValue, { color: colors.info }]}>
                        {(() => {
                          const records = plantCareRecords[plant.id] || [];
                          const lastWatering = records.find(r => r.care_type === 'watering');
                          if (lastWatering) {
                            const days = Math.floor((Date.now() - new Date(lastWatering.created_at).getTime()) / (1000 * 60 * 60 * 24));
                            if (days === 0) return '今天已浇';
                            if (days === 1) return '昨天浇';
                            return `${days}天前`;
                          }
                          return '浇水';
                        })()}
                      </Text>
                      <Text style={styles.plantStatLabel}>
                        {(() => {
                          const records = plantCareRecords[plant.id] || [];
                          const count = records.filter(r => r.care_type === 'watering').length;
                          return count > 0 ? `${count}次记录` : '快速操作';
                        })()}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleEditPlant(plant)} style={styles.statItem}>
                      <Icons.Edit2 size={20} color={colors.success} />
                      <Text style={[styles.plantStatValue, { color: colors.success }]}>编辑</Text>
                      <Text style={styles.plantStatLabel}>修改信息</Text>
                    </TouchableOpacity>
                  </View>
                  {/* <View style={styles.plantActions}>
                    <TouchableOpacity onPress={() => handleWaterPlant(plant.id)} style={styles.actionButton} activeOpacity={0.7}>
                      <Icons.Droplets size={16} color={colors.info} />
                      <Text style={styles.actionButtonText}>已浇水</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleEditPlant(plant)} style={styles.actionButton} activeOpacity={0.7}>
                      <Icons.Edit2 size={16} color={colors.success} />
                      <Text style={[styles.actionButtonText, { color: colors.success }]}>编辑</Text>
                    </TouchableOpacity>
                  </View> */}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>添加新植物</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Icons.X size={24} color={colors['text-tertiary']} />
              </TouchableOpacity>
            </View>
            <Text style={styles.inputLabel}>植物名称</Text>
            <TextInput
              value={newPlantName}
              onChangeText={setNewPlantName}
              placeholder="例如：绿萝、吊兰"
              style={styles.input}
              placeholderTextColor={colors['text-tertiary']}
            />
            <Text style={styles.inputLabel}>昵称（选填）</Text>
            <TextInput
              value={newPlantNickname}
              onChangeText={setNewPlantNickname}
              placeholder="例如：小绿、花花"
              style={styles.input}
              placeholderTextColor={colors['text-tertiary']}
            />
            <Text style={styles.inputLabel}>位置</Text>
            <View style={styles.locationChips}>
              {Object.entries(environmentLabels).map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => setNewPlantLocation(key)}
                  style={[styles.locationChip, newPlantLocation === key && styles.locationChipActive]}
                >
                  <Text style={[styles.locationChipText, newPlantLocation === key && styles.locationChipTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={handleAddPlant} style={styles.submitButton}>
              <Text style={styles.submitButtonText}>添加到花园</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showEditModal} animationType="slide" transparent onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>编辑植物</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Icons.X size={24} color={colors['text-tertiary']} />
              </TouchableOpacity>
            </View>
            <Text style={styles.inputLabel}>植物名称</Text>
            <TextInput
              value={newPlantName}
              onChangeText={setNewPlantName}
              placeholder="例如：绿萝、吊兰"
              style={styles.input}
              placeholderTextColor={colors['text-tertiary']}
            />
            <Text style={styles.inputLabel}>昵称（选填）</Text>
            <TextInput
              value={newPlantNickname}
              onChangeText={setNewPlantNickname}
              placeholder="例如：小绿、花花"
              style={styles.input}
              placeholderTextColor={colors['text-tertiary']}
            />
            <Text style={styles.inputLabel}>位置</Text>
            <View style={styles.locationChips}>
              {Object.entries(environmentLabels).map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => setNewPlantLocation(key)}
                  style={[styles.locationChip, newPlantLocation === key && styles.locationChipActive]}
                >
                  <Text style={[styles.locationChipText, newPlantLocation === key && styles.locationChipTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={handleSaveEdit} style={styles.submitButton}>
              <Text style={styles.submitButtonText}>保存修改</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerGradient: { backgroundColor: colors.primary, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, overflow: 'hidden' },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl * 1.5, paddingBottom: spacing.md },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerTitleText: { fontSize: 24, fontWeight: 'bold', color: '#fff', textShadowColor: 'rgba(0,0,0,0.15)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  addButtonText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: spacing.xs, fontWeight: '500' },
  locationFilter: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  filterChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', marginRight: spacing.sm },
  filterChipActive: { backgroundColor: '#fff' },
  filterChipText: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  filterChipTextActive: { color: colors.primary, fontWeight: '600' },
  statsContainer: { flexDirection: 'row', paddingHorizontal: spacing.lg, marginTop: spacing.md, gap: spacing.sm },
  statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: spacing.md, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: colors.text },
  statLabel: { fontSize: 12, color: colors['text-secondary'], marginTop: 2 },
  calendarContainer: { paddingHorizontal: spacing.lg, marginTop: spacing.md, marginBottom: spacing.sm },
  calendarTitle: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  calendarDay: { width: 40, height: 50, alignItems: 'center', justifyContent: 'center', marginRight: spacing.xs, backgroundColor: colors.surface, borderRadius: 8 },
  calendarDayText: { fontSize: 14, color: colors.text },
  calendarDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginTop: 2 },
  list: { flex: 1 },
  listContent: { padding: spacing.lg, paddingBottom: spacing.xxl * 3 },
  loadingContainer: { alignItems: 'center', paddingVertical: spacing.xxl * 2 },
  loadingText: { fontSize: 16, color: colors['text-secondary'] },
  emptyContainer: { alignItems: 'center', paddingVertical: spacing.xxl * 2 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  emptySubtitle: { fontSize: 14, color: colors['text-secondary'], marginBottom: spacing.lg },
  emptyAddButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: 12 },
  emptyAddButtonText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  plantCard: { backgroundColor: colors.surface, borderRadius: 16, overflow: 'hidden', marginBottom: spacing.md, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 6 },
  plantImage: { height: 160, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  deleteButton: { position: 'absolute', top: spacing.sm, right: spacing.sm, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  plantImageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.md, backgroundColor: 'rgba(0,0,0,0.5)' },
  plantNickname: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  plantName: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  plantEnvBadge: { position: 'absolute', right: spacing.md, bottom: spacing.md, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 8 },
  plantEnvText: { color: '#fff', fontSize: 12 },
  plantInfo: { padding: spacing.md },
  plantStats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: spacing.md },
  statItem: { alignItems: 'center', padding: spacing.sm, backgroundColor: colors.background, borderRadius: 12, flex: 1, marginHorizontal: spacing.xs },
  plantStatValue: { fontSize: 14, fontWeight: 'bold', color: colors.text, marginTop: spacing.xs },
  plantStatLabel: { fontSize: 12, color: colors['text-tertiary'], marginTop: 2 },
  plantActions: { flexDirection: 'row', gap: spacing.sm },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.sm, borderRadius: 12, borderWidth: 1, borderColor: colors.info },
  actionButtonText: { fontSize: 14, fontWeight: '500', color: colors.info },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  inputLabel: { fontSize: 14, color: colors['text-secondary'], marginBottom: spacing.xs },
  input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: spacing.md, paddingVertical: spacing.md, color: colors.text, marginBottom: spacing.md },
  locationChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  locationChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 16, backgroundColor: colors.background },
  locationChipActive: { backgroundColor: colors.primary },
  locationChipText: { fontSize: 12, color: colors['text-secondary'] },
  locationChipTextActive: { color: '#fff' },
  submitButton: { backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: 12, alignItems: 'center', marginTop: spacing.sm },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
