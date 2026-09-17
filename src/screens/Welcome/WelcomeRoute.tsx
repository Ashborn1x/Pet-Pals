import { useRouter } from 'expo-router';
import { WelcomeScreen } from './WelcomeScreen';

export function WelcomeRoute() {
  const router = useRouter();

  const handleAddPet = () => {
    router.push('/add-pet');
  };

  const handleSkip = () => {
    router.replace('/dashboard');
  };

  return <WelcomeScreen onAddPet={handleAddPet} onSkip={handleSkip} />;
}
