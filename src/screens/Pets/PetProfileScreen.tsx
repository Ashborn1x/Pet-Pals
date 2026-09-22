import { useEffect, useRef, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ArrowLeft, Bell, Check, Clock3, Footprints, ImagePlus, Pencil, Plus, Syringe, Trash2, Utensils } from 'lucide-react-native';
import { Defs, LinearGradient as SvgLinearGradient, Rect, Stop, Svg } from 'react-native-svg';
import { CareLog, Pet, PetPhoto } from '../../types/pet';
import { SkeletonScreen } from '../../components/Loading/Skeleton';
import { addCareLog, addPetPhoto, deleteCareLog, deletePet, deletePetPhoto, getCareLogs, getPet, getPetPhotos, updateCareLog, updateCareLogDetails } from '../../database/petpalsDatabase';
import { useSQLiteContext } from 'expo-sqlite';
import { getPetAvatarSource } from '../../constants/petAvatars';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

type Props = { petId?: string; onBack: () => void; onEditPet: (pet: Pet) => void };
type ProfileTab = 'activity' | 'diet' | 'health' | 'gallery';

export function PetProfileScreen({ petId, onBack, onEditPet }: Props) {
  const db = useSQLiteContext();
  const [pet, setPet] = useState<Pet>();
  const [dataLoading, setDataLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProfileTab>('activity');
  const [logs, setLogs] = useState<CareLog[]>([]);
  const [photos, setPhotos] = useState<PetPhoto[]>([]);
  const [addType, setAddType] = useState<'activity' | 'meal' | 'health'>();
  const [editingLog, setEditingLog] = useState<CareLog>();
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDetail, setDraftDetail] = useState('');
  const [draftTime, setDraftTime] = useState('08:00 AM');
  const [draftDate, setDraftDate] = useState('Today');

  useEffect(() => {
    Promise.all([petId ? getPet(db, petId) : Promise.resolve(undefined), getCareLogs(db), petId ? getPetPhotos(db, petId) : Promise.resolve([])])
      .then(([nextPet, nextLogs, nextPhotos]) => { setPet(nextPet); setLogs(nextLogs); setPhotos(nextPhotos); })
      .finally(() => setDataLoading(false));
  }, [db, petId]);

  const petLogs = pet ? logs.filter((log) => log.petId === pet.id) : [];
  const completedLogs = petLogs.filter((log) => log.completed).length;

  const toggleLog = async (id: string) => {
    const nextCompleted = !logs.find((log) => log.id === id)?.completed;
    await updateCareLog(db, id, nextCompleted);
    setLogs((current) => current.map((log) => log.id === id ? { ...log, completed: !log.completed } : log));
  };

  const confirmDelete = () => {
    if (!pet) return;
    Alert.alert(`Remove ${pet.name}?`, 'This will permanently remove the pet and its care history from this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => { await deletePet(db, pet.id); onBack(); } },
    ]);
  };

  const openAdd = (type: 'activity' | 'meal' | 'health') => {
    setAddType(type);
    setEditingLog(undefined);
    setDraftTitle('');
    setDraftDetail('');
    setDraftTime(formatCurrentTime());
    setDraftDate('Today');
  };

  const openEdit = (log: CareLog) => {
    setAddType(log.type === 'meal' ? 'meal' : log.type === 'vet' || log.type === 'meds' ? 'health' : 'activity');
    setEditingLog(log);
    setDraftTitle(log.title);
    setDraftDetail(log.detail);
    setDraftTime(log.time);
    setDraftDate(log.date);
  };

  const saveEntry = async () => {
    if (!pet || !addType || !draftTitle.trim()) return;
    const time = draftTime.trim() || formatCurrentTime();
    if (editingLog) {
      const date = addType === 'health' ? (draftDate.trim() || 'Today') : editingLog.date;
      await updateCareLogDetails(db, editingLog.id, draftTitle.trim(), draftDetail.trim() || 'Added from pet profile', addType === 'health' ? '—' : time, date);
      setLogs((current) => current.map((log) => log.id === editingLog.id ? { ...log, title: draftTitle.trim(), detail: draftDetail.trim() || 'Added from pet profile', time: addType === 'health' ? '—' : time, date } : log));
      setAddType(undefined);
      setEditingLog(undefined);
      return;
    }
    const type = addType === 'activity' ? 'walk' : addType === 'meal' ? 'meal' : 'vet';
    const log = await addCareLog(db, {
      petId: pet.id, type, title: draftTitle.trim(), detail: draftDetail.trim() || 'Added from pet profile',
      time: addType === 'health' ? '—' : time, date: addType === 'health' ? (draftDate.trim() || 'Today') : 'Today', completed: false,
    });
    setLogs((current) => [log, ...current]);
    setAddType(undefined);
  };

  const removeEntry = () => {
    if (!editingLog) return;
    Alert.alert(`Delete ${editingLog.title}?`, 'This entry will be permanently removed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteCareLog(db, editingLog.id); setLogs((current) => current.filter((log) => log.id !== editingLog.id)); setAddType(undefined); setEditingLog(undefined); } },
    ]);
  };

  const addPhoto = async () => {
    if (!pet) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Allow photo access to add a gallery photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.85 });
    if (result.canceled) return;
    const photo = await addPetPhoto(db, pet.id, result.assets[0].uri);
    setPhotos((current) => [photo, ...current]);
  };

  const removePhoto = (photo: PetPhoto) => {
    Alert.alert('Remove photo?', 'This removes the photo from this pet’s gallery.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => { await deletePetPhoto(db, photo.id); setPhotos((current) => current.filter((item) => item.id !== photo.id)); } },
    ]);
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
            <View style={styles.heroRightActions}>
              <Pressable accessibilityRole="button" accessibilityLabel="Edit pet" onPress={() => onEditPet(pet)} style={[styles.heroButton, styles.editButton]}><Pencil color="#1F2E23" size={16} strokeWidth={2.2} /></Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Delete pet" onPress={confirmDelete} style={[styles.heroButton, styles.deleteButton]}><Trash2 color="#B9553E" size={16} strokeWidth={2.2} /></Pressable>
            </View>
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

          {activeTab === 'activity' && <ActivityPanel logs={petLogs} completedLogs={completedLogs} onToggleLog={toggleLog} pet={pet} onAdd={() => openAdd('activity')} onEdit={openEdit} />}
          {activeTab === 'diet' && <DietPanel logs={petLogs} onAdd={() => openAdd('meal')} onEdit={openEdit} />}
          {activeTab === 'health' && <HealthPanel logs={petLogs} onAdd={() => openAdd('health')} />}
          {activeTab === 'gallery' && <GalleryPanel photos={photos} onAdd={addPhoto} onDelete={removePhoto} />}
        </View>
      </ScrollView>
      <EntryModal type={addType} editing={Boolean(editingLog)} title={draftTitle} detail={draftDetail} time={draftTime} date={draftDate} onChangeTitle={setDraftTitle} onChangeDetail={setDraftDetail} onChangeTime={setDraftTime} onChangeDate={setDraftDate} onClose={() => { setAddType(undefined); setEditingLog(undefined); }} onDelete={removeEntry} onSave={saveEntry} />
    </View>
  );
}

