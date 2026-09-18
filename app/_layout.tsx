import '../global.css';
import { Stack } from 'expo-router';
import { NavigationBar } from 'expo-navigation-bar';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { UniversalNav } from '../src/components/Navigation/UniversalNav';
import { usePathname } from 'expo-router';
import { View } from 'react-native';

export default function Layout() {
  const pathname = usePathname();
  const showNavigation = pathname !== '/';

  return (
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
          </Stack>
        </View>
        {showNavigation && (
          <View pointerEvents="box-none" style={{ bottom: 0, left: 0, position: 'absolute', right: 0 }}>
            <UniversalNav />
          </View>
        )}
      </View>
    </SafeAreaProvider>
  );
}
