import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ONBOARDING_COMPLETED_KEY } from '../../constants/storage';
import { WelcomeScreen } from './WelcomeScreen';

export function WelcomeRoute() {
  const router = useRouter();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY)
      .then((completed) => {
        if (completed === 'true') {
          router.replace('/dashboard');
          return;
        }
        if (mounted) setCheckingOnboarding(false);
      })
      .catch(() => {
        if (mounted) setCheckingOnboarding(false);
      });

    return () => { mounted = false; };
  }, [router]);

  const handleAddPet = () => {
    router.push('/add-pet');
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    router.replace('/dashboard');
  };

  if (checkingOnboarding) return <View style={{ backgroundColor: '#EFECE3', flex: 1 }} />;

  return <WelcomeScreen onAddPet={handleAddPet} onSkip={handleSkip} />;
}
