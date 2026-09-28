import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
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
  Crop,
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
import * as ImageManipulator from 'expo-image-manipulator';
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
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null);
  const [photoChoiceOpen, setPhotoChoiceOpen] = useState(false);
  const [photoProcessing, setPhotoProcessing] = useState(false);
  const [cropEditorOpen, setCropEditorOpen] = useState(false);
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
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      const selectedUri = result.assets[0].uri;
      setPendingPhotoUri(selectedUri);
      setPhotoChoiceOpen(true);
    }
  };

  const saveCroppedPhoto = async (crop: { originX: number; originY: number; width: number; height: number }) => {
    if (!pendingPhotoUri) return;
    try {
      setPhotoProcessing(true);
      const result = await ImageManipulator.manipulateAsync(pendingPhotoUri, [{ crop }], { compress: 1, format: ImageManipulator.SaveFormat.JPEG });
      setPhotoUri(result.uri);
      setPendingPhotoUri(null);
      setCropEditorOpen(false);
    } catch {
      Alert.alert('Unable to crop photo', 'Please try selecting the photo again.');
    } finally {
      setPhotoProcessing(false);
    }
  };

  const save = () => {
    if (!name.trim()) {
      setError('Please enter your pet’s name');
      return;
    }

    const age = getAgeFromBirthDate(birthDate, birthDateEstimated, initialPet);

    onSave({
      id: initialPet?.id ?? '',
      name: name.trim(),
      species,
      gender,
      birthDate: birthDate.trim() || null,
      birthDateEstimated: Boolean(birthDate.trim() && birthDateEstimated),
      breed: (breed === 'Other' ? customBreed : breed).trim() || 'Companion Pet',
      ageYears: age.years,
      ageMonths: age.months,
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
          <Image accessibilityLabel={photoUri ? 'Selected pet photo' : `${currentSpecies.label} default preview`} source={photoUri ? { uri: photoUri } : getPetAvatarSource(species)} resizeMode="contain" style={styles.previewImage} />
          <Pressable accessibilityRole="button" accessibilityLabel={photoUri ? 'Change pet photo' : 'Add pet photo'} onPress={pickPhoto} style={styles.photoButton}>
            <Camera color="#557A63" size={20} strokeWidth={1.9} />
            <Text style={styles.addPhotoText}>{photoUri ? 'Change Photo' : 'Choose Photo'}</Text>
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
            <View style={styles.genderContent}><Text style={styles.fieldLabel}>{birthDateEstimated ? 'Birth month' : 'Birth date'} <Text style={styles.optionalLabel}>(optional)</Text></Text><Pressable accessibilityRole="button" accessibilityLabel={birthDateEstimated ? 'Choose birth month' : 'Choose birth date'} onPress={() => setBirthDatePickerOpen(true)} style={styles.dateValue}><Text style={[styles.fieldValue, !birthDate && styles.placeholderValue]}>{birthDate ? formatBirthDateForDisplay(birthDate, birthDateEstimated) : birthDateEstimated ? 'Choose a month' : 'Choose a date'}</Text></Pressable>{birthDatePickerOpen && <DateTimePicker value={parseBirthDate(birthDate)} mode="date" display="default" maximumDate={new Date()} onChange={(_, value) => { setBirthDatePickerOpen(false); if (value) setBirthDate(formatBirthDate(value)); }} />}</View><Pressable accessibilityRole="checkbox" accessibilityState={{ checked: birthDateEstimated }} onPress={() => { if (!birthDate) setBirthDatePickerOpen(true); setBirthDateEstimated((current) => !current); }} style={[styles.estimatedButton, birthDateEstimated && styles.activeEstimated]}><Text style={[styles.estimatedText, birthDateEstimated && styles.activeEstimatedText]}>Estimated</Text></Pressable>
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
      <Modal visible={photoChoiceOpen} animationType="fade" transparent onRequestClose={() => { setPhotoChoiceOpen(false); setPendingPhotoUri(null); }}>
        <View style={styles.photoModalBackdrop}>
          <View style={styles.photoModal}>
            <Text style={styles.photoModalTitle}>How should we use this photo?</Text>
            <Text style={styles.photoModalSubtitle}>Keep the full image or crop it to a square.</Text>
            {pendingPhotoUri && <Image source={{ uri: pendingPhotoUri }} resizeMode="contain" style={styles.photoModalPreview} />}
            <View style={styles.photoModalActions}>
              <Pressable onPress={() => { setPhotoUri(pendingPhotoUri); setPendingPhotoUri(null); setPhotoChoiceOpen(false); }} style={styles.photoModalFullButton}><Text style={styles.photoModalFullText}>Use Full Photo</Text></Pressable>
              <Pressable disabled={photoProcessing} onPress={() => { setPhotoChoiceOpen(false); setCropEditorOpen(true); }} style={[styles.photoModalCropButton, photoProcessing && styles.photoModalDisabled]}><Crop color="#FFFFFF" size={18} /><Text style={styles.photoModalCropText}>Crop Photo</Text></Pressable>
            </View>
            <Pressable onPress={() => { setPhotoChoiceOpen(false); setPendingPhotoUri(null); }} style={styles.photoModalCancel}><Text style={styles.photoModalCancelText}>Choose Another</Text></Pressable>
          </View>
        </View>
      </Modal>
      {pendingPhotoUri && <PhotoCropEditor visible={cropEditorOpen} uri={pendingPhotoUri} saving={photoProcessing} onCancel={() => setCropEditorOpen(false)} onSave={saveCroppedPhoto} />}
    </KeyboardAvoidingView>
  );
}

function parseBirthDate(value: string) {
  if (!value) return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function getImageDimensions(uri: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    Image.getSize(uri, (width, height) => resolve({ width, height }), reject);
  });
}

