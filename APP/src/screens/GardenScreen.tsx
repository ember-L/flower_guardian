// 花园屏幕 - 使用纯 StyleSheet
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icons } from '../components/Icon';
import { colors, spacing } from '../constants/theme';
import { NavigationProps } from '../navigation/AppNavigator';

interface GardenScreenProps extends Partial<NavigationProps> {}

export function GardenScreen({ onNavigate, currentTab, onTabChange, isLoggedIn, onRequireLogin, onLogout }: GardenScreenProps) {
  const quotes = [
    "每一朵花，都是大自然的微笑",
    "用心浇灌，静待花开",
    "生命因绿色而美好",
  ];

  const mockPlants = [
    { id: '1', name: '绿萝', nickname: '小绿', image: '', nextAction: '浇水', daysUntil: 2, health: 'good', environment: 'other', quote: '用心浇灌，静待花开' },
    { id: '2', name: '虎皮兰', nickname: '小兰', image: '', nextAction: '施肥', daysUntil: 5, health: 'good', environment: 'south-balcony', quote: '' },
    { id: '3', name: '吊兰', nickname: '吊吊', image: '', nextAction: '修剪', daysUntil: 1, health: 'warning', environment: 'office', quote: '' },
  ];

  const environmentLabels: Record<string, string> = {
    'south-balcony': '南阳台',
    'north-bedroom': '北卧室',
    'office': '办公室',
    'other': '其他位置',
  };
  const [plants, setPlants] = useState(mockPlants);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPlant, setEditingPlant] = useState<typeof mockPlants[0] | null>(null);
  const [newPlantName, setNewPlantName] = useState('');
  const [newPlantNickname, setNewPlantNickname] = useState('');

  const handleWaterPlant = (plantId: string) => {
    setPlants(plants.map(plant => {
      if (plant.id === plantId) {
        return { ...plant, daysUntil: 7, nextAction: '浇水' };
      }
      return plant;
    }));
    Alert.alert('浇水成功', '已记录浇水时间');
  };

  const handleDeletePlant = (plantId: string) => {
    Alert.alert('删除植物', '确定要删除这株植物吗？', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => setPlants(plants.filter(p => p.id !== plantId)) },
    ]);
  };

  const handleEditPlant = (plant: typeof mockPlants[0]) => {
    setEditingPlant(plant);
    setNewPlantName(plant.name);
    setNewPlantNickname(plant.nickname);
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editingPlant || !newPlantName.trim()) {
      Alert.alert('请输入植物名称');
      return;
    }
    setPlants(plants.map(p => {
      if (p.id === editingPlant.id) {
        return { ...p, name: newPlantName, nickname: newPlantNickname || newPlantName };
      }
      return p;
    }));
    setShowEditModal(false);
    setEditingPlant(null);
    setNewPlantName('');
    setNewPlantNickname('');
  };

  const handleAddPlant = () => {
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
    const newPlant = {
      id: Date.now().toString(),
      name: newPlantName,
      nickname: newPlantNickname || newPlantName,
      image: '',
      nextAction: '浇水',
      daysUntil: 7,
      health: 'good',
      environment: 'other',
      quote: quotes[Math.floor(Math.random() * quotes.length)],
    };
    setPlants([...plants, newPlant]);
    setShowAddModal(false);
    setNewPlantName('');
    setNewPlantNickname('');
  };

  const getHealthConfig = (health: string) => {
    switch (health) {
      case 'good': return { label: '健康', color: colors.success };
      case 'warning': return { label: '需关注', color: colors.warning };
      case 'bad': return { label: '生病', color: colors.error };
      default: return { label: '健康', color: colors.success };
    }
  };

  const getWaterConfig = (daysUntil: number) => {
    if (daysUntil <= 0) return { label: '今天', color: colors.error };
    if (daysUntil <= 1) return { label: '明天', color: colors.warning };
    return { label: `${daysUntil}天`, color: colors.info };
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 头部 - 渐变背景 */}
      <View style={styles.headerGradient}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerTitle}>
              <Icons.Flower2 size={24} color="#fff" />
              <Text style={styles.headerTitleText}>我的花园</Text>
            </View>
            <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addButton}>
              <Icons.Plus size={16} color={colors.primary} />
              <Text style={styles.addButtonText}>添加植物</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.headerSubtitle}>
            {plants.length > 0 ? `已养护 ${plants.length} 株植物` : '快来添加你的第一株植物吧'}
          </Text>
        </View>
      </View>

      {/* 植物列表 */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {plants.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Icons.Flower2 size={40} color={colors['text-tertiary']} />
            </View>
            <Text style={styles.emptyTitle}>花园空空如也</Text>
            <Text style={styles.emptySubtitle}>添加你的第一株植物，开始养护之旅</Text>
            <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.emptyAddButton}>
              <Icons.Plus size={18} color="#fff" />
              <Text style={styles.emptyAddButtonText}>添加植物</Text>
            </TouchableOpacity>
          </View>
        ) : (
          plants.map((plant) => {
            const healthConfig = getHealthConfig(plant.health);
            const waterConfig = getWaterConfig(plant.daysUntil);
            return (
              <View key={plant.id} style={styles.plantCard}>
                <View style={styles.plantImage}>
                  <Icons.Flower2 size={50} color="rgba(255,255,255,0.3)" />
                  <TouchableOpacity onPress={() => handleDeletePlant(plant.id)} style={styles.deleteButton}>
                    <Icons.X size={16} color="#fff" />
                  </TouchableOpacity>
                  <View style={styles.plantImageOverlay}>
                    <Text style={styles.plantNickname}>{plant.nickname}</Text>
                    <Text style={styles.plantName}>{plant.name}</Text>
                    <View style={styles.plantEnvBadge}>
                      <Text style={styles.plantEnvText}>{environmentLabels[plant.environment]}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.plantInfo}>
                  <View style={styles.plantStats}>
                    <View style={styles.statItem}>
                      <Icons.Clock size={20} color={colors.primary} />
                      <Text style={styles.statValue}>30天</Text>
                      <Text style={styles.statLabel}>花龄</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleWaterPlant(plant.id)} style={styles.statItem}>
                      <Icons.Droplets size={20} color={waterConfig.color} />
                      <Text style={[styles.statValue, { color: waterConfig.color }]}>{waterConfig.label}</Text>
                      <Text style={styles.statLabel}>下次浇水</Text>
                    </TouchableOpacity>
                    <View style={styles.statItem}>
                      <Icons.Heart size={20} color={healthConfig.color} />
                      <Text style={[styles.statValue, { color: healthConfig.color }]}>{healthConfig.label}</Text>
                      <Text style={styles.statLabel}>状态</Text>
                    </View>
                  </View>
                  {plant.quote && (
                    <View style={styles.quoteContainer}>
                      <Icons.Quote size={16} color={colors.primary} />
                      <Text style={styles.quoteText}>{plant.quote}</Text>
                    </View>
                  )}
                  <View style={styles.plantActions}>
                    <TouchableOpacity onPress={() => handleWaterPlant(plant.id)} style={styles.actionButton} activeOpacity={0.7}>
                      <Icons.Droplets size={16} color={colors.info} />
                      <Text style={styles.actionButtonText}>已浇水</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleEditPlant(plant)} style={styles.actionButton} activeOpacity={0.7}>
                      <Icons.Edit2 size={16} color={colors.success} />
                      <Text style={[styles.actionButtonText, { color: colors.success }]}>编辑</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* 添加植物弹窗 */}
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
            <TouchableOpacity onPress={handleAddPlant} style={styles.submitButton}>
              <Text style={styles.submitButtonText}>添加到花园</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 编辑植物弹窗 */}
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
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl * 1.5, paddingBottom: spacing.lg },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerTitleText: { fontSize: 24, fontWeight: 'bold', color: '#fff', textShadowColor: 'rgba(0,0,0,0.15)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  addButtonText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: spacing.xs, fontWeight: '500' },
  list: { flex: 1 },
  listContent: { padding: spacing.lg, paddingBottom: spacing.xxl * 4 },
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
  statValue: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginTop: spacing.xs },
  statLabel: { fontSize: 12, color: colors['text-tertiary'], marginTop: 2 },
  quoteContainer: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, padding: spacing.sm, backgroundColor: '#fff0f3', borderRadius: 12, marginBottom: spacing.sm },
  quoteText: { flex: 1, fontSize: 14, color: colors['text-secondary'], fontStyle: 'italic' },
  plantActions: { flexDirection: 'row', gap: spacing.sm },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.sm, borderRadius: 12, borderWidth: 1, borderColor: colors.info },
  actionButtonText: { fontSize: 14, fontWeight: '500', color: colors.info },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  inputLabel: { fontSize: 14, color: colors['text-secondary'], marginBottom: spacing.xs },
  input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: spacing.md, paddingVertical: spacing.md, color: colors.text, marginBottom: spacing.md },
  submitButton: { backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: 12, alignItems: 'center', marginTop: spacing.sm },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
