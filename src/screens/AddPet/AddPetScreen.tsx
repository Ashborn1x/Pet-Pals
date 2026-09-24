import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  ArrowLeft,
  Bird,
  Bone,
  Camera,
  CalendarDays,
  Cat,
  Check,
  ChevronDown,
  ChevronUp,
  Dog,
  PawPrint,
  Rabbit,
  Sparkles,
  Weight,
} from 'lucide-react-native';
import { Pet, PetGender, PetSpecies } from '../../types/pet';
import { getPetAvatarSource } from '../../constants/petAvatars';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { addPetStyles as styles } from './styles';

type WeightUnit = 'lbs' | 'kg';

type Props = {
  onBack: () => void;
  onSave: (pet: Pet) => void;
  initialPet?: Pet;
  mode?: 'create' | 'edit';
};

const SPECIES: { key: PetSpecies; label: string }[] = [
  { key: 'dog', label: 'Dog' },
  { key: 'cat', label: 'Cat' },
  { key: 'rabbit', label: 'Rabbit' },
  { key: 'bird', label: 'Bird' },
  { key: 'other', label: 'Other' },
];

const BREEDS: Record<PetSpecies, string[]> = {
  dog: ['Golden Retriever', 'Labrador Retriever', 'French Bulldog', 'German Shepherd', 'Poodle', 'Beagle', 'Corgi', 'Mixed Dog'],
  cat: ['Domestic Shorthair', 'Calico', 'Persian', 'Maine Coon', 'Siamese', 'Ragdoll', 'Bengal'],
  rabbit: ['Holland Lop', 'Netherland Dwarf', 'Mini Rex', 'Lionhead', 'Flemish Giant'],
  bird: ['Parakeet / Budgie', 'Cockatiel', 'Canary', 'Lovebird', 'Conure'],
  other: ['Hamster', 'Guinea Pig', 'Ferret', 'Hedgehog', 'Other Companion'],
};

function SpeciesIcon({ species, color = '#627C6B', size = 20 }: { species: PetSpecies; color?: string; size?: number }) {
  const Icon = species === 'dog' ? Dog : species === 'cat' ? Cat : species === 'rabbit' ? Rabbit : species === 'bird' ? Bird : Sparkles;
  return <Icon color={color} size={size} strokeWidth={2} />;
}

