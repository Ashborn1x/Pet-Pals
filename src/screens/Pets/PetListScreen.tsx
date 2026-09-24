import { useCallback, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CalendarDays, CheckCircle2, ChevronRight, Heart, PawPrint, Plus, Trash2, Weight } from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SkeletonScreen } from '../../components/Loading/Skeleton';
import { deletePet, getPets } from '../../database/petpalsDatabase';
import { useSQLiteContext } from 'expo-sqlite';
import { Pet } from '../../types/pet';
import { getPetAvatarSource } from '../../constants/petAvatars';

type Props = { onOpenAddPet: () => void; onOpenPet?: (pet: Pet) => void; onOpenCalendar?: () => void };

export function PetListScreen({ onOpenAddPet, onOpenPet, onOpenCalendar }: Props) {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const [pets, setPets] = useState<Pet[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedPetId, setSelectedPetId] = useState('');

  const loadPets = useCallback(() => {
    setDataLoading(true);
    getPets(db).then((nextPets) => {
      setPets(nextPets);
      setSelectedPetId((current) => current || nextPets[0]?.id || '');
    }).finally(() => setDataLoading(false));
  }, [db]);

  useFocusEffect(loadPets);

  const openPet = (pet: Pet) => { setSelectedPetId(pet.id); onOpenPet?.(pet); };
  const confirmDelete = (pet: Pet) => Alert.alert(`Remove ${pet.name}?`, 'This will permanently remove the pet and its care history from this device.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Remove', style: 'destructive', onPress: async () => {
      await deletePet(db, pet.id);
      setPets((current) => current.filter((item) => item.id !== pet.id));
      setSelectedPetId((current) => current === pet.id ? '' : current);
    } },
  ]);

  if (dataLoading) return <SkeletonScreen variant="pets" />;

  return <View style={styles.screen}><ScrollView contentContainerStyle={[styles.content, { paddingTop: 16 + Math.min(insets.top, 18) }]} showsVerticalScrollIndicator={false}>
    <View pointerEvents="none" style={styles.decorations}><View style={styles.leftBlob} /><View style={styles.rightBlob} /></View>
    <View style={styles.header}><View style={styles.headerCopy}><View style={styles.titleRow}><PawPrint color="#476351" fill="#476351" size={27} /><Text style={styles.title}>My Pack</Text><Heart color="#476351" size={17} strokeWidth={2.2} /></View><Text style={styles.subtitle}>{pets.length} companions <Text style={styles.dot}>•</Text> Tap any pet to view health details.</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Add a pet" onPress={onOpenAddPet} style={styles.addButton}><Plus color="#FFFFFF" size={16} strokeWidth={3} /><PawPrint color="#FFFFFF" fill="#FFFFFF" size={15} /><Text style={styles.addButtonText}>Add Pet</Text></Pressable></View>
    <View style={styles.petList}>{pets.map((pet, index) => <PetCard key={pet.id} index={index} pet={pet} selected={pet.id === selectedPetId} onPress={() => openPet(pet)} onCalendar={onOpenCalendar} onDelete={() => confirmDelete(pet)} />)}{!pets.length && <View style={styles.emptyState}><PawPrint color="#7D9685" size={30} /><Text style={styles.emptyTitle}>No pets found</Text><Text style={styles.emptyText}>Add your first companion to get started.</Text></View>}</View>
  </ScrollView></View>;
}

