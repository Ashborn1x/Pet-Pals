import { useState } from 'react';
import type { ReactNode } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Bell, ChevronRight, CircleHelp, LockKeyhole, Moon, ShieldCheck, UserRound } from 'lucide-react-native';

export function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Make PetPals feel right for you.</Text>

        <View style={styles.profileCard}>
          <View style={styles.profileIcon}><UserRound color="#557A63" size={23} /></View>
          <View style={styles.profileCopy}><Text style={styles.profileName}>Jordan</Text><Text style={styles.profileDetail}>Pet parent · 2 companions</Text></View>
          <ChevronRight color="#A0AEA4" size={18} />
        </View>

        <Text style={styles.sectionLabel}>PREFERENCES</Text>
        <View style={styles.card}>
          <SettingRow icon={<Bell color="#557A63" size={18} />} title="Care reminders" detail="Daily routine notifications" trailing={<Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} trackColor={{ false: '#D5DCD6', true: '#88AA91' }} thumbColor="#FFFFFF" />} />
          <View style={styles.divider} />
          <SettingRow icon={<Moon color="#A87948" size={18} />} title="Appearance" detail="Follow device theme" onPress={() => Alert.alert('Appearance', 'Appearance follows your device settings.')} />
        </View>

        <Text style={styles.sectionLabel}>PRIVACY & SUPPORT</Text>
        <View style={styles.card}>
          <SettingRow icon={<ShieldCheck color="#557A63" size={18} />} title="Privacy" detail="Your pet data stays on this device" onPress={() => Alert.alert('Privacy', 'Your PetPals data is stored locally.')} />
          <View style={styles.divider} />
          <SettingRow icon={<LockKeyhole color="#A87948" size={18} />} title="Security" detail="App access and protection" />
          <View style={styles.divider} />
          <SettingRow icon={<CircleHelp color="#557A63" size={18} />} title="Help & feedback" detail="Get support with PetPals" />
        </View>

        <Text style={styles.version}>PetPals · Version 1.0.0</Text>
      </ScrollView>
    </View>
  );
}

function SettingRow({ icon, title, detail, trailing, onPress }: { icon: ReactNode; title: string; detail: string; trailing?: ReactNode; onPress?: () => void }) {
  const content = <><View style={styles.rowIcon}>{icon}</View><View style={styles.rowCopy}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowDetail}>{detail}</Text></View>{trailing ?? (onPress ? <ChevronRight color="#A0AEA4" size={17} /> : null)}</>;
  return onPress ? <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={styles.row}>{content}</Pressable> : <View accessible accessibilityLabel={`${title}. ${detail}`} style={styles.row}>{content}</View>;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#EFECE3', flex: 1 },
  content: { padding: 20, paddingBottom: 110 },
  title: { color: '#1B2B20', fontSize: 28, fontWeight: '800', letterSpacing: -0.7 },
  subtitle: { color: '#718276', fontSize: 13, marginTop: 3 },
  profileCard: { alignItems: 'center', backgroundColor: '#FAF8F3', borderColor: '#E8E2D7', borderRadius: 20, borderWidth: 1, flexDirection: 'row', marginTop: 22, padding: 14 },
  profileIcon: { alignItems: 'center', backgroundColor: '#DCE9E0', borderRadius: 22, height: 44, justifyContent: 'center', width: 44 },
  profileCopy: { flex: 1, marginLeft: 11 },
  profileName: { color: '#1F2E23', fontSize: 14, fontWeight: '800' },
  profileDetail: { color: '#718276', fontSize: 11, marginTop: 3 },
  sectionLabel: { color: '#819286', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 8, marginTop: 26 },
  card: { backgroundColor: '#FAF8F3', borderColor: '#E8E2D7', borderRadius: 20, borderWidth: 1, paddingHorizontal: 14 },
  row: { alignItems: 'center', flexDirection: 'row', minHeight: 68 },
  rowIcon: { alignItems: 'center', backgroundColor: '#E8F0EA', borderRadius: 17, height: 34, justifyContent: 'center', width: 34 },
  rowCopy: { flex: 1, marginLeft: 11 },
  rowTitle: { color: '#25382B', fontSize: 13, fontWeight: '700' },
  rowDetail: { color: '#718276', fontSize: 11, marginTop: 3 },
  divider: { backgroundColor: '#E8E2D7', height: 1 },
  version: { color: '#A0AEA4', fontSize: 10, marginTop: 32, textAlign: 'center' },
});
