// 知识详情页面
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icons } from '../components/Icon';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../constants/theme';
import { KnowledgeArticle } from '../data/knowledgeBase';

interface Props {
  onGoBack: () => void;
  article: KnowledgeArticle;
}

export function KnowledgeDetailScreen({ onGoBack, article }: Props) {
  // 简单的Markdown-like渲染
  const renderContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, index) => {
      if (line.startsWith('## ')) {
        return (
          <Text key={index} style={styles.h2}>
            {line.replace('## ', '')}
          </Text>
        );
      }
      if (line.startsWith('### ')) {
        return (
          <Text key={index} style={styles.h3}>
            {line.replace('### ', '')}
          </Text>
        );
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <View key={index} style={styles.bulletItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.body}>{line.replace(/^[*-] /, '')}</Text>
          </View>
        );
      }
      if (line.match(/^\d+\./)) {
        return (
          <View key={index} style={styles.numberItem}>
            <Text style={styles.number}>{line.match(/^\d+/)?.[0]}.</Text>
            <Text style={styles.body}>{line.replace(/^\d+\. /, '')}</Text>
          </View>
        );
      }
      if (line.trim() === '') {
        return <View key={index} style={styles.spacer} />;
      }
      return (
        <Text key={index} style={styles.body}>
          {line}
        </Text>
      );
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.backBtn}>
          <Icons.ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {article.title}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 分类标签 */}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{article.category}</Text>
        </View>

        {/* 标题 */}
        <Text style={styles.title}>{article.title}</Text>

        {/* 摘要 */}
        <Text style={styles.summary}>{article.summary}</Text>

        {/* 分割线 */}
        <View style={styles.divider} />

        {/* 内容 */}
        <View style={styles.articleContent}>{renderContent(article.content)}</View>
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    textAlign: 'center',
    marginHorizontal: spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  categoryText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  summary: {
    fontSize: fontSize.md,
    color: colors['text-secondary'],
    lineHeight: 24,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  articleContent: {
    gap: spacing.sm,
  },
  h2: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  h3: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  body: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 26,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: spacing.sm,
  },
  bullet: {
    fontSize: fontSize.md,
    color: colors.primary,
    marginRight: spacing.sm,
    lineHeight: 26,
  },
  numberItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: spacing.sm,
  },
  number: {
    fontSize: fontSize.md,
    color: colors.primary,
    marginRight: spacing.sm,
    fontWeight: fontWeight.medium,
    lineHeight: 26,
  },
  spacer: {
    height: spacing.sm,
  },
});
