// 写日记页面
import React, { useState, useEffect } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, Text,
  TextInput, Image, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { Icons } from '../components/Icon';
import { colors, spacing } from '../constants/theme';
import { NavigationProps } from '../navigation/AppNavigator';
import { createDiary, getMyPlants, Plant } from '../services/diaryService';

interface WriteDiaryScreenProps extends Partial<NavigationProps> {
  editDiaryId?: number;
}

export function WriteDiaryScreen({ onGoBack, onNavigate, editDiaryId, isLoggedIn, onRequireLogin }: WriteDiaryScreenProps) {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedPlantId, setSelectedPlantId] = useState<number | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [height, setHeight] = useState('');
  const [leafCount, setLeafCount] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // 检查登录状态
  useEffect(() => {
    if (!isLoggedIn && onRequireLogin) {
      onRequireLogin();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      loadPlants();
    }
  }, [isLoggedIn]);

  const loadPlants = async () => {
    if (!isLoggedIn) return;
    try {
      const data = await getMyPlants();
      setPlants(data);
      if (data.length > 0) {
        setSelectedPlantId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load plants:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleAddImage = () => {
    if (images.length >= 9) {
      Alert.alert('提示', '最多只能添加9张图片');
      return;
    }

    Alert.alert('添加图片', '选择图片来源', [
      {
        text: '拍照',
        onPress: () => {
          launchCamera({ mediaType: 'photo', quality: 0.8 }, (response) => {
            if (response.assets && response.assets[0]?.uri) {
              setImages([...images, response.assets[0].uri]);
            }
          });
        },
      },
      {
        text: '相册',
        onPress: () => {
          launchImageLibrary({ mediaType: 'photo', quality: 0.8, selectionLimit: 9 - images.length }, (response) => {
            if (response.assets) {
              const newImages = response.assets.map(a => a.uri).filter(Boolean) as string[];
              setImages([...images, ...newImages].slice(0, 9));
            }
          });
        },
      },
      { text: '取消', style: 'cancel' },
    ]);
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!selectedPlantId) {
      Alert.alert('提示', '请选择植物');
      return;
    }

    if (!content.trim() && images.length === 0) {
      Alert.alert('提示', '请添加图片或文字内容');
      return;
    }

    setLoading(true);
    try {
      await createDiary({
        user_plant_id: selectedPlantId,
        content: content.trim(),
        images: images.length > 0 ? images : undefined,
        height: height ? parseInt(height, 10) : undefined,
        leaf_count: leafCount ? parseInt(leafCount, 10) : undefined,
      });
      Alert.alert('成功', '日记保存成功', [
        { text: '确定', onPress: () => onGoBack?.() }
      ]);
    } catch (error) {
      Alert.alert('错误', '保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.headerButton}>
          <Icons.X size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>写日记</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.headerButton, styles.saveButton]}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>保存</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 植物选择 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>选择植物</Text>
          {plants.length === 0 ? (
            <Text style={styles.emptyText}>暂无植物，请先添加植物</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {plants.map((plant) => (
                <TouchableOpacity
                  key={plant.id}
                  style={[
                    styles.plantChip,
                    selectedPlantId === plant.id && styles.plantChipActive
                  ]}
                  onPress={() => setSelectedPlantId(plant.id)}
                >
                  <Text style={[
                    styles.plantChipText,
                    selectedPlantId === plant.id && styles.plantChipTextActive
                  ]}>
                    {plant.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* 图片区域 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>图片 ({images.length}/9)</Text>
          <View style={styles.imageGrid}>
            {images.map((uri, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri }} style={styles.image} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => handleRemoveImage(index)}
                >
                  <Icons.X size={12} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 9 && (
              <TouchableOpacity style={styles.addImageButton} onPress={handleAddImage}>
                <Icons.Plus size={24} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 生长数据 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>生长数据（可选）</Text>
          <View style={styles.growthInputs}>
            <View style={styles.growthInput}>
              <Text style={styles.growthLabel}>高度 (cm)</Text>
              <TextInput
                style={styles.input}
                value={height}
                onChangeText={setHeight}
                placeholder="例如: 30"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.growthInput}>
              <Text style={styles.growthLabel}>叶片数量</Text>
              <TextInput
                style={styles.input}
                value={leafCount}
                onChangeText={setLeafCount}
                placeholder="例如: 5"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* 文字内容 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>记录文字（可选）</Text>
          <TextInput
            style={styles.textArea}
            value={content}
            onChangeText={setContent}
            placeholder="今天植物有什么变化？"
            multiline
            maxLength={500}
          />
          <Text style={styles.charCount}>{content.length}/500</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1,
    borderBottomColor: colors.border, backgroundColor: colors.surface,
  },
  headerButton: { padding: spacing.sm },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  saveButton: { backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: spacing.md },
  saveButtonText: { color: '#fff', fontWeight: '600' },
  content: { flex: 1, padding: spacing.lg },
  section: { marginBottom: spacing.xl },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  emptyText: { color: colors['text-tertiary'], fontSize: 14 },
  plantChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 20,
    backgroundColor: colors.surface, marginRight: spacing.sm, borderWidth: 1,
    borderColor: colors.border,
  },
  plantChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  plantChipText: { fontSize: 14, color: colors.text },
  plantChipTextActive: { color: '#fff' },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  imageContainer: { width: 100, height: 100, borderRadius: 12, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  removeImageButton: {
    position: 'absolute', top: 4, right: 4, width: 20, height: 20,
    borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
  },
  addImageButton: {
    width: 100, height: 100, borderRadius: 12, borderWidth: 1, borderColor: colors.primary,
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center',
  },
  growthInputs: { flexDirection: 'row', gap: spacing.md },
  growthInput: { flex: 1 },
  growthLabel: { fontSize: 14, color: colors['text-secondary'], marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, fontSize: 16, borderWidth: 1, borderColor: colors.border,
  },
  textArea: {
    backgroundColor: colors.surface, borderRadius: 12, padding: spacing.md,
    fontSize: 16, minHeight: 120, textAlignVertical: 'top', borderWidth: 1,
    borderColor: colors.border,
  },
  charCount: { fontSize: 12, color: colors['text-tertiary'], textAlign: 'right', marginTop: spacing.xs },
});
