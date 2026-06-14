import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, HEADER_TOP_EXTRA, RADIUS, SPACING } from '../../constants/theme';
import { getProgress } from '../../store/progressStore';
import { UserProgress } from '../../constants/types';
import Card from '../../components/ui/Card';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getWeekActivity(weeklyActivity: Record<string, number>): number[] {
  const today = new Date();
  const dow = today.getDay(); // 0=Sun
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + mondayOffset + i);
    return weeklyActivity[d.toISOString().split('T')[0]] ?? 0;
  });
}

export default function StatisticsScreen() {
  const [progress, setProgress] = useState<UserProgress | null>(null);

  useFocusEffect(useCallback(() => { getProgress().then(setProgress); }, []));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Statistics</Text>
          <Text style={styles.headerSub}>Track your learning progress</Text>
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <StatCard icon="flame" iconColor={COLORS.orange} label="Day Streak" value={String(progress?.streak ?? 0)} />
          <StatCard icon="book" iconColor={COLORS.primary} label="Saved Words" value={String(progress?.savedWords.length ?? 0)} />
          <StatCard icon="headset" iconColor={COLORS.green} label="Lessons" value={String(progress?.completedLessons.length ?? 0)} />
          <StatCard icon="star" iconColor={COLORS.secondary} label="Words Learned" value={String(progress?.learnedWords.length ?? 0)} />
        </View>

        {/* Weekly Activity */}
        {(() => {
          const weekActivity = getWeekActivity(progress?.weeklyActivity ?? {});
          const maxVal = Math.max(...weekActivity, 1);
          return (
            <Card style={styles.activityCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Weekly Activity</Text>
                <Text style={styles.cardSub}>Lessons this week</Text>
              </View>
              <View style={styles.chartRow}>
                {weekActivity.map((val, i) => (
                  <View key={i} style={styles.barWrap}>
                    <Text style={styles.barValue}>{val > 0 ? val : ''}</Text>
                    <View style={[styles.bar, { height: Math.max(4, (val / maxVal) * 80), opacity: val > 0 ? 1 : 0.2 }]} />
                    <Text style={styles.barDay}>{DAYS[i]}</Text>
                  </View>
                ))}
              </View>
            </Card>
          );
        })()}

        {/* Recent Achievements */}
        <Card style={styles.achCard}>
          <Text style={styles.cardTitle}>Recent Achievements</Text>
          <AchievementRow icon="trophy" iconColor={COLORS.orange} title="First Week!" desc="Completed 7 days in a row" />
          <AchievementRow icon="medal" iconColor={COLORS.primary} title="Word Master" desc="Learned 50+ vocabulary words" />
          <AchievementRow icon="infinite" iconColor={COLORS.green} title="Consistent Learner" desc="Studied 15 days without missing" />
          <AchievementRow icon="star" iconColor={COLORS.secondary} title="Perfect Score" desc="100% accuracy on 5 lessons" />
        </Card>

        {/* Learning Insights */}
        <Card style={styles.insightCard}>
          <Text style={styles.cardTitle}>Learning Insights</Text>
          <InsightRow label="Average Accuracy" value="84%" color={COLORS.green} />
          <InsightRow label="Total Study Time" value={`${Math.round((progress?.completedLessons.length ?? 0) * 7)} min`} color={COLORS.primary} />
          <InsightRow label="Words Per Day" value={String(Math.round((progress?.learnedWords.length ?? 0) / Math.max(1, progress?.streak ?? 1)))} color={COLORS.secondary} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon, iconColor, label, value }: { icon: string; iconColor: string; label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={icon as any} size={22} color={iconColor} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function AchievementRow({ icon, iconColor, title, desc }: { icon: string; iconColor: string; title: string; desc: string }) {
  return (
    <View style={styles.achRow}>
      <View style={[styles.achIcon, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={styles.achInfo}>
        <Text style={styles.achTitle}>{title}</Text>
        <Text style={styles.achDesc}>{desc}</Text>
      </View>
      <Ionicons name="checkmark-circle" size={20} color={COLORS.green} />
    </View>
  );
}

function InsightRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.insightRow}>
      <Text style={styles.insightLabel}>{label}</Text>
      <Text style={[styles.insightValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.xl + HEADER_TOP_EXTRA, paddingBottom: SPACING.md },
  headerTitle: { ...FONTS.bold, fontSize: 24, color: COLORS.text.primary },
  headerSub: { fontSize: 14, color: COLORS.text.secondary, marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  statCard: { width: '47%', backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.lg, alignItems: 'center', gap: SPACING.xs, borderWidth: 1, borderColor: COLORS.border },
  statIcon: { width: 44, height: 44, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  statValue: { ...FONTS.bold, fontSize: 28, color: COLORS.text.primary },
  statLabel: { fontSize: 12, color: COLORS.text.secondary, textAlign: 'center' },
  activityCard: { marginHorizontal: SPACING.lg, marginBottom: SPACING.md, padding: SPACING.xl },
  cardHeader: { marginBottom: SPACING.lg },
  cardTitle: { ...FONTS.medium, fontSize: 17, color: COLORS.text.primary },
  cardSub: { fontSize: 13, color: COLORS.text.secondary, marginTop: 2 },
  chartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 110 },
  barWrap: { alignItems: 'center', gap: 4, flex: 1 },
  barValue: { fontSize: 11, color: COLORS.text.secondary },
  bar: { width: 20, backgroundColor: COLORS.primary, borderRadius: 4 },
  barDay: { fontSize: 11, color: COLORS.text.light },
  achCard: { marginHorizontal: SPACING.lg, marginBottom: SPACING.md, padding: SPACING.xl, gap: SPACING.md },
  achRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  achIcon: { width: 40, height: 40, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  achInfo: { flex: 1 },
  achTitle: { ...FONTS.medium, fontSize: 14, color: COLORS.text.primary },
  achDesc: { fontSize: 12, color: COLORS.text.secondary, marginTop: 2 },
  insightCard: { marginHorizontal: SPACING.lg, marginBottom: SPACING.xl, padding: SPACING.xl, gap: SPACING.md },
  insightRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  insightLabel: { fontSize: 14, color: COLORS.text.secondary },
  insightValue: { ...FONTS.semiBold, fontSize: 15 },
});
