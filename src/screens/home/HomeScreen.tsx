import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { COLORS, FONTS, HEADER_TOP_EXTRA, RADIUS, SHADOW, SPACING } from '../../constants/theme';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { ApiTopic, fetchTopics } from '../../services/api';
import { getProgress, getLastLesson, LastLesson } from '../../store/progressStore';
import { syncNotification } from '../../services/notificationService';
import { UserProgress } from '../../constants/types';
import ProgressBar from '../../components/ui/ProgressBar';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

type Nav = StackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const nav = useNavigation<Nav>();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [popularTopics, setPopularTopics] = useState<ApiTopic[]>([]);
  const [lastLesson, setLastLesson] = useState<LastLesson | null>(null);

  useEffect(() => {
    getProgress().then(p => {
      setProgress(p);
      syncNotification(p).catch(() => {});
    });
    fetchTopics().then(t => setPopularTopics(t.slice(0, 3))).catch(() => {});
    getLastLesson().then(setLastLesson);
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.welcome}>Welcome back! 👋</Text>
          <Text style={styles.subtitle}>Let's continue your learning journey</Text>
        </View>

        <View style={styles.body}>
          {/* Popular Topics */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Popular Topics</Text>
              <TouchableOpacity onPress={() => nav.navigate('Tabs', { screen: 'Topics' })}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topicsRow}>
              {popularTopics.map(topic => (
                <TouchableOpacity key={topic.id} onPress={() => nav.navigate('TopicDetail', { topicId: topic.id, topicTitle: topic.title, iconColor: topic.iconColor, iconName: topic.iconName })}>
                  <Card style={styles.topicCard}>
                    <View style={[styles.topicIcon, { backgroundColor: topic.iconColor[0] ?? COLORS.primary }]}>
                      <Ionicons name={topic.iconName as any} size={22} color={COLORS.white} />
                    </View>
                    <Text style={styles.topicTitle} numberOfLines={2}>{topic.title}</Text>
                  </Card>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Daily Streak */}
          <Card style={styles.streakCard}>
            <View style={styles.streakHeader}>
              <Text style={styles.sectionTitle}>Daily Streak</Text>
              <Ionicons name="flame" size={22} color={COLORS.orange} />
            </View>
            <View style={styles.streakRow}>
              <Text style={styles.streakNumber}>{progress?.streak ?? 0}</Text>
              <Text style={styles.streakUnit}>days</Text>
            </View>
            <ProgressBar
              progress={progress ? progress.todayCompleted.lessons / progress.dailyGoal.lessons : 0}
              color={COLORS.primary}
            />
            <Text style={styles.streakSub}>
              {progress?.todayCompleted.lessons ?? 0} of {progress?.dailyGoal.lessons ?? 2} daily goals completed
            </Text>
          </Card>

          {/* Today's Tasks */}
          {progress && (
            <Card style={styles.tasksCard}>
              <Text style={[styles.sectionTitle, { marginBottom: SPACING.md }]}>Today's Tasks</Text>
              <TaskItem
                icon="headset"
                iconColor={COLORS.primary}
                title={`Complete ${progress.dailyGoal.lessons} Listening Lesson${progress.dailyGoal.lessons > 1 ? 's' : ''}`}
                meta={`${progress.todayCompleted.lessons} / ${progress.dailyGoal.lessons} completed`}
                done={progress.todayCompleted.lessons >= progress.dailyGoal.lessons}
                onPress={() => lastLesson
                  ? nav.navigate('LessonDetail', { topicId: lastLesson.topicId, sectionId: lastLesson.sectionId, sectionTitle: lastLesson.sectionTitle })
                  : nav.navigate('Tabs', { screen: 'Topics' })
                }
              />
              <TaskItem
                icon="text"
                iconColor={COLORS.orange}
                title={`Learn ${progress.dailyGoal.words} Vocabulary Words`}
                meta={`${progress.todayCompleted.words} / ${progress.dailyGoal.words} learned`}
                done={progress.todayCompleted.words >= progress.dailyGoal.words}
                onPress={() => nav.navigate('Tabs', { screen: 'Vocabulary' })}
              />
            </Card>
          )}

          {/* Continue Learning */}
          {(lastLesson || popularTopics.length > 0) && (
            <Card style={styles.continueCard}>
              <Text style={[styles.sectionTitle, { marginBottom: SPACING.md }]}>Continue Learning</Text>
              <View style={styles.continueRow}>
                <View style={[styles.continueIcon, { backgroundColor: COLORS.primary }]}>
                  <Ionicons name="headset" size={22} color={COLORS.white} />
                </View>
                <View style={styles.continueInfo}>
                  {lastLesson ? (
                    <>
                      <Text style={styles.continueSub}>Last visited section</Text>
                      <Text style={styles.continueTitle} numberOfLines={2}>{lastLesson.sectionTitle}</Text>
                      <Text style={styles.continueMeta}>
                        {progress?.completedLessons.length
                          ? `${progress.completedLessons.length} lesson${progress.completedLessons.length > 1 ? 's' : ''} completed overall`
                          : 'Continue where you left off'}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.continueSub}>Suggested Topic</Text>
                      <Text style={styles.continueTitle} numberOfLines={2}>{popularTopics[0].title}</Text>
                      <Text style={styles.continueMeta}>Start your first lesson</Text>
                    </>
                  )}
                </View>
              </View>
              <Button
                label={lastLesson ? 'Continue' : 'Start Learning'}
                onPress={() => lastLesson
                  ? nav.navigate('LessonDetail', { topicId: lastLesson.topicId, sectionId: lastLesson.sectionId, sectionTitle: lastLesson.sectionTitle })
                  : nav.navigate('TopicDetail', { topicId: popularTopics[0].id, topicTitle: popularTopics[0].title, iconColor: popularTopics[0].iconColor, iconName: popularTopics[0].iconName })
                }
                fullWidth
                style={{ marginTop: SPACING.lg }}
              />
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function TaskItem({ icon, iconColor, title, meta, done, onPress }: {
  icon: string; iconColor: string; title: string; meta: string; done: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.taskItem, done && styles.taskItemDone]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.taskIcon, { backgroundColor: done ? COLORS.green : iconColor }]}>
        <Ionicons name={done ? 'checkmark' : icon as any} size={20} color={COLORS.white} />
      </View>
      <View style={styles.taskInfo}>
        <Text style={[styles.taskTitle, done && styles.taskTitleDone]}>{title}</Text>
        <Text style={styles.taskMeta}>{meta}</Text>
      </View>
      {done
        ? <Ionicons name="checkmark-circle" size={20} color={COLORS.green} />
        : <Ionicons name="chevron-forward" size={16} color={COLORS.text.light} />
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primary },
  scroll: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg + HEADER_TOP_EXTRA + 20,
    paddingBottom: SPACING.lg + 20,
  },
  welcome: { ...FONTS.medium, fontSize: 22, color: COLORS.white, marginBottom: 4 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  body: { padding: SPACING.lg, gap: SPACING.lg },
  section: {},
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  sectionTitle: { ...FONTS.medium, fontSize: 17, color: COLORS.text.primary },
  seeAll: { fontSize: 14, color: COLORS.primary },
  topicsRow: { gap: SPACING.md, paddingRight: SPACING.lg },
  topicCard: { width: 160, padding: SPACING.lg },
  topicIcon: {
    width: 44, height: 44, borderRadius: RADIUS.lg,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md,
  },
  topicTitle: { ...FONTS.medium, fontSize: 14, color: COLORS.text.primary, marginBottom: 4 },
  topicMeta: { fontSize: 12, color: COLORS.text.secondary },
  streakCard: { padding: SPACING.xl },
  streakHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  streakRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: SPACING.lg },
  streakNumber: { ...FONTS.bold, fontSize: 42, color: COLORS.primary },
  streakUnit: { fontSize: 16, color: COLORS.text.secondary },
  streakSub: { fontSize: 13, color: COLORS.text.secondary, marginTop: SPACING.sm },
  tasksCard: { padding: SPACING.xl, gap: SPACING.md },
  taskItem: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.lg, padding: SPACING.md,
  },
  taskIcon: { width: 44, height: 44, borderRadius: RADIUS.xl, alignItems: 'center', justifyContent: 'center' },
  taskInfo: { flex: 1 },
  taskItemDone: { backgroundColor: '#F0FFF4', borderWidth: 1, borderColor: COLORS.green + '40' },
  taskTitle: { ...FONTS.medium, fontSize: 15, color: COLORS.text.primary },
  taskTitleDone: { color: COLORS.green },
  taskMeta: { fontSize: 13, color: COLORS.text.secondary, marginTop: 2 },
  continueCard: { padding: SPACING.xl },
  continueRow: { flexDirection: 'row', gap: SPACING.md, alignItems: 'flex-start' },
  continueIcon: { width: 44, height: 44, borderRadius: RADIUS.xl, alignItems: 'center', justifyContent: 'center' },
  continueInfo: { flex: 1 },
  continueSub: { fontSize: 12, color: COLORS.text.secondary, marginBottom: 2 },
  continueTitle: { ...FONTS.medium, fontSize: 16, color: COLORS.text.primary, marginBottom: 2 },
  continueMeta: { fontSize: 12, color: COLORS.text.secondary },
});