function getProfileImage(pet: Pet) {
  if (pet.photoUri) return { uri: pet.photoUri };
  if (pet.species === 'dog') return require('../../assets/images/cartoon_dog_avatar_1789624318697.jpg');
  if (pet.species === 'cat') return require('../../assets/images/cartoon_cat_avatar_1789624329620.jpg');
  return getPetAvatarSource(pet.species, pet.photoUri);
}

function SectionHeader({ label, action, onPress }: { label: string; action: string; onPress?: () => void }) {
  return <View style={styles.sectionHeader}><Text style={styles.sectionLabel}>{label}</Text><Pressable accessibilityRole="button" onPress={onPress ?? (() => undefined)} style={styles.sectionActionButton}><Plus color="#2E5B42" size={14} strokeWidth={2.5} /><Text style={styles.sectionAction}>{action}</Text></Pressable></View>;
}

function formatCurrentTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function ActivityPanelLegacy({ logs, completedLogs, onToggleLog, pet }: { logs: CareLog[]; completedLogs: number; onToggleLog: (id: string) => void; pet: Pet }) {
  return <View style={styles.panelStack}><SectionHeader label="DAILY ACTIVITIES" action="Add Activity" /><View style={styles.logStack}>{logs.length ? logs.filter((log) => log.type !== 'meal').map((log) => <Pressable key={log.id} accessibilityRole="button" accessibilityState={{ checked: log.completed }} onPress={() => onToggleLog(log.id)} style={styles.logRow}><View style={[styles.logIcon, log.completed && styles.completedLogIcon]}>{log.completed ? <Check color="#2E5B42" size={14} strokeWidth={2.6} /> : <Footprints color="#2E5B42" size={15} />}</View><View style={styles.logCopy}><Text style={styles.logTitle}>{log.title}</Text><View style={styles.metaLine}><Clock3 size={10} color="#94A59A" /><Text style={styles.logMeta}>{log.time} · Everyday</Text></View></View><View style={styles.notifyPill}><Bell color="#3E7650" size={10} /><Text style={styles.notifyText}>Notify ON</Text></View><Trash2 color="#B9C0BA" size={14} /></Pressable>) : <Text style={styles.emptyLogs}>No activities logged yet.</Text>}</View><Text style={styles.progressHint}>{completedLogs} of {logs.length || 3} routines complete · {pet.name}</Text></View>;
}

