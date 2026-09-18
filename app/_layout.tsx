import '../global.css';
import { Stack } from 'expo-router';
import { usePathname } from 'expo-router';
import { NavigationBar } from 'expo-navigation-bar';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { SQLiteProvider } from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeDatabase } from '../src/database/petpalsDatabase';
import { ONBOARDING_COMPLETED_KEY } from '../src/constants/storage';
import { UniversalNav } from '../src/components/Navigation/UniversalNav';
import { useEffect, useState } from 'react';

export default function Layout() {
  const pathname = usePathname();
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY).then((value) => setOnboardingComplete(value === 'true'));
  }, []);

  const showNavigation = pathname !== '/' || onboardingComplete;

  return (
    <SQLiteProvider databaseName="petpals.db" onInit={initializeDatabase}>
      <SafeAreaProvider>
        <StatusBar hidden={false} barStyle="dark-content" backgroundColor="#FFF5EA" translucent={false} />
        <NavigationBar hidden={false} style="dark" />
        <View style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>
            <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="add-pet" options={{ headerShown: false }} />
            <Stack.Screen name="dashboard" options={{ headerShown: false }} />
            <Stack.Screen name="pets" options={{ headerShown: false }} />
            <Stack.Screen name="pet-profile" options={{ headerShown: false }} />
            <Stack.Screen name="calendar" options={{ headerShown: false }} />
            <Stack.Screen name="notifications" options={{ headerShown: false }} />
            <Stack.Screen name="settings" options={{ headerShown: false }} />
            </Stack>
          </View>
          {showNavigation && (
            <View pointerEvents="box-none" style={{ bottom: 0, elevation: 1000, height: 92, justifyContent: 'flex-end', left: 0, position: 'absolute', right: 0, zIndex: 1000 }}>
              <UniversalNav />
            </View>
          )}
        </View>
      </SafeAreaProvider>
    </SQLiteProvider>
  );
}
