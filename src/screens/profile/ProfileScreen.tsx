import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, Alert, Modal, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { COLORS, FONTS, HEADER_TOP_EXTRA, RADIUS, SPACING } from '../../constants/theme';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { getProgress } from '../../store/progressStore';
import { UserProgress } from '../../constants/types';
import Card from '../../components/ui/Card';
import ProgressBar from '../../components/ui/ProgressBar';
import {
  requestNotificationPermission,
  scheduleDaily,
  cancelDailyReminder,
  getNotificationsEnabled,
  getNotificationTime,
  saveNotificationTime,
  syncNotification,
} from '../../services/notificationService';

type Nav = StackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const nav = useNavigation<Nav>();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notifTime, setNotifTime] = useState<{ hour: number; minute: number }>({ hour: 20, minute: 0 });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerHour, setPickerHour] = useState(20);
  const [pickerMinute, setPickerMinute] = useState(0);

  useFocusEffect(
    useCallback(() => {
      getProgress().then(setProgress);
      getNotificationsEnabled().then(setNotificationsEnabled);
      getNotificationTime().then(setNotifTime);
    }, [])
  );

  const handleNotificationToggle = async () => {
    if (notificationsEnabled) {
      await cancelDailyReminder();
      setNotificationsEnabled(false);
    } else {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          'Permission required',
          'Please enable notifications in your device settings to use daily reminders.',
        );
        return;
      }
      setPickerHour(notifTime.hour);
      setPickerMinute(notifTime.minute);
      setShowTimePicker(true);
    }
  };

  const handleTimeConfirm = async () => {
    setShowTimePicker(false);
    await scheduleDaily(pickerHour, pickerMinute);
    const newTime = { hour: pickerHour, minute: pickerMinute };
    setNotifTime(newTime);
    setNotificationsEnabled(true);
    if (progress) await syncNotification(progress);
    Alert.alert(
      'Để nhận thông báo đúng giờ',
      'Trên một số điện thoại Android (Xiaomi, OPPO, Samsung...), bạn cần vào Cài đặt → Ứng dụng → Daily English và:\n\n• Bật Khởi động tự động\n• Chọn Pin → Không giới hạn',
      [
        { text: 'Để sau', style: 'cancel' },
        { text: 'Mở cài đặt', onPress: () => Linking.openSettings() },
      ],
    );
  };

  const handleChangeTime = () => {
    setPickerHour(notifTime.hour);
    setPickerMinute(notifTime.minute);
    setShowTimePicker(true);
  };

  const handleTimePickerConfirm = async () => {
    setShowTimePicker(false);
    await saveNotificationTime(pickerHour, pickerMinute);
    const newTime = { hour: pickerHour, minute: pickerMinute };
    setNotifTime(newTime);
    if (progress) await syncNotification(progress);
  };

  const formatTime = (h: number, m: number) =>
    `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <View style={styles.profileHeader}>
          <View style={styles.statsRow}>
            <StatChip value={String(progress?.streak ?? 0)} label="Day Streak" />
            <View style={styles.divider} />
            <StatChip value={String(progress?.completedLessons.length ?? 0)} label="Lessons" />
            <View style={styles.divider} />
            <StatChip value={String(progress?.learnedWords.length ?? 0)} label="Words" />
          </View>
        </View>

        <View style={styles.body}>
          {/* Menu items */}
          <Card style={styles.menuCard}>
            <MenuItem icon="flag" iconColor={COLORS.primary} label="Learning Goal" onPress={() => nav.navigate('LearningGoal')} />
            <Separator />
            <MenuItem icon="bookmark" iconColor={COLORS.secondary} label="Saved Words" onPress={() => nav.navigate('SavedWords')} badge={String(progress?.savedWords.length ?? 0)} />
            <Separator />
            <MenuItem icon="notifications" iconColor={COLORS.orange} label="Daily Reminder" onPress={handleNotificationToggle} toggle toggleValue={notificationsEnabled} />
            {notificationsEnabled && (
              <>
                <Separator />
                <TouchableOpacity style={styles.timeRow} onPress={handleChangeTime} activeOpacity={0.7}>
                  <View style={[styles.menuIcon, { backgroundColor: COLORS.orange + '20' }]}>
                    <Ionicons name="time-outline" size={18} color={COLORS.orange} />
                  </View>
                  <Text style={styles.menuLabel}>Reminder time</Text>
                  <Text style={styles.timeValue}>{formatTime(notifTime.hour, notifTime.minute)}</Text>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.text.light} />
                </TouchableOpacity>
              </>
            )}
          </Card>

          {/* Learning Level — TODO: implement when backend supports level filtering
          <Card style={styles.levelCard}>
            <Text style={styles.sectionTitle}>Learning Level</Text>
            <View style={styles.levelRow}>
              <Text style={styles.levelLabel}>Beginner</Text>
              <Text style={styles.levelCurrent}>B1 · Intermediate</Text>
              <Text style={styles.levelLabel}>Advanced</Text>
            </View>
            <ProgressBar progress={0.45} height={8} style={{ marginTop: SPACING.xs }} />
          </Card>
          */}

          {/* Study Statistics */}
          <Card style={styles.studyCard}>
            <Text style={styles.sectionTitle}>Study Statistics</Text>
            <View style={styles.studyRow}>
              <Text style={styles.studyLabel}>Lessons Completed</Text>
              <Text style={styles.studyValue}>{progress?.completedLessons.length ?? 0}</Text>
            </View>
            <View style={styles.studyRow}>
              <Text style={styles.studyLabel}>Total Study Time</Text>
              <Text style={[styles.studyValue, { color: COLORS.primary }]}>
                {Math.round((progress?.completedLessons.length ?? 0) * 7)} min
              </Text>
            </View>
            <View style={[styles.studyRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.studyLabel}>Average Accuracy</Text>
              <Text style={[styles.studyValue, { color: COLORS.green }]}>84%</Text>
            </View>
          </Card>
        </View>
      </ScrollView>

      {/* Time Picker Modal */}
      <Modal visible={showTimePicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Set reminder time</Text>
            <View style={styles.pickerRow}>
              <TimeColumn
                value={pickerHour}
                min={0}
                max={23}
                onChange={setPickerHour}
                label="Hour"
              />
              <Text style={styles.pickerColon}>:</Text>
              <TimeColumn
                value={pickerMinute}
                min={0}
                max={55}
                step={5}
                onChange={setPickerMinute}
                label="Min"
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowTimePicker(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirm}
                onPress={notificationsEnabled ? handleTimePickerConfirm : handleTimeConfirm}
              >
                <Text style={styles.modalConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function TimeColumn({ value, min, max, step = 1, onChange, label }: {
  value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; label: string;
}) {
  const increment = () => onChange(value + step > max ? min : value + step);
  const decrement = () => onChange(value - step < min ? max - ((max - min) % step || step) : value - step);
  return (
    <View style={styles.timeCol}>
      <Text style={styles.timeColLabel}>{label}</Text>
      <TouchableOpacity onPress={increment} style={styles.timeBtn}>
        <Ionicons name="chevron-up" size={22} color={COLORS.primary} />
      </TouchableOpacity>
      <Text style={styles.timeColValue}>{String(value).padStart(2, '0')}</Text>
      <TouchableOpacity onPress={decrement} style={styles.timeBtn}>
        <Ionicons name="chevron-down" size={22} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
  );
}

function StatChip({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statChip}>
      <Text style={styles.chipValue}>{value}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

function MenuItem({ icon, iconColor, label, onPress, badge, toggle, toggleValue }: {
  icon: string; iconColor: string; label: string; onPress: () => void;
  badge?: string; toggle?: boolean; toggleValue?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={icon as any} size={18} color={iconColor} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      {badge && <View style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View>}
      {toggle
        ? <View style={[styles.toggle, { backgroundColor: toggleValue ? COLORS.green : COLORS.border }]}>
            <View style={[styles.toggleThumb, { alignSelf: toggleValue ? 'flex-end' : 'flex-start' }]} />
          </View>
        : <Ionicons name="chevron-forward" size={16} color={COLORS.text.light} />
      }
    </TouchableOpacity>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  profileHeader: { backgroundColor: COLORS.primary, paddingTop: SPACING.xl + 60, paddingBottom: SPACING.xl + 60, paddingHorizontal: SPACING.xl, alignItems: 'center' },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: RADIUS.xl, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md },
  statChip: { alignItems: 'center' },
  chipValue: { ...FONTS.bold, fontSize: 26, color: COLORS.white },
  chipLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  divider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.3)' },
  body: { padding: SPACING.lg, gap: SPACING.md },
  menuCard: { padding: 0, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.lg },
  menuIcon: { width: 36, height: 36, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 15, color: COLORS.text.primary },
  badge: { backgroundColor: COLORS.primary, borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: COLORS.white, fontSize: 12, ...FONTS.medium },
  toggle: { width: 44, height: 24, backgroundColor: COLORS.green, borderRadius: RADIUS.full, justifyContent: 'center', paddingHorizontal: 2 },
  toggleThumb: { width: 20, height: 20, borderRadius: RADIUS.full, backgroundColor: COLORS.white, alignSelf: 'flex-end' },
  separator: { height: 1, backgroundColor: COLORS.border, marginLeft: SPACING.lg + 36 + SPACING.md },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.lg },
  timeValue: { fontSize: 15, color: COLORS.primary, ...FONTS.medium, marginRight: SPACING.xs },
  sectionTitle: { ...FONTS.medium, fontSize: 16, color: COLORS.text.primary, marginBottom: SPACING.md },
  levelCard: { padding: SPACING.xl },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  levelLabel: { fontSize: 12, color: COLORS.text.light },
  levelCurrent: { fontSize: 13, color: COLORS.primary, ...FONTS.medium },
  studyCard: { padding: SPACING.xl },
  studyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  studyLabel: { fontSize: 14, color: COLORS.text.secondary },
  studyValue: { ...FONTS.medium, fontSize: 14, color: COLORS.text.primary },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.xl, width: 280 },
  modalTitle: { ...FONTS.medium, fontSize: 17, color: COLORS.text.primary, textAlign: 'center', marginBottom: SPACING.xl },
  pickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xl, marginBottom: SPACING.xl },
  pickerColon: { ...FONTS.bold, fontSize: 32, color: COLORS.text.primary, marginTop: 20 },
  timeCol: { alignItems: 'center', gap: SPACING.sm },
  timeColLabel: { fontSize: 12, color: COLORS.text.light },
  timeBtn: { padding: SPACING.xs },
  timeColValue: { ...FONTS.bold, fontSize: 36, color: COLORS.text.primary, minWidth: 52, textAlign: 'center' },
  modalActions: { flexDirection: 'row', gap: SPACING.md },
  modalCancel: { flex: 1, padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  modalCancelText: { fontSize: 15, color: COLORS.text.secondary },
  modalConfirm: { flex: 1, padding: SPACING.md, borderRadius: RADIUS.lg, backgroundColor: COLORS.primary, alignItems: 'center' },
  modalConfirmText: { fontSize: 15, color: COLORS.white, ...FONTS.medium },
});