function DietPanelLegacy({ logs }: { logs: CareLog[] }) {
  const meals = logs.filter((log) => log.type === 'meal');
  return <View style={styles.panelStack}><SectionHeader label="DIET & FEEDING" action="Add Meal" /><View style={styles.logStack}>{meals.length ? meals.map((log) => <View key={log.id} style={styles.logRow}><View style={[styles.logIcon, styles.mealIcon]}><Utensils color="#D98235" size={14} /></View><View style={styles.logCopy}><Text style={styles.logTitle}>{log.title}</Text><View style={styles.metaLine}><Clock3 size={10} color="#94A59A" /><Text style={styles.logMeta}>{log.time} · Everyday</Text></View></View><View style={styles.mealNotify}><Bell color="#B97625" size={10} /><Text style={styles.mealNotifyText}>Notify ON</Text></View><Trash2 color="#B9C0BA" size={14} /></View>) : <Text style={styles.emptyLogs}>No meals added yet.</Text>}</View></View>;
}

function HealthPanelLegacy() {
  return <View style={styles.panelStack}><SectionHeader label="HEALTH HISTORY TIMELINE" action="Add History" /><View style={styles.timeline}><View style={styles.timelineLine} /><View style={styles.healthRow}><View style={styles.healthIcon}><Syringe color="#2E5B42" size={13} /></View><View style={styles.logCopy}><Text style={styles.logTitle}>Anti-Rabies 3-Year Vaccine</Text><Text style={styles.logMeta}>May 15, 2026</Text></View><Trash2 color="#B9C0BA" size={14} /></View></View></View>;
}

function GalleryPanelLegacy() {
  return <View style={styles.panelStack}><SectionHeader label="0 PHOTOS" action="Add Photo" /><View style={styles.emptyGallery}><ImagePlus color="#D2B28A" size={28} /><Text style={styles.emptyGalleryTitle}>No photos yet</Text><Text style={styles.emptyGalleryText}>Add a photo to keep your pet&apos;s memories here.</Text></View></View>;
}

function ActivityPanel({ logs, completedLogs, onToggleLog, pet, onAdd, onEdit }: { logs: CareLog[]; completedLogs: number; onToggleLog: (id: string) => void; pet: Pet; onAdd: () => void; onEdit: (log: CareLog) => void }) {
  const activityLogs = logs.filter((log) => !['meal', 'vet', 'meds'].includes(log.type));
  return <View style={styles.panelStack}><SectionHeader label="DAILY ACTIVITIES" action="Add Activity" onPress={onAdd} /><View style={styles.logStack}>{activityLogs.length ? activityLogs.map((log) => <Pressable key={log.id} accessibilityRole="button" accessibilityState={{ checked: log.completed }} onPress={() => onToggleLog(log.id)} style={styles.logRow}><View style={[styles.logIcon, log.completed && styles.completedLogIcon]}>{log.completed ? <Check color="#2E5B42" size={14} strokeWidth={2.6} /> : <Footprints color="#2E5B42" size={15} />}</View><View style={styles.logCopy}><Text style={styles.logTitle}>{log.title}</Text><View style={styles.metaLine}><Clock3 size={10} color="#94A59A" /><Text style={styles.logMeta}>{log.time} · {log.date}</Text></View></View><View style={styles.notifyPill}><Bell color="#3E7650" size={10} /><Text style={styles.notifyText}>Notify ON</Text></View><Pressable accessibilityRole="button" accessibilityLabel={`Edit ${log.title}`} onPress={() => onEdit(log)} style={styles.rowEdit}><Pencil color="#6D8072" size={13} /></Pressable></Pressable>) : <Text style={styles.emptyLogs}>No activities logged yet.</Text>}</View><Text style={styles.progressHint}>{completedLogs} of {activityLogs.length} routines complete · {pet.name}</Text></View>;
}

