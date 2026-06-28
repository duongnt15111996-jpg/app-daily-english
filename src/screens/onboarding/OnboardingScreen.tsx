import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { CommonActions } from '@react-navigation/native';

import { COLORS, FONTS, HEADER_TOP_EXTRA, RADIUS, SHADOW, SPACING } from '../../constants/theme';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { updateDailyGoal } from '../../store/progressStore';

type Nav = StackNavigationProp<RootStackParamList>;

type Level = 'beginner' | 'intermediate' | 'advanced';

const LEVELS: { id: Level; label: string; desc: string; icon: string }[] = [
  { id: 'beginner', label: 'Beginner', desc: 'Just starting out', icon: 'leaf-outline' },
  { id: 'intermediate', label: 'Intermediate', desc: 'Know the basics', icon: 'school-outline' },
  { id: 'advanced', label: 'Advanced', desc: 'Want to polish my English', icon: 'trophy-outline' },
];

const STEP_COUNT = 3;

export default function OnboardingScreen() {
  const nav = useNavigation<Nav>();
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState<Level>('beginner');
  const [lessons, setLessons] = useState(2);
  const [words, setWords] = useState(10);
  const [reminder, setReminder] = useState(true);

  const handleFinish = async () => {
    await Promise.all([
      AsyncStorage.setItem('onboarding_done', '1'),
      AsyncStorage.setItem('user_level', level),
      updateDailyGoal(lessons, words),
    ]);
    nav.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Tabs' }] }));
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Progress dots */}
      {step > 0 && (
        <View style={styles.dots}>
          {Array.from({ length: STEP_COUNT }).map((_, i) => (
            <View key={i} style={[styles.dot, i < step && styles.dotActive]} />
          ))}
        </View>
      )}

      {step === 0 && <WelcomeStep onNext={() => setStep(1)} />}
      {step === 1 && (
        <LevelStep
          selected={level}
          onSelect={setLevel}
          onNext={() => setStep(2)}
          onBack={() => setStep(0)}
        />
      )}
      {step === 2 && (
        <GoalStep
          lessons={lessons}
          words={words}
          reminder={reminder}
          onLessons={setLessons}
          onWords={setWords}
          onReminder={setReminder}
          onFinish={handleFinish}
          onBack={() => setStep(1)}
        />
      )}
    </SafeAreaView>
  );
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <View style={styles.page}>
      <View style={styles.welcomeIcon}>
        <Ionicons name="headset" size={56} color={COLORS.white} />
      </View>
      <Text style={styles.welcomeTitle}>Daily English</Text>
      <Text style={styles.welcomeSub}>
        Improve your English every day with listening exercises and vocabulary flashcards.
      </Text>
      <TouchableOpacity style={styles.primaryBtn} onPress={onNext} activeOpacity={0.85}>
        <Text style={styles.primaryBtnText}>Get Started</Text>
        <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
}

