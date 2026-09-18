import { useRouter } from 'expo-router';
import { PetListScreen } from '../src/screens/Pets/PetListScreen';

export default function PetsRoute() {
  const router = useRouter();

  return <PetListScreen onOpenAddPet={() => router.push('/add-pet')} onOpenPet={(pet) => router.push({ pathname: '/pet-profile', params: { petId: pet.id } })} />;
}
