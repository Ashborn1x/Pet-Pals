import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft, Bell, Check, Circle, ClipboardList, Clock3, ImagePlus, Pencil, Trash2, Utensils } from 'lucide-react-native';
import { CareLog, Pet } from '../../types/pet';
import { SkeletonScreen } from '../../components/Loading/Skeleton';
import { getCareLogs, getPet, updateCareLog } from '../../database/petpalsDatabase';
import { useSQLiteContext } from 'expo-sqlite';
import { getPetAvatarSource } from '../../constants/petAvatars';

type Props = { petId?: string; onBack: () => void };
type ProfileTab = 'activity' | 'diet' | 'health' | 'gallery';

export function PetProfileScreen({ petId, onBack }: Props) {
  const db = useSQLiteContext();
  const [pet, setPet] = useState<Pet>();
  const [dataLoading, setDataLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProfileTab>('activity');
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
          <Image source={getProfileImage(pet)} style={styles.heroImage} />
          <Pressable accessibilityRole="button" accessibilityLabel="Back to pets" onPress={onBack} style={styles.heroButton}><ArrowLeft color="#1F2E23" size={20} strokeWidth={2.2} /></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Edit pet" onPress={() => Alert.alert('Edit pet', 'Pet editing will be available soon.')} style={[styles.heroButton, styles.editButton]}><Pencil color="#1F2E23" size={16} strokeWidth={2.2} /></Pressable>
        </View>

        <View style={styles.profileCard}>
          <Text style={styles.petName}>{pet.name}</Text>
          <Text style={styles.petSummary}>{pet.breed} · {pet.ageYears} yrs · {pet.weight} {pet.weightUnit}</Text>

          <View style={styles.segmentedControl}>
            {(['activity', 'diet', 'health', 'gallery'] as ProfileTab[]).map((tab) => <Pressable key={tab} onPress={() => setActiveTab(tab)} style={[styles.segment, activeTab === tab && styles.activeSegment]}><Text style={[styles.segmentText, activeTab === tab && styles.activeSegmentText]}>{tab[0].toUpperCase() + tab.slice(1)}</Text></Pressable>)}
          </View>

          {activeTab === 'activity' && <ActivityPanel logs={petLogs} completedLogs={completedLogs} onToggleLog={toggleLog} pet={pet} />}
          {activeTab === 'diet' && <DietPanel logs={petLogs} />}
          {activeTab === 'health' && <HealthPanel />}
          {activeTab === 'gallery' && <GalleryPanel />}
        </View>
      </ScrollView>
    </View>
  );
}

function getProfileImage(pet: Pet) {
  if (pet.photoUri) return { uri: pet.photoUri };
  if (pet.species === 'dog') return require('../../assets/images/cartoon_dog_avatar_1789624318697.jpg');
  if (pet.species === 'cat') return require('../../assets/images/cartoon_cat_avatar_1789624329620.jpg');
  return getPetAvatarSource(pet.species, pet.photoUri);
}

function SectionHeader({ label, action }: { label: string; action: string }) {
  return <View style={styles.sectionHeader}><Text style={styles.sectionLabel}>{label}</Text><Pressable accessibilityRole="button" onPress={() => Alert.alert(action, `${action} will be available soon.`)}><Text style={styles.sectionAction}>+ {action}</Text></Pressable></View>;
}

function ActivityPanel({ logs, completedLogs, onToggleLog, pet }: { logs: CareLog[]; completedLogs: number; onToggleLog: (id: string) => void; pet: Pet }) {
  return <View style={styles.panelStack}><SectionHeader label="DAILY ACTIVITIES" action="Add Activity" /><View style={styles.logStack}>{logs.length ? logs.filter((log) => log.type !== 'meal').map((log) => <Pressable key={log.id} onPress={() => onToggleLog(log.id)} style={styles.logRow}><View style={styles.logIcon}><Circle color="#4B8060" size={12} /></View><View style={styles.logCopy}><Text style={styles.logTitle}>{log.title}</Text><Text style={styles.logMeta}><Clock3 size={9} color="#8A9B8F" /> {log.time} · Everyday</Text></View><View style={styles.notifyPill}><Bell color="#3E7650" size={9} /><Text style={styles.notifyText}>Notify ON</Text></View><Trash2 color="#B9C0BA" size={11} /></Pressable>) : <Text style={styles.emptyLogs}>No activities logged yet.</Text>}</View><Text style={styles.progressHint}>{completedLogs} of {logs.length || 3} routines complete · {pet.name}</Text></View>;
}

function DietPanel({ logs }: { logs: CareLog[] }) {
  const meals = logs.filter((log) => log.type === 'meal');
  return <View style={styles.panelStack}><SectionHeader label="DIET & FEEDING" action="Add Meal" /><View style={styles.logStack}>{meals.length ? meals.map((log) => <View key={log.id} style={styles.logRow}><View style={[styles.logIcon, styles.mealIcon]}><Utensils color="#D98235" size={13} /></View><View style={styles.logCopy}><Text style={styles.logTitle}>{log.title}</Text><Text style={styles.logMeta}><Clock3 size={9} color="#8A9B8F" /> {log.time} · Everyday</Text></View><View style={styles.mealNotify}><Bell color="#B97625" size={9} /><Text style={styles.mealNotifyText}>Notify ON</Text></View><Trash2 color="#B9C0BA" size={11} /></View>) : <Text style={styles.emptyLogs}>No meals added yet.</Text>}</View></View>;
}

