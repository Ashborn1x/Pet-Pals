import { View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WelcomeContent } from '../../components/Onboarding/WelcomeContent';
import { WelcomeHero } from '../../components/Onboarding/WelcomeHero';
import { useOnboarding } from '../../hooks/useOnboarding';
import { onboardingStyles as styles } from './styles';
import { WelcomeScreenProps } from '../../types/navigation';

export function WelcomeScreen({ onAddPet, onSkip }: WelcomeScreenProps) {
  const onboarding = useOnboarding();
  const insets = useSafeAreaInsets();

  const handlePrimaryAction = () => {
    if (onboarding.isLastSlide) {
      onAddPet();
    } else {
      onboarding.goToNext();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <WelcomeHero
          slide={onboarding.activeSlide}
          slideOpacity={onboarding.animation.slideOpacity}
          slideScale={onboarding.animation.slideScale}
        />
        <WelcomeContent
          slideIndex={onboarding.currentSlide}
          title={onboarding.activeSlide.title}
          description={onboarding.activeSlide.description}
          isLastSlide={onboarding.isLastSlide}
          textOpacity={onboarding.animation.textOpacity}
          textOffset={onboarding.animation.textOffset}
          onSelectSlide={onboarding.setCurrentSlide}
          onPrimaryAction={handlePrimaryAction}
          onSkip={onSkip}
          bottomInset={insets.bottom}
        />
      </View>
    </SafeAreaView>
  );
}
