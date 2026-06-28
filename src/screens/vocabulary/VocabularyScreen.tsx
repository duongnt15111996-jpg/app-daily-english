import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  Animated, Dimensions, ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { COLORS, FONTS, HEADER_TOP_EXTRA, RADIUS, SHADOW, SPACING } from '../../constants/theme';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { fetchWordDetails, WordDetails } from '../../services/dictionaryApi';
import { fetchVocabularyTopics, fetchRandomVocabularyWords } from '../../services/api';
import { getProgress, markWordLearned, toggleSavedWord } from '../../store/progressStore';

type Nav = StackNavigationProp<RootStackParamList>;
type ScreenView = 'selecting' | 'loading' | 'learning' | 'batch_done';

const { width } = Dimensions.get('window');
const CARD_W = width - SPACING.lg * 2;

interface VocabTopic {
  id: string;
  label: string;
  icon: string;
}

const TOPIC_ICON_MAP: Record<string, string> = {
  travel: 'airplane', business: 'briefcase', food: 'restaurant',
  technology: 'laptop', health: 'fitness', daily: 'sunny',
  'daily life': 'sunny', emotions: 'heart', nature: 'leaf',
  education: 'book', sports: 'football', art: 'color-palette',
  science: 'flask', music: 'musical-notes', history: 'time',
};

function topicToVocabTopic(topic: string): VocabTopic {
  return {
    id: topic,
    label: topic.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    icon: TOPIC_ICON_MAP[topic.toLowerCase()] ?? 'library',
  };
}

const RANDOM_TOPIC: VocabTopic = { id: 'random', label: 'Random', icon: 'shuffle' };

