import { Bell, CalendarDays, Home, PawPrint, Settings } from 'lucide-react-native';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedProps, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { Defs, LinearGradient, Path, Stop, Svg } from 'react-native-svg';

export type NavTabId = 'home' | 'pets' | 'calendar' | 'notifications' | 'settings';

type Props = {
  activeTab: NavTabId;
  onTabPressIn: (tab: NavTabId) => void;
  onTabChange: (tab: NavTabId) => void;
  progress: SharedValue<number>;
};

const NAV_TABS = [
  { id: 'home' as const, label: 'Home', icon: Home },
  { id: 'pets' as const, label: 'My Pets', icon: PawPrint },
  { id: 'calendar' as const, label: 'Calendar', icon: CalendarDays },
  { id: 'notifications' as const, label: 'Notification', icon: Bell },
  { id: 'settings' as const, label: 'Settings', icon: Settings },
];

const BAR_HEIGHT = 62;
const CORNER_RADIUS = 18;
const HORIZONTAL_INSET = 24;
const BUBBLE_RADIUS = 23;
const AnimatedPath = Animated.createAnimatedComponent(Path);

export function CurvedNavBar({ activeTab, onTabPressIn, onTabChange, progress }: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const barWidth = Math.min(Math.max(screenWidth - 16, 280), 360);
  const tabWidth = (barWidth - HORIZONTAL_INSET * 2) / NAV_TABS.length;
  const activeIndex = Math.max(0, NAV_TABS.findIndex((tab) => tab.id === activeTab));
  const animatedPathProps = useAnimatedProps(() => ({
    d: createBarPath(barWidth, HORIZONTAL_INSET + (progress.value + 0.5) * tabWidth),
  }), [barWidth, tabWidth]);
  const bubbleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: HORIZONTAL_INSET + (progress.value + 0.5) * tabWidth - BUBBLE_RADIUS }],
  }), [tabWidth]);

  return (
    <View style={styles.outer}>
      <View style={[styles.container, { width: barWidth }]}> 
        <Svg width={barWidth} height={BAR_HEIGHT} style={styles.background} pointerEvents="none">
          <Defs>
            <LinearGradient id="petPalsSageNav" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#558066" />
              <Stop offset="40%" stopColor="#456E55" />
              <Stop offset="100%" stopColor="#30543E" />
            </LinearGradient>
          </Defs>
          <AnimatedPath animatedProps={animatedPathProps} fill="url(#petPalsSageNav)" />
        </Svg>

        <Animated.View style={[styles.activeBubble, bubbleStyle]}>
          {NAV_TABS.map((tab, index) => <AnimatedNavIcon key={tab.id} icon={tab.icon} index={index} progress={progress} />)}
        </Animated.View>

        <View style={styles.tabRow}>
          {NAV_TABS.map((tab) => {
            const Icon = tab.icon;
            const selected = tab.id === activeTab;
            const tabIndex = NAV_TABS.findIndex((item) => item.id === tab.id);

            return (
              <Pressable
                key={tab.id}
                accessibilityRole="tab"
                accessibilityLabel={tab.label}
                accessibilityState={{ selected }}
                onPressIn={() => onTabPressIn(tab.id)}
                onPress={() => onTabChange(tab.id)}
                style={styles.tabButton}
              >
                <AnimatedTabIcon icon={Icon} index={tabIndex} progress={progress} />
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function AnimatedNavIcon({ icon: Icon, index, progress }: { icon: typeof Home; index: number; progress: SharedValue<number> }) {
  const iconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [index - 1, index, index + 1], [0, 1, 0], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(progress.value, [index - 1, index, index + 1], [0.82, 1, 0.82], Extrapolation.CLAMP) }],
  }), [index]);

  return (
    <Animated.View pointerEvents="none" style={[styles.iconLayer, iconStyle]}>
      <Icon color="#FFFFFF" size={20} strokeWidth={2.4} />
    </Animated.View>
  );
}

function AnimatedTabIcon({ icon: Icon, index, progress }: { icon: typeof Home; index: number; progress: SharedValue<number> }) {
  const iconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [index - 0.5, index, index + 0.5], [1, 0, 1], Extrapolation.CLAMP),
  }), [index]);

  return (
    <Animated.View style={iconStyle}>
      <Icon color="#FFFFFF" size={20} strokeWidth={2.2} />
    </Animated.View>
  );
}

function createBarPath(width: number, activeX: number) {
  'worklet';
  const cutoutRadius = 31;
  const shoulderRadius = 12;
  const notchHalf = cutoutRadius + shoulderRadius;
  const leftShoulderStart = activeX - notchHalf;
  const leftCradleEdge = activeX - cutoutRadius;
  const rightCradleEdge = activeX + cutoutRadius;
  const rightShoulderStart = activeX + notchHalf;

  return [
    `M ${CORNER_RADIUS} 0`,
    `L ${Math.max(CORNER_RADIUS, leftShoulderStart)} 0`,
    `A ${shoulderRadius} ${shoulderRadius} 0 0 1 ${leftCradleEdge} 12`,
    `A ${cutoutRadius} ${cutoutRadius} 0 0 0 ${rightCradleEdge} 12`,
    `A ${shoulderRadius} ${shoulderRadius} 0 0 1 ${Math.min(width - CORNER_RADIUS, rightShoulderStart)} 0`,
    `L ${width - CORNER_RADIUS} 0`,
    `Q ${width} 0 ${width} ${CORNER_RADIUS}`,
    `L ${width} ${BAR_HEIGHT - CORNER_RADIUS}`,
    `Q ${width} ${BAR_HEIGHT} ${width - CORNER_RADIUS} ${BAR_HEIGHT}`,
    `L ${CORNER_RADIUS} ${BAR_HEIGHT}`,
    `Q 0 ${BAR_HEIGHT} 0 ${BAR_HEIGHT - CORNER_RADIUS}`,
    `L 0 ${CORNER_RADIUS}`,
    `Q 0 0 ${CORNER_RADIUS} 0`,
    'Z',
  ].join(' ');
}

const styles = StyleSheet.create({
  outer: { alignItems: 'center', elevation: 1000, paddingBottom: 12, position: 'relative', width: '100%', zIndex: 1000 },
  container: { height: BAR_HEIGHT, position: 'relative' },
  background: { elevation: 8, shadowColor: '#2D4B37', shadowOffset: { height: 8, width: 0 }, shadowOpacity: 0.25, shadowRadius: 12 },
  activeBubble: { alignItems: 'center', backgroundColor: '#456E55', borderColor: 'rgba(255,255,255,0.55)', borderRadius: BUBBLE_RADIUS, borderWidth: 1, elevation: 6, height: BUBBLE_RADIUS * 2, justifyContent: 'center', position: 'absolute', shadowColor: '#2D4B37', shadowOffset: { height: 5, width: 0 }, shadowOpacity: 0.4, shadowRadius: 8, top: -11, width: BUBBLE_RADIUS * 2 },
  iconLayer: { alignItems: 'center', bottom: 0, justifyContent: 'center', left: 0, position: 'absolute', right: 0, top: 0 },
  tabRow: { alignItems: 'center', flexDirection: 'row', height: BAR_HEIGHT, paddingHorizontal: HORIZONTAL_INSET, position: 'absolute', width: '100%' },
  tabButton: { alignItems: 'center', flex: 1, height: BAR_HEIGHT, justifyContent: 'center' },
});