function DietPanel({ logs, onAdd, onEdit }: { logs: CareLog[]; onAdd: () => void; onEdit: (log: CareLog) => void }) {
  const meals = logs.filter((log) => log.type === 'meal');
  return <View style={styles.panelStack}><SectionHeader label="DIET & FEEDING" action="Add Meal" onPress={onAdd} /><View style={styles.logStack}>{meals.length ? meals.map((log) => <View key={log.id} style={styles.logRow}><View style={[styles.logIcon, styles.mealIcon]}><Utensils color="#D98235" size={14} /></View><View style={styles.logCopy}><Text style={styles.logTitle}>{log.title}</Text><View style={styles.metaLine}><Clock3 size={10} color="#94A59A" /><Text style={styles.logMeta}>{log.time} · {log.date}</Text></View></View><View style={styles.mealNotify}><Bell color="#B97625" size={10} /><Text style={styles.mealNotifyText}>Notify ON</Text></View><Pressable accessibilityRole="button" accessibilityLabel={`Edit ${log.title}`} onPress={() => onEdit(log)} style={styles.rowEdit}><Pencil color="#6D8072" size={13} /></Pressable></View>) : <Text style={styles.emptyLogs}>No meals added yet.</Text>}</View></View>;
}

function HealthPanel({ logs, onAdd }: { logs: CareLog[]; onAdd: () => void }) {
  const healthLogs = logs.filter((log) => log.type === 'vet' || log.type === 'meds');
  return <View style={styles.panelStack}><SectionHeader label="HEALTH HISTORY TIMELINE" action="Add History" onPress={onAdd} /><View style={styles.timeline}>{healthLogs.length ? healthLogs.map((log) => <View key={log.id} style={styles.healthRow}><View style={styles.healthIcon}><Syringe color="#2E5B42" size={13} /></View><View style={styles.logCopy}><Text style={styles.logTitle}>{log.title}</Text><Text style={styles.logMeta}>{log.date} · {log.detail}</Text></View></View>) : <Text style={styles.emptyLogs}>No health history added yet.</Text>}</View></View>;
}

function GalleryPanel({ photos, onAdd, onDelete }: { photos: PetPhoto[]; onAdd: () => void; onDelete: (photo: PetPhoto) => void }) {
  return <View style={styles.panelStack}><SectionHeader label={`${photos.length} PHOTOS`} action="Add Photo" onPress={onAdd} />{photos.length ? <View style={styles.galleryGrid}>{photos.map((photo) => <Pressable key={photo.id} accessibilityRole="button" accessibilityLabel="Remove gallery photo" onLongPress={() => onDelete(photo)}><Image source={{ uri: photo.uri }} style={styles.galleryImage} /></Pressable>)}</View> : <View style={styles.emptyGallery}><ImagePlus color="#D2B28A" size={28} /><Text style={styles.emptyGalleryTitle}>No photos yet</Text><Text style={styles.emptyGalleryText}>Add a photo to keep your pet&apos;s memories here.</Text></View>}</View>;
}

