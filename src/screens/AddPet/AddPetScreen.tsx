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
import { PetSpecies } from '../../types/pet';
import { getPetAvatarSource } from '../../constants/petAvatars';
import * as ImagePicker from 'expo-image-picker';
import { addPetStyles as styles } from './styles';

type WeightUnit = 'lbs' | 'kg';

type Pet = {
  name: string;
  species: PetSpecies;
  breed: string;
  weight: number;
  weightUnit: WeightUnit;
  photoUri: string | null;
};

type Props = {
  onBack: () => void;
  onSave: (pet: Pet) => void;
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

export function AddPetScreen({ onBack, onSave }: Props) {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<PetSpecies>('dog');
  const [breed, setBreed] = useState(BREEDS.dog[0]);
  const [weight, setWeight] = useState('24');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('lbs');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [typeOpen, setTypeOpen] = useState(false);
  const [breedOpen, setBreedOpen] = useState(false);
  const [error, setError] = useState('');

  const currentSpecies = SPECIES.find((item) => item.key === species) ?? SPECIES[0];

  const selectSpecies = (nextSpecies: PetSpecies) => {
    setSpecies(nextSpecies);
    setBreed(BREEDS[nextSpecies][0]);
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
      name: name.trim(),
      species,
      breed: breed.trim() || 'Companion Pet',
      weight: Number.parseFloat(weight) || 10,
      weightUnit,
      photoUri,
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} style={styles.backButton}>
          <ArrowLeft color="#2C3B30" size={21} strokeWidth={2.2} />
        </Pressable>

        <View style={styles.heading}>
          <Text style={styles.title}>Add a Pet</Text>
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
                  <Pressable key={item} onPress={() => { setBreed(item); setBreedOpen(false); }} style={styles.breedOption}>
                    <Text style={styles.optionText}>{item}</Text>
                    {breed === item && <Check color="#627C6B" size={16} strokeWidth={3} />}
                  </Pressable>
                ))}
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
          <Pressable accessibilityRole="button" onPress={save} style={styles.saveButton}><Text style={styles.saveText}>Save</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={onBack} style={styles.cancelButton}><Text style={styles.cancelText}>Cancel</Text></Pressable>
          <View style={styles.homeIndicator} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
