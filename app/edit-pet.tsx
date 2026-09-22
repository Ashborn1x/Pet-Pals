import { Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { AddPetScreen } from '../src/screens/AddPet/AddPetScreen';
import { getPet, updatePet } from '../src/database/petpalsDatabase';
import type { Pet } from '../src/types/pet';
import { SkeletonScreen } from '../src/components/Loading/Skeleton';

export default function EditPetRoute() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { petId } = useLocalSearchParams<{ petId?: string }>();
  const [pet, setPet] = useState<Pet>();

  useEffect(() => {
    if (petId) getPet(db, petId).then(setPet);
  }, [db, petId]);

  if (!pet) return <SkeletonScreen variant="pets" />;

  const handleSave = async (nextPet: Pet) => {
    try {
      await updatePet(db, pet.id, nextPet);
      Alert.alert('Pet updated', `${nextPet.name}'s profile has been updated.`, [
        { text: 'OK', onPress: () => router.replace({ pathname: '/pet-profile', params: { petId: pet.id } }) },
      ]);
    } catch (error) {
      console.error('Unable to update pet locally', error);
      Alert.alert('Unable to update pet', 'Please reload the app and try again.');
    }
  };

  return <AddPetScreen initialPet={pet} mode="edit" onBack={() => router.back()} onSave={handleSave} />;
}
