import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Bell, CheckCheck, CircleAlert, Droplets, Flame } from 'lucide-react-native';

type NotificationItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
  type: 'alert' | 'water' | 'streak';
};

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: 'vaccination', title: 'Vaccination Due Soon', detail: "Oliver's annual rabies booster is scheduled in 2 weeks.", time: '2h ago', type: 'alert' },
  { id: 'hydration', title: 'Hydration Check', detail: "Time to refresh Luna's water fountain bowl.", time: '4h ago', type: 'water' },
  { id: 'streak', title: 'Daily Streak Achieved 🔥', detail: 'You have logged all routines for 5 consecutive days.', time: '1d ago', type: 'streak' },
];

export function NotificationsScreen() {
  const [readIds, setReadIds] = useState<string[]>([]);
  const allRead = readIds.length === INITIAL_NOTIFICATIONS.length;

  const markAllRead = () => setReadIds(INITIAL_NOTIFICATIONS.map((item) => item.id));
  const markRead = (id: string) => setReadIds((current) => current.includes(id) ? current : [...current, id]);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View><Text style={styles.title}>Notifications</Text><Text style={styles.subtitle}>Care reminders & health alerts</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Mark all notifications as read" onPress={markAllRead} disabled={allRead} style={styles.markReadButton}><CheckCheck color={allRead ? '#A8B3AB' : '#557A63'} size={12} /><Text style={[styles.markReadText, allRead && styles.markReadDisabled]}>Mark all read</Text></Pressable>
        </View>

        <View style={styles.list}>
          {INITIAL_NOTIFICATIONS.map((item) => {
            const read = readIds.includes(item.id);
            return <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`${item.title}. ${item.detail}`} accessibilityState={{ selected: read }} onPress={() => markRead(item.id)} style={[styles.card, read && styles.readCard]}>
              <View style={[styles.iconCircle, item.type === 'alert' ? styles.alertIcon : item.type === 'water' ? styles.waterIcon : styles.streakIcon]}>{item.type === 'alert' ? <CircleAlert color="#E36B5C" size={16} /> : item.type === 'water' ? <Droplets color="#6B9889" size={16} /> : <Flame color="#B17B40" size={16} />}</View>
              <View style={styles.copy}><View style={styles.titleRow}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.time}>{item.time}</Text></View><Text style={styles.detail}>{item.detail}</Text></View>
              {!read && <View style={styles.unreadDot} />}
            </Pressable>;
          })}
        </View>

        <View style={styles.footerHint}><Bell color="#A2AEA5" size={18} /><Text style={styles.footerText}>You&apos;re all caught up for now.</Text></View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#EFECE3', flex: 1 },
  content: { flexGrow: 1, padding: 18, paddingBottom: 110 },
  header: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between' },
  title: { color: '#1B2B20', fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  subtitle: { color: '#718276', fontSize: 10, marginTop: 4 },
  markReadButton: { alignItems: 'center', flexDirection: 'row', gap: 3, marginBottom: 4 },
  markReadText: { color: '#557A63', fontSize: 9, fontWeight: '700' },
  markReadDisabled: { color: '#A8B3AB' },
  list: { gap: 8, marginTop: 18 },
  card: { alignItems: 'center', backgroundColor: '#FAF8F3', borderColor: '#C5CEC5', borderRadius: 16, borderWidth: 1, elevation: 2, flexDirection: 'row', minHeight: 58, paddingHorizontal: 10, paddingVertical: 9, shadowColor: '#526558', shadowOpacity: 0.08, shadowRadius: 6 },
  readCard: { borderColor: '#E8E2D7', opacity: 0.72 },
  iconCircle: { alignItems: 'center', borderRadius: 15, height: 30, justifyContent: 'center', marginRight: 9, width: 30 },
  alertIcon: { backgroundColor: '#FCE5DF' },
  waterIcon: { backgroundColor: '#E5F0EC' },
  streakIcon: { backgroundColor: '#F5EBDD' },
  copy: { flex: 1 },
  titleRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  cardTitle: { color: '#33483A', flex: 1, fontSize: 10.5, fontWeight: '800' },
  time: { color: '#9AA69D', fontSize: 8, marginLeft: 6 },
  detail: { color: '#718276', fontSize: 9, lineHeight: 13, marginTop: 3 },
  unreadDot: { backgroundColor: '#557A63', borderRadius: 3, height: 6, marginLeft: 6, width: 6 },
  footerHint: { alignItems: 'center', marginTop: 42 },
  footerText: { color: '#A2AEA5', fontSize: 10, marginTop: 7 },
});
