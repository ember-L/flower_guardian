// 智能提醒管理页面 - UI Kitten 组件
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import {
  List,
  ListItem,
  Toggle,
  Button,
  Card,
  Text,
  TopNavigation,
  Modal,
  Radio,
  RadioGroup,
  Layout,
  useTheme,
} from '@ui-kitten/components';
import { Icons } from '../components/Icon';
import { colors, spacing, borderRadius, fontSize } from '../constants/theme';

// 模拟提醒数据
const mockReminders = [
  { id: '1', plantName: '绿萝', type: 'water', title: '浇水', interval: 7, enabled: true, lastDone: '2024-01-15' },
  { id: '2', plantName: '绿萝', type: 'fertilize', title: '施肥', interval: 30, enabled: true, lastDone: '2024-01-10' },
  { id: '3', plantName: '虎皮兰', type: 'water', title: '浇水', interval: 14, enabled: true, lastDone: '2024-01-12' },
  { id: '4', plantName: '吊兰', type: 'prune', title: '修剪', interval: 90, enabled: false, lastDone: '2024-01-01' },
];

type RootStackParamList = {
  Reminder: { plantId?: string };
};

const reminderTypeIcons = {
  water: Icons.Droplets,
  fertilize: Icons.Flower2,
  prune: Icons.Scissors,
  repot: Icons.Flower2,
};

const reminderTypeColors = {
  water: colors.primary,
  fertilize: colors.secondary,
  prune: colors.warning,
  repot: '#8B4513',
};

