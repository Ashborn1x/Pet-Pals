import { usePathname, useRouter } from 'expo-router';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Carousel, type CarouselRef } from 'react-native-reanimated-carousel';
import type { SharedValue } from 'react-native-reanimated';
import { DashboardScreen } from '../../screens/Dashboard/DashboardScreen';
import { CalendarScreen } from '../../screens/Calendar/CalendarScreen';
import { NotificationsScreen } from '../../screens/Notifications/NotificationsScreen';
import { PetListScreen } from '../../screens/Pets/PetListScreen';
import { SettingsScreen } from '../../screens/Settings/SettingsScreen';

export const MAIN_TAB_ROUTES = ['/dashboard', '/pets', '/calendar', '/notifications', '/settings'] as const;
type MainTabRoute = (typeof MAIN_TAB_ROUTES)[number];

export type MainTabCarouselRef = {
  navigateToIndex: (index: number) => void;
};

export const MainTabCarousel = forwardRef<MainTabCarouselRef, { progress: SharedValue<number> }>(function MainTabCarousel({ progress }, ref) {
  const pathname = usePathname();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const carouselRef = useRef<CarouselRef>(null);
  const requestedIndexRef = useRef<number | null>(null);
  const route = normalizeRoute(pathname);
  const activeIndex = Math.max(0, MAIN_TAB_ROUTES.indexOf(route));
  const pageWidth = Math.max(1, width);

  useEffect(() => {
    progress.value = activeIndex;
    if (requestedIndexRef.current === activeIndex) {
      requestedIndexRef.current = null;
      return;
    }
    if (carouselRef.current?.getCurrentIndex() !== activeIndex) {
      carouselRef.current?.scrollTo({ index: activeIndex, animated: true });
    }
  }, [activeIndex, progress]);

  useImperativeHandle(ref, () => ({
    navigateToIndex: (index) => {
      requestedIndexRef.current = index;
      progress.value = index;
      carouselRef.current?.scrollTo({ index, animated: true });
    },
  }), [progress]);

  const changeRoute = (nextRoute: MainTabRoute) => {
    const nextIndex = MAIN_TAB_ROUTES.indexOf(nextRoute);
    if (requestedIndexRef.current !== null && requestedIndexRef.current !== nextIndex) {
      return;
    }
    requestedIndexRef.current = null;
    if (nextRoute !== pathname) router.replace(nextRoute);
  };

  return (
    <Carousel
      ref={carouselRef}
      data={[...MAIN_TAB_ROUTES]}
      defaultIndex={activeIndex}
      loop={false}
      scrollEnabled
      // Make the outer boundaries hard stops while keeping valid tab swipes enabled.
      overscrollEnabled={activeIndex !== 0 && activeIndex !== MAIN_TAB_ROUTES.length - 1}
      // Require an intentional horizontal gesture and let vertical scrolling win.
      onConfigurePanGesture={(gesture) => {
        gesture.activeOffsetX([-24, 24]);
        gesture.failOffsetY([-14, 14]);
      }}
      // Keep all five main tabs mounted so their scroll position and local state are cached.
      renderWindowSize={5}
      progress={progress}
      style={[styles.carousel, { height, width }]}
      itemSize={pageWidth}
      onSnapToItem={(index) => changeRoute(MAIN_TAB_ROUTES[index])}
      renderItem={({ item }) => (
        <View style={[styles.page, { width: pageWidth }]}>
          {item === '/dashboard' && <DashboardScreen onOpenAddPet={() => router.push('/add-pet')} onReturnToWelcome={() => router.replace('/')} />}
          {item === '/pets' && <PetListScreen onOpenAddPet={() => router.push('/add-pet')} onOpenPet={(pet) => router.push({ pathname: '/pet-profile', params: { petId: pet.id } })} />}
          {item === '/calendar' && <CalendarScreen onOpenAddPet={() => router.push('/add-pet')} />}
          {item === '/notifications' && <NotificationsScreen />}
          {item === '/settings' && <SettingsScreen />}
        </View>
      )}
    />
  );
});

function normalizeRoute(pathname: string): MainTabRoute {
  return pathname === '/pet-profile' ? '/pets' : MAIN_TAB_ROUTES.includes(pathname as MainTabRoute) ? pathname as MainTabRoute : '/dashboard';
}

const styles = StyleSheet.create({
  carousel: { flex: 1 },
  page: { flex: 1 },
});
