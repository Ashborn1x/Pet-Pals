import { Animated, Pressable, Text, View } from 'react-native';
import { ONBOARDING_SLIDES } from '../data/onboardingSlides';
import { onboardingStyles as styles } from '../styles';

type Props = {
  slideIndex: number;
  title: string;
  description: string;
  isLastSlide: boolean;
  textOpacity: Animated.Value;
  textOffset: Animated.Value;
  onSelectSlide: (index: number) => void;
  onPrimaryAction: () => void;
  bottomInset: number;
};

export function WelcomeContent({ slideIndex, title, description, isLastSlide, textOpacity, textOffset, onSelectSlide, onPrimaryAction, bottomInset }: Props) {
  return (
    <View style={[styles.contentSheet, { paddingBottom: Math.max(96, 30 + bottomInset) }]}>
      <Animated.View style={[styles.textHolder, { opacity: textOpacity, transform: [{ translateY: textOffset }] }]}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </Animated.View>
      <View style={styles.pagination} accessibilityLabel="Slide navigation">
        {ONBOARDING_SLIDES.map((slide, index) => (
          <Pressable
            key={slide.id}
            accessibilityRole="button"
            accessibilityLabel={`Go to slide ${index + 1}`}
            accessibilityState={{ selected: slideIndex === index }}
            hitSlop={8}
            onPress={() => onSelectSlide(index)}
            style={[styles.dot, slideIndex === index ? styles.activeDot : styles.inactiveDot]}
          />
        ))}
      </View>
      <View style={styles.actionGroup}>
        <Pressable accessibilityRole="button" onPress={onPrimaryAction} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>{isLastSlide ? 'Add a Pet' : 'Next'}</Text>
          {!isLastSlide && <Text style={styles.nextArrow}>›</Text>}
        </Pressable>
      </View>
    </View>
  );
}
