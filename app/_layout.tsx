import '../global.css';
import { Stack } from 'expo-router';
import { NavigationBar } from 'expo-navigation-bar';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function Layout() {
  return (
    <SafeAreaProvider>
      <StatusBar hidden={false} barStyle="dark-content" backgroundColor="#FFF5EA" translucent={false} />
      <NavigationBar hidden={false} style="dark" />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="add-pet" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
