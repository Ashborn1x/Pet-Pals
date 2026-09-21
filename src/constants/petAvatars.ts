import type { ImageSourcePropType } from 'react-native';
import type { PetSpecies } from '../types/pet';

const petAvatarSources: Record<PetSpecies, ImageSourcePropType> = {
  dog: require('../assets/icons/dog_icon.png'),
  cat: require('../assets/icons/cat_icon.png'),
  rabbit: require('../assets/icons/bunny_icon.png'),
  bird: require('../assets/icons/bird_icon.png'),
  other: require('../assets/icons/other_icon.png'),
};

export function getPetAvatarSource(species: PetSpecies, photoUri?: string | null): ImageSourcePropType {
  if (photoUri) return { uri: photoUri };
  return petAvatarSources[species] ?? petAvatarSources.other;
}
