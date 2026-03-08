// 识别（首页）屏幕 - 核心入口
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, Image, Loader2 } from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize } from '../constants/theme';
import { takePhoto, selectFromGallery, recognizePlant, RecognitionResult } from '../services/recognitionService';
import { PlantCard } from '../components/PlantCard';

export function IdentifyScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPlantCard, setShowPlantCard] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState<RecognitionResult | null>(null);

  const handleIdentify = async (source: 'camera' | 'gallery') => {
    try {
      setIsLoading(true);

      // 选择图片
      const response = source === 'camera'
        ? await takePhoto()
        : await selectFromGallery();

      if (response.didCancel || !response.assets || response.assets.length === 0) {
        setIsLoading(false);
        return;
      }

      const imageUri = response.assets[0].uri;
      if (!imageUri) {
        setIsLoading(false);
        return;
      }

      // 调用识别API
      const result = await recognizePlant(imageUri);
      setRecognitionResult(result);
      setShowPlantCard(true);
    } catch (error) {
      Alert.alert('识别失败', '请重试或检查网络连接');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToGarden = () => {
    // TODO: 调用添加植物到花园的API
    Alert.alert('添加成功', '已添加到我的花园');
    setShowPlantCard(false);
    setRecognitionResult(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>护花使者</Text>
        <Text style={styles.subtitle}>你的掌上植物管家</Text>
      </View>

      <View style={styles.mainButtonContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>正在识别中...</Text>
            <Text style={styles.loadingSubtext}>请稍候，AI正在分析植物特征</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.identifyButton}
            onPress={() => handleIdentify('camera')}
            activeOpacity={0.8}
          >
            <Camera size={64} color={colors.white} />
            <Text style={styles.identifyText}>拍照识别</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleIdentify('gallery')}
          disabled={isLoading}
        >
          <Image size={24} color={colors.primary} />
          <Text style={styles.actionText}>相册导入</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tips}>
        <Text style={styles.tipsTitle}>新手推荐</Text>
        <Text style={styles.tipsText}>不确定养什么？试试场景问答推荐</Text>
        <TouchableOpacity style={styles.tipsButton}>
          <Text style={styles.tipsButtonText}>开始推荐</Text>
        </TouchableOpacity>
      </View>

      {/* 植物档案卡弹窗 */}
      <PlantCard
        visible={showPlantCard}
        plant={recognitionResult}
        onClose={() => {
          setShowPlantCard(false);
          setRecognitionResult(null);
        }}
        onAddToGarden={handleAddToGarden}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.primary,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors['text-secondary'],
    marginTop: spacing.xs,
  },
  mainButtonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  identifyButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  identifyText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: fontSize.lg,
    color: colors.primary,
    fontWeight: '600',
    marginTop: spacing.lg,
  },
  loadingSubtext: {
    fontSize: fontSize.sm,
    color: colors['text-secondary'],
    marginTop: spacing.xs,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  actionText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: '500',
  },
  tips: {
    margin: spacing.lg,
    marginTop: 0,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  tipsTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  tipsText: {
    fontSize: fontSize.sm,
    color: colors['text-secondary'],
    marginTop: spacing.xs,
  },
  tipsButton: {
    backgroundColor: colors.secondary + '20',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
    marginTop: spacing.md,
  },
  tipsButtonText: {
    fontSize: fontSize.sm,
    color: colors.secondary,
    fontWeight: '500',
  },
});
