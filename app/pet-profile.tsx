import { useLocalSearchParams, useRouter } from 'expo-router';
import { PetProfileScreen } from '../src/screens/Pets/PetProfileScreen';

export default function PetProfileRoute() {
  const router = useRouter();
  const { petId } = useLocalSearchParams<{ petId?: string }>();

  return <PetProfileScreen petId={petId} onBack={() => router.back()} onEditPet={(pet) => router.push({ pathname: '/edit-pet', params: { petId: pet.id } })} />;
}
