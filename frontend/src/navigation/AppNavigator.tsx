// 导航配置
import React from 'react';
import { createBottomTabNavigator, createNativeStackNavigator } from '@react-navigation/native';
import { View, StyleSheet, Platform } from 'react-native';
import { IdentifyScreen } from '../screens/IdentifyScreen';
import { GardenScreen } from '../screens/GardenScreen';
import { EncyclopediaScreen } from '../screens/EncyclopediaScreen';
import { EncyclopediaDetailScreen } from '../screens/EncyclopediaDetailScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { DiagnosisScreen } from '../screens/DiagnosisScreen';
import { RecommendationScreen } from '../screens/RecommendationScreen';
import { DiaryScreen } from '../screens/DiaryScreen';
import { ReminderScreen } from '../screens/ReminderScreen';
import { tabs, activeColor, inactiveColor, TabParamList } from './tabs';
import { colors } from '../constants/theme';

const Tab = createBottomTabNavigator<TabParamList>();

// 百科Stack
function EncyclopediaStackNavigator() {
  return (
    <EncyclopediaStack.Navigator screenOptions={{ headerShown: false }}>
      <EncyclopediaStack.Screen name="EncyclopediaMain" component={EncyclopediaScreen} />
      <EncyclopediaStack.Screen name="EncyclopediaDetail" component={EncyclopediaDetailScreen} />
    </EncyclopediaStack.Navigator>
  );
}
import { createNativeStackNavigator as EncyclopediaStack } from '@react-navigation/native-stack';

// Profile Stack
function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="Diagnosis" component={DiagnosisScreen} />
      <ProfileStack.Screen name="Recommendation" component={RecommendationScreen} />
      <ProfileStack.Screen name="Diary" component={DiaryScreen} />
      <ProfileStack.Screen name="Reminder" component={ReminderScreen} />
    </ProfileStack.Navigator>
  );
}
import { createNativeStackNavigator as ProfileStack } from '@react-navigation/native-stack';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const IconComponent = tabs.find((t) => t.name === name)?.icon;
  if (!IconComponent) return null;

  return (
    <View style={styles.iconContainer}>
      <IconComponent
        size={24}
        color={focused ? activeColor : inactiveColor}
        strokeWidth={focused ? 2.5 : 2}
      />
    </View>
  );
}

export function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name} focused={focused} />
        ),
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      })}
    >
      <Tab.Screen
        name="Identify"
        component={IdentifyScreen}
        options={{ tabBarLabel: '识别' }}
      />
      <Tab.Screen
        name="Garden"
        component={GardenScreen}
        options={{ tabBarLabel: '花园' }}
      />
      <Tab.Screen
        name="Encyclopedia"
        component={EncyclopediaStackNavigator}
        options={{ tabBarLabel: '百科' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{ tabBarLabel: '我的' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 0,
    elevation: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    height: Platform.OS === 'ios' ? 85 : 65,
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    paddingTop: 10,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