export function ReminderScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'Reminder'>>();
  const [reminders, setReminders] = useState(mockReminders);
  const [showEnvModal, setShowEnvModal] = useState(false);
  const [lazyMode, setLazyMode] = useState(true);
  const [selectedEnvIndex, setSelectedEnvIndex] = useState(0);

  // 环境选项
  const envOptions = [
    { id: 'south', label: '南向阳台', icon: '☀️', desc: '光照充足，浇水频率较高' },
    { id: 'north', label: '北向房间', icon: '☁️', desc: '光照较弱，浇水频率较低' },
    { id: 'office', label: '办公室', icon: '🏢', desc: '光照一般，常开空调' },
    { id: 'bedroom', label: '卧室', icon: '🛏️', desc: '光照较弱，通风可能较差' },
  ];

  const toggleReminder = (id: string) => {
    setReminders(prev =>
      prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r)
    );
  };

  const handleSnooze = (reminder: typeof mockReminders[0]) => {
    const options = [
      { label: '1天后', days: 1 },
      { label: '3天后', days: 3 },
      { label: '1周后', days: 7 },
      { label: '取消', cancel: true },
    ];

    Alert.alert(
      '延期提醒',
      `将${reminder.title}延期多久？\n\n开启懒人模式后，系统会自动学习你的习惯`,
      options.map(opt =>
        opt.cancel
          ? { text: opt.label, style: 'cancel' as const }
          : { text: opt.label, onPress: () => console.log(`延期${opt.days}天`) }
      )
    );
  };

  const handleEnvConfirm = () => {
    const env = envOptions[selectedEnvIndex];
    Alert.alert('环境已更新', `当前环境: ${env.label}\n系统将自动调整浇水频率`);
    setShowEnvModal(false);
  };

  const getNextDate = (reminder: typeof mockReminders[0]) => {
    const lastDate = new Date(reminder.lastDone);
    const nextDate = new Date(lastDate);
    nextDate.setDate(lastDate.getDate() + reminder.interval);
    const today = new Date();
    const diffDays = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? `${diffDays}天后` : '今天';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部 - UI Kitten TopNavigation */}
      <TopNavigation
        title="智能提醒"
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
            accessoryLeft={(props) => <Icons.Settings {...props} size={24} />}
          />
        )}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 环境设置提示 - UI Kitten Card */}
        <Card style={styles.envCard} status="warning">
          <View style={styles.envHeader}>
            <Icons.Sun size={24} />
            <Text category="s1">环境校准</Text>
            <Text category="c1" status="primary">点击调整</Text>
          </View>
          <Text appearance="hint">{`当前环境：${envOptions[selectedEnvIndex].label} | 系统已自动调整浇水频率`}</Text>
          <View style={styles.envTip}>
            <Text appearance="hint" category="c1">💡 根据环境调整浇水频率，让植物更健康</Text>
          </View>
        </Card>

        {/* 懒人模式 - UI Kitten Layout + Toggle */}
        <Layout style={styles.lazyModeCard} level="1">
          <View style={styles.lazyModeHeader}>
            <Icons.Clock size={24} />
            <View style={styles.lazyModeTitleContainer}>
              <Text category="s1">懒人模式</Text>
              {lazyMode && (
                <Text status="success" category="c1">学习中</Text>
              )}
            </View>
          </View>
          <View style={styles.lazyModeContent}>
            <Text appearance="hint" style={{ flex: 1, marginRight: spacing.md }}>
              {lazyMode
                ? '系统正在学习你的养护习惯，自动调整提醒时间'
                : '开启后，系统会学习你的习惯自动调整提醒时间'}
            </Text>
            <Toggle checked={lazyMode} onChange={setLazyMode} />
          </View>
        </Layout>

        {/* 提醒列表 - UI Kitten List */}
        <Layout style={styles.section} level="1">
          <Text category="s1" style={styles.sectionTitle}>提醒列表</Text>
          {reminders.map((reminder) => {
            const IconComponent = reminderTypeIcons[reminder.type as keyof typeof reminderTypeIcons] || Icons.Droplets;
            const iconColor = reminderTypeColors[reminder.type as keyof typeof reminderTypeColors] || colors.primary;

            return (
              <ListItem
                key={reminder.id}
                style={styles.reminderCard}
                accessoryLeft={
                  <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
                    <IconComponent size={24} />
                  </View>
                }
                title={(props: any) => <Text {...props} category="s1">{reminder.plantName}</Text>}
                description={(props: any) => (
                  <View {...props}>
                    <Text appearance="hint">{`${reminder.title} · 每${reminder.interval}天`}</Text>
                    <Text status="primary" category="c1">{`下次：${getNextDate(reminder)}`}</Text>
                  </View>
                )}
                accessoryRight={
                  <View style={styles.reminderActions}>
                    <Toggle checked={reminder.enabled} onChange={() => toggleReminder(reminder.id)} />
                    <Button
                      size="tiny"
                      appearance="ghost"
                      status="basic"
                      accessoryLeft={<Icons.Clock size={16} />}
                      onPress={() => handleSnooze(reminder)}
                    />
                  </View>
                }
              />
            );
          })}
        </Layout>

        {/* 添加提醒 */}
        <Button
          style={styles.addButton}
          appearance="filled"
          status="primary"
          accessoryLeft={<Icons.Bell size={20} />}
        >
          添加新提醒
        </Button>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 环境选择弹窗 - UI Kitten Modal */}
      <Modal
        visible={showEnvModal}
        backdropStyle={styles.modalBackdrop}
        onBackdropPress={() => setShowEnvModal(false)}
      >
        <Card style={styles.envModal} header={
          <View style={styles.modalHeader}>
            <Text category="h6">选择摆放环境</Text>
            <Button
              size="tiny"
              appearance="ghost"
              status="basic"
              accessoryLeft={<Icons.X size={24} />}
              onPress={() => setShowEnvModal(false)}
            />
          </View>
        }>
          <Text appearance="hint" style={styles.modalSubtitle}>
            不同环境光照和湿度不同，系统会自动调整浇水频率
          </Text>

          <RadioGroup
            selectedIndex={selectedEnvIndex}
            onChange={index => setSelectedEnvIndex(index)}
          >
            {envOptions.map((env, index) => (
              <Radio
                key={env.id}
                status="primary"
                style={styles.envRadio}
              >
                {env.label}
              </Radio>
            ))}
          </RadioGroup>

          <Button
            style={styles.confirmButton}
            appearance="filled"
            status="primary"
            onPress={handleEnvConfirm}
          >
            确认环境
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
  content: {
    flex: 1,
  },
  envCard: {
    margin: spacing.lg,
  },
  envHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  envTip: {
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
  },
  lazyModeCard: {
    margin: spacing.lg,
    marginTop: 0,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  lazyModeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  lazyModeTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  lazyModeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  section: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  reminderCard: {
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  reminderActions: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  addButton: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  // 弹窗样式
  modalBackdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  envModal: {
    maxWidth: 360,
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  modalSubtitle: {
    marginBottom: spacing.lg,
  },
  envRadio: {
    marginVertical: spacing.xs,
  },
  confirmButton: {
    marginTop: spacing.lg,
  },
});
