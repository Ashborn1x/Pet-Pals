import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { WelcomeScreen } from './WelcomeScreen';

export function WelcomeRoute() {
  const router = useRouter();

  const handleAddPet = () => {
    router.push('/add-pet');
  };

  const handleSkip = () => {
    Alert.alert('Maybe later', 'You can add a pet anytime from the home screen.');
  };

  return <WelcomeScreen onAddPet={handleAddPet} onSkip={handleSkip} />;
}
