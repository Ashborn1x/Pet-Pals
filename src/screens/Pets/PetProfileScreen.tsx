import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Activity, ArrowLeft, CalendarDays, Check, CheckCircle2, Circle, Droplets, Heart, Pencil, Phone, Plus, ShieldCheck, Utensils, Weight } from 'lucide-react-native';
import { Defs, LinearGradient, Path, Stop, Svg, Circle as SvgCircle } from 'react-native-svg';
import { CareLog, Pet } from '../../types/pet';
import { SkeletonScreen } from '../../components/Loading/Skeleton';
import { getCareLogs, getPet, updateCareLog } from '../../database/petpalsDatabase';
import { useSQLiteContext } from 'expo-sqlite';

type Props = { petId?: string; onBack: () => void };
type ProfileTab = 'health' | 'diet' | 'activity';

const avatarSources = {
  dog: require('../../assets/images/cartoon_dog_avatar_1789624318697.jpg'),
  cat: require('../../assets/images/cartoon_cat_avatar_1789624329620.jpg'),
  jordan: require('../../assets/images/jordan_avatar_photo_1789667660941.jpg'),
};

export function PetProfileScreen({ petId, onBack }: Props) {
  const db = useSQLiteContext();
  const [pet, setPet] = useState<Pet>();
  const [dataLoading, setDataLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProfileTab>('health');
  const [logs, setLogs] = useState<CareLog[]>([]);

  useEffect(() => {
    Promise.all([petId ? getPet(db, petId) : Promise.resolve(undefined), getCareLogs(db)])
      .then(([nextPet, nextLogs]) => { setPet(nextPet); setLogs(nextLogs); })
      .finally(() => setDataLoading(false));
  }, [db, petId]);

  const petLogs = pet ? logs.filter((log) => log.petId === pet.id) : [];
  const completedLogs = petLogs.filter((log) => log.completed).length;

  const toggleLog = async (id: string) => {
    const nextCompleted = !logs.find((log) => log.id === id)?.completed;
    await updateCareLog(db, id, nextCompleted);
    setLogs((current) => current.map((log) => log.id === id ? { ...log, completed: !log.completed } : log));
  };

  if (dataLoading || !pet) return <SkeletonScreen variant="pets" />;

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          <Image source={avatarSources[pet.avatar]} style={styles.heroImage} />
          <View style={styles.heroShade} />
          <Pressable accessibilityRole="button" accessibilityLabel="Back to pets" onPress={onBack} style={styles.heroButton}><ArrowLeft color="#1F2E23" size={20} strokeWidth={2.2} /></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Edit pet details" onPress={() => Alert.alert('Edit pet', 'Pet editing will be available soon.')} style={[styles.heroButton, styles.editButton]}><Pencil color="#1F2E23" size={17} strokeWidth={2.1} /></Pressable>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.identityRow}>
            <View style={styles.identityCopy}><Text style={styles.petName}>{pet.name}</Text><Text style={styles.petBreed}>{pet.breed.toUpperCase()}</Text></View>
            <WellnessGauge />
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metricCard}><Text style={styles.metricLabel}>WEIGHT</Text><Text style={styles.metricValue}>{pet.weight} <Text style={styles.metricUnit}>{pet.weightUnit}</Text></Text></View>
            <View style={styles.metricCard}><Text style={styles.metricLabel}>AGE</Text><Text style={styles.metricValue}>{pet.ageYears}y {pet.ageMonths}m</Text></View>
          </View>

          <View style={styles.segmentedControl}>
            {(['health', 'diet', 'activity'] as ProfileTab[]).map((tab) => <Pressable key={tab} onPress={() => setActiveTab(tab)} style={[styles.segment, activeTab === tab && styles.activeSegment]}><Text style={[styles.segmentText, activeTab === tab && styles.activeSegmentText]}>{tab}</Text></Pressable>)}
          </View>

          {activeTab === 'health' && <HealthPanel />}
          {activeTab === 'diet' && <DietPanel />}
          {activeTab === 'activity' && <ActivityPanel logs={petLogs} completedLogs={completedLogs} onToggleLog={toggleLog} pet={pet} />}
        </View>
      </ScrollView>
    </View>
  );
}

