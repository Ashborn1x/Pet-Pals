import { usePathname, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { CurvedNavBar, NavTabId } from './CurvedNavBar';

export function UniversalNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<NavTabId>(pathname === '/pets' ? 'pets' : 'home');

  useEffect(() => {
    if (pathname === '/pets' || pathname === '/pet-profile') setActiveTab('pets');
    if (pathname === '/dashboard') setActiveTab('home');
  }, [pathname]);

  const changeTab = (tab: NavTabId) => {
    setActiveTab(tab);
    if (tab === 'home') router.replace('/dashboard');
    if (tab === 'pets') router.replace('/pets');
  };

  return <CurvedNavBar activeTab={activeTab} onTabChange={changeTab} />;
}
