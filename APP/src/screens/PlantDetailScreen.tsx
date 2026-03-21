// 植物详情页面
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icons } from '../components/Icon';
import { colors, spacing } from '../constants/theme';
import { NavigationProps } from '../navigation/AppNavigator';
import {
  UserPlant,
  CareRecord,
  GrowthRecord,
  HealthRecord,
  getUserPlant,
  getCareRecords,
  addCareRecord,
  getGrowthRecords,
  addGrowthRecord,
  getHealthRecords,
  addHealthRecord,
  updateUserPlant,
  deleteMyPlant,
} from '../services/plantService';

interface PlantDetailScreenProps extends Partial<NavigationProps> {}

const careTypes = [
  { value: 'watering', label: '浇水' },
  { value: 'fertilizing', label: '施肥' },
  { value: 'repotting', label: '换盆' },
  { value: 'pruning', label: '修剪' },
  { value: 'pest_control', label: '杀虫' },
];

const healthStatuses = [
  { value: 'good', label: '健康', color: colors.success },
  { value: 'fair', label: '一般', color: colors.warning },
  { value: 'sick', label: '生病', color: colors.error },
  { value: 'critical', label: '濒死', color: colors.error },
];

const locations = [
  { value: 'south-balcony', label: '南阳台' },
  { value: 'north-bedroom', label: '北卧室' },
  { value: 'living-room', label: '客厅' },
  { value: 'office', label: '办公室' },
  { value: 'other', label: '其他' },
];

