import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

export type SkeletonVariant = 'dashboard' | 'pets' | 'calendar' | 'notifications' | 'settings';

export function useSkeletonLoading(duration = 550) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  return loading;
}

export function SkeletonScreen({ variant }: { variant: SkeletonVariant }) {
  return (
    <View style={styles.screen} accessibilityLabel="Loading">
      {variant === 'dashboard' && <DashboardSkeleton />}
      {variant === 'pets' && <PetsSkeleton />}
      {variant === 'calendar' && <CalendarSkeleton />}
      {variant === 'notifications' && <NotificationsSkeleton />}
      {variant === 'settings' && <SettingsSkeleton />}
    </View>
  );
}

function DashboardSkeleton() {
  return <SkeletonScroll>
    <View style={styles.header}><View><Block width={145} height={20} /><Block width={190} height={11} marginTop={8} /></View><Block width={42} height={42} radius={21} /></View>
    <View style={styles.rowGap}><Block flex height={116} radius={20} /><Block flex height={116} radius={20} /></View>
    <Block height={112} radius={20} marginTop={14} />
    <Block height={260} radius={20} marginTop={14} />
  </SkeletonScroll>;
}

function PetsSkeleton() {
  return <SkeletonScroll>
    <View style={styles.header}><View><Block width={110} height={26} /><Block width={190} height={11} marginTop={8} /></View><Block width={40} height={40} radius={20} /></View>
    <Block height={46} radius={16} marginTop={22} />
    {[0, 1, 2].map((item) => <View key={item} style={styles.petCard}><Block width={82} height={82} radius={21} /><View style={styles.petCopy}><Block width="70%" height={15} /><Block width="48%" height={10} marginTop={10} /><Block width="85%" height={10} marginTop={13} /></View></View>)}
  </SkeletonScroll>;
}

function CalendarSkeleton() {
  return <SkeletonScroll>
    <View style={styles.header}><View><Block width={140} height={22} /><Block width={215} height={10} marginTop={8} /></View><Block width={55} height={32} radius={15} /></View>
    <View style={styles.card}><Block width="52%" height={16} /><View style={styles.calendarGrid}>{Array.from({ length: 35 }, (_, index) => <Block key={index} width="13%" height={30} radius={9} />)}</View></View>
    <Block height={75} radius={18} marginTop={10} />
    <Block height={180} radius={18} marginTop={10} />
  </SkeletonScroll>;
}

function NotificationsSkeleton() {
  return <SkeletonScroll>
    <View style={styles.header}><View><Block width={145} height={22} /><Block width={170} height={10} marginTop={8} /></View><Block width={90} height={12} /></View>
    {[0, 1, 2].map((item) => <View key={item} style={styles.notificationCard}><Block width={30} height={30} radius={15} /><View style={styles.petCopy}><Block width="75%" height={12} /><Block width="95%" height={9} marginTop={9} /></View></View>)}
  </SkeletonScroll>;
}

function SettingsSkeleton() {
  return <SkeletonScroll>
    <Block width={105} height={27} /><Block width={190} height={11} marginTop={8} />
    <Block height={72} radius={20} marginTop={22} />
    <Block width={100} height={10} marginTop={27} />
    <Block height={136} radius={20} marginTop={8} />
    <Block width={135} height={10} marginTop={27} />
    <Block height={198} radius={20} marginTop={8} />
  </SkeletonScroll>;
}

function SkeletonScroll({ children }: { children: ReactNode }) {
  return <Animated.ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>{children}</Animated.ScrollView>;
}

function Block({ width, height, radius = 10, marginTop = 0, flex }: { width?: number | `${number}%`; height: number; radius?: number; marginTop?: number; flex?: boolean }) {
  const opacity = useRef(new Animated.Value(0.45)).current;
  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 0.85, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.45, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [opacity]);
  return <Animated.View style={[styles.block, { height, width: width ?? '100%', borderRadius: radius, marginTop, flex: flex ? 1 : undefined, opacity }]} />;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#EFECE3', flex: 1 },
  content: { padding: 18, paddingBottom: 110 },
  block: { backgroundColor: '#D8DED7' },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  rowGap: { flexDirection: 'row', gap: 10, marginTop: 18 },
  card: { backgroundColor: '#FAF8F3', borderRadius: 18, marginTop: 14, padding: 12 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', marginTop: 18 },
  petCard: { alignItems: 'center', backgroundColor: '#FAF8F3', borderRadius: 24, flexDirection: 'row', marginTop: 12, padding: 14 },
  petCopy: { flex: 1, marginLeft: 13 },
  notificationCard: { alignItems: 'center', backgroundColor: '#FAF8F3', borderRadius: 16, flexDirection: 'row', marginTop: 10, minHeight: 72, padding: 10 },
});
