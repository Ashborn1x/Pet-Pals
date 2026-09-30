import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Bell, CalendarDays, Check, ChevronRight, CircleAlert, Droplets, Flame, Heart, PawPrint, ShieldPlus } from 'lucide-react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Defs, Ellipse, RadialGradient, Stop, Svg } from 'react-native-svg';
import { getPets } from '../../database/petpalsDatabase';
import { getPetAvatarSource } from '../../constants/petAvatars';
import type { Pet } from '../../types/pet';

type NotificationType = 'alert' | 'water' | 'streak';
type NotificationItem = { id: string; title: string; detail: string; time: string; type: NotificationType; petName?: string };

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: 'streak', title: 'Daily Streak Achieved 🔥', detail: 'You have logged all routines for 5 consecutive days.', time: '1d ago', type: 'streak' },
];

export function NotificationsScreen() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const [readIds, setReadIds] = useState<string[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const allRead = readIds.length === INITIAL_NOTIFICATIONS.length;

  useEffect(() => { getPets(db).then(setPets); }, [db]);
  const markAllRead = () => setReadIds(INITIAL_NOTIFICATIONS.map((item) => item.id));
  const markRead = (id: string) => setReadIds((current) => current.includes(id) ? current : [...current, id]);

  return <View style={styles.screen}><NotificationBackdrop /><ScrollView style={styles.notificationLayer} contentContainerStyle={[styles.content, { paddingTop: 20 + Math.min(insets.top, 18) }]} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><View><View style={styles.titleRow}><PawPrint color="#546453" fill="#546453" size={28} /><Text style={styles.title}>Notifications</Text><View style={styles.titleAccent}><View style={styles.sparkle} /></View></View><Text style={styles.subtitle}>Care reminders &amp; health alerts</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Mark all notifications as read" onPress={markAllRead} disabled={allRead} style={[styles.markReadButton, allRead && styles.markReadDisabled]}><Check color={allRead ? '#A8B3AB' : '#283C2E'} size={14} strokeWidth={3} /><Text style={[styles.markReadText, allRead && styles.markReadTextDisabled]}>Mark all read</Text></Pressable></View>
    <View style={styles.list}>{INITIAL_NOTIFICATIONS.map((item) => { const read = readIds.includes(item.id); const pet = pets.find((candidate) => candidate.name.toLowerCase() === item.petName?.toLowerCase()); return <NotificationCard key={item.id} item={item} pet={pet} read={read} onPress={() => markRead(item.id)} />; })}</View>
    <View style={styles.footer}><View pointerEvents="none" style={styles.footerDoodles}><PawPrint color="#465E4B" fill="#465E4B" size={40} style={styles.footerPaw} /><Heart color="#465E4B" size={40} strokeWidth={1.8} style={styles.footerHeartOutline} /></View><View style={styles.footerContent}><View style={styles.footerBell}><View style={[styles.bellSpark, styles.bellSparkLeft]} /><View style={[styles.bellSpark, styles.bellSparkRight]} /><View style={[styles.bellSpark, styles.bellSparkTopLeft]} /><View style={[styles.bellSpark, styles.bellSparkTopRight]} /><View style={styles.footerIcon}><Bell color="#4B5E50" size={26} strokeWidth={2.2} /><Heart color="#4B5E50" fill="#4B5E50" size={7} style={styles.footerHeart} /></View></View><Text style={styles.footerTitle}>You&apos;re all caught up for now.</Text><View style={styles.divider}><View style={styles.dividerLine} /><Heart color="#55695A" size={12} strokeWidth={1.6} /><View style={styles.dividerLine} /></View></View></View>
  </ScrollView></View>;
}