type CropRect = { originX: number; originY: number; width: number; height: number };
type CropEditorProps = { visible: boolean; uri: string; saving: boolean; onCancel: () => void; onSave: (crop: CropRect) => Promise<void> };
const CROP_FRAME_SIZE = 300;

function PhotoCropEditor({ visible, uri, saving, onCancel, onSave }: CropEditorProps) {
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const imageSizeRef = useRef(imageSize);
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  const panStartRef = useRef(pan);

  useEffect(() => {
    let active = true;
    setImageSize(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    getImageDimensions(uri).then((size) => { if (active) setImageSize(size); }).catch(() => { if (active) setImageSize(null); });
    return () => { active = false; };
  }, [uri]);

  useEffect(() => { imageSizeRef.current = imageSize; }, [imageSize]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panRef.current = pan; }, [pan]);

  const getBounds = (nextZoom = zoomRef.current) => {
    const size = imageSizeRef.current;
    if (!size) return { x: 0, y: 0 };
    const scale = Math.max(CROP_FRAME_SIZE / size.width, CROP_FRAME_SIZE / size.height) * nextZoom;
    return { x: Math.max(0, (size.width * scale - CROP_FRAME_SIZE) / 2), y: Math.max(0, (size.height * scale - CROP_FRAME_SIZE) / 2) };
  };

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { panStartRef.current = panRef.current; },
    onPanResponderMove: (_, gesture) => {
      const bounds = getBounds();
      setPan({ x: Math.max(-bounds.x, Math.min(bounds.x, panStartRef.current.x + gesture.dx)), y: Math.max(-bounds.y, Math.min(bounds.y, panStartRef.current.y + gesture.dy)) });
    },
  })).current;

  const changeZoom = (amount: number) => {
    const nextZoom = Math.max(0.75, Math.min(3, Number((zoomRef.current + amount).toFixed(2))));
    const bounds = getBounds(nextZoom);
    setZoom(nextZoom);
    setPan((current) => ({ x: Math.max(-bounds.x, Math.min(bounds.x, current.x)), y: Math.max(-bounds.y, Math.min(bounds.y, current.y)) }));
  };

  const save = () => {
    const size = imageSizeRef.current;
    if (!size) return;
    const scale = Math.max(CROP_FRAME_SIZE / size.width, CROP_FRAME_SIZE / size.height) * zoomRef.current;
    const imageLeft = (CROP_FRAME_SIZE - size.width * scale) / 2 + panRef.current.x;
    const imageTop = (CROP_FRAME_SIZE - size.height * scale) / 2 + panRef.current.y;
    const cropSize = CROP_FRAME_SIZE / scale;
    const originX = Math.max(0, Math.min(size.width, -imageLeft / scale));
    const originY = Math.max(0, Math.min(size.height, -imageTop / scale));
    onSave({ originX, originY, width: Math.min(cropSize, size.width - originX), height: Math.min(cropSize, size.height - originY) });
  };

  const scale = imageSize ? Math.max(CROP_FRAME_SIZE / imageSize.width, CROP_FRAME_SIZE / imageSize.height) * zoom : 1;
  const imageWidth = imageSize ? imageSize.width * scale : CROP_FRAME_SIZE;
  const imageHeight = imageSize ? imageSize.height * scale : CROP_FRAME_SIZE;

  return <Modal visible={visible} animationType="slide" onRequestClose={onCancel}>
    <View style={styles.cropEditorScreen}>
      <View style={styles.cropEditorHeader}><Pressable onPress={onCancel}><Text style={styles.cropEditorCancel}>Cancel</Text></Pressable><Text style={styles.cropEditorTitle}>Crop Photo</Text><Pressable disabled={!imageSize || saving} onPress={save}><Text style={[styles.cropEditorDone, (!imageSize || saving) && styles.cropEditorDisabled]}>{saving ? 'Saving…' : 'Done'}</Text></Pressable></View>
      <View style={styles.cropWorkspace} {...panResponder.panHandlers}>
        {imageSize && <Image source={{ uri }} resizeMode="stretch" style={{ height: imageHeight, left: (CROP_FRAME_SIZE - imageWidth) / 2 + pan.x, position: 'absolute', top: (CROP_FRAME_SIZE - imageHeight) / 2 + pan.y, width: imageWidth }} />}
        <View pointerEvents="none" style={styles.cropShadeTop} /><View pointerEvents="none" style={styles.cropShadeBottom} /><View pointerEvents="none" style={styles.cropShadeLeft} /><View pointerEvents="none" style={styles.cropShadeRight} /><View pointerEvents="none" style={styles.cropFrame} />
        {!imageSize && <Text style={styles.cropLoading}>Loading photo…</Text>}
      </View>
      <Text style={styles.cropHint}>Drag the photo to position it inside the square.</Text>
      <View style={styles.cropZoomControls}><Pressable onPress={() => changeZoom(-0.25)} style={styles.cropZoomButton}><Text style={styles.cropZoomText}>−</Text></Pressable><Text style={styles.cropZoomLabel}>Zoom {Math.round(zoom * 100)}%</Text><Pressable onPress={() => changeZoom(0.25)} style={styles.cropZoomButton}><Text style={styles.cropZoomText}>+</Text></Pressable></View>
    </View>
  </Modal>;
}

function formatBirthDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatBirthDateForDisplay(value: string, estimated: boolean) {
  const date = parseBirthDate(value);
  return date.toLocaleDateString('en-US', estimated
    ? { month: 'long', year: 'numeric' }
    : { month: 'short', day: 'numeric', year: 'numeric' });
}

function getAgeFromBirthDate(value: string, estimated: boolean, initialPet?: Pet) {
  const birthDate = value ? parseBirthDate(value) : null;
  if (!birthDate || Number.isNaN(birthDate.getTime())) {
    return { years: initialPet?.ageYears ?? 0, months: initialPet?.ageMonths ?? 0 };
  }

  const now = new Date();
  let months = (now.getFullYear() - birthDate.getFullYear()) * 12 + now.getMonth() - birthDate.getMonth();
  if (!estimated && now.getDate() < birthDate.getDate()) months -= 1;
  months = Math.max(0, months);
  return { years: Math.floor(months / 12), months: months % 12 };
}
