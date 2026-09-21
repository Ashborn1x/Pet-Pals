import '../global.css';
import { Stack } from 'expo-router';
import { usePathname } from 'expo-router';
import { NavigationBar } from 'expo-navigation-bar';
import { StatusBar } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { SQLiteProvider } from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeDatabase } from '../src/database/petpalsDatabase';
import { ONBOARDING_COMPLETED_KEY } from '../src/constants/storage';
import { UniversalNav } from '../src/components/Navigation/UniversalNav';
import { MAIN_TAB_ROUTES, MainTabCarousel, type MainTabCarouselRef } from '../src/components/Navigation/MainTabCarousel';

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SQLiteProvider databaseName="petpals.db" onInit={initializeDatabase}>
        <SafeAreaProvider>
          <AppContent />
        </SafeAreaProvider>
      </SQLiteProvider>
    </GestureHandlerRootView>
  );
}

function AppContent() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const tabProgress = useSharedValue(0);
  const carouselRef = useRef<MainTabCarouselRef>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY).then((value) => setOnboardingComplete(value === 'true'));
  }, []);

  const showNavigation = pathname !== '/' || onboardingComplete;
  const showMainCarousel = MAIN_TAB_ROUTES.includes(pathname as (typeof MAIN_TAB_ROUTES)[number]);

  return (
    <>
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
          {showMainCarousel && (
            <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
              <MainTabCarousel ref={carouselRef} progress={tabProgress} />
            </View>
          )}
        </View>
        {showNavigation && (
          <View pointerEvents="box-none" style={{ bottom: insets.bottom + 8, elevation: 1000, height: 92, justifyContent: 'flex-end', left: 0, position: 'absolute', right: 0, zIndex: 1000 }}>
            <UniversalNav
              progress={tabProgress}
              onTabPress={(tab) => carouselRef.current?.navigateToIndex(NAV_TAB_INDEX[tab])}
            />
          </View>
        )}
      </View>
    </>
  );
}

const NAV_TAB_INDEX = { home: 0, pets: 1, calendar: 2, notifications: 3, settings: 4 } as const;