function NotificationCard({ item, pet, read, onPress }: { item: NotificationItem; pet?: Pet; read: boolean; onPress: () => void }) {
  const isAlert = item.type === 'alert';
  const isWater = item.type === 'water';
  const isStreak = item.type === 'streak';
  return <Pressable accessibilityRole="button" accessibilityLabel={`${item.title}. ${item.detail}`} accessibilityState={{ selected: read }} onPress={onPress} style={[styles.card, read && styles.readCard]}>
    <View style={[styles.avatarWrap, isAlert ? styles.alertAvatar : isWater ? styles.waterAvatar : styles.streakAvatar]}>{isStreak && <View style={styles.streakRays}><View style={[styles.streakRay, styles.rayTop]} /><View style={[styles.streakRay, styles.rayLeft]} /><View style={[styles.streakRay, styles.rayBottom]} /><View style={[styles.streakRay, styles.rayRight]} /></View>}{pet ? <Image source={getPetAvatarSource(pet.species, pet.photoUri)} style={styles.avatar} /> : <View style={styles.streakAvatarInner}><PawPrint color="#FFFFFF" fill="#FFFFFF" size={24} /></View>}<View style={[styles.badge, isAlert ? styles.alertBadge : isWater ? styles.waterBadge : styles.streakBadge]}>{isAlert ? <ShieldPlus color="#FFFFFF" size={14} /> : isWater ? <Droplets color="#FFFFFF" size={14} /> : <Flame color="#FFFFFF" size={14} />}</View></View>
    <View style={styles.copy}><View style={styles.cardTitleRow}><View style={[styles.categoryIcon, isAlert ? styles.alertIcon : isWater ? styles.waterIcon : styles.streakIcon]}>{isAlert ? <CalendarDays color="#D97757" size={12} /> : isWater ? <Droplets color="#55785D" size={12} /> : <Flame color="#E08A27" size={12} />}</View><Text numberOfLines={1} style={styles.cardTitle}>{item.title}</Text></View><Text style={styles.detail}>{item.detail}</Text></View>
    <View style={styles.cardRight}><View style={styles.timeRow}><Text style={styles.time}>{item.time}</Text>{!read && <View style={styles.unreadDot} />}</View><ChevronRight color="#A8B4AA" size={17} /></View>
  </Pressable>;
}