function LevelStep({
  selected, onSelect, onNext, onBack,
}: {
  selected: Level;
  onSelect: (l: Level) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <View style={styles.page}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Ionicons name="arrow-back" size={20} color={COLORS.text.secondary} />
      </TouchableOpacity>
      <Text style={styles.stepTitle}>What's your level?</Text>
      <Text style={styles.stepSub}>We'll tailor the content for you</Text>

      <View style={styles.levelList}>
        {LEVELS.map(l => (
          <TouchableOpacity
            key={l.id}
            style={[styles.levelCard, selected === l.id && styles.levelCardActive]}
            onPress={() => onSelect(l.id)}
            activeOpacity={0.8}
          >
            <View style={[styles.levelIcon, selected === l.id && styles.levelIconActive]}>
              <Ionicons name={l.icon as any} size={22} color={selected === l.id ? COLORS.white : COLORS.primary} />
            </View>
            <View style={styles.levelInfo}>
              <Text style={[styles.levelLabel, selected === l.id && styles.levelLabelActive]}>{l.label}</Text>
              <Text style={styles.levelDesc}>{l.desc}</Text>
            </View>
            {selected === l.id && <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />}
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={onNext} activeOpacity={0.85}>
        <Text style={styles.primaryBtnText}>Continue</Text>
        <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
}

function GoalStep({
  lessons, words, reminder, onLessons, onWords, onReminder, onFinish, onBack,
}: {
  lessons: number;
  words: number;
  reminder: boolean;
  onLessons: (v: number) => void;
  onWords: (v: number) => void;
  onReminder: (v: boolean) => void;
  onFinish: () => void;
  onBack: () => void;
}) {
  return (
    <View style={styles.page}>
      <Text style={styles.stepTitle}>Set your daily goal</Text>
      <Text style={styles.stepSub}>You can always change this later</Text>

      <View style={styles.goalCards}>
        <View style={styles.goalCard}>
          <View style={styles.goalCardTop}>
            <View style={[styles.goalIcon, { backgroundColor: COLORS.primaryLight }]}>
              <Ionicons name="book" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.goalLabel}>Lessons / day</Text>
          </View>
          <View style={styles.stepper}>
            <TouchableOpacity style={styles.stepBtn} onPress={() => onLessons(Math.max(1, lessons - 1))}>
              <Ionicons name="remove" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <Text style={styles.stepValue}>{lessons}</Text>
            <TouchableOpacity style={styles.stepBtn} onPress={() => onLessons(Math.min(10, lessons + 1))}>
              <Ionicons name="add" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.goalCard}>
          <View style={styles.goalCardTop}>
            <View style={[styles.goalIcon, { backgroundColor: '#FFF3E8' }]}>
              <Ionicons name="text" size={20} color={COLORS.orange} />
            </View>
            <Text style={styles.goalLabel}>Words / day</Text>
          </View>
          <View style={styles.stepper}>
            <TouchableOpacity style={styles.stepBtn} onPress={() => onWords(Math.max(5, words - 5))}>
              <Ionicons name="remove" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <Text style={styles.stepValue}>{words}</Text>
            <TouchableOpacity style={styles.stepBtn} onPress={() => onWords(Math.min(50, words + 5))}>
              <Ionicons name="add" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.goalCard, styles.reminderCard]}>
          <View style={[styles.goalIcon, { backgroundColor: '#FFF8E8' }]}>
            <Ionicons name="alarm" size={20} color="#F59E0B" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.goalLabel}>Daily Reminder</Text>
            <Text style={styles.goalDesc}>Get notified to study every day</Text>
          </View>
          <Switch
            value={reminder}
            onValueChange={onReminder}
            trackColor={{ true: COLORS.primary, false: COLORS.border }}
            thumbColor={COLORS.white}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={onFinish} activeOpacity={0.85}>
        <Text style={styles.primaryBtnText}>Start Learning</Text>
        <Ionicons name="checkmark" size={18} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingTop: SPACING.md + HEADER_TOP_EXTRA,
    paddingBottom: SPACING.md,
  },
  dot: { width: 8, height: 8, borderRadius: RADIUS.full, backgroundColor: COLORS.border },
  dotActive: { backgroundColor: COLORS.primary, width: 20 },

  page: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
    justifyContent: 'center',
  },
  backBtn: {
    alignSelf: 'flex-start',
    padding: 12,
    marginBottom: SPACING.lg,
    marginLeft: -SPACING.sm,
  },

  // Welcome
  welcomeIcon: {
    width: 96, height: 96, borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: SPACING.xl, ...SHADOW.md,
  },
  welcomeTitle: { ...FONTS.bold, fontSize: 32, color: COLORS.text.primary, textAlign: 'center', marginBottom: SPACING.md },
  welcomeSub: { fontSize: 15, color: COLORS.text.secondary, textAlign: 'center', lineHeight: 22, marginBottom: SPACING.xxl },

  // Step header
  stepTitle: { ...FONTS.bold, fontSize: 26, color: COLORS.text.primary, marginBottom: SPACING.sm },
  stepSub: { fontSize: 14, color: COLORS.text.secondary, marginBottom: SPACING.xl },

  // Level
  levelList: { gap: SPACING.md, marginBottom: SPACING.xl },
  levelCard: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.lg,
    borderWidth: 1.5, borderColor: COLORS.border, ...SHADOW.sm,
  },
  levelCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  levelIcon: {
    width: 44, height: 44, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  levelIconActive: { backgroundColor: COLORS.primary },
  levelInfo: { flex: 1 },
  levelLabel: { ...FONTS.medium, fontSize: 15, color: COLORS.text.primary },
  levelLabelActive: { color: COLORS.primary },
  levelDesc: { fontSize: 12, color: COLORS.text.secondary, marginTop: 2 },

  // Goal
  goalCards: { gap: SPACING.md, marginBottom: SPACING.xl },
  goalCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.border, gap: SPACING.md, ...SHADOW.sm,
  },
  goalCardTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  goalIcon: { width: 40, height: 40, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  goalLabel: { ...FONTS.medium, fontSize: 15, color: COLORS.text.primary },
  goalDesc: { fontSize: 12, color: COLORS.text.secondary, marginTop: 2 },
  reminderCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg },
  stepBtn: {
    width: 36, height: 36, borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  stepValue: { ...FONTS.bold, fontSize: 24, color: COLORS.primary, minWidth: 32, textAlign: 'center' },

  // Primary button
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, backgroundColor: COLORS.primary, borderRadius: RADIUS.xl,
    paddingVertical: SPACING.md + 2, ...SHADOW.md,
  },
  primaryBtnText: { ...FONTS.semiBold, fontSize: 16, color: COLORS.white },
});
