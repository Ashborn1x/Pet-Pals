import { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CalendarDays, Check, ChevronLeft, ChevronRight, Circle, Clock, Heart, PawPrint, Plus, Syringe, Stethoscope, Trash2, Utensils, X } from 'lucide-react-native';
import { SkeletonScreen } from '../../components/Loading/Skeleton';
import { addCareLog, deleteCareLog, getCareLogs, getPets } from '../../database/petpalsDatabase';
import { useSQLiteContext } from 'expo-sqlite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CareLog, Pet } from '../../types/pet';

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

type ScheduleType = 'vet' | 'vaccine';

export function CalendarScreen() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const today = new Date();
  const [pets, setPets] = useState<Pet[]>([]);
  const [logs, setLogs] = useState<CareLog[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [companion, setCompanion] = useState('all');
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleType, setScheduleType] = useState<ScheduleType>('vet');
  const [schedulePetId, setSchedulePetId] = useState('');
  const [scheduleTitle, setScheduleTitle] = useState('Vet checkup');
  const [scheduleDetail, setScheduleDetail] = useState('');
  const [scheduleTime, setScheduleTime] = useState('10:00 AM');
  const [saving, setSaving] = useState(false);
  const days = useMemo(() => createCalendarDays(month), [month]);
  const selectedDate = new Date(month.getFullYear(), month.getMonth(), selectedDay);
  const isCurrentMonth = month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth();
  const selectedLabel = selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const visibleLogs = logs.filter((log) => companion === 'all' || log.petId === companion);
  const selectedDateKey = toDateKey(selectedDate);
  const selectedLogs = visibleLogs.filter((log) => isLogOnDate(log, selectedDateKey, isCurrentMonth && selectedDay === today.getDate()));
  const activeDateCount = days.filter((day) => day.currentMonth && getCalendarEventTypes(day.date, month, visibleLogs, today).length > 0).length;

  useEffect(() => {
    Promise.all([getPets(db), getCareLogs(db)])
      .then(([nextPets, nextLogs]) => { setPets(nextPets); setLogs(nextLogs); setSchedulePetId((current) => current || nextPets[0]?.id || ''); })
      .finally(() => setDataLoading(false));
  }, [db]);

  if (dataLoading) return <SkeletonScreen variant="calendar" />;

  const changeMonth = (direction: number) => {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
    setSelectedDay(1);
  };

  const openSchedule = () => {
    setScheduleType('vet');
    setScheduleTitle('Vet checkup');
    setScheduleDetail('');
    setScheduleTime('10:00 AM');
    setScheduleOpen(true);
  };

  const saveSchedule = async () => {
    if (!schedulePetId || !scheduleTitle.trim()) {
      Alert.alert('Missing details', 'Choose a pet and add a title for this appointment.');
      return;
    }
    setSaving(true);
    try {
      const log = await addCareLog(db, {
        petId: schedulePetId,
        type: scheduleType,
        title: scheduleTitle.trim(),
        detail: scheduleDetail.trim() || (scheduleType === 'vet' ? 'Regular health checkup' : 'Vaccination appointment'),
        time: scheduleTime.trim() || '10:00 AM',
        date: selectedDateKey,
        completed: false,
      });
      setLogs((current) => [log, ...current]);
      setScheduleOpen(false);
    } catch {
      Alert.alert('Could not save', 'The appointment could not be scheduled. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: 14 + Math.min(insets.top, 18) }]} showsVerticalScrollIndicator={false}>
        <View pointerEvents="none" style={styles.decorations}><View style={styles.leftBlob} /><View style={styles.rightBlob} /></View>
        <View style={styles.header}>
          <View><View style={styles.titleRow}><PawPrint color="#476351" fill="#476351" size={25} /><Text style={styles.title}>Care Calendar</Text><Heart color="#476351" size={15} /></View><Text style={styles.subtitle}>Click any day to view & schedule pet routines</Text></View>
        </View>

        <View style={styles.calendarCard}>
          <View style={styles.monthRow}>
            <View style={styles.monthTitleRow}><Pressable onPress={() => changeMonth(-1)} style={styles.monthArrow}><ChevronLeft color="#557A63" size={15} /></Pressable><Text style={styles.monthTitle}>{MONTHS[month.getMonth()]} {month.getFullYear()}</Text><Pressable onPress={() => changeMonth(1)} style={styles.monthArrow}><ChevronRight color="#557A63" size={15} /></Pressable></View>
            <View accessible accessibilityLabel="Month view" style={styles.viewToggle}><Text style={styles.viewActive}>Month view</Text></View>
          </View>
          <View style={styles.weekRow}>{WEEKDAYS.map((day) => <Text key={day} style={styles.weekday}>{day}</Text>)}</View>
          <View style={styles.grid}>{days.map((day, index) => {
            const selected = day.currentMonth && day.date === selectedDay;
            const isToday = isCurrentMonth && day.currentMonth && day.date === today.getDate();
            const eventTypes = day.currentMonth ? getCalendarEventTypes(day.date, month, visibleLogs, today) : [];
            return <Pressable key={`${day.year}-${day.month}-${day.date}-${index}`} accessibilityRole="button" accessibilityLabel={`${MONTHS[day.month] ?? ''} ${day.date}${isToday ? ', today' : ''}${eventTypes.length ? ', has care events' : ''}`} accessibilityState={{ selected }} disabled={!day.currentMonth} onPress={() => setSelectedDay(day.date)} style={[styles.dayCell, selected && styles.selectedDay, !day.currentMonth && styles.outsideDay]}><Text style={[styles.dayText, selected && styles.selectedDayText, !day.currentMonth && styles.outsideDayText]}>{day.date}</Text>{eventTypes.length > 0 && <View style={styles.dotRow}>{eventTypes.map((type, eventIndex) => <View key={`${type}-${eventIndex}`} style={[styles.eventDot, type === 'meal' || type === 'water' ? styles.medsDot : type === 'vet' || type === 'meds' ? styles.vetDot : styles.routineDot]} />)}</View>}{isToday && !selected && <View style={styles.todayMarker} />}</Pressable>;
          })}</View>
          <View style={styles.legend}><View style={styles.legendItem}><View style={[styles.legendDot, styles.routineDot]} /><Text style={styles.legendText}>Routine</Text></View><View style={styles.legendItem}><View style={[styles.legendDot, styles.medsDot]} /><Text style={styles.legendText}>Meds</Text></View><View style={styles.legendItem}><View style={[styles.legendDot, styles.vetDot]} /><Text style={styles.legendText}>Vet / Checkup</Text></View><Text style={styles.activeDates}>{activeDateCount} active dates</Text></View>
        </View>

        <View style={styles.filterCard}>
          <View style={styles.filterHeader}><Text style={styles.filterTitle}>FILTER COMPANION</Text><Text style={styles.allMembers}>All Pack Members</Text></View>
          <View style={styles.companionRow}>
            <CompanionButton label="All" subtitle="2 Companions" active={companion === 'all'} onPress={() => setCompanion('all')} />
            {pets.map((pet) => <CompanionButton key={pet.id} label={pet.name} subtitle={`${logs.filter((log) => log.petId === pet.id).length} Tasks`} active={companion === pet.id} onPress={() => setCompanion(pet.id)} />)}
          </View>
        </View>

        <View style={styles.scheduleCard}>
          <View style={styles.scheduleHeader}><View style={styles.scheduleHeading}><View style={styles.dateEyebrow}><CalendarDays color="#6B8B78" size={12} /><Text style={styles.dateEyebrowText}>SELECTED DAY</Text></View><Text style={styles.scheduleTitle}>{isCurrentMonth && selectedDay === today.getDate() ? 'Today' : selectedLabel}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Schedule care for selected date" onPress={openSchedule} style={styles.scheduleButton}><Plus color="#FFFFFF" size={14} /><Text style={styles.scheduleButtonText}>Schedule</Text></Pressable></View>
          {selectedLogs.length ? selectedLogs.map((log) => <EventRow key={log.id} log={log} pet={pets.find((pet) => pet.id === log.petId)} onDelete={() => Alert.alert('Remove appointment?', `Remove ${log.title} from your calendar?`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: async () => { await deleteCareLog(db, log.id); setLogs((current) => current.filter((item) => item.id !== log.id)); } }])} />) : <View style={styles.emptySchedule}><CalendarDays color="#A3B0A5" size={20} /><Text style={styles.emptyScheduleTitle}>Nothing scheduled</Text><Text style={styles.emptyScheduleText}>Add a checkup or vaccine for this day.</Text></View>}
        </View>
      </ScrollView>
      <ScheduleModal visible={scheduleOpen} pets={pets} selectedPetId={schedulePetId} type={scheduleType} title={scheduleTitle} detail={scheduleDetail} time={scheduleTime} saving={saving} onClose={() => setScheduleOpen(false)} onPetChange={setSchedulePetId} onTypeChange={(type) => { setScheduleType(type); setScheduleTitle(type === 'vet' ? 'Vet checkup' : 'Vaccination'); }} onTitleChange={setScheduleTitle} onDetailChange={setScheduleDetail} onTimeChange={setScheduleTime} onSave={saveSchedule} />
    </View>
  );
}

