// 养护百科详情页 - 使用纯 StyleSheet
import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icons } from '../components/Icon';
import { colors, spacing } from '../constants/theme';
import { NavigationProps } from '../navigation/AppNavigator';

interface EncyclopediaDetailScreenProps extends Partial<NavigationProps> {}

const mockPlantDetail = {
  id: '1',
  name: '绿萝',
  scientificName: 'Epipremnum aureum',
  category: '观叶植物',
  careLevel: 1,
  description: '绿萝是天南星科麒麟叶属植物，原产于印度尼西亚所罗门群岛的热带雨林。绿萝生命力顽强，易于养护，是最常见的室内观叶植物之一。它叶片翠绿，心形，能吸收空气中的甲醛、苯等有害气体，非常适合放在室内。',
  lightRequirement: '耐阴',
  waterRequirement: '见干见湿',
  temperature: '15-30°C',
  humidity: '40-60%',
  difficulties: [
    { id: '1', title: '黄叶', solution: '可能是浇水过多或过少导致，检查土壤干湿度后调整浇水频率' },
    { id: '2', title: '叶片发白', solution: '可能是光照过强导致，应放置在散光或阴凉处' },
    { id: '3', title: '生长缓慢', solution: '可能是营养不足，可适当施肥' },
  ],
  tips: ['适合放在北向窗户边', '水培也很容易成活', '经常喷水增加空气湿度', '每月擦拭叶片保持光泽'],
};

export function EncyclopediaDetailScreen({ onGoBack }: EncyclopediaDetailScreenProps) {
  const plant = mockPlantDetail;

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.navBar}>
            <TouchableOpacity onPress={handleGoBack} style={styles.backButton}><Icons.ChevronLeft size={20} color="#fff" /></TouchableOpacity>
            <Text style={styles.navTitle}>植物详情</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.plantInfo}>
            <View style={styles.plantIcon}><Icons.Flower2 size={40} color="#fff" /></View>
            <Text style={styles.plantName}>{plant.name}</Text>
            <Text style={styles.plantScientific}>{plant.scientificName}</Text>
            <View style={styles.tagRow}>
              <View style={styles.tag}><Text style={styles.tagText}>{plant.category}</Text></View>
              <View style={styles.tag}><Text style={styles.tagText}>难度 {plant.careLevel}</Text></View>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>简介</Text>
            <Text style={styles.description}>{plant.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>养护要求</Text>
            <View style={styles.careList}>
              <View style={styles.careItem}><View style={styles.careIcon}><Icons.Sun size={20} color={colors.warning} /></View><View><Text style={styles.careLabel}>光照</Text><Text style={styles.careValue}>{plant.lightRequirement}</Text></View></View>
              <View style={styles.careItem}><View style={[styles.careIcon, { backgroundColor: colors.info + '15' }]}><Icons.Droplets size={20} color={colors.info} /></View><View><Text style={styles.careLabel}>浇水</Text><Text style={styles.careValue}>{plant.waterRequirement}</Text></View></View>
              <View style={styles.careItem}><View style={[styles.careIcon, { backgroundColor: colors.error + '15' }]}><Icons.Thermometer size={20} color={colors.error} /></View><View><Text style={styles.careLabel}>温度</Text><Text style={styles.careValue}>{plant.temperature}</Text></View></View>
              <View style={styles.careItem}><View style={[styles.careIcon, { backgroundColor: colors.info + '15' }]}><Icons.CloudRain size={20} color={colors.info} /></View><View><Text style={styles.careLabel}>湿度</Text><Text style={styles.careValue}>{plant.humidity}</Text></View></View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>常见问题</Text>
            {plant.difficulties.map((item) => (
              <View key={item.id} style={styles.problemCard}>
                <View style={styles.problemHeader}><Icons.AlertCircle size={16} color={colors.warning} /><Text style={styles.problemTitle}>{item.title}</Text></View>
                <Text style={styles.problemSolution}>{item.solution}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>养护小贴士</Text>
            {plant.tips.map((tip, index) => (
              <View key={index} style={styles.tipItem}><Icons.Check size={16} color={colors.success} /><Text style={styles.tipText}>{tip}</Text></View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomButton}>
        <TouchableOpacity style={styles.submitButton}><Text style={styles.submitButtonText}>添加到我的花园</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  heroSection: { backgroundColor: colors.primary, paddingTop: spacing.xl },
  navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  backButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  navTitle: { color: '#fff', fontSize: 17, fontWeight: '600' },
  placeholder: { width: 32 },
  plantInfo: { alignItems: 'center', paddingBottom: spacing.xl * 2 },
  plantIcon: { width: 80, height: 80, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  plantName: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  plantScientific: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontStyle: 'italic', marginTop: spacing.xs },
  tagRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  tag: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 10 },
  tagText: { color: '#fff', fontSize: 12 },
  content: { paddingHorizontal: spacing.lg, marginTop: -spacing.lg },
  section: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.md, marginBottom: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: spacing.md },
  description: { fontSize: 15, color: colors['text-secondary'], lineHeight: 22 },
  careList: { gap: spacing.sm },
  careItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  careIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  careLabel: { fontSize: 13, color: colors['text-tertiary'] },
  careValue: { fontSize: 15, fontWeight: '500', color: colors.text },
  problemCard: { backgroundColor: colors.background, borderRadius: 12, padding: spacing.sm, marginBottom: spacing.sm },
  problemHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
  problemTitle: { fontSize: 15, fontWeight: '500', color: colors.text },
  problemSolution: { fontSize: 14, color: colors['text-secondary'], marginLeft: 24 },
  tipItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  tipText: { fontSize: 14, color: colors['text-secondary'] },
  bottomButton: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  submitButton: { backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: 12, alignItems: 'center' },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