export default function VocabularyScreen() {
  const nav = useNavigation<Nav>();
  const [view, setView] = useState<ScreenView>('selecting');
  const [selectedTopic, setSelectedTopic] = useState<VocabTopic | null>(null);
  const [deck, setDeck] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [detailsCache, setDetailsCache] = useState<Map<string, WordDetails | null>>(new Map());
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [learnedThisBatch, setLearnedThisBatch] = useState(0);
  const [wordGoal, setWordGoal] = useState(10);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [topics, setTopics] = useState<VocabTopic[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(true);

  const flipAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchVocabularyTopics().then(raw => {
      setTopics([RANDOM_TOPIC, ...raw.map(topicToVocabTopic)]);
      setTopicsLoading(false);
    });
  }, []);

  const frontInterpolate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backInterpolate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  const currentWord = deck[currentIndex] ?? '';
  const cachedDetails = detailsCache.get(currentWord);
  const isSaved = savedIds.includes(currentWord);

  const handleStart = async () => {
    if (!selectedTopic) return;
    setView('loading');
    setLoadError(null);
    try {
      const progress = await getProgress();
      setWordGoal(progress.dailyGoal.words);
      setSavedIds(progress.savedWords);
      const words = await fetchRandomVocabularyWords(selectedTopic.id === 'random' ? null : selectedTopic.id, progress.dailyGoal.words);
      if (words.length === 0) throw new Error('No words found for this topic');
      setDeck(words);
      setCurrentIndex(0);
      setLearnedThisBatch(0);
      setFlipped(false);
      flipAnim.setValue(0);
      setDetailsCache(new Map());
      setView('learning');
      // prefetch first card immediately after deck loads
      if (words.length > 0) {
        fetchWordDetails(words[0]).then(details => {
          if (details !== null) setDetailsCache(prev => new Map(prev).set(words[0], details));
        });
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load words');
      setView('selecting');
    }
  };

  const handleFlip = async () => {
    const toValue = flipped ? 0 : 1;
    Animated.spring(flipAnim, { toValue, useNativeDriver: true, friction: 8 }).start();
    setFlipped(!flipped);

    if (!flipped && !detailsCache.has(currentWord)) {
      setDetailsLoading(true);
      const details = await fetchWordDetails(currentWord);
      setDetailsCache(prev => new Map(prev).set(currentWord, details));
      setDetailsLoading(false);
    }
  };

  const handleNext = (known: boolean) => {
    Speech.stop();
    setIsSpeaking(false);
    const newDeck = [...deck];
    if (known) {
      markWordLearned(currentWord);
      newDeck.splice(currentIndex, 1);
      setLearnedThisBatch(prev => prev + 1);
    } else {
      const card = newDeck.splice(currentIndex, 1)[0];
      newDeck.push(card);
    }

    if (newDeck.length === 0) {
      setDeck([]);
      setView('batch_done');
      return;
    }

    const nextIndex = currentIndex >= newDeck.length ? 0 : currentIndex;
    setDeck(newDeck);
    setCurrentIndex(nextIndex);
    setFlipped(false);
    flipAnim.setValue(0);
    prefetchSilently(newDeck[nextIndex]);
  };

  const handleSave = async () => {
    const nowSaved = await toggleSavedWord(currentWord);
    setSavedIds(prev => nowSaved ? [...prev, currentWord] : prev.filter(id => id !== currentWord));
  };

  const prefetchSilently = (word: string) => {
    if (!word || detailsCache.has(word)) return;
    fetchWordDetails(word).then(details => {
      if (details !== null) setDetailsCache(prev => new Map(prev).set(word, details));
    });
  };

  const handlePlayAudio = () => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    Speech.stop();
    Speech.speak(currentWord, {
      language: 'en-US',
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const handleNextBatch = async () => {
    if (!selectedTopic) return;
    setView('loading');
    setLoadError(null);
    try {
      const words = await fetchRandomVocabularyWords(selectedTopic.id === 'random' ? null : selectedTopic.id, wordGoal);
      if (words.length === 0) throw new Error('No words found');
      setDeck(words);
      setCurrentIndex(0);
      setLearnedThisBatch(0);
      setFlipped(false);
      flipAnim.setValue(0);
      setDetailsCache(new Map());
      setView('learning');
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load words');
      setView('selecting');
    }
  };

  // --- Topic selector view ---
  if (view === 'selecting') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Vocabulary Learning</Text>
          <TouchableOpacity onPress={() => nav.navigate('SavedWords')}>
            <Ionicons name="bookmark" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.selectorBody} showsVerticalScrollIndicator={false}>
          <Text style={styles.selectorLabel}>Choose a topic for today</Text>
          {loadError && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={COLORS.red} />
              <Text style={styles.errorText}>{loadError}</Text>
            </View>
          )}
          {topicsLoading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
          ) : (
          <View style={styles.topicGrid}>
            {topics.map((topic: VocabTopic) => {
              const isSelected = selectedTopic?.id === topic.id;
              return (
                <TouchableOpacity
                  key={topic.id}
                  style={[styles.topicTile, isSelected && styles.topicTileSelected]}
                  onPress={() => setSelectedTopic(topic)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.topicTileIcon, isSelected && styles.topicTileIconSelected]}>
                    <Ionicons name={topic.icon as any} size={24} color={isSelected ? COLORS.white : COLORS.primary} />
                  </View>
                  <Text style={[styles.topicTileLabel, isSelected && styles.topicTileLabelSelected]}>
                    {topic.label}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} style={styles.topicCheck} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          )}
        </ScrollView>

        <View style={styles.startWrap}>
          <TouchableOpacity
            style={[styles.startBtn, !selectedTopic && styles.startBtnDisabled]}
            onPress={handleStart}
            disabled={!selectedTopic}
            activeOpacity={0.85}
          >
            <Ionicons name="play" size={18} color={COLORS.white} />
            <Text style={styles.startBtnText}>Start Learning</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // --- Loading view ---
  if (view === 'loading') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Preparing your words...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // --- Batch done view ---
  if (view === 'batch_done') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.finishedWrap}>
          <Ionicons name="star" size={72} color={COLORS.primary} />
          <Text style={styles.finishedTitle}>Session Complete!</Text>
          <Text style={styles.finishedSub}>
            You reviewed {learnedThisBatch} word{learnedThisBatch !== 1 ? 's' : ''} from {selectedTopic?.label}.
          </Text>
          <TouchableOpacity style={styles.nextBtn} onPress={handleNextBatch} activeOpacity={0.85}>
            <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
            <Text style={styles.nextBtnText}>Next Batch</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.changeTopicBtn} onPress={() => setView('selecting')}>
            <Text style={styles.changeTopicText}>Change Topic</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => nav.navigate('SavedWords')} style={{ marginTop: SPACING.sm }}>
            <Text style={styles.savedLink}>View Saved Words</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // --- Learning (flashcard) view ---
  const progressPct = wordGoal > 0 ? (learnedThisBatch / wordGoal) * 100 : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { Speech.stop(); setView('selecting'); }} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{selectedTopic?.label}</Text>
        <TouchableOpacity onPress={() => nav.navigate('SavedWords')}>
          <Ionicons name="bookmark" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.progress}>
        <Text style={styles.progressText}>
          {learnedThisBatch} / {wordGoal} words learned today · {deck.length} left
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${Math.min(progressPct, 100)}%` }]} />
        </View>
      </View>

      {/* Flashcard */}
      <TouchableOpacity style={styles.cardWrap} onPress={handleFlip} activeOpacity={0.95}>
        {/* Front */}
        <Animated.View style={[styles.card, styles.cardFront, { transform: [{ rotateY: frontInterpolate }] }]}>
          <Text style={styles.word}>{currentWord}</Text>
          <View style={styles.tapHint}>
            <Ionicons name="sync" size={14} color={COLORS.text.light} />
            <Text style={styles.tapText}>Tap to see definition</Text>
          </View>
          <View style={[styles.topicBadge, { backgroundColor: COLORS.primaryLight }]}>
            <Text style={[styles.topicBadgeText, { color: COLORS.primary }]}>{selectedTopic?.label}</Text>
          </View>
        </Animated.View>

        {/* Back */}
        <Animated.View style={[styles.card, styles.cardBack, { transform: [{ rotateY: backInterpolate }] }]}>
          {detailsLoading ? (
            <ActivityIndicator color={COLORS.primary} size="small" />
          ) : cachedDetails ? (
            <>
              {!!cachedDetails.phonetic && (
                <Text style={styles.pronunciation}>{cachedDetails.phonetic}</Text>
              )}
              {!!cachedDetails.partOfSpeech && (
                <Text style={styles.partOfSpeech}>{cachedDetails.partOfSpeech}</Text>
              )}
              <View style={styles.divider} />
              {(cachedDetails.meanings?.length ?? 0) > 0
                ? cachedDetails.meanings!.map((m, mi) => (
                    <View key={mi} style={mi > 0 ? { marginTop: SPACING.sm } : undefined}>
                      {mi > 0 && !!m.partOfSpeech && (
                        <Text style={styles.partOfSpeech}>{m.partOfSpeech}</Text>
                      )}
                      {m.definitions.map((d, di) => (
                        <View key={di} style={di > 0 ? { marginTop: SPACING.sm } : undefined}>
                          <Text style={styles.definition}>
                            {m.definitions.length > 1 ? `${di + 1}. ` : ''}{d.definition}
                          </Text>
                          {!!d.example && (
                            <Text style={styles.example}>"{d.example}"</Text>
                          )}
                        </View>
                      ))}
                    </View>
                  ))
                : <>
                    <Text style={styles.definition}>{cachedDetails.definition || 'No definition available'}</Text>
                    {!!cachedDetails.example && (
                      <Text style={styles.example}>"{cachedDetails.example}"</Text>
                    )}
                  </>
              }
            </>
          ) : (
            <>
              <Ionicons name="alert-circle-outline" size={28} color={COLORS.text.light} />
              <Text style={styles.noDefinition}>Definition not available</Text>
              <TouchableOpacity onPress={async () => {
                setDetailsLoading(true);
                const details = await fetchWordDetails(currentWord);
                setDetailsCache(prev => new Map(prev).set(currentWord, details));
                setDetailsLoading(false);
              }}>
                <Text style={styles.retryText}>Tap to retry</Text>
              </TouchableOpacity>
            </>
          )}
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={[styles.audioBtn, isSpeaking && styles.audioBtnActive]}
              onPress={handlePlayAudio}
              disabled={isSpeaking}
            >
              <Ionicons name={isSpeaking ? 'volume-high' : 'volume-medium'} size={16} color={COLORS.primary} />
              <Text style={styles.audioBtnText}>{isSpeaking ? 'Playing...' : 'Play'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, isSaved && styles.saveBtnActive]}
              onPress={handleSave}
            >
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={16}
                color={isSaved ? COLORS.primary : COLORS.text.secondary}
              />
              <Text style={[styles.saveBtnText, isSaved && { color: COLORS.primary }]}>
                {isSaved ? 'Saved' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </TouchableOpacity>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionBtn, styles.actionRetry]} onPress={() => handleNext(false)} activeOpacity={0.8}>
          <Ionicons name="refresh" size={20} color={COLORS.orange} />
          <Text style={[styles.actionText, { color: COLORS.orange }]}>Review Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.actionKnow]} onPress={() => handleNext(true)} activeOpacity={0.8}>
          <Ionicons name="checkmark" size={20} color={COLORS.green} />
          <Text style={[styles.actionText, { color: COLORS.green }]}>I Know This</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl + HEADER_TOP_EXTRA,
    paddingBottom: SPACING.md,
  },
  backBtn: { padding: 12 },
  headerTitle: { ...FONTS.bold, fontSize: 20, color: COLORS.text.primary, flex: 1, marginHorizontal: SPACING.sm },

  // Selector
  selectorBody: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl ?? SPACING.xl },
  selectorLabel: { ...FONTS.medium, fontSize: 16, color: COLORS.text.primary, marginBottom: SPACING.lg },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    backgroundColor: '#FFF5F5', borderRadius: RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: '#FED7D7',
  },
  errorText: { fontSize: 13, color: '#C53030', flex: 1 },
  topicGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  topicTile: {
    width: (width - SPACING.lg * 2 - SPACING.md) / 2,
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: SPACING.lg, alignItems: 'flex-start',
    borderWidth: 2, borderColor: COLORS.border,
    position: 'relative',
    ...SHADOW.sm,
  },
  topicTileSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  topicTileIcon: {
    width: 44, height: 44, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  topicTileIconSelected: { backgroundColor: COLORS.primary },
  topicTileLabel: { ...FONTS.medium, fontSize: 14, color: COLORS.text.primary },
  topicTileLabelSelected: { color: COLORS.primary },
  topicCheck: { position: 'absolute', top: SPACING.sm, right: SPACING.sm },
  startWrap: { padding: SPACING.lg, paddingBottom: SPACING.xl },
  startBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.full,
    paddingVertical: SPACING.md + 2, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
  },
  startBtnDisabled: { backgroundColor: COLORS.text.light },
  startBtnText: { ...FONTS.semiBold, color: COLORS.white, fontSize: 16 },

  // Loading
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md },
  loadingText: { fontSize: 15, color: COLORS.text.secondary },

  // Progress
  progress: { paddingHorizontal: SPACING.lg, gap: SPACING.xs, marginBottom: SPACING.lg },
  progressText: { fontSize: 13, color: COLORS.text.secondary },
  progressBar: { height: 5, backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.full, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: RADIUS.full },

  // Card
  cardWrap: { alignSelf: 'center', width: CARD_W, height: 300, marginBottom: SPACING.xl },
  card: {
    position: 'absolute', width: '100%', height: '100%',
    backgroundColor: COLORS.white, borderRadius: RADIUS.xxl,
    alignItems: 'center', justifyContent: 'center', padding: SPACING.xl,
    backfaceVisibility: 'hidden', ...SHADOW.md,
  },
  cardFront: {},
  cardBack: { transform: [{ rotateY: '180deg' }], justifyContent: 'flex-start', paddingTop: SPACING.lg },
  word: { ...FONTS.bold, fontSize: 34, color: COLORS.text.primary, textAlign: 'center', marginBottom: SPACING.lg },
  tapHint: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tapText: { fontSize: 12, color: COLORS.text.light },
  topicBadge: {
    position: 'absolute', top: SPACING.lg, right: SPACING.lg,
    paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full,
  },
  topicBadgeText: { fontSize: 11 },
  partOfSpeech: { fontSize: 12, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 1, alignSelf: 'flex-start', marginBottom: 2 },
  pronunciation: { fontSize: 15, color: COLORS.text.secondary, alignSelf: 'flex-start', marginBottom: SPACING.sm },
  divider: { height: 1, backgroundColor: COLORS.border, width: '100%', marginVertical: SPACING.sm },
  defLabel: { ...FONTS.medium, fontSize: 11, color: COLORS.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5, alignSelf: 'flex-start' },
  definition: { fontSize: 15, color: COLORS.text.primary, lineHeight: 22, alignSelf: 'flex-start' },
  exLabel: { ...FONTS.medium, fontSize: 11, color: COLORS.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5, alignSelf: 'flex-start' },
  example: { fontSize: 13, color: COLORS.text.secondary, fontStyle: 'italic', alignSelf: 'flex-start', lineHeight: 20 },
  noDefinition: { fontSize: 14, color: COLORS.text.light, marginTop: SPACING.sm },
  retryText: { fontSize: 13, color: COLORS.primary, marginTop: SPACING.sm },
  cardActions: { flexDirection: 'row', gap: SPACING.sm, position: 'absolute', bottom: SPACING.lg },
  audioBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 5, paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  audioBtnActive: { opacity: 0.5 },
  audioBtnText: { fontSize: 12, color: COLORS.primary, ...FONTS.medium },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 5, paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border,
  },
  saveBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  saveBtnText: { fontSize: 12, color: COLORS.text.secondary },

  // Actions
  actions: { flexDirection: 'row', gap: SPACING.md, paddingHorizontal: SPACING.lg },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, paddingVertical: SPACING.md, borderRadius: RADIUS.xl, borderWidth: 1.5,
  },
  actionRetry: { borderColor: COLORS.orange, backgroundColor: COLORS.orange + '10' },
  actionKnow: { borderColor: COLORS.green, backgroundColor: COLORS.green + '10' },
  actionText: { ...FONTS.medium, fontSize: 14 },

  // Batch done
  finishedWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl, gap: SPACING.md },
  finishedTitle: { ...FONTS.bold, fontSize: 26, color: COLORS.text.primary },
  finishedSub: { fontSize: 15, color: COLORS.text.secondary, textAlign: 'center', lineHeight: 22 },
  nextBtn: {
    marginTop: SPACING.md, backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md, paddingHorizontal: SPACING.xxl ?? 32,
    borderRadius: RADIUS.full, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
  },
  nextBtnText: { ...FONTS.semiBold, color: COLORS.white, fontSize: 15 },
  changeTopicBtn: { paddingVertical: SPACING.sm },
  changeTopicText: { fontSize: 14, color: COLORS.text.secondary },
  savedLink: { fontSize: 14, color: COLORS.primary },
});