function EntryModal({ type, editing, title, detail, time, date, onChangeTitle, onChangeDetail, onChangeTime, onChangeDate, onClose, onDelete, onSave }: { type?: 'activity' | 'meal' | 'health'; editing: boolean; title: string; detail: string; time: string; date: string; onChangeTitle: (value: string) => void; onChangeDetail: (value: string) => void; onChangeTime: (value: string) => void; onChangeDate: (value: string) => void; onClose: () => void; onDelete: () => void; onSave: () => void }) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const label = type === 'activity' ? 'Add Activity' : type === 'meal' ? 'Add Meal' : 'Add Health History';
  const selected = parseTime(time);
  const setPart = (part: 'hour' | 'minute' | 'period', value: string) => onChangeTime(formatTime(part === 'hour' ? value : selected.hour, part === 'minute' ? value : selected.minute, part === 'period' ? value : selected.period));
  return <Modal animationType="slide" transparent visible={Boolean(type)} onRequestClose={onClose}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}><View style={styles.modalCard}><View style={styles.modalHeading}><Text style={styles.modalTitle}>{editing ? `Edit ${type === 'meal' ? 'Meal' : type === 'activity' ? 'Activity' : 'Health History'}` : label}</Text><Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={styles.modalClose}><Text style={styles.modalCloseText}>×</Text></Pressable></View><Text style={styles.modalLabel}>Name</Text><TextInput autoFocus accessibilityLabel="Entry title" value={title} onChangeText={onChangeTitle} placeholder="Title" placeholderTextColor="#9AA69D" style={styles.modalInput} />{type === 'health' ? <><Text style={styles.modalLabel}>Date</Text><Pressable accessibilityRole="button" accessibilityLabel="Choose health history date" onPress={() => setShowDatePicker(true)} style={styles.dateButton}><Text style={styles.dateButtonText}>{date || 'Choose a date'}</Text><Text style={styles.dateButtonIcon}>⌄</Text></Pressable>{showDatePicker && <DateTimePicker value={parseDate(date)} mode="date" display={Platform.OS === 'ios' ? 'inline' : 'default'} onChange={(_, selectedDate) => { if (Platform.OS !== 'ios') setShowDatePicker(false); if (selectedDate) onChangeDate(formatDate(selectedDate)); }} /> }<Text style={styles.modalHint}>Health history uses a date only.</Text></> : <><Text style={styles.modalLabel}>Time</Text><View style={styles.timePicker}><TimeWheel values={HOURS} selected={selected.hour} onSelect={(value) => setPart('hour', value)} /><Text style={styles.timeColon}>:</Text><TimeWheel values={MINUTES} selected={selected.minute} onSelect={(value) => setPart('minute', value)} /><TimeWheel values={PERIODS} selected={selected.period} onSelect={(value) => setPart('period', value)} /></View><Text style={styles.modalHint}>Scroll to change the time.</Text></>}<TextInput accessibilityLabel="Entry details" value={detail} onChangeText={onChangeDetail} placeholder="Details (optional)" placeholderTextColor="#9AA69D" style={[styles.modalInput, styles.modalDetailInput]} multiline /><View style={styles.modalActions}>{editing && <Pressable onPress={onDelete} style={styles.modalDelete}><Trash2 color="#B9553E" size={15} /><Text style={styles.modalDeleteText}>Delete</Text></Pressable>}<Pressable onPress={onClose} style={styles.modalCancel}><Text style={styles.modalCancelText}>Cancel</Text></Pressable><Pressable disabled={!title.trim()} onPress={onSave} style={[styles.modalSave, !title.trim() && styles.modalSaveDisabled]}><Text style={styles.modalSaveText}>Save</Text></Pressable></View></View></KeyboardAvoidingView></Modal>;
}

const HOURS = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'));
const PERIODS = ['AM', 'PM'];

function parseTime(value: string) {
  const match = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  return { hour: match?.[1].padStart(2, '0') ?? '08', minute: match?.[2] ?? '00', period: match?.[3].toUpperCase() ?? 'AM' };
}

function formatTime(hour: string, minute: string, period: string) {
  return `${hour}:${minute} ${period}`;
}

function parseDate(value: string) {
  if (value === 'Today' || !value) return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function formatDate(value: Date) {
  return value.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function TimeWheel({ values, selected, onSelect }: { values: string[]; selected: string; onSelect: (value: string) => void }) {
  const scrollRef = useRef<ScrollView>(null);
  const selectedIndex = Math.max(0, values.indexOf(selected));

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: selectedIndex * TIME_ITEM_HEIGHT, animated: false });
  }, [selectedIndex]);

  return <ScrollView
    ref={scrollRef}
    showsVerticalScrollIndicator={false}
    snapToInterval={TIME_ITEM_HEIGHT}
    decelerationRate="fast"
    style={styles.timeWheel}
    contentContainerStyle={styles.timeWheelContent}
    onMomentumScrollEnd={(event) => {
      const index = Math.round(event.nativeEvent.contentOffset.y / TIME_ITEM_HEIGHT);
      onSelect(values[Math.max(0, Math.min(values.length - 1, index))]);
    }}
  >{values.map((value) => <Pressable key={value} onPress={() => onSelect(value)} style={[styles.timeOption, value === selected && styles.timeOptionSelected]}><Text style={[styles.timeOptionText, value === selected && styles.timeOptionSelectedText]}>{value}</Text></Pressable>)}</ScrollView>;
}

const TIME_ITEM_HEIGHT = 30;

