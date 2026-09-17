import { ImageSourcePropType } from 'react-native';

export type OnboardingSlide = {
  id: number;
  title: string;
  description: string;
  image: ImageSourcePropType;
  alt: string;
  bgTint: string;
};

export type WelcomeScreenProps = {
  onAddPet: () => void;
};
