import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { CurvedNavBar, NavTabId } from './CurvedNavBar';
import { DashboardScreen } from '../../screens/Dashboard/DashboardScreen';

export function DashboardWithNav() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<NavTabId>('home');

  return (
    <View style={{ backgroundColor: '#F1EDE3', flex: 1 }}>
      <View style={{ flex: 1 }}>
        <DashboardScreen
          onOpenAddPet={() => router.push('/add-pet')}
          onReturnToWelcome={() => router.replace('/')}
        />
      </View>
      <CurvedNavBar activeTab={activeTab} onTabChange={setActiveTab} />
    </View>
  );
}
