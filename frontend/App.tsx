/**
 * 护花使者 - Flower Guardian
 * 你的掌上植物管家，让养花不再凭感觉
 */
import React, { useState } from 'react';
import { StatusBar, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { colors } from './src/constants/theme';

type TabName = 'Identify' | 'Garden' | 'Encyclopedia' | 'Profile';

function App() {
  const [currentTab, setCurrentTab] = useState<TabName>('Identify');

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <View style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
          <AppNavigator currentTab={currentTab} onTabChange={setCurrentTab} />
        </View>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

export default App;
