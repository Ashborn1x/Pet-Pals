import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft, Bell, Check, Clock3, Footprints, ImagePlus, Pencil, Plus, Syringe, Trash2, Utensils } from 'lucide-react-native';
import { Defs, LinearGradient as SvgLinearGradient, Rect, Stop, Svg } from 'react-native-svg';
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
          <Image source={getProfileImage(pet)} resizeMode="cover" style={styles.heroImage} />
          <Svg pointerEvents="none" style={styles.heroFade} viewBox="0 0 100 100" preserveAspectRatio="none">
            <Defs>
              <SvgLinearGradient id="petProfileHeroFade" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
                <Stop offset="0.72" stopColor="#FFFFFF" stopOpacity="0.72" />
                <Stop offset="1" stopColor="#FFFFFF" stopOpacity="1" />
              </SvgLinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100" height="100" fill="url(#petProfileHeroFade)" />
          </Svg>
          <View style={styles.heroActions}>
            <Pressable accessibilityRole="button" accessibilityLabel="Back to pets" onPress={onBack} style={styles.heroButton}><ArrowLeft color="#FFFFFF" size={20} strokeWidth={2.2} /></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Edit pet" onPress={() => Alert.alert('Edit pet', 'Pet editing will be available soon.')} style={[styles.heroButton, styles.editButton]}><Pencil color="#1F2E23" size={16} strokeWidth={2.2} /></Pressable>
          </View>
          <View style={styles.heroInfo}>
            <View style={styles.heroNameBlock}>
              <Text style={styles.heroName}>{pet.name}</Text>
              <Text style={styles.heroBreed}>{pet.breed} · {pet.ageYears} yrs · {pet.weight} {pet.weightUnit}</Text>
            </View>
          </View>
        </View>

        <View style={styles.contentSection}>
          <View style={styles.segmentedControl}>
            {(['activity', 'diet', 'health', 'gallery'] as ProfileTab[]).map((tab) => <Pressable key={tab} accessibilityRole="tab" accessibilityState={{ selected: activeTab === tab }} onPress={() => setActiveTab(tab)} style={[styles.segment, activeTab === tab && styles.activeSegment]}><Text style={[styles.segmentText, activeTab === tab && styles.activeSegmentText]}>{tab[0].toUpperCase() + tab.slice(1)}</Text></Pressable>)}
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
  return <View style={styles.sectionHeader}><Text style={styles.sectionLabel}>{label}</Text><Pressable accessibilityRole="button" onPress={() => Alert.alert(action, `${action} will be available soon.`)} style={styles.sectionActionButton}><Plus color="#2E5B42" size={14} strokeWidth={2.5} /><Text style={styles.sectionAction}>{action}</Text></Pressable></View>;
}

function ActivityPanel({ logs, completedLogs, onToggleLog, pet }: { logs: CareLog[]; completedLogs: number; onToggleLog: (id: string) => void; pet: Pet }) {
  return <View style={styles.panelStack}><SectionHeader label="DAILY ACTIVITIES" action="Add Activity" /><View style={styles.logStack}>{logs.length ? logs.filter((log) => log.type !== 'meal').map((log) => <Pressable key={log.id} accessibilityRole="button" accessibilityState={{ checked: log.completed }} onPress={() => onToggleLog(log.id)} style={styles.logRow}><View style={[styles.logIcon, log.completed && styles.completedLogIcon]}>{log.completed ? <Check color="#2E5B42" size={14} strokeWidth={2.6} /> : <Footprints color="#2E5B42" size={15} />}</View><View style={styles.logCopy}><Text style={styles.logTitle}>{log.title}</Text><View style={styles.metaLine}><Clock3 size={10} color="#94A59A" /><Text style={styles.logMeta}>{log.time} · Everyday</Text></View></View><View style={styles.notifyPill}><Bell color="#3E7650" size={10} /><Text style={styles.notifyText}>Notify ON</Text></View><Trash2 color="#B9C0BA" size={14} /></Pressable>) : <Text style={styles.emptyLogs}>No activities logged yet.</Text>}</View><Text style={styles.progressHint}>{completedLogs} of {logs.length || 3} routines complete · {pet.name}</Text></View>;
}

function DietPanel({ logs }: { logs: CareLog[] }) {
  const meals = logs.filter((log) => log.type === 'meal');
  return <View style={styles.panelStack}><SectionHeader label="DIET & FEEDING" action="Add Meal" /><View style={styles.logStack}>{meals.length ? meals.map((log) => <View key={log.id} style={styles.logRow}><View style={[styles.logIcon, styles.mealIcon]}><Utensils color="#D98235" size={14} /></View><View style={styles.logCopy}><Text style={styles.logTitle}>{log.title}</Text><View style={styles.metaLine}><Clock3 size={10} color="#94A59A" /><Text style={styles.logMeta}>{log.time} · Everyday</Text></View></View><View style={styles.mealNotify}><Bell color="#B97625" size={10} /><Text style={styles.mealNotifyText}>Notify ON</Text></View><Trash2 color="#B9C0BA" size={14} /></View>) : <Text style={styles.emptyLogs}>No meals added yet.</Text>}</View></View>;
}

function HealthPanel() {
  return <View style={styles.panelStack}><SectionHeader label="HEALTH HISTORY TIMELINE" action="Add History" /><View style={styles.timeline}><View style={styles.timelineLine} /><View style={styles.healthRow}><View style={styles.healthIcon}><Syringe color="#2E5B42" size={13} /></View><View style={styles.logCopy}><Text style={styles.logTitle}>Anti-Rabies 3-Year Vaccine</Text><Text style={styles.logMeta}>May 15, 2026</Text></View><Trash2 color="#B9C0BA" size={14} /></View></View></View>;
}

