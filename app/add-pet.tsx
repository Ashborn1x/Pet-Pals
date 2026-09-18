import { Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ONBOARDING_COMPLETED_KEY } from '../src/constants/storage';
import { addPet } from '../src/database/petpalsDatabase';
import { useSQLiteContext } from 'expo-sqlite';
import type { PetSpecies } from '../src/types/pet';
import { AddPetScreen } from '../src/screens/AddPet/AddPetScreen';

export default function AddPetRoute() {
  const router = useRouter();
  const db = useSQLiteContext();

  const handleSave = async (pet: { name: string; species: PetSpecies; breed: string; weight: number; weightUnit: 'lbs' | 'kg' }) => {
    try {
      await addPet(db, pet);
      await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');

      if (Platform.OS === 'web') {
        router.replace('/dashboard');
        return;
      }

      Alert.alert('Pet saved', 'Your pet profile has been created.', [
        { text: 'OK', onPress: () => router.replace('/dashboard') },
      ]);
    } catch (error) {
      console.error('Unable to save pet locally', error);
      Alert.alert('Unable to save pet', 'Please reload the app and try again.');
    }
  };

  return <AddPetScreen onBack={() => router.back()} onSave={handleSave} />;
}
