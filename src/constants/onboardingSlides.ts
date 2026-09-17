import { OnboardingSlide } from '../types/navigation';

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: 0,
    title: 'Pet Care\nMade Simple',
    description: 'Create a convenient profile for your pet and manage every aspect of their care in one place.',
    image: require('../assets/images/clay_pet_care_simple_1789625871275.jpg'),
    alt: '3D clay cartoon puppy with dog food bowl, bone and toys',
    bgTint: '#FBEBD9',
  },
  {
    id: 1,
    title: 'Health & Wellness\nUnder Control',
    description: "Track vaccinations, medical records, and important events to ensure your furry friend's wellbeing.",
    image: require('../assets/images/clay_pet_wellness_1789625894177.jpg'),
    alt: '3D clay puppy with first-aid kit, medicine bottle, and vaccination shield',
    bgTint: '#EDE7F6',
  },
  {
    id: 2,
    title: 'Daily Care &\nSmart Routines',
    description: 'Schedule feedings, log fresh water, track active walks, and celebrate daily care streaks.',
    image: require('../assets/images/clay_cat_daily_routine_1789625909416.jpg'),
    alt: '3D clay kitten and puppy with food bowl and routine calendar',
    bgTint: '#EBF1EC',
  },
];
