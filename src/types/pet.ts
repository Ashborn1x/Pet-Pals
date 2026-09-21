export type PetSpecies = 'dog' | 'cat' | 'rabbit' | 'bird' | 'other';

export type CareType = 'meal' | 'water' | 'walk' | 'meds' | 'vet' | 'weight' | 'note';

export type Pet = {
  id: string;
  name: string;
  species: PetSpecies;
  breed: string;
  ageYears: number;
  ageMonths: number;
  weight: number;
  weightUnit: 'lbs' | 'kg';
  photoUri: string | null;
  /** Kept for database compatibility; pet screens derive the default image from species. */
  avatar: PetSpecies | 'jordan';
};

export type CareLog = {
  id: string;
  petId: string;
  type: CareType;
  title: string;
  detail: string;
  time: string;
  date: string;
  completed: boolean;
};
