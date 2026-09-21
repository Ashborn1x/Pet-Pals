import { usePathname, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import { CurvedNavBar, NavTabId } from './CurvedNavBar';

const TAB_INDEX: Record<NavTabId, number> = {
  home: 0,
  pets: 1,
  calendar: 2,
  notifications: 3,
  settings: 4,
};

export function UniversalNav({ progress, onTabPress }: { progress: SharedValue<number>; onTabPress?: (tab: NavTabId) => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<NavTabId>(pathname === '/pets' ? 'pets' : 'home');

  useEffect(() => {
    if (pathname === '/pets' || pathname === '/pet-profile') setActiveTab('pets');
    if (pathname === '/calendar') setActiveTab('calendar');
    if (pathname === '/notifications') setActiveTab('notifications');
    if (pathname === '/settings') setActiveTab('settings');
    if (pathname === '/dashboard') setActiveTab('home');
  }, [pathname]);

  const selectTab = (tab: NavTabId) => {
    setActiveTab(tab);
    progress.value = TAB_INDEX[tab];
    onTabPress?.(tab);
  };

  const changeTab = (tab: NavTabId) => {
    setActiveTab(tab);
    progress.value = TAB_INDEX[tab];
    // MainTabCarousel updates the route after the latest requested animation settles.
    // Keep a direct route fallback for screens outside the carousel, such as pet-profile.
    if (pathname === '/pet-profile') {
      if (tab === 'home') router.replace('/dashboard');
      if (tab === 'pets') router.replace('/pets');
      if (tab === 'calendar') router.replace('/calendar');
      if (tab === 'notifications') router.replace('/notifications');
      if (tab === 'settings') router.replace('/settings');
    }
  };

  return <CurvedNavBar activeTab={activeTab} onTabPressIn={selectTab} onTabChange={changeTab} progress={progress} />;
}
