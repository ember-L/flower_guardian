// 导航配置 - 支持子页面跳转
import React, { useState, useEffect } from 'react';
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
import { StoreScreen } from '../screens/StoreScreen';
import { StoreDetailScreen } from '../screens/StoreDetailScreen';
import { OrdersScreen } from '../screens/OrdersScreen';
import { CartScreen } from '../screens/CartScreen';
import { OrderDetailScreen } from '../screens/OrderDetailScreen';
import { DiagnosisHistoryScreen } from '../screens/DiagnosisHistoryScreen';
import { DiagnosisDetailScreen } from '../screens/DiagnosisDetailScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { WriteDiaryScreen } from '../screens/WriteDiaryScreen';
import { DiaryDetailScreen } from '../screens/DiaryDetailScreen';
import { GrowthCurveScreen } from '../screens/GrowthCurveScreen';
import { AddressScreen } from '../screens/AddressScreen';
import { AddressEditScreen } from '../screens/AddressEditScreen';
import { EmailVerifyScreen } from '../screens/EmailVerifyScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { ConsultationListScreen } from '../screens/ConsultationListScreen';
import { ConsultationScreen } from '../screens/ConsultationScreen';
import { KnowledgeScreen } from '../screens/KnowledgeScreen';
import { KnowledgeDetailScreen } from '../screens/KnowledgeDetailScreen';
import { PlantDetailScreen } from '../screens/PlantDetailScreen';
import { getCurrentUser, isAuthenticated, logout as authLogout, checkAuthStatus } from '../services/auth';

export type TabName = 'Identify' | 'Garden' | 'Encyclopedia' | 'Store' | 'Profile';
export type SubPageName = 'Diagnosis' | 'Recommendation' | 'Reminder' | 'EncyclopediaDetail' | 'Diary' | 'StoreDetail' | 'Cart' | 'Checkout' | 'Orders' | 'OrderDetail' | 'DiagnosisHistory' | 'DiagnosisDetail' | 'Login' | 'Register' | 'ForgotPassword' | 'WriteDiary' | 'DiaryDetail' | 'GrowthCurve' | 'Address' | 'AddressEdit' | 'EmailVerify' | 'ConsultationList' | 'Consultation' | 'Knowledge' | 'KnowledgeDetail' | 'PlantDetail' | null;

interface TabConfig {
  name: TabName;
  label: string;
  icon: React.ComponentType<any>;
}

export interface NavigationProps {
  currentTab: TabName;
  currentSubPage: SubPageName;
  onTabChange: (tab: TabName) => void;
  onNavigate: (page: SubPageName, params?: any) => void;
  onGoBack: () => void;
  isLoggedIn?: boolean;
  onRequireLogin?: () => void;
  onLogout?: () => void;
  route?: { params?: any };
}

