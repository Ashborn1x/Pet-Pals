import { usePathname, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import { CurvedNavBar, NavTabId } from './CurvedNavBar';

export function UniversalNav({ progress }: { progress: SharedValue<number> }) {
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

  const changeTab = (tab: NavTabId) => {
    setActiveTab(tab);
    if (tab === 'home') router.replace('/dashboard');
    if (tab === 'pets') router.replace('/pets');
    if (tab === 'calendar') router.replace('/calendar');
    if (tab === 'notifications') router.replace('/notifications');
    if (tab === 'settings') router.replace('/settings');
  };

  return <CurvedNavBar activeTab={activeTab} onTabChange={changeTab} progress={progress} />;
}
