import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, SafeAreaView, ActivityIndicator, Modal, ScrollView, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Speech from 'expo-speech';

import { COLORS, FONTS, HEADER_TOP_EXTRA, RADIUS, SPACING, SHADOW } from '../../constants/theme';
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
  const [selectedWord, setSelectedWord] = useState<WordDetails | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speakDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    if (selectedWord?.word === word) setSelectedWord(null);
  };

  const handleSpeak = (word: string) => {
    if (speakDebounceRef.current) clearTimeout(speakDebounceRef.current);
    speakDebounceRef.current = setTimeout(async () => {
      const speaking = await Speech.isSpeakingAsync();
      if (speaking) {
        await Speech.stop();
        setIsSpeaking(false);
        return;
      }
      setIsSpeaking(true);
      Speech.speak(word, {
        language: 'en-US',
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }, 100);
  };

  const handleCloseModal = () => {
    Speech.stop().catch(() => {});
    setIsSpeaking(false);
    setSelectedWord(null);
  };

  const renderItem = ({ item }: { item: WordDetails }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => setSelectedWord(item)}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{item.word.slice(0, 3).toUpperCase()}</Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.word}>{item.word}</Text>
        {!!item.phonetic && <Text style={styles.pronunciation}>{item.phonetic}</Text>}
        <Text style={styles.definition} numberOfLines={2}>{item.definition}</Text>
      </View>
      <TouchableOpacity onPress={() => handleRemove(item.word)} style={styles.removeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="bookmark" size={20} color={COLORS.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
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

      {/* Word Detail Modal */}
      <Modal
        visible={!!selectedWord}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <Pressable style={styles.backdrop} onPress={handleCloseModal} />
        {selectedWord && (
          <View style={styles.sheet}>
            {/* Handle */}
            <View style={styles.handle} />

            {/* Word header */}
            <View style={styles.sheetHeader}>
              <View style={styles.sheetWordBlock}>
                <Text style={styles.sheetWord}>{selectedWord.word}</Text>
                {!!selectedWord.phonetic && (
                  <Text style={styles.sheetPhonetic}>{selectedWord.phonetic}</Text>
                )}
              </View>
              <TouchableOpacity style={[styles.speakBtn, isSpeaking && styles.speakBtnActive]} onPress={() => handleSpeak(selectedWord.word)}>
                <Ionicons name={isSpeaking ? 'volume-high' : 'volume-medium-outline'} size={22} color={isSpeaking ? COLORS.white : COLORS.primary} />
              </TouchableOpacity>
            </View>

            {/* Meanings */}
            <ScrollView style={styles.sheetBody} showsVerticalScrollIndicator={false}>
              {selectedWord.meanings && selectedWord.meanings.length > 0 ? (
                selectedWord.meanings.map((meaning, mi) => (
                  <View key={mi} style={styles.meaningBlock}>
                    <View style={styles.posRow}>
                      <View style={styles.posBadge}>
                        <Text style={styles.posBadgeText}>{meaning.partOfSpeech}</Text>
                      </View>
                    </View>
                    {meaning.definitions.map((d, di) => (
                      <View key={di} style={styles.defItem}>
                        <Text style={styles.defNum}>{di + 1}.</Text>
                        <View style={styles.defContent}>
                          <Text style={styles.defText}>{d.definition}</Text>
                          {!!d.example && (
                            <Text style={styles.defExample}>"{d.example}"</Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                ))
              ) : (
                <View style={styles.meaningBlock}>
                  {!!selectedWord.partOfSpeech && (
                    <View style={styles.posRow}>
                      <View style={styles.posBadge}>
                        <Text style={styles.posBadgeText}>{selectedWord.partOfSpeech}</Text>
                      </View>
                    </View>
                  )}
                  <View style={styles.defItem}>
                    <Text style={styles.defNum}>1.</Text>
                    <View style={styles.defContent}>
                      <Text style={styles.defText}>{selectedWord.definition}</Text>
                      {!!selectedWord.example && (
                        <Text style={styles.defExample}>"{selectedWord.example}"</Text>
                      )}
                    </View>
                  </View>
                </View>
              )}
              <View style={{ height: SPACING.xl }} />
            </ScrollView>

            {/* Footer */}
            <View style={styles.sheetFooter}>
              <TouchableOpacity style={styles.unsaveBtn} onPress={() => handleRemove(selectedWord.word)}>
                <Ionicons name="bookmark-outline" size={18} color={COLORS.text.secondary} />
                <Text style={styles.unsaveBtnText}>Bỏ lưu từ này</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
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
  word: { ...FONTS.medium, fontSize: 16, color: COLORS.text.primary },
  pronunciation: { fontSize: 12, color: COLORS.primary, marginTop: 1 },
  definition: { fontSize: 13, color: COLORS.text.secondary, lineHeight: 18, marginTop: 2 },
  removeBtn: { padding: SPACING.xs },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md, padding: SPACING.xl },
  emptyTitle: { ...FONTS.medium, fontSize: 18, color: COLORS.text.primary },
  emptySub: { fontSize: 14, color: COLORS.text.secondary, textAlign: 'center', lineHeight: 22 },

  // Modal
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    maxHeight: '80%',
    ...SHADOW.md,
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginTop: SPACING.sm, marginBottom: SPACING.md },
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: SPACING.xl, paddingBottom: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  sheetWordBlock: { flex: 1, gap: 4 },
  sheetWord: { ...FONTS.bold, fontSize: 28, color: COLORS.text.primary },
  sheetPhonetic: { fontSize: 16, color: COLORS.primary, fontStyle: 'italic' },
  speakBtn: {
    width: 44, height: 44, borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 4,
  },
  speakBtnActive: { backgroundColor: COLORS.primary },
  sheetBody: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg },
  meaningBlock: { marginBottom: SPACING.lg },
  posRow: { flexDirection: 'row', marginBottom: SPACING.sm },
  posBadge: { backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.md, paddingHorizontal: SPACING.sm, paddingVertical: 3 },
  posBadgeText: { fontSize: 12, color: COLORS.primary, ...FONTS.medium, fontStyle: 'italic' },
  defItem: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  defNum: { fontSize: 14, color: COLORS.text.light, width: 20, marginTop: 1 },
  defContent: { flex: 1, gap: 4 },
  defText: { fontSize: 15, color: COLORS.text.primary, lineHeight: 22 },
  defExample: { fontSize: 13, color: COLORS.text.secondary, fontStyle: 'italic', lineHeight: 20 },
  sheetFooter: { paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border },
  unsaveBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, justifyContent: 'center', paddingVertical: SPACING.sm },
  unsaveBtnText: { fontSize: 14, color: COLORS.text.secondary },
});