function WellnessGauge() {
  return (
    <View style={styles.gauge}>
      <Svg width={58} height={58} rotation={-90} viewBox="0 0 52 52">
        <SvgCircle cx={26} cy={26} r={22} fill="none" stroke="#EAE4D7" strokeWidth={4} />
        <SvgCircle cx={26} cy={26} r={22} fill="none" stroke="#4E8363" strokeWidth={4} strokeDasharray={[60, 138]} strokeLinecap="round" />
        <SvgCircle cx={26} cy={26} r={22} fill="none" stroke="#EDA63A" strokeWidth={4} strokeDasharray={[45, 138]} strokeDashoffset={-65} strokeLinecap="round" />
        <SvgCircle cx={26} cy={26} r={22} fill="none" stroke="#8FB6D3" strokeWidth={4} strokeDasharray={[25, 138]} strokeDashoffset={-115} strokeLinecap="round" />
      </Svg>
      <Heart color="#EDA63A" fill="#EDA63A" size={19} style={styles.gaugeHeart} />
    </View>
  );
}

function HealthPanel() {
  return <View style={styles.panelStack}>
    <View style={styles.panel}>
      <View style={styles.panelHeader}><View style={styles.panelTitleRow}><ShieldCheck color="#4E7A5E" size={17} /><Text style={styles.panelTitle}>Vitality & Wellness Status</Text></View><Text style={styles.optimalPill}>98% Optimal</Text></View>
      <Text style={styles.panelBody}>Vaccinations up to date. Coat, energy, and appetite metrics are within peak healthy parameters.</Text>
    </View>
    <View style={styles.panel}>
      <View style={styles.panelHeader}><Text style={styles.panelTitle}>Primary Veterinarian</Text><Text style={styles.checkedText}>Checked 2 mos ago</Text></View>
      <View style={styles.vetRow}><View><Text style={styles.vetName}>Dr. Katherine Wells</Text><Text style={styles.panelBody}>Sage Hill Veterinary Care · (555) 382-9012</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Call veterinarian" onPress={() => Alert.alert('Veterinarian', '(555) 382-9012')} style={styles.callButton}><Phone color="#3E654C" size={16} /></Pressable></View>
    </View>
    <View style={styles.panel}><Text style={styles.panelTitle}>Routine Supplements & Care</Text><CareLine label="Daily Omega-3 Chewable" value="Active" /><CareLine label="Rabies & DHPP Vaccines" value="Valid thru 2027" /><CareLine label="Flea & Tick Prevention" value="Monthly" last /></View>
  </View>;
}

