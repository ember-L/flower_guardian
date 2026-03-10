/**
 * 护花使者 - Flower Guardian
 * 你的掌上植物管家，让养花不再凭感觉
 */
import React, { useState } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { ApplicationProvider, Layout } from '@ui-kitten/components';
import { AppNavigator } from './src/navigation/AppNavigator';
import { colors } from './src/constants/theme';
import { theme } from './src/theme';

type TabName = 'Identify' | 'Garden' | 'Encyclopedia' | 'Profile';

function App() {
  const [currentTab, setCurrentTab] = useState<TabName>('Identify');

  return (
    <ApplicationProvider {...theme}>
      <NavigationContainer>
        <Layout style={{ flex: 1, backgroundColor: colors.background }}>
          <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
          <AppNavigator currentTab={currentTab} onTabChange={setCurrentTab} />
        </Layout>
      </NavigationContainer>
    </ApplicationProvider>
  );
}

export default App;
