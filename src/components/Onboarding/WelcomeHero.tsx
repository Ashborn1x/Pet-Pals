import { Animated, View } from 'react-native';
import { onboardingStyles as styles } from '../../screens/Welcome/styles';
import { OnboardingSlide } from '../../types/navigation';

type Props = {
  slide: OnboardingSlide;
  slideOpacity: Animated.Value;
  slideScale: Animated.Value;
};

export function WelcomeHero({ slide, slideOpacity, slideScale }: Props) {
  return (
    <View
      style={[styles.hero, { backgroundColor: slide.bgTint }]}
    >
      <Animated.Image
        accessibilityLabel={slide.alt}
        source={slide.image}
        style={[styles.heroImage, { opacity: slideOpacity, transform: [{ scale: slideScale }] }]}
        resizeMode="cover"
      />
    </View>
  );
}