function EventRow({ log, pet, onDelete }: { log: CareLog; pet?: Pet; onDelete: () => void }) {
  const icon = log.type === 'meal' ? <Utensils color="#A87948" size={14} /> : log.type === 'meds' || log.type === 'vaccine' ? <Syringe color="#C46A55" size={14} /> : log.type === 'vet' ? <Stethoscope color="#557A63" size={14} /> : <Circle color="#557A63" size={9} fill="#557A63" />;
  return <View style={styles.eventRow}><View style={styles.eventTime}><Clock color="#8A9B8F" size={12} /><Text style={styles.eventTimeText}>{log.time}</Text></View><View style={styles.eventIcon}>{icon}</View><View style={styles.eventCopy}><Text style={styles.eventTitle}>{log.title}</Text><Text style={styles.eventDetail}>{pet ? `${pet.name} · ` : ''}{log.detail}</Text></View><Text style={[styles.eventStatus, log.completed ? styles.doneStatus : styles.upcomingStatus]}>{log.completed ? 'Done' : 'Upcoming'}</Text><Pressable accessibilityRole="button" accessibilityLabel={`Remove ${log.title}`} onPress={onDelete} style={styles.deleteEvent}><Trash2 color="#B9553E" size={13} /></Pressable></View>;
}

function ScheduleModal({ visible, pets, selectedPetId, type, title, detail, time, saving, onClose, onPetChange, onTypeChange, onTitleChange, onDetailChange, onTimeChange, onSave }: { visible: boolean; pets: Pet[]; selectedPetId: string; type: 'vet' | 'vaccine'; title: string; detail: string; time: string; saving: boolean; onClose: () => void; onPetChange: (id: string) => void; onTypeChange: (type: 'vet' | 'vaccine') => void; onTitleChange: (value: string) => void; onDetailChange: (value: string) => void; onTimeChange: (value: string) => void; onSave: () => void }) {
  return <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalRoot}><Pressable onPress={onClose} style={styles.modalBackdrop} /><View style={styles.modalSheet}><View style={styles.modalHeader}><View><Text style={styles.modalEyebrow}>NEW APPOINTMENT</Text><Text style={styles.modalTitle}>Schedule care</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close schedule form" onPress={onClose} style={styles.closeButton}><X color="#557A63" size={18} /></Pressable></View><Text style={styles.fieldLabel}>TYPE</Text><View style={styles.typeRow}><Pressable accessibilityRole="button" accessibilityState={{ selected: type === 'vet' }} onPress={() => onTypeChange('vet')} style={[styles.typeButton, type === 'vet' && styles.typeButtonActive]}><Stethoscope color={type === 'vet' ? '#FFFFFF' : '#557A63'} size={16} /><Text style={[styles.typeButtonText, type === 'vet' && styles.typeButtonTextActive]}>Checkup</Text></Pressable><Pressable accessibilityRole="button" accessibilityState={{ selected: type === 'vaccine' }} onPress={() => onTypeChange('vaccine')} style={[styles.typeButton, type === 'vaccine' && styles.typeButtonActive]}><Syringe color={type === 'vaccine' ? '#FFFFFF' : '#557A63'} size={16} /><Text style={[styles.typeButtonText, type === 'vaccine' && styles.typeButtonTextActive]}>Vaccine</Text></Pressable></View><Text style={styles.fieldLabel}>FOR PET</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.petChoiceRow}>{pets.map((pet) => <Pressable key={pet.id} accessibilityRole="button" accessibilityState={{ selected: selectedPetId === pet.id }} onPress={() => onPetChange(pet.id)} style={[styles.petChoice, selectedPetId === pet.id && styles.petChoiceActive]}><Text style={[styles.petChoiceText, selectedPetId === pet.id && styles.petChoiceTextActive]}>{pet.name}</Text>{selectedPetId === pet.id && <Check color="#FFFFFF" size={13} />}</Pressable>)}</ScrollView><Text style={styles.fieldLabel}>TITLE</Text><TextInput accessibilityLabel="Appointment title" value={title} onChangeText={onTitleChange} placeholder="e.g. Annual checkup" placeholderTextColor="#9AA69D" style={styles.input} /><View style={styles.inputRow}><View style={styles.inputHalf}><Text style={styles.fieldLabel}>TIME</Text><TextInput accessibilityLabel="Appointment time" value={time} onChangeText={onTimeChange} placeholder="10:00 AM" placeholderTextColor="#9AA69D" style={styles.input} /></View><View style={styles.inputHalf}><Text style={styles.fieldLabel}>NOTE</Text><TextInput accessibilityLabel="Appointment note" value={detail} onChangeText={onDetailChange} placeholder="Optional" placeholderTextColor="#9AA69D" style={styles.input} /></View></View><Pressable accessibilityRole="button" disabled={saving} onPress={onSave} style={[styles.saveButton, saving && styles.saveButtonDisabled]}><Text style={styles.saveButtonText}>{saving ? 'Saving…' : 'Save appointment'}</Text></Pressable></View></KeyboardAvoidingView></Modal>;
}

