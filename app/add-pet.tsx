import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { AddPetScreen } from '../src/screens/AddPet/AddPetScreen';

export default function AddPetRoute() {
  const router = useRouter();

  const handleSave = () => {
    Alert.alert('Pet saved', 'Your pet profile has been created.', [
      { text: 'OK', onPress: () => router.replace('/dashboard') },
    ]);
  };

  return <AddPetScreen onBack={() => router.back()} onSave={handleSave} />;
}