export function PlantDetailScreen({
  route,
  onNavigate,
  onTabChange,
}: PlantDetailScreenProps) {
  const plantId = (route?.params as any)?.plantId;
  const [plant, setPlant] = useState<UserPlant | null>(null);
  const [careRecords, setCareRecords] = useState<CareRecord[]>([]);
  const [growthRecords, setGrowthRecords] = useState<GrowthRecord[]>([]);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'care' | 'growth' | 'health'>('care');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<'care' | 'growth' | 'health'>('care');

  // 表单状态
  const [careType, setCareType] = useState('watering');
  const [careNotes, setCareNotes] = useState('');
  const [growthHeight, setGrowthHeight] = useState('');
  const [growthLeafCount, setGrowthLeafCount] = useState('');
  const [growthDescription, setGrowthDescription] = useState('');
  const [healthStatus, setHealthStatus] = useState('good');
  const [pestInfo, setPestInfo] = useState('');
  const [treatment, setTreatment] = useState('');
  const [editLocation, setEditLocation] = useState('');

  useEffect(() => {
    if (plantId) {
      loadData();
    }
  }, [plantId]);

  const loadData = async () => {
    try {
      const [plantData, careData, growthData, healthData] = await Promise.all([
        getUserPlant(plantId),
        getCareRecords(plantId),
        getGrowthRecords(plantId),
        getHealthRecords(plantId),
      ]);
      setPlant(plantData);
      setCareRecords(careData);
      setGrowthRecords(growthData);
      setHealthRecords(healthData);
      setEditLocation(plantData.location || '');
    } catch (error) {
      console.error('Failed to load plant data:', error);
      Alert.alert('加载失败', '无法获取植物信息');
    }
  };

  const handleAddCareRecord = async () => {
    try {
      await addCareRecord(plantId, { care_type: careType, notes: careNotes });
      const newRecords = await getCareRecords(plantId);
      setCareRecords(newRecords);
      setShowAddModal(false);
      resetForm();
      Alert.alert('成功', '已添加养护记录');
    } catch (error) {
      Alert.alert('失败', '无法添加记录');
    }
  };

  const handleAddGrowthRecord = async () => {
    try {
      await addGrowthRecord(plantId, {
        height: growthHeight ? parseInt(growthHeight) : undefined,
        leaf_count: growthLeafCount ? parseInt(growthLeafCount) : undefined,
        description: growthDescription,
      });
      const newRecords = await getGrowthRecords(plantId);
      setGrowthRecords(newRecords);
      setShowAddModal(false);
      resetForm();
      Alert.alert('成功', '已添加生长记录');
    } catch (error) {
      Alert.alert('失败', '无法添加记录');
    }
  };

  const handleAddHealthRecord = async () => {
    try {
      await addHealthRecord(plantId, {
        health_status: healthStatus,
        pest_info: pestInfo,
        treatment: treatment,
      });
      const newRecords = await getHealthRecords(plantId);
      setHealthRecords(newRecords);
      setShowAddModal(false);
      resetForm();
      Alert.alert('成功', '已添加健康记录');
    } catch (error) {
      Alert.alert('失败', '无法添加记录');
    }
  };

  const handleLocationChange = async (loc: string) => {
    try {
      setEditLocation(loc);
      await updateUserPlant(plantId, { location: loc });
      setPlant({ ...plant!, location: loc });
    } catch (error) {
      console.error('Failed to update location:', error);
    }
  };

  const handleDelete = () => {
    Alert.alert('删除植物', '确定要删除这株植物吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMyPlant(plantId);
            onTabChange && onTabChange('Garden');
          } catch (error) {
            Alert.alert('失败', '无法删除植物');
          }
        },
      },
    ]);
  };

  const resetForm = () => {
    setCareType('watering');
    setCareNotes('');
    setGrowthHeight('');
    setGrowthLeafCount('');
    setGrowthDescription('');
    setHealthStatus('good');
    setPestInfo('');
    setTreatment('');
  };

  const getCareTypeLabel = (type: string) => {
    return careTypes.find(c => c.value === type)?.label || type;
  };

  const getHealthStatusConfig = (status: string) => {
    return healthStatuses.find(h => h.value === status) || healthStatuses[0];
  };

  if (!plant) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onTabChange && onTabChange('Garden')} style={styles.backButton}>
          <Icons.ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{plant.nickname || plant.plant_name}</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Icons.Trash2 size={20} color={colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 植物基本信息 */}
        <View style={styles.infoCard}>
          <View style={styles.plantImage}>
            <Icons.Flower2 size={60} color="rgba(255,255,255,0.3)" />
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.plantName}>{plant.plant_name}</Text>
            <Text style={styles.plantType}>{plant.plant_type || '未知类型'}</Text>
          </View>

          {/* 位置快捷选择 */}
          <View style={styles.locationSection}>
            <Text style={styles.locationTitle}>位置</Text>
            <View style={styles.locationChips}>
              {locations.map(loc => (
                <TouchableOpacity
                  key={loc.value}
                  onPress={() => handleLocationChange(loc.value)}
                  style={[
                    styles.locationChip,
                    editLocation === loc.value && styles.locationChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.locationChipText,
                      editLocation === loc.value && styles.locationChipTextActive,
                    ]}
                  >
                    {loc.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Tab 切换 */}
        <View style={styles.tabs}>
          <TouchableOpacity
            onPress={() => setActiveTab('care')}
            style={[styles.tab, activeTab === 'care' && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === 'care' && styles.tabTextActive]}>
              养护记录
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('growth')}
            style={[styles.tab, activeTab === 'growth' && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === 'growth' && styles.tabTextActive]}>
              生长追踪
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('health')}
            style={[styles.tab, activeTab === 'health' && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === 'health' && styles.tabTextActive]}>
              健康记录
            </Text>
          </TouchableOpacity>
        </View>

        {/* 养护记录 Tab */}
        {activeTab === 'care' && (
          <View style={styles.tabContent}>
            <TouchableOpacity
              onPress={() => {
                setAddType('care');
                setShowAddModal(true);
              }}
              style={styles.addRecordButton}
            >
              <Icons.Plus size={18} color={colors.primary} />
              <Text style={styles.addRecordText}>添加养护记录</Text>
            </TouchableOpacity>

            {careRecords.length === 0 ? (
              <Text style={styles.emptyText}>暂无养护记录</Text>
            ) : (
              careRecords.map(record => (
                <View key={record.id} style={styles.recordCard}>
                  <View style={styles.recordHeader}>
                    <Text style={styles.recordType}>{getCareTypeLabel(record.care_type)}</Text>
                    <Text style={styles.recordDate}>
                      {new Date(record.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  {record.notes && <Text style={styles.recordNotes}>{record.notes}</Text>}
                </View>
              ))
            )}
          </View>
        )}

        {/* 生长记录 Tab */}
        {activeTab === 'growth' && (
          <View style={styles.tabContent}>
            <TouchableOpacity
              onPress={() => {
                setAddType('growth');
                setShowAddModal(true);
              }}
              style={styles.addRecordButton}
            >
              <Icons.Plus size={18} color={colors.primary} />
              <Text style={styles.addRecordText}>添加生长记录</Text>
            </TouchableOpacity>

            {growthRecords.length === 0 ? (
              <Text style={styles.emptyText}>暂无生长记录</Text>
            ) : (
              growthRecords.map(record => (
                <View key={record.id} style={styles.recordCard}>
                  <View style={styles.recordHeader}>
                    <Text style={styles.recordDate}>
                      {new Date(record.record_date).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.growthStats}>
                    {record.height && (
                      <Text style={styles.growthStat}>高度: {record.height}cm</Text>
                    )}
                    {record.leaf_count && (
                      <Text style={styles.growthStat}>叶数: {record.leaf_count}</Text>
                    )}
                    {record.flower_count && (
                      <Text style={styles.growthStat}>花苞: {record.flower_count}</Text>
                    )}
                  </View>
                  {record.description && (
                    <Text style={styles.recordNotes}>{record.description}</Text>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {/* 健康记录 Tab */}
        {activeTab === 'health' && (
          <View style={styles.tabContent}>
            <TouchableOpacity
              onPress={() => {
                setAddType('health');
                setShowAddModal(true);
              }}
              style={styles.addRecordButton}
            >
              <Icons.Plus size={18} color={colors.primary} />
              <Text style={styles.addRecordText}>添加健康记录</Text>
            </TouchableOpacity>

            {healthRecords.length === 0 ? (
              <Text style={styles.emptyText}>暂无健康记录</Text>
            ) : (
              healthRecords.map(record => {
                const statusConfig = getHealthStatusConfig(record.health_status);
                return (
                  <View key={record.id} style={styles.recordCard}>
                    <View style={styles.recordHeader}>
                      <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
                        <Text style={styles.statusBadgeText}>{statusConfig.label}</Text>
                      </View>
                      <Text style={styles.recordDate}>
                        {new Date(record.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    {record.pest_info && (
                      <Text style={styles.recordNotes}>病虫害: {record.pest_info}</Text>
                    )}
                    {record.treatment && (
                      <Text style={styles.recordNotes}>治疗措施: {record.treatment}</Text>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* 添加记录弹窗 */}
      <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                添加{addType === 'care' ? '养护' : addType === 'growth' ? '生长' : '健康'}记录
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Icons.X size={24} color={colors['text-tertiary']} />
              </TouchableOpacity>
            </View>

            {/* 养护记录表单 */}
            {addType === 'care' && (
              <>
                <Text style={styles.inputLabel}>养护类型</Text>
                <View style={styles.typeChips}>
                  {careTypes.map(type => (
                    <TouchableOpacity
                      key={type.value}
                      onPress={() => setCareType(type.value)}
                      style={[styles.typeChip, careType === type.value && styles.typeChipActive]}
                    >
                      <Text style={[styles.typeChipText, careType === type.value && styles.typeChipTextActive]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.inputLabel}>备注</Text>
                <TextInput
                  value={careNotes}
                  onChangeText={setCareNotes}
                  placeholder="可选备注"
                  style={styles.input}
                  multiline
                />
                <TouchableOpacity onPress={handleAddCareRecord} style={styles.submitButton}>
                  <Text style={styles.submitButtonText}>保存</Text>
                </TouchableOpacity>
              </>
            )}

            {/* 生长记录表单 */}
            {addType === 'growth' && (
              <>
                <Text style={styles.inputLabel}>高度 (cm)</Text>
                <TextInput
                  value={growthHeight}
                  onChangeText={setGrowthHeight}
                  placeholder="可选"
                  keyboardType="numeric"
                  style={styles.input}
                />
                <Text style={styles.inputLabel}>叶数</Text>
                <TextInput
                  value={growthLeafCount}
                  onChangeText={setGrowthLeafCount}
                  placeholder="可选"
                  keyboardType="numeric"
                  style={styles.input}
                />
                <Text style={styles.inputLabel}>描述</Text>
                <TextInput
                  value={growthDescription}
                  onChangeText={setGrowthDescription}
                  placeholder="可选描述"
                  style={styles.input}
                  multiline
                />
                <TouchableOpacity onPress={handleAddGrowthRecord} style={styles.submitButton}>
                  <Text style={styles.submitButtonText}>保存</Text>
                </TouchableOpacity>
              </>
            )}

            {/* 健康记录表单 */}
            {addType === 'health' && (
              <>
                <Text style={styles.inputLabel}>健康状态</Text>
                <View style={styles.typeChips}>
                  {healthStatuses.map(status => (
                    <TouchableOpacity
                      key={status.value}
                      onPress={() => setHealthStatus(status.value)}
                      style={[
                        styles.typeChip,
                        healthStatus === status.value && { backgroundColor: status.color },
                      ]}
                    >
                      <Text
                        style={[
                          styles.typeChipText,
                          healthStatus === status.value && styles.typeChipTextActive,
                        ]}
                      >
                        {status.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.inputLabel}>病虫害信息</Text>
                <TextInput
                  value={pestInfo}
                  onChangeText={setPestInfo}
                  placeholder="可选"
                  style={styles.input}
                />
                <Text style={styles.inputLabel}>治疗措施</Text>
                <TextInput
                  value={treatment}
                  onChangeText={setTreatment}
                  placeholder="可选"
                  style={styles.input}
                />
                <TouchableOpacity onPress={handleAddHealthRecord} style={styles.submitButton}>
                  <Text style={styles.submitButtonText}>保存</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 16, color: colors['text-secondary'] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { padding: spacing.xs },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, flex: 1, textAlign: 'center' },
  deleteButton: { padding: spacing.xs },
  content: { flex: 1 },
  infoCard: { margin: spacing.lg, backgroundColor: colors.surface, borderRadius: 16, overflow: 'hidden' },
  plantImage: { height: 180, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  infoRow: { padding: spacing.md },
  plantName: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  plantType: { fontSize: 14, color: colors['text-secondary'], marginTop: spacing.xs },
  locationSection: { padding: spacing.md, paddingTop: 0 },
  locationTitle: { fontSize: 14, color: colors['text-secondary'], marginBottom: spacing.sm },
  locationChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  locationChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 16, backgroundColor: colors.background },
  locationChipActive: { backgroundColor: colors.primary },
  locationChipText: { fontSize: 12, color: colors['text-secondary'] },
  locationChipTextActive: { color: '#fff' },
  tabs: { flexDirection: 'row', marginHorizontal: spacing.lg, marginBottom: spacing.md },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { fontSize: 14, color: colors['text-tertiary'] },
  tabTextActive: { color: colors.primary, fontWeight: '600' },
  tabContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl * 2 },
  addRecordButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, padding: spacing.md, borderWidth: 1, borderColor: colors.primary, borderRadius: 12, marginBottom: spacing.md },
  addRecordText: { color: colors.primary, fontWeight: '500' },
  emptyText: { textAlign: 'center', color: colors['text-tertiary'], paddingVertical: spacing.xl },
  recordCard: { backgroundColor: colors.surface, borderRadius: 12, padding: spacing.md, marginBottom: spacing.sm },
  recordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  recordType: { fontSize: 16, fontWeight: '600', color: colors.text },
  recordDate: { fontSize: 12, color: colors['text-tertiary'] },
  recordNotes: { fontSize: 14, color: colors['text-secondary'], marginTop: spacing.xs },
  growthStats: { flexDirection: 'row', gap: spacing.md },
  growthStat: { fontSize: 14, color: colors['text-secondary'] },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 8 },
  statusBadgeText: { fontSize: 12, color: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  inputLabel: { fontSize: 14, color: colors['text-secondary'], marginBottom: spacing.xs, marginTop: spacing.sm },
  input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: spacing.md, paddingVertical: spacing.md, color: colors.text, marginBottom: spacing.sm },
  typeChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  typeChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 20, backgroundColor: colors.background },
  typeChipActive: { backgroundColor: colors.primary },
  typeChipText: { fontSize: 14, color: colors['text-secondary'] },
  typeChipTextActive: { color: '#fff' },
  submitButton: { backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: 12, alignItems: 'center', marginTop: spacing.lg },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
