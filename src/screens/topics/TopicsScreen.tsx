import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { COLORS, FONTS, HEADER_TOP_EXTRA, RADIUS, SPACING } from '../../constants/theme';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { ApiTopic, fetchTopics } from '../../services/api';
import { getLessonHistory, LessonHistoryEntry, getProgress } from '../../store/progressStore';
import PressableCard from '../../components/ui/PressableCard';

type Nav = StackNavigationProp<RootStackParamList>;
type TopicStatus = 'not_started' | 'in_progress' | 'completed';

function getTopicStatus(topicId: string, history: LessonHistoryEntry[], completedIds: string[]): TopicStatus {
  const entries = history.filter(e => e.topicId === topicId);
  if (entries.length === 0) return 'not_started';
  return entries.every(e => completedIds.includes(e.lessonId)) ? 'completed' : 'in_progress';
}

export default function TopicsScreen() {
  const nav = useNavigation<Nav>();
  const [topics, setTopics] = useState<ApiTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [lessonHistory, setLessonHistory] = useState<LessonHistoryEntry[]>([]);

  useEffect(() => {
    fetchTopics()
      .then(setTopics)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => {
    getProgress().then(p => setCompletedIds(p.completedLessons));
    getLessonHistory().then(setLessonHistory);
  }, []));

  const filtered = query.trim()
    ? topics.filter(t => t.title.toLowerCase().includes(query.toLowerCase()))
    : topics;

  const renderItem = ({ item }: { item: ApiTopic }) => {
    const status = getTopicStatus(item.id, lessonHistory, completedIds);
    const iconBg = status === 'completed' ? COLORS.green : status === 'in_progress' ? COLORS.orange : (item.iconColor[0] ?? COLORS.primary);
    return (
      <PressableCard
        onPress={() => nav.navigate('TopicDetail', { topicId: item.id, topicTitle: item.title, iconColor: item.iconColor, iconName: item.iconName })}
        style={{ ...styles.card, ...(status === 'completed' ? styles.cardDone : status === 'in_progress' ? styles.cardInProgress : {}) }}
      >
        <View style={styles.row}>
          <View style={[styles.icon, { backgroundColor: iconBg }]}>
            <Ionicons
              name={status === 'completed' ? 'checkmark' : item.iconName as any}
              size={22}
              color={COLORS.white}
            />
          </View>
          <View style={styles.info}>
            <Text style={styles.title}>{item.title}</Text>
            {status === 'in_progress' && <Text style={styles.statusLabel}>Đang học</Text>}
            {status === 'completed' && <Text style={styles.statusLabelDone}>Hoàn thành</Text>}
          </View>
          <Ionicons name="chevron-forward" size={16} color={status === 'completed' ? COLORS.green : status === 'in_progress' ? COLORS.orange : COLORS.text.light} />
        </View>
      </PressableCard>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Learning Topics</Text>
        <Text style={styles.headerSub}>Choose your learning path</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={COLORS.text.light} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search topics..."
            placeholderTextColor={COLORS.text.light}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color={COLORS.text.light} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      {loading ? (
        <ActivityIndicator style={styles.loader} color={COLORS.primary} size="large" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => i.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={40} color={COLORS.text.light} />
              <Text style={styles.emptyText}>No topics found for "{query}"</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.xl + HEADER_TOP_EXTRA, paddingBottom: SPACING.md },
  headerTitle: { ...FONTS.bold, fontSize: 24, color: COLORS.text.primary },
  headerSub: { fontSize: 14, color: COLORS.text.secondary, marginTop: 4 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    marginTop: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
  },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text.primary, paddingVertical: 0 },
  loader: { flex: 1 },
  list: { padding: SPACING.lg, gap: SPACING.md },
  card: { padding: SPACING.lg },
  cardDone: { borderWidth: 1, borderColor: COLORS.green + '50', backgroundColor: '#F0FFF4' },
  cardInProgress: { borderWidth: 1, borderColor: COLORS.orange + '60', backgroundColor: '#FFFBEB' },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  icon: { width: 48, height: 48, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  title: { ...FONTS.medium, fontSize: 16, color: COLORS.text.primary },
  statusLabel: { fontSize: 12, color: COLORS.orange, marginTop: 2 },
  statusLabelDone: { fontSize: 12, color: COLORS.green, marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: SPACING.xl * 2, gap: SPACING.md },
  emptyText: { fontSize: 14, color: COLORS.text.secondary, textAlign: 'center' },
});
