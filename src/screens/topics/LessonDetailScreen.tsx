import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { COLORS, FONTS, HEADER_TOP_EXTRA, RADIUS, SPACING } from '../../constants/theme';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { ApiLesson, fetchLessons } from '../../services/api';
import { getProgress, saveLastLesson, getInProgressLessons } from '../../store/progressStore';
import PressableCard from '../../components/ui/PressableCard';

type Nav = StackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'LessonDetail'>;

export default function LessonDetailScreen() {
  const nav = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const [lessons, setLessons] = useState<ApiLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [inProgressIds, setInProgressIds] = useState<string[]>([]);

  useEffect(() => {
    saveLastLesson({ topicId: params.topicId, sectionId: params.sectionId, sectionTitle: params.sectionTitle });
    fetchLessons(params.topicId, params.sectionId)
      .then(setLessons)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.topicId, params.sectionId]);

  useFocusEffect(useCallback(() => {
    getProgress().then(p => setCompletedIds(p.completedLessons));
    getInProgressLessons().then(setInProgressIds);
  }, []));

  const sectionCompleted = lessons.filter(l => completedIds.includes(l.id)).length;

  const renderLesson = ({ item, index }: { item: ApiLesson; index: number }) => {
    const isDone = completedIds.includes(item.id);
    const isInProgress = !isDone && inProgressIds.includes(item.id);

    const rowStyle: ViewStyle = {
      ...styles.lessonRow,
      ...(isDone ? styles.lessonDone : {}),
      ...(isInProgress ? styles.lessonInProgress : {}),
    };
    return (
      <PressableCard
        style={rowStyle}
        shadow={false}
        onPress={() => nav.navigate('ListeningExercise', { topicId: params.topicId, sectionId: params.sectionId, lessonId: item.id, lessonTitle: item.title })}
      >
        <View style={[styles.lessonNum, isDone && styles.lessonNumDone, isInProgress && styles.lessonNumInProgress]}>
          {isDone
            ? <Ionicons name="checkmark" size={14} color={COLORS.white} />
            : isInProgress
              ? <Ionicons name="play" size={12} color={COLORS.white} />
              : <Text style={styles.numText}>{index + 1}</Text>
          }
        </View>
        <View style={styles.lessonInfo}>
          <View style={styles.lessonTitleRow}>
            <Text style={styles.lessonTitle}>{item.title}</Text>
            {isInProgress && (
              <View style={styles.inProgressTag}>
                <Text style={styles.inProgressTagText}>Đang học</Text>
              </View>
            )}
          </View>
          <View style={styles.lessonMeta}>
            {!!item.duration && (
              <>
                <Ionicons name="time-outline" size={12} color={COLORS.text.light} />
                <Text style={styles.metaText}>{item.duration}</Text>
              </>
            )}
            {!!item.description && (
              <Text style={styles.metaText} numberOfLines={1}>{item.description}</Text>
            )}
          </View>
        </View>
        <Ionicons
          name="play-circle"
          size={32}
          color={isDone ? COLORS.green : isInProgress ? COLORS.orange : COLORS.primary}
        />
      </PressableCard>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => nav.goBack()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{params.sectionTitle}</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.info}>
        {!!params.sectionDescription && (
          <Text style={styles.infoDesc}>{params.sectionDescription}</Text>
        )}
        <View style={styles.infoStats}>
          <Ionicons name="book-outline" size={14} color={COLORS.text.secondary} />
          <Text style={styles.infoMeta}>{lessons.length} lessons · {sectionCompleted} completed</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={COLORS.primary} size="large" />
      ) : (
        <FlatList
          data={lessons}
          keyExtractor={l => l.id}
          renderItem={renderLesson}
          contentContainerStyle={styles.list}
          ListHeaderComponent={<Text style={styles.listTitle}>Lessons</Text>}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: SPACING.md + HEADER_TOP_EXTRA, paddingBottom: SPACING.md, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  back: { padding: 12 },
  headerTitle: { ...FONTS.medium, fontSize: 17, color: COLORS.text.primary, flex: 1, textAlign: 'center' },
  info: { backgroundColor: COLORS.primary, padding: SPACING.xl },
  infoDesc: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginBottom: SPACING.sm },
  infoStats: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoMeta: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  loader: { flex: 1 },
  list: { padding: SPACING.lg, gap: SPACING.sm },
  listTitle: { ...FONTS.medium, fontSize: 16, color: COLORS.text.primary, marginBottom: SPACING.sm },
  lessonRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
  },
  lessonDone: { borderColor: COLORS.green + '40', backgroundColor: '#F0FFF4' },
  lessonInProgress: { borderColor: COLORS.orange + '60', backgroundColor: '#FFFBEB' },
  lessonNum: { width: 32, height: 32, borderRadius: RADIUS.full, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  lessonNumDone: { backgroundColor: COLORS.green },
  lessonNumInProgress: { backgroundColor: COLORS.orange },
  numText: { ...FONTS.medium, fontSize: 13, color: COLORS.primary },
  lessonInfo: { flex: 1 },
  lessonTitleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: 4 },
  lessonTitle: { ...FONTS.medium, fontSize: 14, color: COLORS.text.primary },
  inProgressTag: { backgroundColor: COLORS.orange + '20', borderRadius: RADIUS.sm, paddingHorizontal: 6, paddingVertical: 2 },
  inProgressTagText: { fontSize: 10, color: COLORS.orange, ...FONTS.medium },
  lessonMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: COLORS.text.light },
});
