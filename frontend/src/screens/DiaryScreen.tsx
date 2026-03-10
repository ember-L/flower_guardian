// 养花日记页面 - UI Kitten 组件
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  Button,
  Card,
  Text,
  TopNavigation,
  Modal,
  Toggle,
  Layout,
  TabView,
  Tab,
  useTheme,
} from '@ui-kitten/components';
import { Icons } from '../components/Icon';
import { colors, spacing, borderRadius, fontSize } from '../constants/theme';

// 日记记录
interface DiaryEntry {
  id: string;
  plantName: string;
  date: string;
  content: string;
  images: string[];
  likes: number;
  comments: number;
  compareWithPrevious?: boolean;
}

// 植物生长数据
interface GrowthData {
  date: string;
  height: number;
  leafCount: number;
}

const mockDiaries: DiaryEntry[] = [
  {
    id: '1',
    plantName: '绿萝',
    date: '2024-01-20',
    content: '今天给绿萝换了一个大一点的花盆，加了新土，期待它长得更好！',
    images: [],
    likes: 12,
    comments: 3,
    compareWithPrevious: true,
  },
  {
    id: '2',
    plantName: '绿萝',
    date: '2024-01-15',
    content: '发现一片新叶子冒出来了，开心！最近天气好，放在阳台生长速度明显加快了。',
    images: [],
    likes: 8,
    comments: 2,
  },
  {
    id: '3',
    plantName: '虎皮兰',
    date: '2024-01-10',
    content: '虎皮兰依旧坚挺，半个月没浇水了还是状态良好，不愧是最省心的植物。',
    images: [],
    likes: 15,
    comments: 5,
  },
];

const mockGrowthData: GrowthData[] = [
  { date: '01-01', height: 15, leafCount: 5 },
  { date: '01-08', height: 18, leafCount: 6 },
  { date: '01-15', height: 22, leafCount: 7 },
  { date: '01-20', height: 25, leafCount: 8 },
];

