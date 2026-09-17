import { CareLog, Pet } from '../types/pet';

export const INITIAL_PETS: Pet[] = [
  { id: 'pet-1', name: 'Oliver', species: 'dog', breed: 'Golden Retriever Mix', ageYears: 2, ageMonths: 4, weight: 28.5, weightUnit: 'lbs', avatar: 'dog' },
  { id: 'pet-2', name: 'Luna', species: 'cat', breed: 'Calico Shorthair', ageYears: 1, ageMonths: 8, weight: 8.2, weightUnit: 'lbs', avatar: 'cat' },
];

export const INITIAL_LOGS: CareLog[] = [
  { id: 'log-1', petId: 'pet-1', type: 'meal', title: 'Morning Breakfast', detail: '1 cup salmon kibble', time: '08:15 AM', date: 'Today', completed: true },
  { id: 'log-2', petId: 'pet-1', type: 'water', title: 'Water Refill', detail: 'Fresh filtered bowl', time: '09:00 AM', date: 'Today', completed: true },
  { id: 'log-3', petId: 'pet-1', type: 'walk', title: 'Neighborhood Stroll', detail: '35 minutes around the park', time: '10:30 AM', date: 'Today', completed: true },
  { id: 'log-4', petId: 'pet-1', type: 'meds', title: 'Daily Omega-3 Chew', detail: 'Coat & joint supplement', time: '01:00 PM', date: 'Today', completed: false },
  { id: 'log-5', petId: 'pet-1', type: 'meal', title: 'Evening Dinner', detail: '1 cup kibble + broth', time: '06:30 PM', date: 'Today', completed: false },
  { id: 'log-6', petId: 'pet-2', type: 'meal', title: 'Evening Dinner', detail: 'Wet food portion', time: '06:00 PM', date: 'Today', completed: false },
];
