import { Animated, Pressable, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { onboardingStyles as styles } from '../../screens/Welcome/styles';
import { OnboardingSlide } from '../../types/navigation';

type Props = {
  slide: OnboardingSlide;
  slideOpacity: Animated.Value;
  slideScale: Animated.Value;
  onPrevious: () => void;
  onNext: () => void;
  showPrevious: boolean;
  showNext: boolean;
};

export function WelcomeHero({ slide, slideOpacity, slideScale, onPrevious, onNext, showPrevious, showNext }: Props) {
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
      {showPrevious && <HeroButton label="Previous slide" onPress={onPrevious} side="left" />}
      {showNext && <HeroButton label="Next slide" onPress={onNext} side="right" />}
    </View>
  );
}

type HeroButtonProps = { label: string; onPress: () => void; side: 'left' | 'right' };

function HeroButton({ label, onPress, side }: HeroButtonProps) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.chevronButton, side === 'left' ? styles.leftChevron : styles.rightChevron, pressed && styles.pressed]}
    >
      <Icon color="#4A5D50" size={22} strokeWidth={1.8} />
    </Pressable>
  );
}