export function DiaryScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const [selectedPlant, setSelectedPlant] = useState<string | null>(null);
  const [showGrowthChart, setShowGrowthChart] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const plants = ['全部', '绿萝', '虎皮兰', '吊兰'];

  const renderGrowthChart = () => (
    <Card style={styles.chartContainer}>
      <View style={styles.chartHeader}>
        <Text category="s1">生长曲线</Text>
        <Button size="small" appearance="ghost" status="basic" onPress={() => setShowGrowthChart(false)}>
          关闭
        </Button>
      </View>

      <View style={styles.chart}>
        <View style={styles.chartYAxis}>
          <Text appearance="hint" category="c1">30cm</Text>
          <Text appearance="hint" category="c1">20cm</Text>
          <Text appearance="hint" category="c1">10cm</Text>
          <Text appearance="hint" category="c1">0cm</Text>
        </View>
        <View style={styles.chartArea}>
          {mockGrowthData.map((data, index) => (
            <View key={index} style={styles.chartBar}>
              <View
                style={[
                  styles.bar,
                  { height: `${(data.height / 30) * 100}%` },
                ]}
              >
                <Text style={styles.barHeight}>{data.height}cm</Text>
              </View>
              <Text appearance="hint" category="c1" style={styles.barLabel}>{data.date}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.growthStats}>
        <View style={styles.statItem}>
          <Text status="primary" category="h6">+10cm</Text>
          <Text appearance="hint" category="c1">本月增高</Text>
        </View>
        <View style={styles.statItem}>
          <Text status="success" category="h6">+3片</Text>
          <Text appearance="hint" category="c1">新叶数量</Text>
        </View>
        <View style={styles.statItem}>
          <Text status="primary" category="h6">95%</Text>
          <Text appearance="hint" category="c1">健康指数</Text>
        </View>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TopNavigation
        title="养花日记"
        alignment="center"
        accessoryLeft={() => (
          <Button
            appearance="ghost"
            status="basic"
            accessoryLeft={(props) => <Icons.ArrowLeft {...props} size={24} />}
            onPress={() => navigation.goBack()}
          />
        )}
        accessoryRight={() => (
          <Button
            appearance="ghost"
            status="basic"
            accessoryLeft={(props) => <Icons.Share2 {...props} size={20} />}
          />
        )}
      />

      {/* 植物筛选 - UI Kitten Chips */}
      <Layout style={styles.filterContainer} level="1">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {plants.map((plant) => (
            <Button
              key={plant}
              size="small"
              appearance={selectedPlant === plant || (plant === '全部' && !selectedPlant) ? 'filled' : 'outline'}
              status={selectedPlant === plant || (plant === '全部' && !selectedPlant) ? 'primary' : 'basic'}
              style={styles.filterChip}
              onPress={() => setSelectedPlant(plant === '全部' ? null : plant)}
            >
              {plant}
            </Button>
          ))}
        </ScrollView>
      </Layout>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 功能按钮 - UI Kitten Button */}
        <View style={styles.actionButtons}>
          <Button
            style={styles.actionButton}
            appearance={showGrowthChart ? 'filled' : 'outline'}
            status={showGrowthChart ? 'primary' : 'basic'}
            accessoryLeft={<Icons.Activity size={20} />}
            onPress={() => setShowGrowthChart(!showGrowthChart)}
          >
            生长曲线
          </Button>
          <Button
            style={styles.actionButton}
            appearance={showCompareModal ? 'filled' : 'outline'}
            status={showCompareModal ? 'primary' : 'basic'}
            accessoryLeft={<Icons.Layers size={20} />}
            onPress={() => setShowCompareModal(true)}
          >
            对比图
          </Button>
        </View>

        {/* 生长曲线 */}
        {showGrowthChart && renderGrowthChart()}

        {/* 日记列表 - UI Kitten Card */}
        <View style={styles.diaryList}>
          {mockDiaries.map((diary) => (
            <Card key={diary.id} style={styles.diaryCard}>
              <View style={styles.diaryHeader}>
                <View style={styles.diaryInfo}>
                  <Text category="s1">{diary.plantName}</Text>
                  <View style={styles.diaryDate}>
                    <Icons.Calendar size={12} />
                    <Text appearance="hint" category="c1">{diary.date}</Text>
                  </View>
                </View>
                {diary.compareWithPrevious && (
                  <Text status="success" category="c1">有对比</Text>
                )}
              </View>

              <Text>{diary.content}</Text>

              {/* 模拟图片区域 */}
              <View style={styles.imagePlaceholder}>
                <Icons.Image size={32} />
                <Text appearance="hint">点击添加图片</Text>
              </View>

              <View style={styles.diaryFooter}>
                <Button
                  size="tiny"
                  appearance="ghost"
                  status="primary"
                  accessoryLeft={<Icons.Heart size={16} />}
                >
                  {diary.likes}
                </Button>
                <Button
                  size="tiny"
                  appearance="ghost"
                  status="basic"
                  accessoryLeft={<Icons.MessageCircle size={16} />}
                >
                  {diary.comments}
                </Button>
              </View>
            </Card>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 添加日记按钮 */}
      <Button
        style={styles.addButton}
        size="large"
        appearance="filled"
        status="primary"
        accessoryLeft={<Icons.Plus size={24} />}
      />

      {/* 对比图弹窗 - UI Kitten Modal */}
      <Modal
        visible={showCompareModal}
        backdropStyle={styles.compareBackdrop}
        onBackdropPress={() => setShowCompareModal(false)}
      >
        <Card style={styles.compareModal} header={
          <View style={styles.compareModalHeader}>
            <Text category="h6">照片对比</Text>
            <Button
              size="tiny"
              appearance="ghost"
              status="basic"
              accessoryLeft={<Icons.X size={24} />}
              onPress={() => setShowCompareModal(false)}
            />
          </View>
        }>
          {/* 对比模式选择 */}
          <View style={styles.compareModeSelector}>
            <Button
              style={styles.compareModeButton}
              size="small"
              appearance={selectedIndex === 0 ? 'filled' : 'outline'}
              status={selectedIndex === 0 ? 'primary' : 'basic'}
              onPress={() => setSelectedIndex(0)}
            >
              并排对比
            </Button>
            <Button
              style={styles.compareModeButton}
              size="small"
              appearance={selectedIndex === 1 ? 'filled' : 'outline'}
              status={selectedIndex === 1 ? 'primary' : 'basic'}
              onPress={() => setSelectedIndex(1)}
            >
              叠加对比
            </Button>
          </View>

          {/* 对比说明 */}
          <Layout style={styles.compareInfo} level="2">
            <Text category="s1">
              {selectedIndex === 0 ? '📸 并排对比' : '🎞️ 叠加对比'}
            </Text>
            <Text appearance="hint">
              {selectedIndex === 0
                ? '选择两张同一位置、同一角度的照片并排展示，直观对比生长变化'
                : '将两张照片叠加在一起，用滑块控制透明度，查看细微变化'
              }
            </Text>
          </Layout>

          {/* 模拟对比区域 */}
          <View style={styles.comparePreview}>
            <View style={styles.compareImage}>
              <Text appearance="hint">📷 1月1日</Text>
            </View>
            <Icons.ArrowRight size={20} />
            <View style={styles.compareImage}>
              <Text appearance="hint">📷 1月20日</Text>
            </View>
          </View>

          <Button
            style={styles.selectPhotosButton}
            appearance="filled"
            status="primary"
            onPress={() => {
              Alert.alert('提示', '请在添加日记时选择多张照片进行对比');
              setShowCompareModal(false);
            }}
          >
            选择照片开始对比
          </Button>
        </Card>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterContainer: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  filterChip: {
    marginRight: spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
  chartContainer: {
    marginBottom: spacing.lg,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  chart: {
    flexDirection: 'row',
    height: 150,
    marginBottom: spacing.md,
  },
  chartYAxis: {
    width: 40,
    justifyContent: 'space-between',
    paddingRight: spacing.sm,
  },
  chartArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderColor: colors.background,
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 30,
    backgroundColor: colors.secondary,
    borderRadius: 4,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 4,
  },
  barHeight: {
    fontSize: 8,
    color: colors.white,
    fontWeight: '500',
  },
  barLabel: {
    marginTop: spacing.xs,
  },
  growthStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.background,
  },
  statItem: {
    alignItems: 'center',
  },
  diaryList: {
    gap: spacing.md,
  },
  diaryCard: {},
  diaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  diaryInfo: {
    flex: 1,
  },
  diaryDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  imagePlaceholder: {
    height: 120,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  diaryFooter: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.background,
  },
  addButton: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  compareBackdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  compareModal: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: spacing.xl + 20,
  },
  compareModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  compareModeSelector: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  compareModeButton: {
    flex: 1,
  },
  compareInfo: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  comparePreview: {
    height: 120,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
  },
  compareImage: {
    width: 100,
    height: 100,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary + '30',
    borderStyle: 'dashed',
  },
  selectPhotosButton: {
    marginTop: spacing.lg,
  },
});
