import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CalendarDays, ChevronLeft, ChevronRight, Circle, Clock, Plus, Syringe, Utensils } from 'lucide-react-native';
import { SkeletonScreen } from '../../components/Loading/Skeleton';
import { getCareLogs, getPets } from '../../database/petpalsDatabase';
import { useSQLiteContext } from 'expo-sqlite';
import type { CareLog, Pet } from '../../types/pet';

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

type Props = { onOpenAddPet?: () => void };

export function CalendarScreen({ onOpenAddPet }: Props) {
  const db = useSQLiteContext();
  const today = new Date();
  const [pets, setPets] = useState<Pet[]>([]);
  const [logs, setLogs] = useState<CareLog[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [companion, setCompanion] = useState('all');
  const days = useMemo(() => createCalendarDays(month), [month]);
  const selectedDate = new Date(month.getFullYear(), month.getMonth(), selectedDay);
  const isCurrentMonth = month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth();
  const selectedLabel = selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const visibleLogs = logs.filter((log) => companion === 'all' || log.petId === companion);

  useEffect(() => {
    Promise.all([getPets(db), getCareLogs(db)])
      .then(([nextPets, nextLogs]) => { setPets(nextPets); setLogs(nextLogs); })
      .finally(() => setDataLoading(false));
  }, [db]);

  if (dataLoading) return <SkeletonScreen variant="calendar" />;

  const changeMonth = (direction: number) => {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
    setSelectedDay(1);
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View><Text style={styles.title}>Care Calendar</Text><Text style={styles.subtitle}>Click any day to view & schedule pet routines</Text></View>
          <Pressable onPress={() => { setMonth(new Date(today.getFullYear(), today.getMonth(), 1)); setSelectedDay(today.getDate()); }} style={styles.todayButton}><Text style={styles.todayText}>Today</Text></Pressable>
        </View>

        <View style={styles.calendarCard}>
          <View style={styles.monthRow}>
            <View style={styles.monthTitleRow}><Pressable onPress={() => changeMonth(-1)} style={styles.monthArrow}><ChevronLeft color="#557A63" size={15} /></Pressable><Text style={styles.monthTitle}>{MONTHS[month.getMonth()]} {month.getFullYear()}</Text><Pressable onPress={() => changeMonth(1)} style={styles.monthArrow}><ChevronRight color="#557A63" size={15} /></Pressable></View>
            <View style={styles.viewToggle}><Text style={styles.viewActive}>Month</Text><Text style={styles.viewInactive}>Week</Text></View>
          </View>
          <View style={styles.weekRow}>{WEEKDAYS.map((day) => <Text key={day} style={styles.weekday}>{day}</Text>)}</View>
          <View style={styles.grid}>{days.map((day, index) => {
            const selected = day.currentMonth && day.date === selectedDay;
            const isToday = isCurrentMonth && day.currentMonth && day.date === today.getDate();
            const hasEvents = day.currentMonth && [2, 6, 9, 12, 18, 20, 24].includes(day.date);
            return <Pressable key={`${day.year}-${day.month}-${day.date}-${index}`} onPress={() => day.currentMonth && setSelectedDay(day.date)} style={[styles.dayCell, selected && styles.selectedDay, !day.currentMonth && styles.outsideDay]}><Text style={[styles.dayText, selected && styles.selectedDayText, !day.currentMonth && styles.outsideDayText]}>{day.date}</Text>{hasEvents && <View style={styles.dotRow}><View style={[styles.eventDot, styles.routineDot]} />{day.date % 3 === 0 && <View style={[styles.eventDot, styles.medsDot]} />}</View>}{isToday && !selected && <View style={styles.todayMarker} />}</Pressable>;
          })}</View>
          <View style={styles.legend}><View style={styles.legendItem}><View style={[styles.legendDot, styles.routineDot]} /><Text style={styles.legendText}>Routine</Text></View><View style={styles.legendItem}><View style={[styles.legendDot, styles.medsDot]} /><Text style={styles.legendText}>Meds</Text></View><View style={styles.legendItem}><View style={[styles.legendDot, styles.vetDot]} /><Text style={styles.legendText}>Vet / Checkup</Text></View><Text style={styles.activeDates}>1 active dates</Text></View>
        </View>

        <View style={styles.filterCard}>
          <View style={styles.filterHeader}><Text style={styles.filterTitle}>FILTER COMPANION</Text><Text style={styles.allMembers}>All Pack Members</Text></View>
          <View style={styles.companionRow}>
            <CompanionButton label="All" subtitle="2 Companions" active={companion === 'all'} onPress={() => setCompanion('all')} />
            {pets.map((pet) => <CompanionButton key={pet.id} label={pet.name} subtitle={`${logs.filter((log) => log.petId === pet.id).length} Tasks`} active={companion === pet.id} onPress={() => setCompanion(pet.id)} />)}
          </View>
        </View>

        <View style={styles.scheduleCard}>
          <View style={styles.scheduleHeader}><View><View style={styles.dateEyebrow}><CalendarDays color="#6B8B78" size={12} /><Text style={styles.dateEyebrowText}>TODAY</Text></View><Text style={styles.scheduleTitle}>{isCurrentMonth && selectedDay === today.getDate() ? 'Today' : selectedLabel}</Text></View><Pressable onPress={() => onOpenAddPet ? onOpenAddPet() : Alert.alert('Schedule Care', 'Choose a routine from the dashboard.')} style={styles.scheduleButton}><Plus color="#FFFFFF" size={14} /><Text style={styles.scheduleButtonText}>Schedule Care</Text></Pressable></View>
          {visibleLogs.slice(0, 3).map((log) => <View key={log.id} style={styles.eventRow}><View style={styles.eventTime}><Clock color="#8A9B8F" size={12} /><Text style={styles.eventTimeText}>{log.time}</Text></View><View style={styles.eventIcon}>{log.type === 'meal' ? <Utensils color="#A87948" size={14} /> : log.type === 'meds' ? <Syringe color="#C46A55" size={14} /> : <Circle color="#557A63" size={9} fill="#557A63" />}</View><View style={styles.eventCopy}><Text style={styles.eventTitle}>{log.title}</Text><Text style={styles.eventDetail}>{log.detail}</Text></View><Text style={[styles.eventStatus, log.completed ? styles.doneStatus : styles.upcomingStatus]}>{log.completed ? 'Done' : 'Upcoming'}</Text></View>)}
        </View>
      </ScrollView>
    </View>
  );
}

function CompanionButton({ label, subtitle, active, onPress }: { label: string; subtitle: string; active: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.companionButton, active && styles.activeCompanion]}><View style={[styles.companionAvatar, active && styles.activeAvatar]}>{label === 'All' ? <Text style={styles.allAvatarText}>All</Text> : <Text style={styles.petAvatarText}>{label[0]}</Text>}</View><View><Text style={[styles.companionName, active && styles.activeCompanionText]}>{label}</Text><Text style={[styles.companionSubtitle, active && styles.activeCompanionText]}>{subtitle}</Text></View></Pressable>;
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
  screen: { backgroundColor: '#EFECE3', flex: 1 },
  content: { padding: 14, paddingBottom: 110 },
  header: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14, paddingHorizontal: 1 },
  title: { color: '#1B2B20', fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  subtitle: { color: '#718276', fontSize: 10, marginTop: 3 },
  todayButton: { backgroundColor: '#FFFFFF', borderColor: '#E7E1D5', borderRadius: 15, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  todayText: { color: '#526558', fontSize: 10, fontWeight: '700' },
  calendarCard: { backgroundColor: '#FAF8F3', borderColor: '#E8E2D7', borderRadius: 18, borderWidth: 1, padding: 10 },
  monthRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  monthTitleRow: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  monthArrow: { alignItems: 'center', backgroundColor: '#F1F2EC', borderRadius: 12, height: 24, justifyContent: 'center', width: 24 },
  monthTitle: { color: '#1F2E23', fontSize: 12, fontWeight: '800' },
  viewToggle: { backgroundColor: '#F2ECE0', borderRadius: 10, flexDirection: 'row', padding: 2 },
  viewActive: { backgroundColor: '#FFFFFF', borderRadius: 8, color: '#355A43', fontSize: 8, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 5 },
  viewInactive: { color: '#8A9B8F', fontSize: 8, fontWeight: '700', paddingHorizontal: 7, paddingVertical: 5 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 5 },
  weekday: { color: '#718276', fontSize: 8, fontWeight: '700', textAlign: 'center', width: '14.28%' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { alignItems: 'center', borderRadius: 10, height: 33, justifyContent: 'center', marginBottom: 3, position: 'relative', width: '14.28%' },
  selectedDay: { backgroundColor: '#557A63' },
  outsideDay: { opacity: 0.38 },
  dayText: { color: '#1F2E23', fontSize: 10, fontWeight: '700' },
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
  legendText: { color: '#718276', fontSize: 8 },
  activeDates: { color: '#9AA69D', fontSize: 8, marginLeft: 'auto' },
  filterCard: { backgroundColor: '#FAF8F3', borderColor: '#E8E2D7', borderRadius: 18, borderWidth: 1, marginTop: 10, padding: 10 },
  filterHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  filterTitle: { color: '#718276', fontSize: 8, fontWeight: '800', letterSpacing: 0.8 },
  allMembers: { color: '#557A63', fontSize: 8, fontWeight: '700' },
  companionRow: { flexDirection: 'row', gap: 6 },
  companionButton: { alignItems: 'center', backgroundColor: '#F3F0E8', borderRadius: 13, flex: 1, flexDirection: 'row', padding: 6 },
  activeCompanion: { backgroundColor: '#557A63' },
  companionAvatar: { alignItems: 'center', backgroundColor: '#E5E0D5', borderRadius: 15, height: 30, justifyContent: 'center', marginRight: 5, width: 30 },
  activeAvatar: { backgroundColor: '#6C927A' },
  allAvatarText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
  petAvatarText: { color: '#6D806F', fontSize: 12, fontWeight: '800' },
  companionName: { color: '#1F2E23', fontSize: 9, fontWeight: '800' },
  companionSubtitle: { color: '#718276', fontSize: 7, marginTop: 2 },
  activeCompanionText: { color: '#FFFFFF' },
  scheduleCard: { backgroundColor: '#FAF8F3', borderColor: '#E8E2D7', borderRadius: 18, borderWidth: 1, marginTop: 10, padding: 10 },
  scheduleHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  dateEyebrow: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  dateEyebrowText: { color: '#718276', fontSize: 8, fontWeight: '800', letterSpacing: 0.7 },
  scheduleTitle: { color: '#1F2E23', fontSize: 14, fontWeight: '800', marginTop: 3 },
  scheduleButton: { alignItems: 'center', backgroundColor: '#557A63', borderRadius: 13, flexDirection: 'row', paddingHorizontal: 9, paddingVertical: 8 },
  scheduleButtonText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800', marginLeft: 4 },
  eventRow: { alignItems: 'center', borderTopColor: '#ECE6D8', borderTopWidth: 1, flexDirection: 'row', paddingVertical: 9 },
  eventTime: { alignItems: 'center', width: 52 },
  eventTimeText: { color: '#718276', fontSize: 8, marginTop: 3, textAlign: 'center' },
  eventIcon: { alignItems: 'center', backgroundColor: '#F4E7D7', borderRadius: 15, height: 30, justifyContent: 'center', marginHorizontal: 8, width: 30 },
  eventCopy: { flex: 1 },
  eventTitle: { color: '#1F2E23', fontSize: 10, fontWeight: '800' },
  eventDetail: { color: '#718276', fontSize: 8.5, marginTop: 3 },
  eventStatus: { borderRadius: 8, fontSize: 8, fontWeight: '800', overflow: 'hidden', paddingHorizontal: 6, paddingVertical: 4 },
  doneStatus: { backgroundColor: '#E8F0EA', color: '#3E654C' },
  upcomingStatus: { backgroundColor: '#FEF4E6', color: '#B9781D' },
});
