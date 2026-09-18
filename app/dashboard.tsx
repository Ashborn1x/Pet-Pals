import { useRouter } from 'expo-router';
import { DashboardScreen } from '../src/screens/Dashboard/DashboardScreen';

export default function DashboardRoute() {
  const router = useRouter();

  return <DashboardScreen onOpenAddPet={() => router.push('/add-pet')} onReturnToWelcome={() => router.replace('/')} />;
}