export function AppNavigator() {
  const insets = useSafeAreaInsets();
  const [currentTab, setCurrentTab] = useState<TabName>('Identify');
  const [currentSubPage, setCurrentSubPage] = useState<SubPageName>(null);
  const [navParams, setNavParams] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    checkAuthStatus().then(setIsLoggedIn).finally(() => setAuthChecked(true));
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setCurrentSubPage(null);
  };

  const handleLogout = async () => {
    await authLogout();
    setIsLoggedIn(false);
    setCurrentTab('Identify');
  };

  const handleRequireLogin = (callback: () => void) => {
    if (!isLoggedIn) {
      setCurrentSubPage('Login');
      return false;
    }
    return true;
  };

  const tabs: TabConfig[] = [
    { name: 'Garden', label: '花园', icon: Icons.Flower2 },
    { name: 'Encyclopedia', label: '百科', icon: Icons.BookOpen },
    { name: 'Identify', label: '首页', icon: Icons.Home },
    { name: 'Store', label: '商城', icon: Icons.Leaf },
    { name: 'Profile', label: '我的', icon: Icons.User },
  ];

  const handleTabChange = (tab: TabName) => {
    setCurrentTab(tab);
    setCurrentSubPage(null);
    setNavParams(null);
  };

  const handleNavigate = (page: SubPageName, params?: any) => {
    setNavParams(params);
    setCurrentSubPage(page);
  };

  const handleGoBack = () => {
    // 返回时切换到识别页面
    setCurrentTab('Identify');
    setCurrentSubPage(null);
    setNavParams(null);
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
      return <EncyclopediaDetailScreen onGoBack={handleGoBack} onNavigate={handleNavigate} currentTab={currentTab} onTabChange={handleTabChange} route={navParams || {}} />;
    }
    if (currentSubPage === 'Diary') {
      return <DiaryScreen onGoBack={handleGoBack} onNavigate={handleNavigate} currentTab={currentTab} onTabChange={handleTabChange} isLoggedIn={isLoggedIn} onRequireLogin={() => setCurrentSubPage('Login')} />;
    }
    if (currentSubPage === 'StoreDetail') {
      return <StoreDetailScreen onGoBack={handleGoBack} onNavigate={handleNavigate} currentTab={currentTab} onTabChange={handleTabChange} productId={navParams?.productId} />;
    }
    if (currentSubPage === 'Cart') {
      return <CartScreen onGoBack={handleGoBack} onNavigate={handleNavigate} currentTab={currentTab} onTabChange={handleTabChange} isLoggedIn={isLoggedIn} onRequireLogin={() => setCurrentSubPage('Login')} />;
    }
    if (currentSubPage === 'Checkout') {
      return <CartScreen onGoBack={handleGoBack} onNavigate={handleNavigate} currentTab={currentTab} onTabChange={handleTabChange} isLoggedIn={isLoggedIn} onRequireLogin={() => setCurrentSubPage('Login')} />;
    }
    if (currentSubPage === 'Orders') {
      return <OrdersScreen onGoBack={handleGoBack} onNavigate={handleNavigate} currentTab={currentTab} onTabChange={handleTabChange} isLoggedIn={isLoggedIn} onRequireLogin={() => setCurrentSubPage('Login')} />;
    }
    if (currentSubPage === 'OrderDetail') {
      return <OrderDetailScreen route={navParams || {}} onGoBack={handleGoBack} onNavigate={handleNavigate} currentTab={currentTab} onTabChange={handleTabChange} isLoggedIn={isLoggedIn} onRequireLogin={() => setCurrentSubPage('Login')} />;
    }
    if (currentSubPage === 'DiagnosisHistory') {
      return <DiagnosisHistoryScreen onGoBack={handleGoBack} onNavigate={handleNavigate} currentTab={currentTab} onTabChange={handleTabChange} />;
    }
    if (currentSubPage === 'DiagnosisDetail') {
      return <DiagnosisDetailScreen route={navParams || {}} onGoBack={handleGoBack} onNavigate={handleNavigate} currentTab={currentTab} onTabChange={handleTabChange} />;
    }
    if (currentSubPage === 'ConsultationList') {
      return <ConsultationListScreen onGoBack={handleGoBack} onNavigate={handleNavigate} />;
    }
    if (currentSubPage === 'Consultation') {
      return <ConsultationScreen onGoBack={handleGoBack} conversationId={navParams?.conversationId} diagnosisContext={navParams?.diagnosisContext} />;
    }
    if (currentSubPage === 'Knowledge') {
      return <KnowledgeScreen onGoBack={handleGoBack} onNavigate={handleNavigate} />;
    }
    if (currentSubPage === 'KnowledgeDetail') {
      return <KnowledgeDetailScreen onGoBack={handleGoBack} article={navParams?.article || {}} />;
    }
    if (currentSubPage === 'PlantDetail') {
      return <PlantDetailScreen route={{ params: navParams }} onNavigate={handleNavigate} onTabChange={handleTabChange} />;
    }
    if (currentSubPage === 'Login') {
      return (
        <LoginScreen
          onGoBack={handleGoBack}
          onLoginSuccess={handleLoginSuccess}
          onSwitchToRegister={() => setCurrentSubPage('Register')}
          onSwitchToForgotPassword={() => setCurrentSubPage('ForgotPassword')}
        />
      );
    }
    if (currentSubPage === 'Register') {
      return (
        <RegisterScreen
          onGoBack={handleGoBack}
          onRegisterSuccess={() => setCurrentSubPage('Login')}
          onSwitchToLogin={() => setCurrentSubPage('Login')}
        />
      );
    }
    if (currentSubPage === 'EmailVerify') {
      return (
        <EmailVerifyScreen
          onGoBack={() => setCurrentSubPage('Login')}
          onVerifySuccess={handleLoginSuccess}
        />
      );
    }
    if (currentSubPage === 'ForgotPassword') {
      return (
        <ForgotPasswordScreen
          onGoBack={() => setCurrentSubPage('Login')}
          onResetSuccess={() => setCurrentSubPage('Login')}
        />
      );
    }
    if (currentSubPage === 'WriteDiary') {
      return <WriteDiaryScreen onGoBack={handleGoBack} onNavigate={handleNavigate} isLoggedIn={isLoggedIn} onRequireLogin={() => setCurrentSubPage('Login')} />;
    }
    if (currentSubPage === 'DiaryDetail') {
      return <DiaryDetailScreen onGoBack={handleGoBack} onNavigate={handleNavigate} diaryId={navParams?.diaryId} isLoggedIn={isLoggedIn} onRequireLogin={() => setCurrentSubPage('Login')} />;
    }
    if (currentSubPage === 'GrowthCurve') {
      return <GrowthCurveScreen onGoBack={handleGoBack} onNavigate={handleNavigate} preselectedPlantId={navParams?.preselectedPlantId} isLoggedIn={isLoggedIn} onRequireLogin={() => setCurrentSubPage('Login')} />;
    }
    if (currentSubPage === 'Address') {
      return <AddressScreen onGoBack={handleGoBack} onNavigate={handleNavigate} currentTab={currentTab} onTabChange={handleTabChange} isLoggedIn={isLoggedIn} onRequireLogin={() => setCurrentSubPage('Login')} />;
    }
    if (currentSubPage === 'AddressEdit') {
      return <AddressEditScreen onGoBack={handleGoBack} addressId={navParams?.addressId} />;
    }

    // 渲染主页面
    switch (currentTab) {
      case 'Identify':
        return <IdentifyScreen onNavigate={handleNavigate} currentTab={currentTab} onTabChange={handleTabChange} />;
      case 'Garden':
        return <GardenScreen onNavigate={handleNavigate} currentTab={currentTab} onTabChange={handleTabChange} isLoggedIn={isLoggedIn} onRequireLogin={() => setCurrentSubPage('Login')} onLogout={handleLogout} />;
      case 'Encyclopedia':
        return <EncyclopediaScreen onNavigate={handleNavigate} currentTab={currentTab} onTabChange={handleTabChange} />;
      case 'Store':
        return <StoreScreen onNavigate={handleNavigate} currentTab={currentTab} onTabChange={handleTabChange} isLoggedIn={isLoggedIn} onRequireLogin={() => setCurrentSubPage('Login')} />;
      case 'Profile':
        return <ProfileScreen onNavigate={handleNavigate} currentTab={currentTab} onTabChange={handleTabChange} isLoggedIn={isLoggedIn} onLogout={handleLogout} onRequireLogin={() => setCurrentSubPage('Login')} />;
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