function PetCard({ pet, index, selected, onPress, onCalendar, onDelete }: { pet: Pet; index: number; selected: boolean; onPress: () => void; onCalendar?: () => void; onDelete: () => void }) {
  const palette = index % 3 === 1 ? { card: '#FCF9F3', border: '#EFE9DC', ring: '#ECC788', badge: '#DFA54D', calendar: '#F3EAD8', health: '#EFECE3' } : index % 3 === 2 ? { card: '#FBF5F4', border: '#EFE4E1', ring: '#D9B7B5', badge: '#A46566', calendar: '#F5E6E4', health: '#EDE6E6' } : { card: '#F8FAF7', border: '#E7EFE9', ring: '#BBD3C3', badge: '#476351', calendar: '#E5EFE7', health: '#EAEFEA' };
  return <View style={[styles.petCard, { backgroundColor: palette.card, borderColor: palette.border }, selected && styles.petCardSelected]}><Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} onLongPress={onDelete} style={styles.cardTop}><View style={[styles.avatarFrame, { borderColor: palette.ring }]}><Image source={getPetAvatarSource(pet.species, pet.photoUri)} style={styles.petImage} /><View style={[styles.petBadge, { backgroundColor: palette.badge }]}>{index % 3 === 2 ? <Heart color="#FFFFFF" fill="#FFFFFF" size={13} /> : <PawPrint color="#FFFFFF" fill="#FFFFFF" size={13} />}</View></View><View style={styles.petDetails}><View style={styles.petTitleRow}><Text numberOfLines={1} style={styles.petName}>{pet.name}</Text><ChevronRight color="#9B9D96" size={17} strokeWidth={2.5} /></View><Text numberOfLines={1} style={styles.breed}>{pet.breed}</Text><View style={styles.metrics}><View style={styles.metric}><CalendarDays color="#737F76" size={15} /><Text style={styles.metricText}>{pet.ageYears}y {pet.ageMonths}m</Text></View><View style={styles.metric}><Weight color="#737F76" size={15} /><Text style={styles.metricText}>{pet.weight} {pet.weightUnit}</Text></View></View></View></Pressable><View style={styles.cardActions}><Pressable accessibilityRole="button" onPress={onCalendar} style={[styles.actionButton, { backgroundColor: palette.calendar }]}><CalendarDays color="#506C59" size={14} /><Text style={styles.actionText}>Calendar</Text></Pressable><Pressable accessibilityRole="button" onPress={onPress} style={[styles.actionButton, { backgroundColor: palette.health }]}><CheckCircle2 color="#69766D" size={14} /><Text style={styles.actionText}>Health &amp; Notes</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Delete ${pet.name}`} onPress={onDelete} style={styles.deleteButton}><Trash2 color="#D96B6B" size={16} /></Pressable></View></View>;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#F6F5EF', flex: 1 }, content: { alignSelf: 'center', maxWidth: 560, padding: 16, paddingBottom: 130, width: '100%' },
  decorations: { bottom: 0, left: 0, overflow: 'hidden', position: 'absolute', right: 0, top: 0 }, leftBlob: { backgroundColor: '#E0E9E1', borderRadius: 140, height: 210, left: -95, opacity: 0.72, position: 'absolute', top: -65, width: 210 }, rightBlob: { backgroundColor: '#D5E2D7', borderRadius: 100, height: 160, opacity: 0.6, position: 'absolute', right: -65, top: 45, width: 160 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 15, paddingHorizontal: 2, paddingTop: 5 }, headerCopy: { flex: 1, minWidth: 0 }, titleRow: { alignItems: 'center', flexDirection: 'row', gap: 8 }, title: { color: '#1F2A22', fontSize: 27, fontWeight: '900', letterSpacing: -0.8 }, subtitle: { color: '#626E65', fontSize: 12, fontWeight: '600', marginTop: 5 }, dot: { color: '#879288' }, addButton: { alignItems: 'center', backgroundColor: '#476351', borderRadius: 22, elevation: 2, flexDirection: 'row', gap: 5, marginLeft: 10, paddingHorizontal: 13, paddingVertical: 10, shadowColor: '#294233', shadowOpacity: 0.2, shadowRadius: 5 }, addButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
  petList: { gap: 14 }, petCard: { borderRadius: 28, borderWidth: 1, elevation: 1, padding: 16, shadowColor: '#5C6B60', shadowOpacity: 0.09, shadowRadius: 8 }, petCardSelected: { borderColor: '#8FAF99', borderWidth: 1.5 }, cardTop: { alignItems: 'center', flexDirection: 'row', minWidth: 0 }, avatarFrame: { backgroundColor: '#FFFFFF', borderRadius: 44, borderWidth: 2, elevation: 1, height: 82, padding: 4, position: 'relative', shadowColor: '#55705E', shadowOpacity: 0.12, shadowRadius: 4, width: 82 }, petImage: { borderRadius: 38, height: '100%', width: '100%' }, petBadge: { alignItems: 'center', borderColor: '#FFFFFF', borderRadius: 13, borderWidth: 2, bottom: -1, height: 26, justifyContent: 'center', position: 'absolute', right: -1, width: 26 }, petDetails: { flex: 1, marginLeft: 14, minWidth: 0 }, petTitleRow: { alignItems: 'center', flexDirection: 'row' }, petName: { color: '#1F2922', flexShrink: 1, fontSize: 22, fontWeight: '900', letterSpacing: -0.5, marginRight: 5 }, breed: { color: '#626E65', fontSize: 13, fontWeight: '600', marginTop: 2 }, metrics: { alignItems: 'center', flexDirection: 'row', gap: 15, marginTop: 9 }, metric: { alignItems: 'center', flexDirection: 'row', gap: 5 }, metricText: { color: '#455249', fontSize: 11, fontWeight: '700' },
  cardActions: { alignItems: 'center', borderTopColor: '#E4E9E3', borderTopWidth: 1, flexDirection: 'row', gap: 8, marginTop: 16, paddingTop: 12 }, actionButton: { alignItems: 'center', borderRadius: 17, flex: 1, flexDirection: 'row', justifyContent: 'center', minHeight: 34, paddingHorizontal: 7 }, actionText: { color: '#425348', fontSize: 10, fontWeight: '700', marginLeft: 5 }, deleteButton: { alignItems: 'center', backgroundColor: '#FDF2F2', borderRadius: 17, height: 34, justifyContent: 'center', width: 34 }, emptyState: { alignItems: 'center', backgroundColor: '#F8FAF7', borderColor: '#E0E9E1', borderRadius: 24, borderStyle: 'dashed', borderWidth: 1, padding: 32 }, emptyTitle: { color: '#425548', fontSize: 15, fontWeight: '800', marginTop: 9 }, emptyText: { color: '#718276', fontSize: 12, marginTop: 4 },
});
