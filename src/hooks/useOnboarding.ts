import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { ONBOARDING_SLIDES } from '../constants/onboardingSlides';

export function useOnboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideOpacity = useRef(new Animated.Value(1)).current;
  const slideScale = useRef(new Animated.Value(1)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;
  const textOffset = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    slideOpacity.setValue(0);
    slideScale.setValue(1.02);
    textOpacity.setValue(0);
    textOffset.setValue(4);

    Animated.parallel([
      Animated.timing(slideOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(slideScale, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(textOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(textOffset, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [currentSlide, slideOpacity, slideScale, textOffset, textOpacity]);

  const goToNext = useCallback(() => {
    setCurrentSlide((slide) => Math.min(slide + 1, ONBOARDING_SLIDES.length - 1));
  }, []);

  const goToPrevious = useCallback(() => {
    setCurrentSlide((slide) => Math.max(slide - 1, 0));
  }, []);

  return {
    currentSlide,
    activeSlide: ONBOARDING_SLIDES[currentSlide],
    isFirstSlide: currentSlide === 0,
    isLastSlide: currentSlide === ONBOARDING_SLIDES.length - 1,
    setCurrentSlide,
    goToNext,
    goToPrevious,
    animation: { slideOpacity, slideScale, textOpacity, textOffset },
  };
}
