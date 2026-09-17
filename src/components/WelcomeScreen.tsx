import { View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WelcomeContent } from '../features/onboarding/components/WelcomeContent';
import { WelcomeHero } from '../features/onboarding/components/WelcomeHero';
import { useOnboarding } from '../features/onboarding/hooks/useOnboarding';
import { onboardingStyles as styles } from '../features/onboarding/styles';
import { WelcomeScreenProps } from '../features/onboarding/types';

export function WelcomeScreen({ onAddPet }: WelcomeScreenProps) {
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
          onPrevious={onboarding.goToPrevious}
          onNext={onboarding.goToNext}
          showPrevious={!onboarding.isFirstSlide}
          showNext={!onboarding.isLastSlide}
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
          bottomInset={insets.bottom}
        />
      </View>
    </SafeAreaView>
  );
}
