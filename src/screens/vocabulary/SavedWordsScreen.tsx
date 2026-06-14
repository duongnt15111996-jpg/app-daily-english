import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { COLORS, FONTS, HEADER_TOP_EXTRA, RADIUS, SPACING } from '../../constants/theme';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { WordDetails, fetchVocabularyWord } from '../../services/api';
import { getProgress, toggleSavedWord } from '../../store/progressStore';

type Nav = StackNavigationProp<RootStackParamList>;

export default function SavedWordsScreen() {
  const nav = useNavigation<Nav>();
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [words, setWords] = useState<WordDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const progress = await getProgress();
      const ids = progress.savedWords;
      setSavedIds(ids);

      const results = await Promise.all(ids.map(id => fetchVocabularyWord(id)));
      if (!cancelled) {
        setWords(results.filter((w): w is WordDetails => w !== null));
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = query
    ? words.filter(w => w.word.toLowerCase().includes(query.toLowerCase()))
    : words;

  const handleRemove = async (word: string) => {
    await toggleSavedWord(word);
    setSavedIds(prev => prev.filter(id => id !== word));
    setWords(prev => prev.filter(w => w.word !== word));
  };

  const renderItem = ({ item }: { item: WordDetails }) => (
    <View style={styles.card}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{item.word.slice(0, 3).toUpperCase()}</Text>
      </View>
      <View style={styles.cardInfo}>
        <View style={styles.cardTop}>
          <Text style={styles.word}>{item.word}</Text>
          {!!item.partOfSpeech && <Text style={styles.pos}>{item.partOfSpeech}</Text>}
        </View>
        <Text style={styles.definition} numberOfLines={2}>{item.definition}</Text>
        {!!item.phonetic && <Text style={styles.pronunciation}>{item.phonetic}</Text>}
      </View>
      <TouchableOpacity onPress={() => handleRemove(item.word)} style={styles.removeBtn}>
        <Ionicons name="bookmark" size={20} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Words</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{savedIds.length}</Text>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color={COLORS.text.light} style={styles.searchIcon} />
        <TextInput
          style={styles.search}
          placeholder="Search saved words..."
          placeholderTextColor={COLORS.text.light}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="bookmark-outline" size={48} color={COLORS.text.light} />
          <Text style={styles.emptyTitle}>{query ? 'No results found' : 'No saved words yet'}</Text>
          <Text style={styles.emptySub}>{query ? 'Try a different search term' : 'Save words from the flashcards to see them here'}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={w => w.word}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingHorizontal: SPACING.lg, paddingTop: SPACING.md + HEADER_TOP_EXTRA, paddingBottom: SPACING.md, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { ...FONTS.medium, fontSize: 17, color: COLORS.text.primary, flex: 1 },
  countBadge: { backgroundColor: COLORS.primary, borderRadius: RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 2 },
  countText: { color: COLORS.white, fontSize: 12, ...FONTS.medium },
  searchWrap: { margin: SPACING.lg, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.md },
  searchIcon: { marginRight: SPACING.sm },
  search: { flex: 1, height: 44, fontSize: 15, color: COLORS.text.primary },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg, gap: SPACING.sm },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md, gap: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  badge: { width: 40, height: 40, borderRadius: RADIUS.md, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 10, color: COLORS.primary, ...FONTS.bold },
  cardInfo: { flex: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: 2 },
  word: { ...FONTS.medium, fontSize: 16, color: COLORS.text.primary },
  pos: { fontSize: 11, color: COLORS.text.secondary, fontStyle: 'italic' },
  definition: { fontSize: 13, color: COLORS.text.secondary, lineHeight: 18 },
  pronunciation: { fontSize: 12, color: COLORS.primary, marginTop: 2 },
  removeBtn: { padding: SPACING.xs },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md, padding: SPACING.xl },
  emptyTitle: { ...FONTS.medium, fontSize: 18, color: COLORS.text.primary },
  emptySub: { fontSize: 14, color: COLORS.text.secondary, textAlign: 'center', lineHeight: 22 },
});
