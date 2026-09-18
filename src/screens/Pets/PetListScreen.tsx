import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CalendarDays, Check, CheckCircle2, ChevronRight, PawPrint, Plus, Search, SlidersHorizontal, Trash2, Weight, X } from 'lucide-react-native';
import { SkeletonScreen } from '../../components/Loading/Skeleton';
import { deletePet, getCareLogs, getPets } from '../../database/petpalsDatabase';
import { useSQLiteContext } from 'expo-sqlite';
import { Pet } from '../../types/pet';

type Props = { onOpenAddPet: () => void; onOpenPet?: (pet: Pet) => void };
type StatusFilter = 'all' | 'healthy' | 'attention';

const avatarSources = {
  dog: require('../../assets/images/cartoon_dog_avatar_1789624318697.jpg'),
  cat: require('../../assets/images/cartoon_cat_avatar_1789624329620.jpg'),
  jordan: require('../../assets/images/jordan_avatar_photo_1789667660941.jpg'),
};

export function PetListScreen({ onOpenAddPet, onOpenPet }: Props) {
  const db = useSQLiteContext();
  const [petsData, setPetsData] = useState<Pet[]>([]);
  const [logs, setLogs] = useState<import('../../types/pet').CareLog[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedPetId, setSelectedPetId] = useState('');

  useEffect(() => {
    Promise.all([getPets(db), getCareLogs(db)])
      .then(([nextPets, nextLogs]) => {
        setPetsData(nextPets);
        setLogs(nextLogs);
        setSelectedPetId((current) => current || nextPets[0]?.id || '');
      })
      .finally(() => setDataLoading(false));
  }, [db]);

  const pets = useMemo(() => petsData.filter((pet) => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchesQuery = !normalizedQuery || [pet.name, pet.breed, pet.species].some((value) => value.toLowerCase().includes(normalizedQuery));
    const needsAttention = pet.name === 'Milo' || pet.breed.toLowerCase().includes('shih tzu');
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'attention' ? needsAttention : !needsAttention);
    return matchesQuery && matchesStatus;
  }), [petsData, query, statusFilter]);

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
            setLogs((current) => current.filter((log) => log.petId !== pet.id));
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
            <Text style={styles.title}>My Pets</Text>
            <Text style={styles.subtitle}>Your furry friends, all in one place.</Text>
          </View>
          <View style={styles.filterWrap}>
            <Pressable accessibilityRole="button" accessibilityLabel="Filter pets" accessibilityState={{ expanded: filterOpen }} onPress={() => setFilterOpen((open) => !open)} style={[styles.filterButton, (filterOpen || statusFilter !== 'all') && styles.filterButtonActive]}>
              <SlidersHorizontal color="#526558" size={17} strokeWidth={2.2} />
            </Pressable>
            {filterOpen && (
              <View style={styles.filterMenu}>
                <Text style={styles.filterHeading}>FILTER BY STATUS</Text>
                {(['all', 'healthy', 'attention'] as StatusFilter[]).map((filter) => (
                  <Pressable key={filter} onPress={() => { setStatusFilter(filter); setFilterOpen(false); }} style={[styles.filterOption, statusFilter === filter && styles.filterOptionActive]}>
                    <Text style={[styles.filterOptionText, statusFilter === filter && styles.filterOptionTextActive]}>{filter === 'all' ? 'All Companions' : filter === 'healthy' ? 'Healthy' : 'Needs Attention'}</Text>
                    {statusFilter === filter && <Check color="#355A43" size={14} strokeWidth={2.6} />}
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.searchBox}>
          <Search color="#8A9B8F" size={17} />
          <TextInput accessibilityLabel="Search pets" value={query} onChangeText={setQuery} placeholder="Search pets..." placeholderTextColor="#8A9B8F" style={styles.searchInput} />
          {!!query && <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery('')} style={styles.clearSearch}><X color="#55675A" size={13} /></Pressable>}
        </View>

        <View style={styles.petList}>
          {pets.map((pet) => <PetCard key={pet.id} pet={pet} logs={logs} selected={pet.id === selectedPetId} onPress={() => { setSelectedPetId(pet.id); onOpenPet?.(pet); }} onDelete={() => confirmDelete(pet)} />)}
          {!pets.length && (
            <View style={styles.emptyState}>
              <PawPrint color="#A0B0A5" size={28} />
              <Text style={styles.emptyTitle}>No pets found</Text>
              <Text style={styles.emptyText}>Try a different search or filter.</Text>
              {!!query && <Pressable onPress={() => setQuery('')}><Text style={styles.clearText}>Clear search</Text></Pressable>}
            </View>
          )}
        </View>

        <Pressable accessibilityRole="button" onPress={onOpenAddPet} style={styles.addButton}>
          <Plus color="#FFFFFF" size={18} strokeWidth={2.6} />
          <Text style={styles.addButtonText}>Add a Pet</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function PetCard({ pet, logs: allLogs, selected, onPress, onDelete }: { pet: Pet; logs: import('../../types/pet').CareLog[]; selected: boolean; onPress: () => void; onDelete: () => void }) {
  const logs = allLogs.filter((log) => log.petId === pet.id);
  const completedCount = logs.filter((log) => log.completed).length;
  const needsAttention = pet.name === 'Milo' || pet.breed.toLowerCase().includes('shih tzu');

  return (
    <View style={[styles.petCard, selected && styles.petCardSelected]}>
      <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={styles.petCardContent}>
        <Image source={avatarSources[pet.avatar]} style={styles.petImage} />
        <View style={styles.petDetails}>
          <View style={styles.petTitleRow}>
            <Text numberOfLines={1} style={styles.petName}>{pet.name}</Text>
            <View style={[styles.statusPill, needsAttention ? styles.attentionPill : styles.healthyPill]}>
              <View style={[styles.statusDot, needsAttention ? styles.attentionDot : styles.healthyDot]} />
              <Text style={[styles.statusText, needsAttention ? styles.attentionText : styles.healthyText]}>{needsAttention ? 'Needs Attention' : 'Healthy'}</Text>
            </View>
          </View>
          <Text numberOfLines={1} style={styles.breed}>{pet.breed}</Text>
          <View style={styles.metrics}>
            <View style={styles.metric}><Weight color="#718276" size={14} /><Text style={styles.metricText}>{pet.weight} {pet.weightUnit}</Text></View>
            <View style={styles.metric}><CalendarDays color="#718276" size={14} /><Text style={styles.metricText}>{pet.ageYears} {pet.ageYears === 1 ? 'yr' : 'yrs'}{pet.ageMonths ? ` ${pet.ageMonths}m` : ''}</Text></View>
            <View style={styles.metric}><CheckCircle2 color="#467356" size={14} /><Text style={styles.doneText}>{completedCount}/{logs.length || 3} Done</Text></View>
          </View>
        </View>
        <ChevronRight color={selected ? '#527763' : '#BAC2BB'} size={17} />
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${pet.name}`} onPress={onDelete} style={styles.deleteButton}>
        <Trash2 color="#B56B5A" size={16} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#F1EDE3', flex: 1 },
  content: { padding: 20, paddingBottom: 140 },
  header: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4 },
  title: { color: '#1B2B20', fontSize: 28, fontWeight: '800', letterSpacing: -0.8 },
  subtitle: { color: '#718276', fontSize: 13, marginTop: 3 },
  filterWrap: { position: 'relative' },
  filterButton: { alignItems: 'center', backgroundColor: '#FAF7F0', borderColor: '#E8E2D5', borderRadius: 20, borderWidth: 1, height: 40, justifyContent: 'center', width: 40 },
  filterButtonActive: { backgroundColor: '#EAE5DA', borderColor: '#557A63' },
  filterMenu: { backgroundColor: '#FFFFFF', borderColor: '#EDE8DE', borderRadius: 16, elevation: 8, padding: 8, position: 'absolute', right: 0, shadowColor: '#26392C', shadowOpacity: 0.16, shadowRadius: 12, top: 47, width: 180, zIndex: 5 },
  filterHeading: { color: '#7A8C80', fontSize: 9, fontWeight: '800', letterSpacing: 0.8, paddingHorizontal: 9, paddingVertical: 6 },
  filterOption: { alignItems: 'center', borderRadius: 11, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 9, paddingVertical: 9 },
  filterOptionActive: { backgroundColor: '#E8F0EA' },
  filterOptionText: { color: '#55675A', fontSize: 11, fontWeight: '600' },
  filterOptionTextActive: { color: '#355A43', fontWeight: '700' },
  searchBox: { alignItems: 'center', backgroundColor: '#F5F1E8', borderColor: '#EAE3D6', borderRadius: 16, borderWidth: 1, flexDirection: 'row', marginTop: 22, paddingHorizontal: 13, height: 46 },
  searchInput: { color: '#1F2E23', flex: 1, fontSize: 13.5, marginLeft: 9, paddingVertical: 0 },
  clearSearch: { alignItems: 'center', backgroundColor: '#DDD6C9', borderRadius: 10, height: 20, justifyContent: 'center', width: 20 },
  petList: { gap: 12, marginTop: 14 },
  petCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#EDE7DC', borderRadius: 26, borderWidth: 1, elevation: 2, flexDirection: 'row', minHeight: 112, padding: 14, shadowColor: '#28372D', shadowOpacity: 0.06, shadowRadius: 10 },
  petCardContent: { alignItems: 'center', flex: 1, flexDirection: 'row', minWidth: 0 },
  petCardSelected: { borderColor: '#527763', borderWidth: 1.5, shadowOpacity: 0.12 },
  deleteButton: { alignItems: 'center', backgroundColor: '#FBEAE5', borderRadius: 16, height: 32, justifyContent: 'center', marginLeft: 6, width: 32 },
  petImage: { backgroundColor: '#EFE9DF', borderColor: '#EAE4D7', borderRadius: 21, borderWidth: 1, height: 82, width: 82 },
  petDetails: { flex: 1, marginLeft: 13, minWidth: 0 },
  petTitleRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  petName: { color: '#1F2E23', flex: 1, fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  statusPill: { alignItems: 'center', borderRadius: 12, flexDirection: 'row', marginLeft: 5, paddingHorizontal: 7, paddingVertical: 4 },
  healthyPill: { backgroundColor: '#E8F0EA' },
  attentionPill: { backgroundColor: '#FDF2EA' },
  statusDot: { borderRadius: 3, height: 6, marginRight: 4, width: 6 },
  healthyDot: { backgroundColor: '#467356' },
  attentionDot: { backgroundColor: '#E06424' },
  statusText: { fontSize: 9, fontWeight: '700' },
  healthyText: { color: '#3E654C' },
  attentionText: { color: '#B85820' },
  breed: { color: '#718276', fontSize: 12, marginTop: 3 },
  metrics: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: 11 },
  metric: { alignItems: 'center', flexDirection: 'row' },
  metricText: { color: '#55675A', fontSize: 10, fontWeight: '600', marginLeft: 3 },
  doneText: { color: '#3E654C', fontSize: 10, fontWeight: '700', marginLeft: 3 },
  emptyState: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#EDE8DE', borderRadius: 24, borderWidth: 1, padding: 30 },
  emptyTitle: { color: '#425548', fontSize: 14, fontWeight: '700', marginTop: 8 },
  emptyText: { color: '#718276', fontSize: 12, marginTop: 4 },
  clearText: { color: '#557A63', fontSize: 12, fontWeight: '700', marginTop: 10 },
  addButton: { alignItems: 'center', backgroundColor: '#527763', borderRadius: 16, elevation: 2, flexDirection: 'row', justifyContent: 'center', marginTop: 14, minHeight: 50, shadowColor: '#486E57', shadowOpacity: 0.25, shadowRadius: 8 },
  addButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', marginLeft: 8 },
});
