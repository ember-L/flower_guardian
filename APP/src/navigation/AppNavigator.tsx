// 导航配置 - 支持子页面跳转
import React, { useState } from 'react';
import { View, StyleSheet, Platform, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icons } from '../components/Icon';
import { colors, spacing } from '../constants/theme';
import { IdentifyScreen } from '../screens/IdentifyScreen';
import { GardenScreen } from '../screens/GardenScreen';
import { EncyclopediaScreen } from '../screens/EncyclopediaScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { DiagnosisScreen } from '../screens/DiagnosisScreen';
import { RecommendationScreen } from '../screens/RecommendationScreen';
import { ReminderScreen } from '../screens/ReminderScreen';
import { EncyclopediaDetailScreen } from '../screens/EncyclopediaDetailScreen';
import { DiaryScreen } from '../screens/DiaryScreen';

export type TabName = 'Identify' | 'Garden' | 'Encyclopedia' | 'Profile';
export type SubPageName = 'Diagnosis' | 'Recommendation' | 'Reminder' | 'EncyclopediaDetail' | 'Diary' | null;

interface TabConfig {
  name: TabName;
  label: string;
  icon: React.ComponentType<any>;
}

export interface NavigationProps {
  currentTab: TabName;
  currentSubPage: SubPageName;
  onTabChange: (tab: TabName) => void;
  onNavigate: (page: SubPageName) => void;
  onGoBack: () => void;
}

export function AppNavigator() {
  const [currentTab, setCurrentTab] = useState<TabName>('Identify');
  const [currentSubPage, setCurrentSubPage] = useState<SubPageName>(null);

  const tabs: TabConfig[] = [
    { name: 'Identify', label: '识别', icon: Icons.Home },
    { name: 'Garden', label: '花园', icon: Icons.Flower2 },
    { name: 'Encyclopedia', label: '百科', icon: Icons.BookOpen },
    { name: 'Profile', label: '我的', icon: Icons.User },
  ];

  const handleTabChange = (tab: TabName) => {
    setCurrentTab(tab);
    setCurrentSubPage(null);
  };

  const handleNavigate = (page: SubPageName) => {
    setCurrentSubPage(page);
  };

  const handleGoBack = () => {
    setCurrentSubPage(null);
  };

  const renderContent = () => {
    // 渲染子页面
    if (currentSubPage === 'Diagnosis') {
      return <DiagnosisScreen onGoBack={handleGoBack} onNavigate={handleNavigate} currentTab={currentTab} onTabChange={handleTabChange} />;
    }
    if (currentSubPage === 'Recommendation') {
      return <RecommendationScreen onGoBack={handleGoBack} onNavigate={handleNavigate} currentTab={currentTab} onTabChange={handleTabChange} />;
    }
    if (currentSubPage === 'Reminder') {
      return <ReminderScreen onGoBack={handleGoBack} onNavigate={handleNavigate} currentTab={currentTab} onTabChange={handleTabChange} />;
    }
    if (currentSubPage === 'EncyclopediaDetail') {
      return <EncyclopediaDetailScreen onGoBack={handleGoBack} onNavigate={handleNavigate} currentTab={currentTab} onTabChange={handleTabChange} />;
    }
    if (currentSubPage === 'Diary') {
      return <DiaryScreen onGoBack={handleGoBack} onNavigate={handleNavigate} currentTab={currentTab} onTabChange={handleTabChange} />;
    }

    // 渲染主页面
    switch (currentTab) {
      case 'Identify':
        return <IdentifyScreen onNavigate={handleNavigate} currentTab={currentTab} onTabChange={handleTabChange} />;
      case 'Garden':
        return <GardenScreen onNavigate={handleNavigate} currentTab={currentTab} onTabChange={handleTabChange} />;
      case 'Encyclopedia':
        return <EncyclopediaScreen onNavigate={handleNavigate} currentTab={currentTab} onTabChange={handleTabChange} />;
      case 'Profile':
        return <ProfileScreen onNavigate={handleNavigate} currentTab={currentTab} onTabChange={handleTabChange} />;
      default:
        return <IdentifyScreen onNavigate={handleNavigate} currentTab={currentTab} onTabChange={handleTabChange} />;
    }
  };

  const getTabIcon = (tab: TabConfig, isActive: boolean, isMain: boolean) => {
    const Icon = tab.icon;
    if (isMain) {
      return (
        <View style={[styles.mainButton, { backgroundColor: colors.primary }]}>
          <Icon width={24} height={24} color="#fff" />
        </View>
      );
    }
    return (
      <View style={[styles.tabIcon, isActive && styles.tabIconActive]}>
        <Icon width={20} height={20} color={isActive ? colors.primary : colors['text-tertiary']} />
      </View>
    );
  };

  // 子页面时隐藏底部导航
  if (currentSubPage) {
    return (
      <View style={styles.container}>
        <View style={styles.contentContainer}>
          {renderContent()}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>
      <View style={[styles.tabBar, { paddingBottom: Platform.OS === 'ios' ? insets.bottom + 8 : 8 }]}>
        <View style={styles.tabContent}>
          {tabs.map((tab) => {
            const isActive = currentTab === tab.name;
            const isMain = tab.name === 'Identify';
            return (
              <TouchableOpacity
                key={tab.name}
                style={styles.tabItem}
                onPress={() => handleTabChange(tab.name)}
                activeOpacity={0.7}
              >
                {getTabIcon(tab, isActive, isMain)}
                <Text style={[styles.tabLabel, { color: isActive ? colors.primary : colors['text-tertiary'] }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  contentContainer: { flex: 1 },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 8,
  },
  tabContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 64,
    paddingHorizontal: spacing.sm,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  mainButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 10,
  },
  tabIcon: { padding: 6, borderRadius: 12 },
  tabIconActive: { backgroundColor: colors.primary + '15' },
  tabLabel: { fontSize: 11, marginTop: 2 },
});
