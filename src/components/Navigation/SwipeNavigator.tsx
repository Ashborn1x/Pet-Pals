import { usePathname, useRouter } from 'expo-router';
import { PanResponder, View } from 'react-native';

const SWIPE_ROUTES = ['/dashboard', '/pets', '/calendar', '/notifications', '/settings'] as const;

export function SwipeNavigator({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const currentRoute = pathname === '/pet-profile' ? '/pets' : pathname;
  const currentIndex = SWIPE_ROUTES.indexOf(currentRoute as (typeof SWIPE_ROUTES)[number]);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_, gestureState) => {
      if (currentIndex < 0) return false;
      return Math.abs(gestureState.dx) > 18 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.2;
    },
    onPanResponderRelease: (_, gestureState) => {
      if (Math.abs(gestureState.dx) < 60 || Math.abs(gestureState.dx) < Math.abs(gestureState.dy) * 1.2) return;

      const nextIndex = gestureState.dx < 0 ? currentIndex + 1 : currentIndex - 1;
      const nextRoute = SWIPE_ROUTES[nextIndex];
      if (nextRoute) router.replace(nextRoute);
    },
  });

  return <View {...panResponder.panHandlers} style={{ flex: 1 }}>{children}</View>;
}
