import { useEffect, useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import {
  Check,
  Clock,
  Droplets,
  Footprints,
  Heart,
  Pill,
  Plus,
  RotateCcw,
  Utensils,
  Weight,
  X,
} from 'lucide-react-native';
import { SkeletonScreen } from '../../components/Loading/Skeleton';
import { addCareLog, getCareLogs, getPets, updateCareLog } from '../../database/petpalsDatabase';
import { useSQLiteContext } from 'expo-sqlite';
import { CareLog, CareType, Pet } from '../../types/pet';
import { dashboardStyles as styles } from './styles';
import { getPetAvatarSource } from '../../constants/petAvatars';

type Props = { onOpenAddPet: () => void; onReturnToWelcome: () => void };

const profileAvatar = require('../../assets/images/jordan_avatar_photo_1789667660941.jpg');

function CareIcon({ type, color = '#557A63', size = 15 }: { type: CareType; color?: string; size?: number }) {
  const Icon = type === 'meal' ? Utensils : type === 'water' ? Droplets : type === 'walk' ? Footprints : type === 'meds' ? Pill : type === 'weight' ? Weight : Heart;
  return <Icon color={color} size={size} strokeWidth={2} />;
}

export function DashboardScreen({ onOpenAddPet, onReturnToWelcome }: Props) {
  const db = useSQLiteContext();
  const [pets, setPets] = useState<Pet[]>([]);
  const [logs, setLogs] = useState<CareLog[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedPetId, setSelectedPetId] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [quickLogOpen, setQuickLogOpen] = useState(false);
  const [logType, setLogType] = useState<CareType>('walk');
  const [logTitle, setLogTitle] = useState('');
  const [logDetail, setLogDetail] = useState('');

  const currentPet = pets.find((pet) => pet.id === selectedPetId) ?? pets[0];
  const displayedLogs = useMemo(
    () => !currentPet ? [] : showAll ? logs : logs.filter((log) => log.petId === currentPet.id),
    [currentPet, logs, showAll],
  );
  const completedCount = displayedLogs.filter((log) => log.completed).length;
  const nextLog = displayedLogs.find((log) => !log.completed);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Morning, Jordan!' : hour < 17 ? 'Afternoon, Jordan!' : 'Evening, Jordan!';

  useEffect(() => {
    Promise.all([getPets(db), getCareLogs(db)])
      .then(([nextPets, nextLogs]) => {
        setPets(nextPets);
        setLogs(nextLogs);
        setSelectedPetId((current) => current || nextPets[0]?.id || '');
      })
      .finally(() => setDataLoading(false));
  }, [db]);

  const toggleLog = async (id: string) => {
    const nextCompleted = !logs.find((log) => log.id === id)?.completed;
    await updateCareLog(db, id, nextCompleted);
    setLogs((current) => current.map((log) => log.id === id ? { ...log, completed: !log.completed } : log));
  };

  const selectLogType = (type: CareType) => {
    setLogType(type);
    setLogTitle(type === 'walk' ? `Walk ${currentPet.name}` : type === 'meal' ? 'Afternoon Meal' : type === 'water' ? 'Fresh Water Refill' : 'Daily Vitamins');
  };

  const createLog = async () => {
    if (!logTitle.trim() || !currentPet) return;
    const log = await addCareLog(db, { petId: currentPet.id, type: logType, title: logTitle.trim(), detail: logDetail.trim() || `Scheduled care for ${currentPet.name}`, time: 'Now', date: 'Today', completed: false });
    setLogs((current) => [log, ...current]);
    setLogTitle('');
    setLogDetail('');
    setQuickLogOpen(false);
  };

  const sourceForPet = (pet: Pet) => getPetAvatarSource(pet.species, pet.photoUri);

  if (dataLoading || !currentPet) return <SkeletonScreen variant="dashboard" />;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.greetingSubtext}>It&apos;s a perfect day for a walk.</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={onReturnToWelcome} style={styles.profileButton}>
            <Image source={profileAvatar} style={styles.profileImage} />
          </Pressable>
        </View>

        <View style={styles.overviewGrid}>
          <View style={[styles.clayCard, styles.progressCard]}>
            <View style={styles.cardEyebrowRow}>
              <Text style={styles.cardEyebrow}>TODAY&apos;S CARE</Text>
              <Heart color="#557A63" size={16} fill="#DCE9E0" />
            </View>
            <Text style={styles.progressValue}>{completedCount}<Text style={styles.progressTotal}>/{displayedLogs.length}</Text></Text>
            <Text style={styles.progressLabel}>routines complete</Text>
            <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${displayedLogs.length ? (completedCount / displayedLogs.length) * 100 : 0}%` }]} /></View>
          </View>
          <View style={[styles.clayCard, styles.focusCard]}>
            <Text style={styles.cardEyebrow}>UP NEXT</Text>
            <View style={styles.focusIcon}><CareIcon type={nextLog?.type ?? 'note'} color="#A87948" size={17} /></View>
            <Text numberOfLines={1} style={styles.focusTitle}>{nextLog?.title ?? 'All caught up'}</Text>
            <Text style={styles.focusMeta}>{nextLog?.time ?? 'Nice work today'}</Text>
          </View>
        </View>

        <View style={[styles.clayCard, styles.section, styles.packCard]}>
          <Text style={styles.sectionTitle}>Your Pack</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.petRow}>
            {pets.map((pet) => {
              const selected = pet.id === currentPet.id;
              return (
                <Pressable key={pet.id} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => setSelectedPetId(pet.id)} style={styles.petItem}>
                  <View style={[styles.petAvatarRing, selected && styles.selectedPetRing]}>
                    <Image source={sourceForPet(pet)} style={styles.petAvatar} />
                    {selected && <View style={styles.selectedDot} />}
                  </View>
                  <Text style={styles.petName}>{pet.name}</Text>
                  <Text style={styles.petAge}>{pet.ageYears}y {pet.ageMonths}m</Text>
                </Pressable>
              );
            })}
            <Pressable accessibilityRole="button" onPress={onOpenAddPet} style={styles.addPetItem}>
              <View style={styles.addPetCircle}><View style={styles.addPetInner}><Plus color="#5A6E61" size={18} strokeWidth={2.4} /></View></View>
              <Text style={styles.addPetText}>Add Pet</Text>
            </Pressable>
          </ScrollView>
        </View>

        <View style={[styles.clayCard, styles.routineSection]}>
          <View style={styles.routineHeader}>
            <View><Text style={styles.sectionTitle}>Today&apos;s Routine</Text><Text style={styles.sectionSubtitle}>{showAll ? 'All pets' : `For ${currentPet.name}`}</Text></View>
            <Pressable accessibilityRole="button" onPress={() => setShowAll((value) => !value)} style={styles.viewAllButton}>
              <Text style={styles.viewAll}>{showAll ? 'ACTIVE PET' : 'VIEW ALL'}</Text>
            </Pressable>
          </View>

        {displayedLogs.map((log) => {
          const pet = pets.find((item) => item.id === log.petId) ?? currentPet;
          return (
            <Pressable key={log.id} accessibilityRole="button" accessibilityState={{ checked: log.completed }} onPress={() => toggleLog(log.id)} style={[styles.routineCard, log.completed && styles.completedCard]}>
              <View style={[styles.checkbox, log.completed && styles.checkedBox]}>{log.completed && <Check color="#FFFFFF" size={15} strokeWidth={3} />}</View>
              <View style={styles.routineBody}>
                <Text style={[styles.routineTitle, log.completed && styles.completedTitle]}>{log.title}</Text>
                <View style={styles.routineMeta}><Clock color="#718276" size={12} /><Text style={styles.routineDetail}>  {log.time}  ·  {log.detail}</Text></View>
              </View>
              <Image source={sourceForPet(pet)} style={styles.routineAvatar} />
            </Pressable>
          );
        })}

          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={() => setQuickLogOpen(true)} style={styles.addRoutineButton}><Plus color="#FFFFFF" size={16} strokeWidth={2.4} /><Text style={styles.addRoutineText}>Add routine</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Return to welcome" onPress={onReturnToWelcome} style={styles.resetButton}><RotateCcw color="#55675B" size={18} /></Pressable>
          </View>
        </View>
      </ScrollView>

      <Modal visible={quickLogOpen} animationType="slide" transparent onRequestClose={() => setQuickLogOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}><View><Text style={styles.modalTitle}>Add Today&apos;s Routine</Text><Text style={styles.modalSubtitle}>For {currentPet.name}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => setQuickLogOpen(false)} style={styles.closeButton}><X color="#55675B" size={17} /></Pressable></View>
            <Text style={styles.formLabel}>Activity Type</Text>
            <View style={styles.typeRow}>
              {(['walk', 'meal', 'water', 'meds'] as CareType[]).map((type) => (
                <Pressable key={type} accessibilityRole="button" onPress={() => selectLogType(type)} style={[styles.typeButton, logType === type && styles.activeTypeButton]}><CareIcon type={type} color={logType === type ? '#FFFFFF' : '#495B50'} /><Text style={[styles.typeText, logType === type && styles.activeTypeText]}>{type === 'meds' ? 'Meds' : type[0].toUpperCase() + type.slice(1)}</Text></Pressable>
              ))}
            </View>
            <Text style={styles.formLabel}>Activity Title</Text>
            <TextInput accessibilityLabel="Activity title" value={logTitle} onChangeText={setLogTitle} placeholder={`e.g. Walk ${currentPet.name}`} placeholderTextColor="#A0B0A5" style={styles.formInput} />
            <Text style={styles.formLabel}>Details / Route / Notes</Text>
            <TextInput accessibilityLabel="Activity details" value={logDetail} onChangeText={setLogDetail} placeholder="e.g. neighborhood stroll" placeholderTextColor="#A0B0A5" style={styles.formInput} />
            <View style={styles.modalActions}><Pressable onPress={() => setQuickLogOpen(false)} style={styles.modalCancel}><Text style={styles.modalCancelText}>Cancel</Text></Pressable><Pressable onPress={createLog} style={styles.modalSave}><Text style={styles.modalSaveText}>Save Routine</Text></Pressable></View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
