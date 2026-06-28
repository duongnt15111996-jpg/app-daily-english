import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, Animated, Keyboard, ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { COLORS, FONTS, HEADER_TOP_EXTRA, RADIUS, SHADOW, SPACING } from '../../constants/theme';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { ApiListeningPart, fetchListeningParts } from '../../services/api';
import { markLessonCompleted, markLessonInProgress } from '../../store/progressStore';
import Button from '../../components/ui/Button';
import ProgressBar from '../../components/ui/ProgressBar';

type Nav = StackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'ListeningExercise'>;
type Status = 'idle' | 'wrong' | 'correct' | 'completed';

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, '').trim();
}

function getWordFeedback(answer: string, transcript: string): { word: string; correct: boolean }[] {
  const answerWords = answer.trim().split(/\s+/).filter(Boolean);
  const transcriptWords = transcript.split(/\s+/).filter(Boolean);
  return transcriptWords.map((word, i) => ({
    word,
    correct: normalizeText(answerWords[i] ?? '') === normalizeText(word),
  }));
}

export default function ListeningExerciseScreen() {
  const nav = useNavigation<Nav>();
  const { params } = useRoute<Route>();

  const [parts, setParts] = useState<ApiListeningPart[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'error' | 'ready'>('loading');
  const [partIndex, setPartIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [isPlaying, setIsPlaying] = useState(false);
  const [wordFeedback, setWordFeedback] = useState<{ word: string; correct: boolean }[]>([]);
  const [completedPartIndices, setCompletedPartIndices] = useState<number[]>([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const soundRef = useRef<Audio.Sound | null>(null);
  const audioGenRef = useRef(0);

  const currentPart = parts[partIndex];

  useEffect(() => {
    Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
  }, []);

  useEffect(() => () => { soundRef.current?.unloadAsync(); }, []);

  useEffect(() => {
    markLessonInProgress(params.topicId, params.sectionId, params.lessonId).catch(() => {});
    fetchListeningParts(params.topicId, params.sectionId, params.lessonId)
      .then(data => {
        setParts(data);
        setLoadState('ready');
      })
      .catch(() => setLoadState('error'));
  }, [params.topicId, params.sectionId, params.lessonId]);

  const playAudio = useCallback(async () => {
    const gen = ++audioGenRef.current;
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      if (gen !== audioGenRef.current) return;

      setIsPlaying(true);

      if (!currentPart?.audioUrl) {
        setTimeout(() => { if (gen === audioGenRef.current) setIsPlaying(false); }, 2000);
        return;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: currentPart.audioUrl },
        { shouldPlay: true }
      );
      if (gen !== audioGenRef.current) {
        sound.unloadAsync().catch(() => {});
        return;
      }
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate(s => {
        if (s.isLoaded && s.didJustFinish && gen === audioGenRef.current) setIsPlaying(false);
      });
    } catch {
      if (gen === audioGenRef.current) setIsPlaying(false);
    }
  }, [currentPart]);

  useEffect(() => {
    if (loadState === 'ready' && currentPart) {
      setAnswer('');
      setStatus('idle');
      setWordFeedback([]);
      playAudio();
    }
  }, [partIndex, loadState]);

  const shakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const successAnimation = () => {
    successAnim.setValue(0);
    Animated.timing(successAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  };

  const handleCheck = () => {
    Keyboard.dismiss();
    if (!currentPart || !answer.trim()) return;
    const transcript = currentPart.transcript ?? '';
    const isCorrect = normalizeText(answer) === normalizeText(transcript);
    const feedback = getWordFeedback(answer, transcript);
    setWordFeedback(feedback);
    if (isCorrect) {
      setStatus('correct');
      successAnimation();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setStatus('wrong');
      shakeAnimation();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleNext = async () => {
    setCompletedPartIndices(prev => prev.includes(partIndex) ? prev : [...prev, partIndex]);
    if (partIndex < parts.length - 1) {
      setPartIndex(p => p + 1);
    } else {
      await markLessonCompleted(params.lessonId);
      setStatus('completed');
    }
  };

  const handleNavigatePart = (index: number) => {
    audioGenRef.current++;
    if (soundRef.current) {
      soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
    setIsPlaying(false);
    setPartIndex(index);
  };

  if (loadState === 'loading') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={COLORS.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.topicName} numberOfLines={1}>{params.lessonTitle}</Text>
          </View>
          <View style={{ width: 32 }} />
        </View>
        <ActivityIndicator style={{ flex: 1 }} color={COLORS.primary} size="large" />
      </SafeAreaView>
    );
  }

  if (loadState === 'error' || parts.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={COLORS.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.topicName}>{params.lessonTitle}</Text>
          </View>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.emptyWrap}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.text.light} />
          <Text style={styles.emptyText}>
            {loadState === 'error' ? 'Failed to load lesson. Please try again.' : 'No content available for this lesson.'}
          </Text>
          {loadState === 'error' && (
            <Button label="Retry" onPress={() => {
              setLoadState('loading');
              fetchListeningParts(params.topicId, params.sectionId, params.lessonId)
                .then(data => { setParts(data); setLoadState('ready'); })
                .catch(() => setLoadState('error'));
            }} style={{ marginTop: SPACING.lg }} />
          )}
        </View>
      </SafeAreaView>
    );
  }

  if (status === 'completed') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.completedWrap}>
          <View style={styles.completedIcon}>
            <Ionicons name="checkmark-circle" size={72} color={COLORS.green} />
          </View>
          <Text style={styles.completedTitle}>Lesson Complete!</Text>
          <Text style={styles.completedSub}>Great job! You finished all {parts.length} parts.</Text>
          <Button label="Back to Lessons" onPress={() => nav.goBack()} style={{ marginTop: SPACING.xl }} fullWidth />
        </View>
      </SafeAreaView>
    );
  }

  const bgColor = status === 'correct' ? COLORS.green + '15' : status === 'wrong' ? COLORS.red + '10' : 'transparent';

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.topicName} numberOfLines={1}>{params.lessonTitle}</Text>
          <Text style={styles.partLabel}>Part {partIndex + 1} of {parts.length}</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      {/* Progress */}
      <View style={styles.progressWrap}>
        <ProgressBar progress={(partIndex + (status === 'correct' ? 1 : 0)) / parts.length} />
      </View>

      {/* Part navigator */}
      <View style={styles.partNav}>
        <TouchableOpacity
          style={[styles.partNavBtn, partIndex === 0 && styles.partNavBtnDisabled]}
          onPress={() => handleNavigatePart(partIndex - 1)}
          disabled={partIndex === 0}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={18} color={partIndex === 0 ? COLORS.text.light : COLORS.primary} />
        </TouchableOpacity>

        <View style={styles.partDots}>
          {parts.map((_, i) => {
            const isDone = completedPartIndices.includes(i);
            const isCurrent = i === partIndex;
            return (
              <TouchableOpacity key={i} onPress={() => handleNavigatePart(i)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                <View style={[styles.partDot, isDone && styles.partDotDone, isCurrent && styles.partDotActive]} />
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.partNavBtn, partIndex === parts.length - 1 && styles.partNavBtnDisabled]}
          onPress={() => handleNavigatePart(partIndex + 1)}
          disabled={partIndex === parts.length - 1}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-forward" size={18} color={partIndex === parts.length - 1 ? COLORS.text.light : COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Audio Player */}
        <View style={[styles.playerCard, status === 'correct' && styles.playerCorrect, status === 'wrong' && styles.playerWrong]}>
          <TouchableOpacity style={styles.playBtn} onPress={playAudio} activeOpacity={0.8} disabled={isPlaying}>
            <View style={[styles.playCircle, isPlaying && styles.playCircleActive]}>
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color={COLORS.white} />
            </View>
          </TouchableOpacity>
          <Text style={styles.playHint}>{isPlaying ? 'Playing...' : 'Play Again'}</Text>
          {isPlaying && (
            <View style={styles.waveRow}>
              {[1, 0.6, 0.9, 0.4, 0.8, 0.5, 1, 0.7].map((h, i) => (
                <View key={i} style={[styles.wave, { height: 20 * h }]} />
              ))}
            </View>
          )}
        </View>

        {/* Input area */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Type what you hear:</Text>
          <Animated.View style={[{ transform: [{ translateX: shakeAnim }] }, { backgroundColor: bgColor, borderRadius: RADIUS.lg }]}>
            <TextInput
              style={[
                styles.input,
                status === 'correct' && styles.inputCorrect,
                status === 'wrong' && styles.inputWrong,
              ]}
              value={answer}
              onChangeText={text => { setAnswer(text); if (status !== 'idle') { setStatus('idle'); setWordFeedback([]); } }}
              placeholder="Start typing..."
              placeholderTextColor={COLORS.text.light}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
              editable={status !== 'correct'}
            />
          </Animated.View>

          {/* Word-by-word feedback */}
          {wordFeedback.length > 0 && status === 'wrong' && (() => {
            const firstWrongIdx = wordFeedback.findIndex(w => !w.correct);
            return (
              <View style={styles.feedbackRow}>
                {wordFeedback.map((item, i) => {
                  if (firstWrongIdx !== -1 && i > firstWrongIdx) {
                    return (
                      <Text key={i} style={styles.feedbackHidden}>*</Text>
                    );
                  }
                  return (
                    <Text key={i} style={[styles.feedbackWord, item.correct ? styles.feedbackOk : styles.feedbackBad]}>
                      {item.word}
                    </Text>
                  );
                })}
              </View>
            );
          })()}

          {/* Status message */}
          {status === 'wrong' && (
            <View style={[styles.statusMsg, { marginTop: 12 }]}>
              <Ionicons name="close-circle" size={16} color={COLORS.red} />
              <Text style={styles.statusTextWrong}>Not quite right. Listen again and try!</Text>
            </View>
          )}
          {status === 'correct' && (
            <Animated.View style={[styles.statusMsg, { opacity: successAnim }]}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.green} />
              <Text style={styles.statusTextOk}>Perfect!</Text>
            </Animated.View>
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          {status !== 'correct' ? (
            <Button label="Check Answer" onPress={handleCheck} fullWidth disabled={!answer.trim()} />
          ) : (
            <Button
              label={partIndex < parts.length - 1 ? 'Next Part →' : 'Finish Lesson'}
              onPress={handleNext}
              fullWidth
            />
          )}
          {status === 'wrong' && (
            <Button label="Retry" onPress={() => { setAnswer(''); setStatus('idle'); setWordFeedback([]); playAudio(); }} variant="outline" fullWidth style={{ marginTop: SPACING.sm }} />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: SPACING.md + HEADER_TOP_EXTRA, paddingBottom: SPACING.md, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { padding: 12 },
  headerCenter: { flex: 1, alignItems: 'center' },
  topicName: { ...FONTS.medium, fontSize: 15, color: COLORS.text.primary },
  partLabel: { fontSize: 12, color: COLORS.text.secondary, marginTop: 2 },
  progressWrap: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: 0, backgroundColor: COLORS.white },
  partNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  partNavBtn: {
    width: 32, height: 32, borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  partNavBtnDisabled: { backgroundColor: COLORS.border, opacity: 0.5 },
  partDots: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1, flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: SPACING.sm },
  partDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.border },
  partDotActive: { width: 22, backgroundColor: COLORS.primary, borderRadius: 4 },
  partDotDone: { backgroundColor: COLORS.green },
  content: { padding: SPACING.lg, gap: SPACING.lg },
  playerCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xxl, padding: SPACING.xl,
    alignItems: 'center', gap: SPACING.md, borderWidth: 1, borderColor: COLORS.border, ...SHADOW.sm,
  },
  playerCorrect: { borderColor: COLORS.green, backgroundColor: '#F0FFF4' },
  playerWrong: { borderColor: COLORS.red + '60' },
  playBtn: {},
  playCircle: {
    width: 72, height: 72, borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  playCircleActive: { backgroundColor: COLORS.primaryDark },
  playHint: { fontSize: 14, color: COLORS.text.secondary },
  waveRow: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 24 },
  wave: { width: 4, backgroundColor: COLORS.primary, borderRadius: 2, opacity: 0.7 },
  inputSection: { gap: SPACING.sm },
  inputLabel: { ...FONTS.medium, fontSize: 14, color: COLORS.text.primary },
  input: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, borderWidth: 1.5,
    borderColor: COLORS.border, padding: SPACING.md, fontSize: 15,
    color: COLORS.text.primary, minHeight: 80, textAlignVertical: 'top',
  },
  inputCorrect: { borderColor: COLORS.green, backgroundColor: '#F0FFF4' },
  inputWrong: { borderColor: COLORS.red },
  feedbackRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 2 },
  feedbackWord: { fontSize: 15, paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.sm },
  feedbackOk: { backgroundColor: COLORS.green + '25', color: COLORS.green },
  feedbackBad: { backgroundColor: COLORS.red + '20', color: COLORS.red, textDecorationLine: 'line-through' },
  feedbackHidden: { fontSize: 15, paddingHorizontal: 6, paddingVertical: 2, color: COLORS.text.light },
  statusMsg: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusTextWrong: { fontSize: 13, color: COLORS.red },
  statusTextOk: { fontSize: 13, color: COLORS.green, ...FONTS.medium },
  actions: { paddingTop: SPACING.sm, gap: SPACING.sm },
  completedWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  completedIcon: { marginBottom: SPACING.lg },
  completedTitle: { ...FONTS.bold, fontSize: 26, color: COLORS.text.primary, marginBottom: SPACING.sm },
  completedSub: { fontSize: 15, color: COLORS.text.secondary, textAlign: 'center' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl, gap: SPACING.md },
  emptyText: { fontSize: 15, color: COLORS.text.secondary, textAlign: 'center' },
});
