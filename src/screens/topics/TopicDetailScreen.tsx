import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { COLORS, FONTS, HEADER_TOP_EXTRA, RADIUS, SPACING } from '../../constants/theme';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { ApiSection, fetchSections } from '../../services/api';
import { getLessonHistory, LessonHistoryEntry, getProgress } from '../../store/progressStore';
import PressableCard from '../../components/ui/PressableCard';

type Nav = StackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'TopicDetail'>;
type SectionStatus = 'not_started' | 'in_progress' | 'completed';

function getSectionStatus(sectionId: string, history: LessonHistoryEntry[], completedIds: string[]): SectionStatus {
  const entries = history.filter(e => e.sectionId === sectionId);
  if (entries.length === 0) return 'not_started';
  return entries.every(e => completedIds.includes(e.lessonId)) ? 'completed' : 'in_progress';
}

export default function TopicDetailScreen() {
  const nav = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const [sections, setSections] = useState<ApiSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [lessonHistory, setLessonHistory] = useState<LessonHistoryEntry[]>([]);

  useEffect(() => {
    fetchSections(params.topicId)
      .then(setSections)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.topicId]);

  useFocusEffect(useCallback(() => {
    getProgress().then(p => setCompletedIds(p.completedLessons));
    getLessonHistory().then(setLessonHistory);
  }, []));

  const headerColor = params.iconColor?.[0] ?? COLORS.primary;

  const renderSection = ({ item }: { item: ApiSection }) => {
    const status = getSectionStatus(item.id, lessonHistory, completedIds);
    return (
      <PressableCard
        onPress={() => nav.navigate('LessonDetail', { topicId: params.topicId, sectionId: item.id, sectionTitle: item.title, sectionDescription: item.description })}
        style={{ ...styles.card, ...(status === 'completed' ? styles.cardDone : status === 'in_progress' ? styles.cardInProgress : {}) }}
      >
        <View style={styles.row}>
          <View style={[styles.checkCircle, status === 'completed' && styles.checkDone, status === 'in_progress' && styles.checkInProgress]}>
            {status === 'completed'
              ? <Ionicons name="checkmark" size={16} color={COLORS.white} />
              : status === 'in_progress'
                ? <Ionicons name="play" size={12} color={COLORS.white} />
                : <Ionicons name="ellipse-outline" size={16} color={COLORS.text.light} />
            }
          </View>
          <View style={styles.info}>
            <View style={styles.titleRow}>
              <Text style={styles.sectionTitle}>{item.title}</Text>
              {status === 'in_progress' && (
                <View style={styles.inProgressTag}>
                  <Text style={styles.inProgressTagText}>Đang học</Text>
                </View>
              )}
            </View>
            {!!item.description && (
              <Text style={styles.sectionDesc} numberOfLines={2}>{item.description}</Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={16} color={status === 'completed' ? COLORS.green : status === 'in_progress' ? COLORS.orange : COLORS.text.light} />
        </View>
      </PressableCard>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <TouchableOpacity style={styles.backBtn} onPress={() => nav.goBack()}>
        <Ionicons name="arrow-back" size={20} color={COLORS.white} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <View style={[styles.header, { backgroundColor: headerColor }]}>
        <View style={styles.headerIcon}>
          <Ionicons name={params.iconName as any} size={28} color={COLORS.white} />
        </View>
        <Text style={styles.headerTitle}>{params.topicTitle}</Text>
        <Text style={styles.headerSub}>Master everyday English</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={COLORS.primary} size="large" />
      ) : (
        <FlatList
          data={sections}
          keyExtractor={s => s.id}
          renderItem={renderSection}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={<Text style={styles.listHeader}>Learning Sections</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: SPACING.md, position: 'absolute', top: 44 + HEADER_TOP_EXTRA, left: SPACING.md, zIndex: 10 },
  backText: { color: COLORS.white, fontSize: 15 },
  header: { paddingTop: 80 + HEADER_TOP_EXTRA, paddingBottom: SPACING.xl, paddingHorizontal: SPACING.xl, alignItems: 'center' },
  headerIcon: { width: 60, height: 60, borderRadius: RADIUS.xxl, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md },
  headerTitle: { ...FONTS.bold, fontSize: 22, color: COLORS.white, textAlign: 'center' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  loader: { flex: 1 },
  list: { padding: SPACING.lg, gap: SPACING.md },
  listHeader: { ...FONTS.medium, fontSize: 17, color: COLORS.text.primary, marginBottom: SPACING.sm },
  card: { padding: SPACING.lg },
  cardDone: { borderWidth: 1, borderColor: COLORS.green + '50', backgroundColor: '#F0FFF4' },
  cardInProgress: { borderWidth: 1, borderColor: COLORS.orange + '60', backgroundColor: '#FFFBEB' },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  checkCircle: { width: 32, height: 32, borderRadius: RADIUS.full, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  checkDone: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  checkInProgress: { backgroundColor: COLORS.orange, borderColor: COLORS.orange },
  info: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: 2 },
  sectionTitle: { ...FONTS.medium, fontSize: 15, color: COLORS.text.primary },
  inProgressTag: { backgroundColor: COLORS.orange + '20', borderRadius: RADIUS.sm, paddingHorizontal: 6, paddingVertical: 2 },
  inProgressTagText: { fontSize: 10, color: COLORS.orange, ...FONTS.medium },
  sectionDesc: { fontSize: 12, color: COLORS.text.secondary },
});