const styles = StyleSheet.create({
  screen: { backgroundColor: '#FFFFFF', flex: 1 },
  scrollContent: { paddingBottom: 120 },
  hero: { backgroundColor: '#EAE5DA', height: 350, overflow: 'hidden', position: 'relative' },
  heroImage: { height: '100%', width: '100%' },
  heroFade: { bottom: 0, height: 150, left: 0, position: 'absolute', right: 0 },
  heroActions: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', left: 16, position: 'absolute', right: 16, top: 16 },
  heroRightActions: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  heroButton: { alignItems: 'center', backgroundColor: '#1A261EE8', borderRadius: 20, elevation: 3, height: 40, justifyContent: 'center', shadowColor: '#000000', shadowOpacity: 0.15, shadowRadius: 6, width: 40 },
  editButton: { backgroundColor: '#FFFFFFE8' },
  deleteButton: { backgroundColor: '#FFF1ED' },
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
  rowEdit: { alignItems: 'center', justifyContent: 'center', marginLeft: 7, padding: 5 },
  progressHint: { color: '#9AA69D', fontSize: 9, marginTop: 1 },
  emptyLogs: { backgroundColor: '#FAF7F0', borderColor: '#EDE7DC', borderRadius: 12, borderWidth: 1, color: '#718276', fontSize: 10, padding: 15, textAlign: 'center' },
  emptyGallery: { alignItems: 'center', backgroundColor: '#FAF7F0', borderColor: '#E8E0D3', borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', padding: 30 },
  emptyGalleryTitle: { color: '#425548', fontSize: 12, fontWeight: '800', marginTop: 8 },
  emptyGalleryText: { color: '#8A9B8F', fontSize: 9, marginTop: 4, textAlign: 'center' },
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  galleryImage: { backgroundColor: '#F0ECE3', borderRadius: 14, height: 104, width: '31%' },
  modalOverlay: { backgroundColor: '#00000055', flex: 1, justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#FFFDF8', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalTitle: { color: '#1F2E23', fontSize: 20, fontWeight: '800', marginBottom: 14 },
  modalHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  modalClose: { alignItems: 'center', backgroundColor: '#F0EEE7', borderRadius: 14, height: 28, justifyContent: 'center', width: 28 },
  modalCloseText: { color: '#7D8F82', fontSize: 22, fontWeight: '400', lineHeight: 24 },
  modalLabel: { color: '#5D7163', fontSize: 10, fontWeight: '700', marginBottom: 5, marginTop: 3 },
  modalInput: { backgroundColor: '#F4F0E6', borderColor: '#E5DDD0', borderRadius: 12, borderWidth: 1, color: '#1F2E23', fontSize: 15, minHeight: 48, paddingHorizontal: 14 },
  dateButton: { alignItems: 'center', backgroundColor: '#F4F0E6', borderColor: '#E5DDD0', borderRadius: 12, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 48, paddingHorizontal: 14 },
  dateButtonText: { color: '#1F2E23', fontSize: 15 },
  dateButtonIcon: { color: '#627C6B', fontSize: 19, fontWeight: '800' },
  modalDetailInput: { minHeight: 86, paddingTop: 12, textAlignVertical: 'top' },
  modalHint: { color: '#7D8F82', fontSize: 11, marginBottom: 8, marginTop: 5 },
  modalActions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end', marginTop: 16 },
  modalDelete: { alignItems: 'center', flexDirection: 'row', gap: 5, marginRight: 'auto', paddingHorizontal: 4 },
  modalDeleteText: { color: '#B9553E', fontSize: 13, fontWeight: '800' },
  modalCancel: { alignItems: 'center', borderColor: '#D8D2C6', borderRadius: 12, borderWidth: 1, justifyContent: 'center', minWidth: 90, paddingHorizontal: 16, paddingVertical: 12 },
  modalCancelText: { color: '#65776C', fontWeight: '700' },
  modalSave: { alignItems: 'center', backgroundColor: '#627C6B', borderRadius: 12, justifyContent: 'center', minWidth: 90, paddingHorizontal: 16, paddingVertical: 12 },
  modalSaveDisabled: { opacity: 0.45 },
  modalSaveText: { color: '#FFFFFF', fontWeight: '800' },
  timePicker: { alignItems: 'center', backgroundColor: '#F4F0E6', borderColor: '#E5DDD0', borderRadius: 10, borderWidth: 1, flexDirection: 'row', height: 86, justifyContent: 'center', overflow: 'hidden' },
  timeWheel: { height: 86, width: 54 },
  timeWheelContent: { paddingVertical: 28 },
  timeOption: { alignItems: 'center', height: 30, justifyContent: 'center' },
  timeOptionSelected: { backgroundColor: '#DDEDE2', borderRadius: 7 },
  timeOptionText: { color: '#9AA69D', fontSize: 15, fontWeight: '600' },
  timeOptionSelectedText: { color: '#2E5B42', fontWeight: '900' },
  timeColon: { color: '#557A63', fontSize: 17, fontWeight: '800', marginHorizontal: 1 },
});
