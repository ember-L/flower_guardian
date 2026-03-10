// 识别（首页）屏幕 - 核心入口 - UI Kitten 组件
import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Text, Spinner, Layout, useTheme } from '@ui-kitten/components';
import { Icons } from '../components/Icon';
import { colors, spacing, borderRadius, fontSize, shadows, touchTarget } from '../constants/theme';
import { takePhoto, selectFromGallery, recognizePlant, RecognitionResult } from '../services/recognitionService';
import { PlantCard } from '../components/PlantCard';

export function IdentifyScreen() {
  const theme = useTheme();
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
      {/* 品牌头部 */}
      <View style={styles.header}>
        <View style={styles.brandBadge}>
          <Icons.Sparkles size={14} color={colors.primary} />
        </View>
        <Text category="h1" style={styles.title}>护花使者</Text>
        <Text appearance="hint" style={styles.subtitle}>你的掌上植物管家，让养花不再凭感觉</Text>
      </View>

      {/* 主识别区域 */}
      <Layout style={styles.mainButtonContainer} level="1">
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingCircle}>
              <Spinner size="large" status="primary" />
            </View>
            <Text category="h6" status="primary" style={styles.loadingText}>AI 正在识别中...</Text>
            <Text appearance="hint" style={styles.loadingSubtext}>请稍候，正在分析植物特征</Text>
          </View>
        ) : (
          <Button
            style={styles.identifyButton}
            appearance="filled"
            status="primary"
            size="giant"
            accessoryLeft={<Icons.Camera size={32} />}
            onPress={() => handleIdentify('camera')}
          >
            拍照识别
          </Button>
        )}
      </Layout>

      {/* 快捷操作 */}
      <Layout style={styles.quickActions} level="1">
        <Button
          style={styles.actionButton}
          appearance="outline"
          status="basic"
          accessoryLeft={<Icons.Image size={20} />}
          onPress={() => handleIdentify('gallery')}
          disabled={isLoading}
        >
          相册导入
        </Button>
      </Layout>

      {/* 新手推荐卡片 - 使用 UI Kitten Card */}
      <Card
        style={styles.tips}
        header={(props) => (
          <View {...props} style={styles.tipsHeader}>
            <Text status="success" category="c1" style={styles.tipsBadge}>新手必备</Text>
            <Text category="s1">不确定养什么？</Text>
          </View>
        )}
        footer={
          <Button size="small" appearance="filled" status="success">
            开始推荐
          </Button>
        }
      >
        <Text appearance="hint">试试场景问答推荐，适合你的植物</Text>
      </Card>

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
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    alignItems: 'center',
  },
  brandBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.primary,
    fontWeight: '700',
    letterSpacing: 1,
  },
  subtitle: {
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  mainButtonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  identifyButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  loadingText: {
    marginTop: spacing.xl,
  },
  loadingSubtext: {
    marginTop: spacing.xs,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  actionButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  tips: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tipsBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
});
