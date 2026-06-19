import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, Alert } from 'react-native';
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
} from '../../services/notificationService';

type Nav = StackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const nav = useNavigation<Nav>();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getProgress().then(setProgress);
      getNotificationsEnabled().then(setNotificationsEnabled);
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
      await scheduleDaily(20, 0);
      setNotificationsEnabled(true);
    }
  };

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
            <Separator />
            <MenuItem icon="settings" iconColor={COLORS.text.secondary} label="Settings" onPress={() => {}} />
          </Card>

          {/* Learning Level */}
          <Card style={styles.levelCard}>
            <Text style={styles.sectionTitle}>Learning Level</Text>
            <View style={styles.levelRow}>
              <Text style={styles.levelLabel}>Beginner</Text>
              <Text style={styles.levelCurrent}>B1 · Intermediate</Text>
              <Text style={styles.levelLabel}>Advanced</Text>
            </View>
            <ProgressBar progress={0.45} height={8} style={{ marginTop: SPACING.xs }} />
          </Card>

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
            <TouchableOpacity style={styles.logoutBtn} onPress={() => {}}>
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  profileHeader: { backgroundColor: COLORS.primary, paddingTop: SPACING.xl + HEADER_TOP_EXTRA, paddingBottom: SPACING.xl + 60, paddingHorizontal: SPACING.xl, alignItems: 'center' },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: RADIUS.xl, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md },
  statChip: { alignItems: 'center' },
  chipValue: { ...FONTS.bold, fontSize: 20, color: COLORS.white },
  chipLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
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
  sectionTitle: { ...FONTS.medium, fontSize: 16, color: COLORS.text.primary, marginBottom: SPACING.md },
  levelCard: { padding: SPACING.xl },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  levelLabel: { fontSize: 12, color: COLORS.text.light },
  levelCurrent: { fontSize: 13, color: COLORS.primary, ...FONTS.medium },
  studyCard: { padding: SPACING.xl },
  studyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  studyLabel: { fontSize: 14, color: COLORS.text.secondary },
  studyValue: { ...FONTS.medium, fontSize: 14, color: COLORS.text.primary },
  logoutBtn: { marginTop: SPACING.lg, alignItems: 'center' },
  logoutText: { fontSize: 14, color: COLORS.red },
});