function NotificationBackdrop() {
  return <Svg pointerEvents="none" style={styles.backgroundSvg} viewBox="0 0 390 844" preserveAspectRatio="none">
    <Defs>
      <RadialGradient id="notificationTopLeft" cx="50%" cy="50%" rx="50%" ry="50%"><Stop offset="0" stopColor="#DBE2D4" stopOpacity="0.7" /><Stop offset="0.7" stopColor="#DBE2D4" stopOpacity="0" /></RadialGradient>
      <RadialGradient id="notificationTopRight" cx="50%" cy="50%" rx="50%" ry="50%"><Stop offset="0" stopColor="#EBE6D4" stopOpacity="0.8" /><Stop offset="0.7" stopColor="#EBE6D4" stopOpacity="0" /></RadialGradient>
    </Defs>
    <Ellipse cx="60" cy="40" rx="110" ry="100" fill="url(#notificationTopLeft)" />
    <Ellipse cx="335" cy="60" rx="95" ry="90" fill="url(#notificationTopRight)" />
  </Svg>;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#F9F5EE', flex: 1 }, notificationLayer: { zIndex: 1 }, content: { alignSelf: 'center', maxWidth: 560, padding: 20, paddingBottom: 125, width: '100%' }, backgroundSvg: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0, zIndex: 0 },
  header: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 22, paddingTop: 3 }, titleRow: { alignItems: 'center', flexDirection: 'row', gap: 8 }, title: { color: '#1E2D24', fontSize: 27, fontWeight: '900', letterSpacing: -0.7 }, titleAccent: { alignItems: 'center', height: 27, justifyContent: 'center', position: 'relative', width: 18 }, sparkle: { backgroundColor: '#2E4234', borderRadius: 2, height: 3, position: 'absolute', right: -1, top: 1, transform: [{ rotate: '45deg' }], width: 7 }, subtitle: { color: '#5C6E61', fontSize: 13, fontWeight: '600', marginLeft: 1, marginTop: 5 }, markReadButton: { alignItems: 'center', backgroundColor: '#E8EDE2', borderColor: '#D5DFCF', borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 5, marginTop: 4, paddingHorizontal: 12, paddingVertical: 9 }, markReadDisabled: { backgroundColor: '#EFF1EC', borderColor: '#E4E8E2' }, markReadText: { color: '#283C2E', fontSize: 10, fontWeight: '800' }, markReadTextDisabled: { color: '#A8B3AB' },
  list: { gap: 13 }, card: { alignItems: 'center', backgroundColor: '#FEFCF7', borderColor: '#ECE5D8', borderRadius: 22, borderWidth: 1, elevation: 2, flexDirection: 'row', minHeight: 78, padding: 10, shadowColor: '#6B685D', shadowOpacity: 0.08, shadowRadius: 7 }, readCard: { opacity: 0.62 }, avatarWrap: { borderRadius: 28, height: 54, marginRight: 11, padding: 3, position: 'relative', width: 54 }, alertAvatar: { backgroundColor: '#FCECE5', borderColor: '#F3DDD2', borderWidth: 1 }, waterAvatar: { backgroundColor: '#E5EDE3', borderColor: '#D5E2D2', borderWidth: 1 }, streakAvatar: { alignItems: 'center', backgroundColor: '#FCEECF', borderColor: '#F6E3B8', borderWidth: 1, justifyContent: 'center' }, avatar: { borderRadius: 28, height: '100%', width: '100%' }, streakAvatarInner: { alignItems: 'center', backgroundColor: '#F8BA44', borderRadius: 22, height: 44, justifyContent: 'center', width: 44 }, streakRays: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }, streakRay: { backgroundColor: '#E69F38', borderRadius: 2, height: 2, position: 'absolute', width: 7 }, rayTop: { left: 12, top: -3, transform: [{ rotate: '45deg' }] }, rayLeft: { left: -4, top: 25 }, rayBottom: { bottom: -3, left: 14, transform: [{ rotate: '-45deg' }] }, rayRight: { right: -4, top: 19, transform: [{ rotate: '12deg' }] }, badge: { alignItems: 'center', borderColor: '#FEFCF7', borderRadius: 12, borderWidth: 2, bottom: -2, height: 24, justifyContent: 'center', position: 'absolute', right: -2, width: 24 }, alertBadge: { backgroundColor: '#D97757' }, waterBadge: { backgroundColor: '#5A7B62' }, streakBadge: { backgroundColor: '#E69F38' }, copy: { flex: 1, minWidth: 0 }, cardTitleRow: { alignItems: 'center', flexDirection: 'row', gap: 5 }, categoryIcon: { alignItems: 'center', borderRadius: 10, height: 20, justifyContent: 'center', width: 20 }, alertIcon: { backgroundColor: '#FDEEE7' }, waterIcon: { backgroundColor: '#EAF1E8' }, streakIcon: { backgroundColor: '#FEF4DE' }, cardTitle: { color: '#1F2C23', flex: 1, fontSize: 13, fontWeight: '900' }, detail: { color: '#5E6D62', fontSize: 11, fontWeight: '500', lineHeight: 15, marginTop: 4 }, cardRight: { alignItems: 'flex-end', alignSelf: 'stretch', justifyContent: 'space-between', marginLeft: 5, paddingVertical: 1 }, timeRow: { alignItems: 'center', flexDirection: 'row', gap: 5 }, time: { color: '#8B988E', fontSize: 9, fontWeight: '700' }, unreadDot: { backgroundColor: '#48634F', borderRadius: 4, height: 7, width: 7 },
  footer: { alignItems: 'center', marginTop: 34, minHeight: 112, position: 'relative', width: '100%' }, footerDoodles: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0, zIndex: 0 }, footerPaw: { bottom: 2, left: 0, opacity: 0.28, position: 'absolute' }, footerHeartOutline: { bottom: 0, opacity: 0.4, position: 'absolute', right: 0, transform: [{ rotate: '-12deg' }] }, footerContent: { alignItems: 'center', position: 'relative', zIndex: 1 }, footerBell: { height: 38, marginBottom: 7, position: 'relative', width: 38 }, footerIcon: { alignItems: 'center', height: 38, justifyContent: 'center', position: 'relative', width: 38 }, footerHeart: { bottom: 7, position: 'absolute' }, bellSpark: { backgroundColor: '#55695A', borderRadius: 2, height: 1.5, position: 'absolute', width: 5 }, bellSparkLeft: { left: 0, top: 19 }, bellSparkRight: { right: 0, top: 19 }, bellSparkTopLeft: { left: 7, top: 4, transform: [{ rotate: '45deg' }] }, bellSparkTopRight: { right: 7, top: 4, transform: [{ rotate: '-45deg' }] }, footerTitle: { color: '#35483B', fontSize: 12, fontWeight: '900', marginTop: 3 }, divider: { alignItems: 'center', flexDirection: 'row', gap: 9, marginTop: 11, width: 130 }, dividerLine: { backgroundColor: '#D6DEC8', borderRadius: 2, flex: 1, height: 1 },
});
