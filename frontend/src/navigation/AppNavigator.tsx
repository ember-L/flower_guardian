// 导航配置 - UI Kitten BottomNavigation
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import {
  BottomNavigation,
  BottomNavigationTab,
  Text,
  Layout,
} from '@ui-kitten/components';
import { Icons } from '../components/Icon';
import { colors, spacing, borderRadius, shadows, fontSize, touchTarget } from '../constants/theme';
import { IdentifyScreen } from '../screens/IdentifyScreen';
import { GardenScreen } from '../screens/GardenScreen';
import { EncyclopediaScreen } from '../screens/EncyclopediaScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

type TabName = 'Identify' | 'Garden' | 'Encyclopedia' | 'Profile';

interface TabConfig {
  name: TabName;
  label: string;
  icon: React.ComponentType<any>;
}

interface AppNavigatorProps {
  currentTab?: TabName;
  onTabChange?: (tab: TabName) => void;
}

export function AppNavigator({ currentTab = 'Identify', onTabChange }: AppNavigatorProps) {
  const tabs: TabConfig[] = [
    { name: 'Identify', label: '识别', icon: Icons.Camera },
    { name: 'Garden', label: '花园', icon: Icons.Flower2 },
    { name: 'Encyclopedia', label: '百科', icon: Icons.BookOpen },
    { name: 'Profile', label: '我的', icon: Icons.User },
  ];

  const renderContent = () => {
    switch (currentTab) {
      case 'Identify':
        return <IdentifyScreen />;
      case 'Garden':
        return <GardenScreen />;
      case 'Encyclopedia':
        return <EncyclopediaScreen />;
      case 'Profile':
        return <ProfileScreen />;
      default:
        return <IdentifyScreen />;
    }
  };

  const renderIcon = (tab: TabConfig) => (style: any) => (
    <tab.icon {...style} width={24} height={24} />
  );

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>
      <BottomNavigation
        selectedIndex={tabs.findIndex(t => t.name === currentTab)}
        onSelect={(index) => onTabChange?.(tabs[index].name)}
        appearance="noIndicator"
        style={styles.tabBar}
      >
        {tabs.map((tab) => (
          <BottomNavigationTab
            key={tab.name}
            title={tab.label}
            icon={renderIcon(tab)}
          />
        ))}
      </BottomNavigation>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    flex: 1,
  },
  tabBar: {
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadows.lg,
    shadowOffset: { width: 0, height: -4 },
  },
});