function CareLine({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return <View style={[styles.careLine, !last && styles.careLineBorder]}><Text style={styles.careLabel}>{label}</Text><Text style={styles.careValue}>{value}</Text></View>;
}

function DietPanel() {
  return <View style={styles.panelStack}><View style={styles.panel}><View style={styles.panelTitleRow}><Utensils color="#EDA63A" size={17} /><Text style={styles.panelTitle}>Daily Feeding Schedule</Text></View><View style={styles.feedCard}><View><Text style={styles.feedTitle}>Morning Breakfast · 07:30 AM</Text><Text style={styles.panelBody}>1 cup salmon & sweet potato kibble</Text></View><Text style={styles.fedPill}>Fed</Text></View><View style={styles.feedCard}><View><Text style={styles.feedTitle}>Evening Dinner · 06:00 PM</Text><Text style={styles.panelBody}>1 cup kibble + warm bone broth</Text></View><Text style={styles.scheduledPill}>Scheduled</Text></View></View><View style={styles.panel}><Text style={styles.panelTitle}>Sensitivities & Notes</Text><Text style={styles.panelBody}>Sensitive stomach. Avoid chicken by-products. Plenty of fresh filtered water.</Text></View><View style={styles.panel}><View style={styles.vetRow}><View style={styles.panelTitleRow}><Droplets color="#4A90E2" size={17} /><View><Text style={styles.panelTitle}>Fresh Water Fountain</Text><Text style={styles.panelBody}>Refilled twice daily</Text></View></View><Pressable onPress={() => Alert.alert('Water refill', 'Fresh water refill logged.')} style={styles.refillButton}><Text style={styles.refillText}>+ Refill</Text></Pressable></View></View></View>;
}

function ActivityPanel({ logs, completedLogs, onToggleLog, pet }: { logs: CareLog[]; completedLogs: number; onToggleLog: (id: string) => void; pet: Pet }) {
  return <View style={styles.panelStack}><View style={styles.panel}><View style={styles.panelHeader}><View><Text style={styles.panelTitle}>Today&apos;s Routine Check</Text><Text style={styles.panelBody}>{completedLogs} of {logs.length || 3} tasks completed</Text></View><Text style={styles.optimalPill}>{Math.round((completedLogs / (logs.length || 1)) * 100)}%</Text></View></View><View style={styles.logStack}>{logs.length ? logs.map((log) => <Pressable key={log.id} onPress={() => onToggleLog(log.id)} style={[styles.logRow, log.completed && styles.completedLog]}><View style={[styles.logCheck, log.completed && styles.logCheckDone]}>{log.completed ? <Check color="#FFFFFF" size={14} strokeWidth={3} /> : <Circle color="#BAC2BB" size={20} />}</View><View style={styles.logCopy}><Text style={[styles.logTitle, log.completed && styles.completedLogText]}>{log.title}</Text><Text style={styles.panelBody}>{log.detail}</Text></View><Text style={styles.logTime}>{log.time}</Text></Pressable>) : <Text style={styles.emptyLogs}>No care logs logged for today yet.</Text>}</View><Pressable onPress={() => Alert.alert('Routine', `Quick add routine for ${pet.name} will be available soon.`)} style={styles.quickAdd}><Plus color="#55675A" size={15} strokeWidth={2.5} /><Text style={styles.quickAddText}>Quick Add Routine for {pet.name}</Text></Pressable></View>;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#FFFFFF', flex: 1 },
  scrollContent: { paddingBottom: 140 },
  hero: { backgroundColor: '#EFECE6', height: 280, position: 'relative' },
  heroImage: { height: '100%', width: '100%' },
  heroShade: { backgroundColor: '#00000022', height: 90, left: 0, position: 'absolute', right: 0, top: 0 },
  heroButton: { alignItems: 'center', backgroundColor: '#FFFFFFEE', borderRadius: 20, elevation: 3, height: 40, justifyContent: 'center', left: 20, position: 'absolute', shadowColor: '#000000', shadowOpacity: 0.15, shadowRadius: 7, top: 20, width: 40 },
  editButton: { left: undefined, right: 20 },
  profileCard: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 36, borderTopRightRadius: 36, marginTop: -30, padding: 24, paddingBottom: 30, position: 'relative' },
  identityRow: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  identityCopy: { flex: 1, paddingTop: 2 },
  petName: { color: '#1B2B20', fontSize: 30, fontWeight: '800', letterSpacing: -0.8 },
  petBreed: { color: '#4E7A5E', fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginTop: 5 },
  gauge: { alignItems: 'center', height: 58, justifyContent: 'center', position: 'relative', width: 58 },
  gaugeHeart: { position: 'absolute' },
  metricRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  metricCard: { alignItems: 'center', backgroundColor: '#FAF7F0', borderColor: '#ECE6D8', borderRadius: 24, borderWidth: 1, flex: 1, paddingVertical: 15 },
  metricLabel: { color: '#8A9B8F', fontSize: 9, fontWeight: '800', letterSpacing: 1.4 },
  metricValue: { color: '#1B2B20', fontSize: 21, fontWeight: '800', marginTop: 4 },
  metricUnit: { color: '#718276', fontSize: 13, fontWeight: '600' },
  segmentedControl: { backgroundColor: '#FAF7F0', borderColor: '#ECE6D8', borderRadius: 24, borderWidth: 1, flexDirection: 'row', marginTop: 22, padding: 5 },
  segment: { alignItems: 'center', borderRadius: 19, flex: 1, paddingVertical: 10 },
  activeSegment: { backgroundColor: '#EDA63A', elevation: 2 },
  segmentText: { color: '#7A8C80', fontSize: 13, fontWeight: '700', textTransform: 'capitalize' },
  activeSegmentText: { color: '#FFFFFF' },
  panelStack: { gap: 13, marginTop: 20 },
  panel: { backgroundColor: '#FAF7F0', borderColor: '#ECE6D8', borderRadius: 22, borderWidth: 1, padding: 16 },
  panelHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  panelTitleRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  panelTitle: { color: '#1F2E23', fontSize: 13, fontWeight: '800' },
  panelBody: { color: '#718276', fontSize: 11.5, lineHeight: 17, marginTop: 7 },
  optimalPill: { backgroundColor: '#E8F0EA', borderRadius: 10, color: '#3E654C', fontSize: 10, fontWeight: '800', overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 4 },
  checkedText: { color: '#8A9B8F', fontSize: 10 },
  vetRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 13 },
  vetName: { color: '#1F2E23', fontSize: 13, fontWeight: '700' },
  callButton: { alignItems: 'center', backgroundColor: '#E8F0EA', borderRadius: 18, height: 36, justifyContent: 'center', width: 36 },
  careLine: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9 },
  careLineBorder: { borderBottomColor: '#ECE6D8', borderBottomWidth: 1 },
  careLabel: { color: '#526558', fontSize: 11.5 },
  careValue: { color: '#3E654C', fontSize: 11, fontWeight: '800' },
  feedCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#EDE7DB', borderRadius: 12, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 11, padding: 11 },
  feedTitle: { color: '#1F2E23', fontSize: 11.5, fontWeight: '700' },
  fedPill: { backgroundColor: '#E8F0EA', borderRadius: 6, color: '#3E654C', fontSize: 10, fontWeight: '800', overflow: 'hidden', paddingHorizontal: 7, paddingVertical: 4 },
  scheduledPill: { backgroundColor: '#FEF4E6', borderRadius: 6, color: '#B9781D', fontSize: 10, fontWeight: '800', overflow: 'hidden', paddingHorizontal: 7, paddingVertical: 4 },
  refillButton: { backgroundColor: '#EAF2FB', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 },
  refillText: { color: '#3672B5', fontSize: 11, fontWeight: '800' },
  logStack: { gap: 8 },
  logRow: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#ECE6D8', borderRadius: 16, borderWidth: 1, flexDirection: 'row', padding: 12 },
  completedLog: { backgroundColor: '#FAF7F0', opacity: 0.75 },
  logCheck: { alignItems: 'center', height: 24, justifyContent: 'center', marginRight: 10, width: 24 },
  logCheckDone: { backgroundColor: '#4E7A5E', borderRadius: 12 },
  logCopy: { flex: 1 },
  logTitle: { color: '#1F2E23', fontSize: 12, fontWeight: '700' },
  completedLogText: { color: '#718276', textDecorationLine: 'line-through' },
  logTime: { color: '#8A9B8F', fontSize: 10, fontWeight: '600', marginLeft: 8 },
  emptyLogs: { backgroundColor: '#FAF7F0', borderColor: '#EDE7DC', borderRadius: 16, borderWidth: 1, color: '#718276', fontSize: 11, padding: 16, textAlign: 'center' },
  quickAdd: { alignItems: 'center', borderColor: '#D5CDBD', borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, flexDirection: 'row', justifyContent: 'center', paddingVertical: 11 },
  quickAddText: { color: '#55675A', fontSize: 11, fontWeight: '800', marginLeft: 6 },
});