function GalleryPanel() {
  return <View style={styles.panelStack}><SectionHeader label="0 PHOTOS" action="Add Photo" /><View style={styles.emptyGallery}><ImagePlus color="#D2B28A" size={28} /><Text style={styles.emptyGalleryTitle}>No photos yet</Text><Text style={styles.emptyGalleryText}>Add a photo to keep your pet&apos;s memories here.</Text></View></View>;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#FFFFFF', flex: 1 },
  scrollContent: { paddingBottom: 120 },
  hero: { backgroundColor: '#EAE5DA', height: 350, overflow: 'hidden', position: 'relative' },
  heroImage: { height: '100%', width: '100%' },
  heroFade: { bottom: 0, height: 150, left: 0, position: 'absolute', right: 0 },
  heroActions: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', left: 16, position: 'absolute', right: 16, top: 16 },
  heroButton: { alignItems: 'center', backgroundColor: '#1A261EE8', borderRadius: 20, elevation: 3, height: 40, justifyContent: 'center', shadowColor: '#000000', shadowOpacity: 0.15, shadowRadius: 6, width: 40 },
  editButton: { backgroundColor: '#FFFFFFE8' },
  heroInfo: { bottom: 17, left: 20, position: 'absolute', right: 20 },
  heroNameBlock: { flex: 1 },
  heroName: { color: '#111A13', fontSize: 28, fontWeight: '900', letterSpacing: -0.6, lineHeight: 32 },
  heroBreed: { color: '#4A5E50', fontSize: 13.5, fontWeight: '600', marginTop: 3 },
  contentSection: { alignSelf: 'center', backgroundColor: '#FFFFFF', maxWidth: 560, minHeight: 420, paddingBottom: 30, paddingHorizontal: 20, paddingTop: 8, width: '100%' },
  segmentedControl: { backgroundColor: '#F5F2EB', borderRadius: 20, flexDirection: 'row', marginTop: 0, padding: 4 },
  segment: { alignItems: 'center', borderRadius: 16, flex: 1, justifyContent: 'center', minHeight: 36, paddingHorizontal: 2, paddingVertical: 8 },
  activeSegment: { backgroundColor: '#EDA63A', elevation: 2, shadowColor: '#EDA63A', shadowOpacity: 0.18, shadowRadius: 5 },
  segmentText: { color: '#6D8072', fontSize: 12, fontWeight: '700' },
  activeSegmentText: { color: '#FFFFFF' },
  panelStack: { gap: 8, marginTop: 14 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 },
  sectionLabel: { color: '#718276', fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  sectionActionButton: { alignItems: 'center', flexDirection: 'row', gap: 3 },
  sectionAction: { color: '#2E5B42', fontSize: 12, fontWeight: '800' },
  logStack: { gap: 9 },
  healthRow: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#EDE8DE', borderRadius: 16, borderWidth: 1, flexDirection: 'row', minHeight: 60, paddingHorizontal: 12, paddingVertical: 9 },
  logRow: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#EDE8DE', borderRadius: 16, borderWidth: 1, flexDirection: 'row', minHeight: 64, paddingHorizontal: 12, paddingVertical: 10 },
  logIcon: { alignItems: 'center', backgroundColor: '#EAF4ED', borderRadius: 12, height: 36, justifyContent: 'center', width: 36 },
  completedLogIcon: { backgroundColor: '#E5F1E8' },
  mealIcon: { backgroundColor: '#FEF4E6' },
  healthIcon: { alignItems: 'center', backgroundColor: '#EAF4ED', borderColor: '#FFFFFF', borderRadius: 14, borderWidth: 2, height: 30, justifyContent: 'center', width: 30 },
  timeline: { paddingLeft: 0, position: 'relative' },
  timelineLine: { backgroundColor: '#E8E2D5', bottom: 12, left: 26, position: 'absolute', top: 12, width: 2 },
  logCopy: { flex: 1, marginLeft: 10, minWidth: 0 },
  logTitle: { color: '#1F2E23', fontSize: 13.5, fontWeight: '800' },
  metaLine: { alignItems: 'center', flexDirection: 'row', gap: 4, marginTop: 3 },
  logMeta: { color: '#718276', fontSize: 10.5 },
  notifyPill: { alignItems: 'center', backgroundColor: '#EAF4ED', borderColor: '#CFE5D5', borderRadius: 12, borderWidth: 1, flexDirection: 'row', overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 5 },
  notifyText: { color: '#2E5B42', fontSize: 8, fontWeight: '700', marginLeft: 4 },
  mealNotify: { alignItems: 'center', backgroundColor: '#FEF4E6', borderColor: '#F6E1C4', borderRadius: 12, borderWidth: 1, flexDirection: 'row', overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 5 },
  mealNotifyText: { color: '#B87019', fontSize: 8, fontWeight: '700', marginLeft: 4 },
  rowTrash: { color: '#B9C0BA', fontSize: 11, marginLeft: 7 },
  progressHint: { color: '#9AA69D', fontSize: 9, marginTop: 1 },
  emptyLogs: { backgroundColor: '#FAF7F0', borderColor: '#EDE7DC', borderRadius: 12, borderWidth: 1, color: '#718276', fontSize: 10, padding: 15, textAlign: 'center' },
  emptyGallery: { alignItems: 'center', backgroundColor: '#FAF7F0', borderColor: '#E8E0D3', borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', padding: 30 },
  emptyGalleryTitle: { color: '#425548', fontSize: 12, fontWeight: '800', marginTop: 8 },
  emptyGalleryText: { color: '#8A9B8F', fontSize: 9, marginTop: 4, textAlign: 'center' },
});
