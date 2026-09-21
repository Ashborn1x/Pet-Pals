import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CalendarDays, CheckCircle2, ChevronRight, PawPrint, Plus, Weight } from 'lucide-react-native';
import { SkeletonScreen } from '../../components/Loading/Skeleton';
import { deletePet, getPets } from '../../database/petpalsDatabase';
import { useSQLiteContext } from 'expo-sqlite';
import { Pet } from '../../types/pet';
import { getPetAvatarSource } from '../../constants/petAvatars';

type Props = { onOpenAddPet: () => void; onOpenPet?: (pet: Pet) => void };

export function PetListScreen({ onOpenAddPet, onOpenPet }: Props) {
  const db = useSQLiteContext();
  const [petsData, setPetsData] = useState<Pet[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedPetId, setSelectedPetId] = useState('');

  useEffect(() => {
    getPets(db)
      .then((nextPets) => {
        setPetsData(nextPets);
        setSelectedPetId((current) => current || nextPets[0]?.id || '');
      })
      .finally(() => setDataLoading(false));
  }, [db]);

  const pets = petsData;

  const confirmDelete = (pet: Pet) => {
    Alert.alert(
      `Remove ${pet.name}?`,
      'This will permanently remove the pet and its care history from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await deletePet(db, pet.id);
            setPetsData((current) => current.filter((item) => item.id !== pet.id));
            setSelectedPetId((current) => current === pet.id ? '' : current);
          },
        },
      ],
    );
  };

  if (dataLoading) return <SkeletonScreen variant="pets" />;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>My Pack</Text>
            <Text style={styles.subtitle}>{pets.length} companions · Tap any pet to view health details</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={onOpenAddPet} style={styles.headerAddButton}>
            <Plus color="#FFFFFF" size={12} strokeWidth={3} />
            <Text style={styles.headerAddText}>Add Pet</Text>
          </Pressable>
        </View>

        <View style={styles.petList}>
          {pets.map((pet, index) => <PetCard key={pet.id} pet={pet} primary={index === 0} selected={pet.id === selectedPetId} onPress={() => { setSelectedPetId(pet.id); onOpenPet?.(pet); }} onDelete={() => confirmDelete(pet)} />)}
          {!pets.length && (
            <View style={styles.emptyState}>
              <PawPrint color="#A0B0A5" size={28} />
              <Text style={styles.emptyTitle}>No pets found</Text>
              <Text style={styles.emptyText}>Add your first companion to get started.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function PetCard({ pet, primary, selected, onPress, onDelete }: { pet: Pet; primary: boolean; selected: boolean; onPress: () => void; onDelete: () => void }) {

  return (
    <View style={[styles.petCard, selected && styles.petCardSelected]}>
      <Pressable accessibilityRole="button" accessibilityState={{ selected }} accessibilityHint="Long press to remove this pet" onPress={onPress} onLongPress={onDelete} style={styles.petCardContent}>
        <Image source={getPetAvatarSource(pet.species, pet.photoUri)} style={styles.petImage} />
        <View style={styles.petDetails}>
          <View style={styles.petTitleRow}>
            <Text numberOfLines={1} style={styles.petName}>{pet.name}</Text>
            {primary && <View style={styles.primaryPill}><Text style={styles.primaryText}>PRIMARY</Text></View>}
            <ChevronRight color="#A9B5AC" size={14} />
          </View>
          <Text numberOfLines={1} style={styles.breed}>{pet.breed}</Text>
          <View style={styles.metrics}>
            <View style={styles.metric}><CalendarDays color="#7F9185" size={11} /><Text style={styles.metricText}>{pet.ageYears}y {pet.ageMonths}m</Text></View>
            <View style={styles.metric}><Weight color="#7F9185" size={11} /><Text style={styles.metricText}>{pet.weight} {pet.weightUnit}</Text></View>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.cardActions}>
            <View style={styles.actionPill}><CalendarDays color="#4C8060" size={11} /><Text style={styles.actionText}>Calendar</Text></View>
            <Pressable accessibilityRole="button" accessibilityLabel={`${pet.name} health and notes`} onPress={onPress} style={[styles.actionPill, styles.notesPill]}><CheckCircle2 color="#7C847B" size={11} /><Text style={styles.notesText}>Health &amp; Notes</Text></Pressable>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#F1EDE3', flex: 1 },
  content: { alignSelf: 'center', maxWidth: 560, padding: 18, paddingBottom: 130, width: '100%' },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingTop: 2 },
  title: { color: '#1B2B20', fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: '#718276', fontSize: 11, marginTop: 3 },
  headerAddButton: { alignItems: 'center', backgroundColor: '#315D43', borderRadius: 16, elevation: 2, flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 9, shadowColor: '#315D43', shadowOpacity: 0.2, shadowRadius: 4 },
  headerAddText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', marginLeft: 4 },
  petList: { gap: 9, marginTop: 14 },
  petCard: { backgroundColor: '#FFFDF8', borderColor: '#E5DDD0', borderRadius: 19, borderWidth: 1, elevation: 1, padding: 10, shadowColor: '#5B4B37', shadowOpacity: 0.06, shadowRadius: 7 },
  petCardContent: { alignItems: 'center', flex: 1, flexDirection: 'row', minWidth: 0 },
  petCardSelected: { borderColor: '#F2A13B', borderWidth: 1.4, shadowOpacity: 0.12 },
  petImage: { backgroundColor: '#EFE9DF', borderColor: '#EAE4D7', borderRadius: 32, borderWidth: 1, height: 64, width: 64 },
  petDetails: { flex: 1, marginLeft: 10, minWidth: 0 },
  petTitleRow: { alignItems: 'center', flexDirection: 'row' },
  petName: { color: '#1F2E23', fontSize: 15, fontWeight: '800', marginRight: 6 },
  primaryPill: { backgroundColor: '#DDEDE2', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  primaryText: { color: '#3D7952', fontSize: 8, fontWeight: '800', letterSpacing: 0.3 },
  breed: { color: '#718276', fontSize: 11, marginTop: 3 },
  metrics: { alignItems: 'center', flexDirection: 'row', gap: 10, marginTop: 6 },
  metric: { alignItems: 'center', flexDirection: 'row' },
  metricText: { color: '#55675A', fontSize: 10, fontWeight: '600', marginLeft: 3 },
  cardDivider: { backgroundColor: '#E9E1D5', height: 1, marginTop: 7 },
  cardActions: { alignItems: 'center', flexDirection: 'row', gap: 6, marginTop: 7 },
  actionPill: { alignItems: 'center', backgroundColor: '#E4F0E7', borderRadius: 10, flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 5 },
  actionText: { color: '#3D7050', fontSize: 9, fontWeight: '700', marginLeft: 3 },
  notesPill: { backgroundColor: '#F1ECE3' },
  notesText: { color: '#6B716A', fontSize: 9, fontWeight: '700', marginLeft: 3 },
  emptyState: { alignItems: 'center', backgroundColor: '#FFFDF8', borderColor: '#EDE8DE', borderRadius: 20, borderWidth: 1, padding: 30 },
  emptyTitle: { color: '#425548', fontSize: 14, fontWeight: '700', marginTop: 8 },
  emptyText: { color: '#718276', fontSize: 12, marginTop: 4 },
});
