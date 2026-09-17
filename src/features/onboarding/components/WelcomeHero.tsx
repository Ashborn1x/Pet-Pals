import { Animated, Pressable, Text, View } from 'react-native';
import { onboardingStyles as styles } from '../styles';
import { OnboardingSlide } from '../types';

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
    <View style={[styles.hero, { backgroundColor: slide.bgTint }]}>
      <Animated.Image
        accessibilityLabel={slide.alt}
        source={slide.image}
        style={[styles.heroImage, { opacity: slideOpacity, transform: [{ scale: slideScale }] }]}
        resizeMode="cover"
      />
      {showPrevious && <HeroButton label="Previous slide" symbol="‹" onPress={onPrevious} side="left" />}
      {showNext && <HeroButton label="Next slide" symbol="›" onPress={onNext} side="right" />}
    </View>
  );
}

type HeroButtonProps = { label: string; symbol: string; onPress: () => void; side: 'left' | 'right' };

function HeroButton({ label, symbol, onPress, side }: HeroButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.chevronButton, side === 'left' ? styles.leftChevron : styles.rightChevron, pressed && styles.pressed]}
    >
      <Text style={styles.chevron}>{symbol}</Text>
    </Pressable>
  );
}