function HealthPanel() {
  return <View style={styles.panelStack}><SectionHeader label="HEALTH HISTORY TIMELINE" action="Add History" /><View style={styles.healthRow}><View style={styles.healthIcon}><ClipboardList color="#4B8060" size={13} /></View><View style={styles.logCopy}><Text style={styles.logTitle}>Anti-Rabies 3-Year Vaccine</Text><Text style={styles.logMeta}>May 15, 2026</Text></View><Trash2 color="#B9C0BA" size={11} /></View></View>;
}

function GalleryPanel() {
  return <View style={styles.panelStack}><SectionHeader label="0 PHOTOS" action="Add Photo" /><View style={styles.emptyGallery}><ImagePlus color="#D2B28A" size={28} /><Text style={styles.emptyGalleryTitle}>No photos yet</Text><Text style={styles.emptyGalleryText}>Add a photo to keep your pet&apos;s memories here.</Text></View></View>;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#FFFFFF', flex: 1 },
  scrollContent: { paddingBottom: 120 },
  hero: { backgroundColor: '#E9D8BE', height: 255, position: 'relative' },
  heroImage: { height: '100%', width: '100%' },
  heroButton: { alignItems: 'center', backgroundColor: '#FFFFFFE8', borderRadius: 18, elevation: 3, height: 32, justifyContent: 'center', left: 10, position: 'absolute', shadowColor: '#000000', shadowOpacity: 0.15, shadowRadius: 6, top: 12, width: 32 },
  editButton: { left: undefined, right: 10 },
  profileCard: { alignSelf: 'center', backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -24, maxWidth: 560, minHeight: 420, padding: 18, paddingBottom: 30, position: 'relative', width: '100%' },
  petName: { color: '#18271D', fontSize: 23, fontWeight: '800', letterSpacing: -0.4 },
  petSummary: { color: '#718276', fontSize: 11, marginTop: 3 },
  segmentedControl: { backgroundColor: '#F4F1EA', borderRadius: 18, flexDirection: 'row', marginTop: 14, padding: 2 },
  segment: { alignItems: 'center', borderRadius: 16, flex: 1, paddingVertical: 8 },
  activeSegment: { backgroundColor: '#EDA63A', elevation: 2 },
  segmentText: { color: '#6D7B70', fontSize: 11, fontWeight: '700' },
  activeSegmentText: { color: '#FFFFFF' },
  panelStack: { gap: 8, marginTop: 14 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 },
  sectionLabel: { color: '#718276', fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  sectionAction: { color: '#315F42', fontSize: 11, fontWeight: '800' },
  logStack: { gap: 7 },
  healthRow: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#E6DED2', borderRadius: 11, borderWidth: 1, flexDirection: 'row', minHeight: 54, paddingHorizontal: 9, paddingVertical: 7 },
  logRow: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#E6DED2', borderRadius: 11, borderWidth: 1, flexDirection: 'row', minHeight: 54, paddingHorizontal: 9, paddingVertical: 7 },
  logIcon: { alignItems: 'center', backgroundColor: '#E5F1E8', borderRadius: 11, height: 25, justifyContent: 'center', width: 25 },
  mealIcon: { backgroundColor: '#FFF0DF' },
  healthIcon: { alignItems: 'center', backgroundColor: '#E5F1E8', borderRadius: 11, height: 25, justifyContent: 'center', width: 25 },
  logCopy: { flex: 1, marginLeft: 8 },
  logTitle: { color: '#1F2E23', fontSize: 12, fontWeight: '800' },
  logMeta: { color: '#718276', fontSize: 10, marginTop: 3 },
  notifyPill: { alignItems: 'center', backgroundColor: '#E9F3EB', borderColor: '#C3DEC8', borderRadius: 10, borderWidth: 1, flexDirection: 'row', overflow: 'hidden', paddingHorizontal: 7, paddingVertical: 4 },
  notifyText: { color: '#3E7650', fontSize: 7, fontWeight: '700', marginLeft: 3 },
  mealNotify: { alignItems: 'center', backgroundColor: '#FFF3E2', borderColor: '#F0D0A4', borderRadius: 10, borderWidth: 1, flexDirection: 'row', overflow: 'hidden', paddingHorizontal: 7, paddingVertical: 4 },
  mealNotifyText: { color: '#B97625', fontSize: 7, fontWeight: '700', marginLeft: 3 },
  rowTrash: { color: '#B9C0BA', fontSize: 11, marginLeft: 7 },
  progressHint: { color: '#9AA69D', fontSize: 8, marginTop: 1 },
  emptyLogs: { backgroundColor: '#FAF7F0', borderColor: '#EDE7DC', borderRadius: 12, borderWidth: 1, color: '#718276', fontSize: 10, padding: 15, textAlign: 'center' },
  emptyGallery: { alignItems: 'center', backgroundColor: '#FAF7F0', borderColor: '#E8E0D3', borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', padding: 30 },
  emptyGalleryTitle: { color: '#425548', fontSize: 12, fontWeight: '800', marginTop: 8 },
  emptyGalleryText: { color: '#8A9B8F', fontSize: 9, marginTop: 4, textAlign: 'center' },
});
