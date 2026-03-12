// 养护百科详情页 - 使用纯 StyleSheet
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icons } from '../components/Icon';
import { colors, spacing } from '../constants/theme';
import { NavigationProps } from '../navigation/AppNavigator';
import { getPlantDetail, addToMyGarden, Plant } from '../services/plantService';

interface EncyclopediaDetailScreenProps extends Partial<NavigationProps> {
  route?: { params?: { plantId?: number } };
}

export function EncyclopediaDetailScreen({ onGoBack, ...props }: EncyclopediaDetailScreenProps) {
  const plantId = (props as any).route?.plantId;
  const [plant, setPlant] = useState<Plant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (plantId) {
      loadPlantDetail();
    } else {
      setLoading(false);
    }
  }, [plantId]);

  const loadPlantDetail = async () => {
    try {
      const data = await getPlantDetail(plantId);
      setPlant(data);
    } catch (error) {
      console.error('加载植物详情失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToGarden = async () => {
    if (!plant) return;
    try {
      await addToMyGarden({
        plant_id: plant.id,
        nickname: plant.name,
        acquired_from: 'encyclopedia',
      });
      Alert.alert('成功', '已添加到我的花园');
    } catch (error: any) {
      if (error.response?.status === 401) {
        Alert.alert('提示', '请先登录后再添加');
      } else {
        Alert.alert('提示', '添加失败，请稍后重试');
      }
    }
  };

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    }
  };

  const getLightText = (light?: string) => {
    const map: Record<string, string> = {
      'full': '喜阳 - 适合光线充足的环境',
      'partial': '半阴 - 适合散射光环境',
      'low': '耐阴 - 适合光线较弱的环境',
    };
    return map[light || ''] || '适合各种光照环境';
  };

  const getWaterText = (water?: string) => {
    const map: Record<string, string> = {
      'frequent': '经常浇水 - 保持土壤湿润',
      'weekly': '每周一次 - 保持土壤湿润',
      'biweekly': '两周一次 - 干透再浇',
      'monthly': '每月一次 - 极耐旱',
    };
    return map[water || ''] || '适量浇水';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!plant) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText}>未找到植物数据</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.navBar}>
            <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
              <Icons.ChevronLeft size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.navTitle}>植物详情</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.plantInfo}>
            <View style={styles.plantIcon}>
              <Icons.Flower2 size={40} color="#fff" />
            </View>
            <Text style={styles.plantName}>{plant.name}</Text>
            <Text style={styles.plantScientific}>{plant.scientific_name || ''}</Text>
            <View style={styles.tagRow}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{plant.category || '室内植物'}</Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>难度 {plant.care_level || 1}</Text>
              </View>
              {plant.beginner_friendly && plant.beginner_friendly >= 4 && (
                <View style={[styles.tag, { backgroundColor: colors.success }]}>
                  <Text style={styles.tagText}>新手友好</Text>
                </View>
              )}
              {plant.is_toxic && (
                <View style={[styles.tag, { backgroundColor: colors.error }]}>
                  <Text style={styles.tagText}>有毒</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* 简介 */}
          {plant.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>简介</Text>
              <Text style={styles.description}>{plant.description}</Text>
            </View>
          )}

          {/* 养护要求 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>养护要求</Text>
            <View style={styles.careList}>
              <View style={styles.careItem}>
                <View style={styles.careIcon}>
                  <Icons.Sun size={20} color={colors.warning} />
                </View>
                <View>
                  <Text style={styles.careLabel}>光照</Text>
                  <Text style={styles.careValue}>{getLightText(plant.light_requirement)}</Text>
                </View>
              </View>
              <View style={styles.careItem}>
                <View style={[styles.careIcon, { backgroundColor: colors.info + '15' }]}>
                  <Icons.Droplets size={20} color={colors.info} />
                </View>
                <View>
                  <Text style={styles.careLabel}>浇水</Text>
                  <Text style={styles.careValue}>{getWaterText(plant.water_requirement)}</Text>
                </View>
              </View>
              {plant.watering_tip && (
                <View style={styles.careItem}>
                  <View style={[styles.careIcon, { backgroundColor: colors.info + '15' }]}>
                    <Icons.AlertCircle size={20} color={colors.info} />
                  </View>
                  <View>
                    <Text style={styles.careLabel}>浇水提示</Text>
                    <Text style={styles.careValue}>{plant.watering_tip}</Text>
                  </View>
                </View>
              )}
              {plant.temperature_range && (
                <View style={styles.careItem}>
                  <View style={[styles.careIcon, { backgroundColor: colors.error + '15' }]}>
                    <Icons.Thermometer size={20} color={colors.error} />
                  </View>
                  <View>
                    <Text style={styles.careLabel}>温度</Text>
                    <Text style={styles.careValue}>{plant.temperature_range}</Text>
                  </View>
                </View>
              )}
              {plant.humidity_range && (
                <View style={styles.careItem}>
                  <View style={[styles.careIcon, { backgroundColor: colors.info + '15' }]}>
                    <Icons.CloudRain size={20} color={colors.info} />
                  </View>
                  <View>
                    <Text style={styles.careLabel}>湿度</Text>
                    <Text style={styles.careValue}>{plant.humidity_range}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* 特点标签 */}
          {plant.features && plant.features.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>特点</Text>
              <View style={styles.featureRow}>
                {plant.features.map((feature, index) => (
                  <View key={index} style={styles.featureTag}>
                    <Icons.Check size={14} color={colors.success} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 养护小贴士 */}
          {plant.care_tips && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>养护小贴士</Text>
              <Text style={styles.tipsText}>{plant.care_tips}</Text>
            </View>
          )}

          {/* 常见问题 */}
          {plant.common_mistakes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>常见问题</Text>
              <View style={styles.problemCard}>
                <View style={styles.problemHeader}>
                  <Icons.AlertCircle size={16} color={colors.warning} />
                  <Text style={styles.problemTitle}>养护误区</Text>
                </View>
                <Text style={styles.problemSolution}>{plant.common_mistakes}</Text>
              </View>
            </View>
          )}

          {/* 存活率 */}
          {plant.survival_rate && (
            <View style={styles.section}>
              <View style={styles.survivalCard}>
                <Icons.Heart size={24} color={colors.success} />
                <View style={styles.survivalInfo}>
                  <Text style={styles.survivalLabel}>新手存活率</Text>
                  <Text style={styles.survivalValue}>{plant.survival_rate}%</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomButton}>
        <TouchableOpacity style={styles.submitButton} onPress={handleAddToGarden}>
          <Icons.Plus size={20} color="#fff" />
          <Text style={styles.submitButtonText}>添加到我的花园</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: colors['text-tertiary'] },
  heroSection: { backgroundColor: colors.primary, paddingTop: spacing.xl },
  navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  backButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  navTitle: { color: '#fff', fontSize: 17, fontWeight: '600' },
  placeholder: { width: 32 },
  plantInfo: { alignItems: 'center', paddingBottom: spacing.xl * 2 },
  plantIcon: { width: 80, height: 80, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  plantName: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  plantScientific: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontStyle: 'italic', marginTop: spacing.xs },
  tagRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap', justifyContent: 'center' },
  tag: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 10 },
  tagText: { color: '#fff', fontSize: 12 },
  content: { paddingHorizontal: spacing.lg, marginTop: -spacing.lg, paddingBottom: spacing.xxl * 3 },
  section: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.md, marginBottom: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: spacing.md },
  description: { fontSize: 15, color: colors['text-secondary'], lineHeight: 22 },
  careList: { gap: spacing.sm },
  careItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  careIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  careLabel: { fontSize: 13, color: colors['text-tertiary'] },
  careValue: { fontSize: 15, fontWeight: '500', color: colors.text, maxWidth: 250 },
  featureRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  featureTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.success + '15', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 10 },
  featureText: { color: colors.success, fontSize: 14 },
  tipsText: { fontSize: 15, color: colors['text-secondary'], lineHeight: 22 },
  problemCard: { backgroundColor: colors.background, borderRadius: 12, padding: spacing.sm },
  problemHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
  problemTitle: { fontSize: 15, fontWeight: '500', color: colors.text },
  problemSolution: { fontSize: 14, color: colors['text-secondary'], marginLeft: 24 },
  survivalCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.success + '15', padding: spacing.md, borderRadius: 12 },
  survivalInfo: { flex: 1 },
  survivalLabel: { fontSize: 14, color: colors['text-secondary'] },
  survivalValue: { fontSize: 24, fontWeight: 'bold', color: colors.success },
  bottomButton: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  submitButton: { backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