export function AddPetScreen({ onBack, onSave, initialPet, mode = 'create' }: Props) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(initialPet?.name ?? '');
  const [species, setSpecies] = useState<PetSpecies>(initialPet?.species ?? 'dog');
  const [gender, setGender] = useState<PetGender>(initialPet?.gender ?? 'unknown');
  const [birthDate, setBirthDate] = useState(initialPet?.birthDate ?? '');
  const [birthDateEstimated, setBirthDateEstimated] = useState(initialPet?.birthDateEstimated ?? false);
  const [birthDatePickerOpen, setBirthDatePickerOpen] = useState(false);
  const [breed, setBreed] = useState(initialPet?.breed ?? BREEDS.dog[0]);
  const [customBreed, setCustomBreed] = useState(initialPet?.breed && !BREEDS[initialPet.species].includes(initialPet.breed) ? initialPet.breed : '');
  const [weight, setWeight] = useState(String(initialPet?.weight ?? 24));
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(initialPet?.weightUnit ?? 'lbs');
  const [photoUri, setPhotoUri] = useState<string | null>(initialPet?.photoUri ?? null);
  const [typeOpen, setTypeOpen] = useState(false);
  const [breedOpen, setBreedOpen] = useState(false);
  const [error, setError] = useState('');

  const currentSpecies = SPECIES.find((item) => item.key === species) ?? SPECIES[0];

  const selectSpecies = (nextSpecies: PetSpecies) => {
    setSpecies(nextSpecies);
    setBreed(BREEDS[nextSpecies][0]);
    setCustomBreed('');
    setTypeOpen(false);
  };

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Allow photo access to choose a picture for your pet.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const save = () => {
    if (!name.trim()) {
      setError('Please enter your pet’s name');
      return;
    }

    onSave({
      id: initialPet?.id ?? '',
      name: name.trim(),
      species,
      gender,
      birthDate: birthDate.trim() || null,
      birthDateEstimated: Boolean(birthDate.trim() && birthDateEstimated),
      breed: (breed === 'Other' ? customBreed : breed).trim() || 'Companion Pet',
      ageYears: initialPet?.ageYears ?? 0,
      ageMonths: initialPet?.ageMonths ?? 0,
      weight: Number.parseFloat(weight) || 10,
      weightUnit,
      photoUri,
      avatar: species,
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 12 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} style={styles.backButton}>
          <ArrowLeft color="#2C3B30" size={21} strokeWidth={2.2} />
        </Pressable>

        <View style={styles.heading}>
          <Text style={styles.title}>{mode === 'edit' ? 'Edit Pet' : 'Add a Pet'}</Text>
          <Text style={styles.subtitle}>Tell us a little about your pet.{`\n`}We’ll take care of the rest.</Text>
        </View>

        <View accessible accessibilityLabel="Pet photo section" style={styles.photoCard}>
          <Image accessibilityLabel={photoUri ? 'Selected pet photo' : `${currentSpecies.label} default preview`} source={photoUri ? { uri: photoUri } : getPetAvatarSource(species)} style={styles.previewImage} />
          <Pressable accessibilityRole="button" accessibilityLabel={photoUri ? 'Change pet photo' : 'Add pet photo'} onPress={pickPhoto} style={styles.photoButton}>
            <Camera color="#557A63" size={21} strokeWidth={1.9} />
            <Text style={styles.addPhotoText}>{photoUri ? 'Change & Crop Photo' : 'Add & Crop Photo'}</Text>
          </Pressable>
          <Text style={styles.photoHint}>Choose a photo and crop it to a square</Text>
        </View>

        <View style={styles.fieldsCard}>
          <View style={styles.fieldRow}>
            <View style={styles.greenBadge}><PawPrint color="#557A63" size={20} strokeWidth={2} /></View>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput
                accessibilityLabel="Pet name"
                value={name}
                onChangeText={(value) => { setName(value); setError(''); }}
                placeholder="Enter your pet’s name"
                placeholderTextColor="#A0B0A5"
                style={styles.input}
                returnKeyType="next"
              />
            </View>
          </View>

          <View style={styles.divider} />
          <View style={styles.fieldRow}>
            <View style={styles.greenBadge}><CalendarDays color="#557A63" size={20} strokeWidth={2} /></View>
            <View style={styles.genderContent}><Text style={styles.fieldLabel}>Birth date <Text style={styles.optionalLabel}>(optional)</Text></Text><Pressable accessibilityRole="button" accessibilityLabel="Choose birth date" onPress={() => setBirthDatePickerOpen(true)} style={styles.dateValue}><Text style={[styles.fieldValue, !birthDate && styles.placeholderValue]}>{birthDate || 'Choose a date'}</Text></Pressable>{birthDatePickerOpen && <DateTimePicker value={parseBirthDate(birthDate)} mode="date" display="default" maximumDate={new Date()} onChange={(_, value) => { setBirthDatePickerOpen(false); if (value) setBirthDate(formatBirthDate(value)); }} />}</View><Pressable accessibilityRole="checkbox" accessibilityState={{ checked: birthDateEstimated, disabled: !birthDate }} disabled={!birthDate} onPress={() => setBirthDateEstimated((current) => !current)} style={[styles.estimatedButton, birthDateEstimated && styles.activeEstimated, !birthDate && styles.disabledEstimated]}><Text style={[styles.estimatedText, birthDateEstimated && styles.activeEstimatedText]}>Estimated</Text></Pressable>
          </View>

          <View style={styles.divider} />
          <View style={styles.fieldRow}>
            <View style={styles.greenBadge}><Text style={styles.genderGlyph}>♀♂</Text></View>
            <View style={styles.genderContent}><Text style={styles.fieldLabel}>Gender</Text><View style={styles.genderOptions}>{(['female', 'male', 'unknown'] as PetGender[]).map((item) => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: gender === item }} onPress={() => setGender(item)} style={[styles.genderButton, gender === item && styles.activeGender]}><Text style={[styles.genderText, gender === item && styles.activeGenderText]}>{item === 'unknown' ? 'Not set' : item[0].toUpperCase() + item.slice(1)}</Text></Pressable>)}</View></View>
          </View>
          <View style={styles.divider} />
          <View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Pet type, ${currentSpecies.label}`}
              accessibilityState={{ expanded: typeOpen }}
              onPress={() => { setTypeOpen((open) => !open); setBreedOpen(false); }}
              style={styles.fieldRow}
            >
              <View style={styles.apricotBadge}><SpeciesIcon species={species} color="#A67140" /></View>
              <View style={styles.fieldContent}><Text style={styles.fieldLabel}>Type</Text><Text style={styles.fieldValue}>{currentSpecies.label}</Text></View>
              {typeOpen ? <ChevronUp color="#8C9C90" size={18} /> : <ChevronDown color="#8C9C90" size={18} />}
            </Pressable>
            {typeOpen && (
              <View style={styles.optionsPanel}>
                {SPECIES.map((item) => (
                  <Pressable
                    key={item.key}
                    accessibilityRole="button"
                    accessibilityState={{ selected: species === item.key }}
                    onPress={() => selectSpecies(item.key)}
                    style={[styles.option, species === item.key && styles.selectedOption]}
                  >
                    <SpeciesIcon species={item.key} color={species === item.key ? '#FFFFFF' : '#627C6B'} size={16} />
                    <Text style={[styles.optionText, species === item.key && styles.selectedOptionText]}>{item.label}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <View style={styles.divider} />
          <View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Breed, ${breed}`}
              accessibilityState={{ expanded: breedOpen }}
              onPress={() => { setBreedOpen((open) => !open); setTypeOpen(false); }}
              style={styles.fieldRow}
            >
              <View style={styles.coralBadge}><Bone color="#C46A55" size={20} strokeWidth={2} /></View>
              <View style={styles.fieldContent}><Text style={styles.fieldLabel}>Breed</Text><Text style={styles.fieldValue}>{breed}</Text></View>
              {breedOpen ? <ChevronUp color="#8C9C90" size={18} /> : <ChevronDown color="#8C9C90" size={18} />}
            </Pressable>
            {breedOpen && (
              <View style={styles.breedPanel}>
                <Text style={styles.panelLabel}>Popular {currentSpecies.label} Breeds</Text>
                {BREEDS[species].map((item) => (
                  <Pressable key={item} onPress={() => { setBreed(item); if (item === 'Other') setCustomBreed(customBreed || (BREEDS[species].includes(breed) ? '' : breed)); setBreedOpen(false); }} style={styles.breedOption}>
                    <Text style={styles.optionText}>{item}</Text>
                    {breed === item && <Check color="#627C6B" size={16} strokeWidth={3} />}
                  </Pressable>
                ))}
                {(breed === 'Other' || !!customBreed) && <TextInput accessibilityLabel="Custom breed" value={customBreed} onChangeText={setCustomBreed} placeholder="Type your breed (optional)" placeholderTextColor="#A0B0A5" style={styles.customBreedInput} />}
              </View>
            )}
          </View>

          <View style={styles.divider} />
          <View style={styles.fieldRow}>
            <View style={styles.greenBadge}><Weight color="#557A63" size={20} strokeWidth={2} /></View>
            <View style={styles.fieldContent}><Text style={styles.fieldLabel}>Weight</Text><TextInput accessibilityLabel="Pet weight" value={weight} onChangeText={(value) => setWeight(value.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" placeholder="Enter weight" placeholderTextColor="#A0B0A5" style={styles.input} /></View>
            <View style={styles.unitToggle}>
              {(['lbs', 'kg'] as WeightUnit[]).map((unit) => (
                <Pressable key={unit} onPress={() => setWeightUnit(unit)} style={[styles.unitButton, weightUnit === unit && styles.activeUnit]}>
                  <Text style={[styles.unitText, weightUnit === unit && styles.activeUnitText]}>{unit}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {!!error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.bottomActions}>
          <Pressable accessibilityRole="button" onPress={save} style={styles.saveButton}><Text style={styles.saveText}>{mode === 'edit' ? 'Save Changes' : 'Save'}</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={onBack} style={styles.cancelButton}><Text style={styles.cancelText}>Cancel</Text></Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function parseBirthDate(value: string) {
  if (!value) return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function formatBirthDate(value: Date) {
  return value.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
