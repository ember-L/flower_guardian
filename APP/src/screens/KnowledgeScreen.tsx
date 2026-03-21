// 养护知识页面
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icons } from '../components/Icon';
import { colors, spacing, borderRadius, shadows, fontSize, fontWeight, touchTarget } from '../constants/theme';
import { knowledgeBase, KnowledgeArticle, searchArticles, getCategories, getArticlesByCategory } from '../data/knowledgeBase';
import { getDiagnoses, DiagnosisRecord } from '../services/diagnosisService';

interface Props {
  onGoBack: () => void;
  onNavigate: (page: string, params?: any) => void;
}

const categoryIcons: Record<string, string> = {
  '浇水': 'droplet',
  '光照': 'sun',
  '施肥': 'feather',
  '病虫害': 'bug',
  '季节': 'calendar',
  '土壤': 'layers',
  '修剪': 'scissors',
  '繁殖': 'git-branch',
};

export function KnowledgeScreen({ onGoBack, onNavigate }: Props) {
  const [selectedTab, setSelectedTab] = useState<'general' | 'personal'>('general');
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [hasDiagnosisHistory, setHasDiagnosisHistory] = useState(false);
  const [diagnosisHistory, setDiagnosisHistory] = useState<DiagnosisRecord[]>([]);

  // 检查诊断历史
  useEffect(() => {
    checkDiagnosisHistory();
  }, []);

  const checkDiagnosisHistory = async () => {
    try {
      const response = await getDiagnoses();
      if (response.items && response.items.length > 0) {
        setHasDiagnosisHistory(true);
        setDiagnosisHistory(response.items.slice(0, 5)); // 取最近5条
        setSelectedTab('personal');
      }
    } catch (error) {
      console.log('No diagnosis history');
    }
  };

  // 搜索过滤
  const filteredArticles = searchText
    ? searchArticles(searchText)
    : selectedCategory
    ? getArticlesByCategory(selectedCategory)
    : knowledgeBase;

  // 获取图标组件
  const getCategoryIcon = (category: string) => {
    const iconName = categoryIcons[category] || 'leaf';
    const IconComponent = (Icons as any)[iconName.charAt(0).toUpperCase() + iconName.slice(1)];
    return IconComponent || Icons.Leaf;
  };

  // 渲染知识卡片
  const renderArticle = ({ item }: { item: KnowledgeArticle }) => {
    const IconComponent = getCategoryIcon(item.category);

    return (
      <TouchableOpacity
        style={styles.articleCard}
        onPress={() => onNavigate('KnowledgeDetail', { article: item })}
        activeOpacity={0.7}
      >
        <View style={styles.articleIcon}>
          <IconComponent size={24} color={colors.primary} />
        </View>
        <View style={styles.articleInfo}>
          <View style={styles.articleCategory}>
            <Text style={styles.articleCategoryText}>{item.category}</Text>
          </View>
          <Text style={styles.articleTitle}>{item.title}</Text>
          <Text style={styles.articleSummary} numberOfLines={2}>
            {item.summary}
          </Text>
        </View>
        <Icons.ChevronRight size={20} color={colors['text-tertiary']} />
      </TouchableOpacity>
    );
  };

  // 渲染个性化建议
  const renderPersonalized = () => (
    <ScrollView style={styles.personalContainer} showsVerticalScrollIndicator={false}>
      {/* 诊断历史概要 */}
      <View style={styles.historySummary}>
        <View style={styles.historyHeader}>
          <Icons.AlertCircle size={20} color={colors.warning} />
          <Text style={styles.historyTitle}>您的诊断历史</Text>
        </View>
        <Text style={styles.historyCount}>
          已有 {diagnosisHistory.length} 条诊断记录
        </Text>
      </View>

      {/* 基于诊断历史的建议 */}
      <View style={styles.suggestionsSection}>
        <Text style={styles.sectionTitle}>根据您的诊断记录</Text>

        {diagnosisHistory.map((record, index) => (
          <View key={record.id || index} style={styles.suggestionCard}>
            <View style={styles.suggestionHeader}>
              <View style={[styles.suggestionIcon, { backgroundColor: colors.warningLight }]}>
                <Icons.AlertCircle size={18} color={colors.warning} />
              </View>
              <Text style={styles.suggestionName}>{record.disease_name}</Text>
            </View>
            {record.treatment && (
              <View style={styles.suggestionContent}>
                <Text style={styles.suggestionLabel}>治疗建议</Text>
                <Text style={styles.suggestionText} numberOfLines={3}>
                  {record.treatment}
                </Text>
              </View>
            )}
            {record.prevention && (
              <View style={styles.suggestionContent}>
                <Text style={styles.suggestionLabel}>预防措施</Text>
                <Text style={styles.suggestionText} numberOfLines={3}>
                  {record.prevention}
                </Text>
              </View>
            )}
          </View>
        ))}

        {diagnosisHistory.length === 0 && (
          <View style={styles.emptyHistory}>
            <Icons.ClipboardList size={48} color={colors.border} />
            <Text style={styles.emptyHistoryText}>暂无诊断记录</Text>
            <Text style={styles.emptyHistorySubtext}>
              进行病害诊断后，将为您生成个性化建议
            </Text>
          </View>
        )}
      </View>

      {/* 快速入口：查看所有知识 */}
      <TouchableOpacity
        style={styles.viewAllButton}
        onPress={() => setSelectedTab('general')}
      >
        <Text style={styles.viewAllText}>查看全部养护知识</Text>
        <Icons.ChevronRight size={20} color={colors.primary} />
      </TouchableOpacity>
    </ScrollView>
  );

  // 分类标签
  const categories = getCategories();

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.backBtn}>
          <Icons.ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>养护知识</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tab切换 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'general' && styles.tabActive]}
          onPress={() => setSelectedTab('general')}
        >
          <Text style={[styles.tabText, selectedTab === 'general' && styles.tabTextActive]}>
            知识库
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'personal' && styles.tabActive]}
          onPress={() => setSelectedTab('personal')}
        >
          <Text style={[styles.tabText, selectedTab === 'personal' && styles.tabTextActive]}>
            个性化
          </Text>
          {hasDiagnosisHistory && <View style={styles.tabBadge} />}
        </TouchableOpacity>
      </View>

      {selectedTab === 'general' ? (
        <>
          {/* 搜索栏 */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <Icons.Search size={20} color={colors['text-tertiary']} />
              <TextInput
                style={styles.searchInput}
                placeholder="搜索知识..."
                placeholderTextColor={colors['text-tertiary']}
                value={searchText}
                onChangeText={setSearchText}
              />
              {searchText ? (
                <TouchableOpacity onPress={() => setSearchText('')}>
                  <Icons.X size={20} color={colors['text-tertiary']} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* 分类筛选 */}
          {!searchText && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
              contentContainerStyle={styles.categoryContainer}
            >
              <TouchableOpacity
                style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(null)}
              >
                <Text style={[styles.categoryChipText, !selectedCategory && styles.categoryChipTextActive]}>
                  全部
                </Text>
              </TouchableOpacity>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[styles.categoryChip, selectedCategory === category && styles.categoryChipActive]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedCategory === category && styles.categoryChipTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* 知识列表 */}
          <FlatList
            data={filteredArticles}
            keyExtractor={(item) => item.id}
            renderItem={renderArticle}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Icons.Search size={48} color={colors.border} />
                <Text style={styles.emptyText}>未找到相关知识</Text>
              </View>
            }
          />
        </>
      ) : (
        renderPersonalized()
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  backBtn: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: fontSize.md,
    color: colors['text-secondary'],
    fontWeight: fontWeight.medium,
  },
  tabTextActive: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
  },
  tabBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: '30%',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.warning,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    paddingVertical: 0,
  },
  categoryScroll: {
    // 移除 maxHeight 限制，让内容自适应高度
    flexGrow: 0,
    flexShrink: 0,
  },
  categoryContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: fontSize.sm,
    color: colors['text-secondary'],
  },
  categoryChipTextActive: {
    color: colors.white,
    fontWeight: fontWeight.medium,
  },
  list: {
    padding: spacing.lg,
  },
  articleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  articleIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  articleInfo: {
    flex: 1,
  },
  articleCategory: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  articleCategoryText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  articleTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  articleSummary: {
    fontSize: fontSize.sm,
    color: colors['text-secondary'],
    lineHeight: 20,
  },
  personalContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  historySummary: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  historyTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  historyCount: {
    fontSize: fontSize.sm,
    color: colors['text-secondary'],
    marginLeft: spacing.xl,
  },
  suggestionsSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  suggestionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  suggestionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  suggestionName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  suggestionContent: {
    marginTop: spacing.sm,
    paddingLeft: spacing.xl,
  },
  suggestionLabel: {
    fontSize: fontSize.sm,
    color: colors['text-tertiary'],
    marginBottom: spacing.xs,
  },
  suggestionText: {
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyHistoryText: {
    fontSize: fontSize.md,
    color: colors['text-secondary'],
    marginTop: spacing.md,
  },
  emptyHistorySubtext: {
    fontSize: fontSize.sm,
    color: colors['text-tertiary'],
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  viewAllText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  empty: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors['text-secondary'],
    marginTop: spacing.md,
  },
});