function CompanionButton({ label, subtitle, active, onPress }: { label: string; subtitle: string; active: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`Filter calendar by ${label}`} accessibilityState={{ selected: active }} onPress={onPress} style={[styles.companionButton, active && styles.activeCompanion]}><View style={[styles.companionAvatar, active && styles.activeAvatar]}>{label === 'All' ? <Text style={styles.allAvatarText}>All</Text> : <Text style={styles.petAvatarText}>{label[0]}</Text>}</View><View><Text style={[styles.companionName, active && styles.activeCompanionText]}>{label}</Text><Text style={[styles.companionSubtitle, active && styles.activeCompanionText]}>{subtitle}</Text></View></Pressable>;
}

function getCalendarEventTypes(day: number, month: Date, visibleLogs: CareLog[], today: Date) {
  const dateKey = toDateKey(new Date(month.getFullYear(), month.getMonth(), day));
  const isToday = day === today.getDate() && month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth();
  return visibleLogs.filter((log) => isLogOnDate(log, dateKey, isToday)).map((log) => log.type);
}

function isLogOnDate(log: CareLog, dateKey: string, isToday: boolean) {
  return log.date === dateKey || (isToday && log.date === 'Today');
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function createCalendarDays(month: Date) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDayOffset = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const previousMonthDays = new Date(year, monthIndex, 0).getDate();
  return Array.from({ length: 42 }, (_, index) => {
    const value = index - firstDayOffset + 1;
    if (value < 1) return { date: previousMonthDays + value, month: monthIndex - 1, year, currentMonth: false };
    if (value > daysInMonth) return { date: value - daysInMonth, month: monthIndex + 1, year, currentMonth: false };
    return { date: value, month: monthIndex, year, currentMonth: true };
  });
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#F6F5EF', flex: 1 },
  content: { alignSelf: 'center', maxWidth: 560, padding: 14, paddingBottom: 110, width: '100%' },
  decorations: { bottom: 0, left: 0, overflow: 'hidden', position: 'absolute', right: 0, top: 0 }, leftBlob: { backgroundColor: '#E0E9E1', borderRadius: 120, height: 190, left: -90, opacity: 0.6, position: 'absolute', top: -70, width: 190 }, rightBlob: { backgroundColor: '#D5E2D7', borderRadius: 100, height: 150, opacity: 0.5, position: 'absolute', right: -70, top: 30, width: 150 },
  header: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 1, paddingTop: 4 },
  titleRow: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  title: { color: '#1B2B20', fontSize: 23, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { color: '#718276', fontSize: 10, marginTop: 3 },
  todayButton: { backgroundColor: '#FFFFFF', borderColor: '#E7E1D5', borderRadius: 15, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  todayText: { color: '#526558', fontSize: 11, fontWeight: '700' },
  calendarCard: { backgroundColor: '#FEFCF7', borderColor: '#E7E0D5', borderRadius: 25, borderWidth: 1, elevation: 1, padding: 14, shadowColor: '#584B3B', shadowOpacity: 0.07, shadowRadius: 8 },
  monthRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  monthTitleRow: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  monthArrow: { alignItems: 'center', backgroundColor: '#F1F2EC', borderRadius: 12, height: 24, justifyContent: 'center', width: 24 },
  monthTitle: { color: '#1F2E23', fontSize: 14, fontWeight: '800' },
  viewToggle: { backgroundColor: '#F2ECE0', borderRadius: 10, flexDirection: 'row', padding: 2 },
  viewActive: { backgroundColor: '#FFFFFF', borderRadius: 8, color: '#355A43', fontSize: 10, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 6 },
  viewInactive: { color: '#8A9B8F', fontSize: 8, fontWeight: '700', paddingHorizontal: 7, paddingVertical: 5 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 5 },
  weekday: { color: '#718276', fontSize: 11, fontWeight: '700', textAlign: 'center', width: '14.28%' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { alignItems: 'center', borderRadius: 10, height: 42, justifyContent: 'center', marginBottom: 2, position: 'relative', width: '14.28%' },
  selectedDay: { backgroundColor: '#557A63' },
  outsideDay: { opacity: 0.38 },
  dayText: { color: '#1F2E23', fontSize: 11, fontWeight: '700' },
  selectedDayText: { color: '#FFFFFF' },
  outsideDayText: { color: '#9BA79E' },
  dotRow: { bottom: 4, flexDirection: 'row', gap: 2, position: 'absolute' },
  eventDot: { borderRadius: 2, height: 3, width: 3 },
  routineDot: { backgroundColor: '#5D8B70' },
  medsDot: { backgroundColor: '#D28B52' },
  vetDot: { backgroundColor: '#C46A55' },
  todayMarker: { backgroundColor: '#557A63', borderRadius: 2, bottom: 4, height: 3, position: 'absolute', width: 3 },
  legend: { alignItems: 'center', borderTopColor: '#E8E2D7', borderTopWidth: 1, flexDirection: 'row', marginTop: 6, paddingTop: 8 },
  legendItem: { alignItems: 'center', flexDirection: 'row', marginRight: 8 },
  legendDot: { borderRadius: 3, height: 5, marginRight: 3, width: 5 },
  legendText: { color: '#718276', fontSize: 10 },
  activeDates: { color: '#9AA69D', fontSize: 10, marginLeft: 'auto' },
  filterCard: { backgroundColor: '#FEFCF7', borderColor: '#E8E2D7', borderRadius: 22, borderWidth: 1, marginTop: 10, padding: 12 },
  filterHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  filterTitle: { color: '#718276', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  allMembers: { color: '#557A63', fontSize: 10, fontWeight: '700' },
  companionRow: { flexDirection: 'row', gap: 6 },
  companionButton: { alignItems: 'center', backgroundColor: '#F3F0E8', borderRadius: 13, flex: 1, flexDirection: 'row', padding: 6 },
  activeCompanion: { backgroundColor: '#557A63' },
  companionAvatar: { alignItems: 'center', backgroundColor: '#E5E0D5', borderRadius: 15, height: 30, justifyContent: 'center', marginRight: 5, width: 30 },
  activeAvatar: { backgroundColor: '#6C927A' },
  allAvatarText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
  petAvatarText: { color: '#6D806F', fontSize: 12, fontWeight: '800' },
  companionName: { color: '#1F2E23', fontSize: 10, fontWeight: '800' },
  companionSubtitle: { color: '#718276', fontSize: 8, marginTop: 2 },
  activeCompanionText: { color: '#FFFFFF' },
  scheduleCard: { backgroundColor: '#FEFCF7', borderColor: '#E8E2D7', borderRadius: 22, borderWidth: 1, marginTop: 10, padding: 12 },
  scheduleHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  scheduleHeading: { flex: 1, minWidth: 0 },
  dateEyebrow: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  dateEyebrowText: { color: '#718276', fontSize: 10, fontWeight: '800', letterSpacing: 0.7 },
  scheduleTitle: { color: '#1F2E23', fontSize: 16, fontWeight: '800', marginTop: 3 },
  scheduleButton: { alignItems: 'center', backgroundColor: '#557A63', borderRadius: 13, flexDirection: 'row', paddingHorizontal: 9, paddingVertical: 8 },
  scheduleButtonText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', marginLeft: 4 },
  eventRow: { alignItems: 'center', borderTopColor: '#ECE6D8', borderTopWidth: 1, flexDirection: 'row', paddingVertical: 9 },
  eventTime: { alignItems: 'center', width: 52 },
  eventTimeText: { color: '#718276', fontSize: 10, marginTop: 3, textAlign: 'center' },
  eventIcon: { alignItems: 'center', backgroundColor: '#F4E7D7', borderRadius: 15, height: 30, justifyContent: 'center', marginHorizontal: 8, width: 30 },
  eventCopy: { flex: 1 },
  eventTitle: { color: '#1F2E23', fontSize: 12, fontWeight: '800' },
  eventDetail: { color: '#718276', fontSize: 10, marginTop: 3 },
  eventStatus: { borderRadius: 8, fontSize: 8, fontWeight: '800', overflow: 'hidden', paddingHorizontal: 6, paddingVertical: 4 },
  doneStatus: { backgroundColor: '#E8F0EA', color: '#3E654C' },
  upcomingStatus: { backgroundColor: '#FEF4E6', color: '#B9781D' },
  deleteEvent: { alignItems: 'center', height: 30, justifyContent: 'center', marginLeft: 6, width: 30 },
  emptySchedule: { alignItems: 'center', borderTopColor: '#ECE6D8', borderTopWidth: 1, paddingVertical: 20 },
  emptyScheduleTitle: { color: '#425548', fontSize: 12, fontWeight: '800', marginTop: 6 },
  emptyScheduleText: { color: '#718276', fontSize: 10, marginTop: 3 },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { backgroundColor: 'rgba(27, 43, 32, 0.35)', bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  modalSheet: { backgroundColor: '#FFFDF8', borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: 28 },
  modalHeader: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  modalEyebrow: { color: '#718276', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  modalTitle: { color: '#1F2E23', fontSize: 22, fontWeight: '900', marginTop: 3 },
  closeButton: { alignItems: 'center', backgroundColor: '#F1F2EC', borderRadius: 18, height: 36, justifyContent: 'center', width: 36 },
  fieldLabel: { color: '#718276', fontSize: 9, fontWeight: '800', letterSpacing: 0.8, marginBottom: 6, marginTop: 10 },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeButton: { alignItems: 'center', borderColor: '#DDE5DD', borderRadius: 13, borderWidth: 1, flex: 1, flexDirection: 'row', justifyContent: 'center', paddingVertical: 11 },
  typeButtonActive: { backgroundColor: '#557A63', borderColor: '#557A63' },
  typeButtonText: { color: '#557A63', fontSize: 11, fontWeight: '800', marginLeft: 6 },
  typeButtonTextActive: { color: '#FFFFFF' },
  petChoiceRow: { gap: 8 },
  petChoice: { alignItems: 'center', backgroundColor: '#F3F0E8', borderRadius: 13, flexDirection: 'row', paddingHorizontal: 13, paddingVertical: 10 },
  petChoiceActive: { backgroundColor: '#557A63' },
  petChoiceText: { color: '#557A63', fontSize: 11, fontWeight: '800' },
  petChoiceTextActive: { color: '#FFFFFF' },
  inputRow: { flexDirection: 'row', gap: 8 },
  inputHalf: { flex: 1 },
  input: { backgroundColor: '#F5F2EB', borderColor: '#E3DED2', borderRadius: 12, borderWidth: 1, color: '#1F2E23', fontSize: 12, paddingHorizontal: 12, paddingVertical: 11 },
  saveButton: { alignItems: 'center', backgroundColor: '#315D43', borderRadius: 14, marginTop: 20, paddingVertical: 14 },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
});
