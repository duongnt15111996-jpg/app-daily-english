import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, HEADER_TOP_EXTRA, RADIUS, SPACING } from '../../constants/theme';
import { getProgress, updateDailyGoal } from '../../store/progressStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function LearningGoalScreen() {
  const nav = useNavigation();
  const [lessons, setLessons] = useState(2);
  const [words, setWords] = useState(10);
  useEffect(() => {
    getProgress().then(p => { setLessons(p.dailyGoal.lessons); setWords(p.dailyGoal.words); });
  }, []);

  const handleSave = async () => {
    await updateDailyGoal(lessons, words);
    Alert.alert('Saved', 'Your learning goals have been updated!');
    nav.goBack();
  };

  const Step = ({ value, onDec, onInc, unit }: { value: number; onDec: () => void; onInc: () => void; unit: string }) => (
    <View style={styles.stepper}>
      <TouchableOpacity style={styles.stepBtn} onPress={onDec}><Ionicons name="remove" size={20} color={COLORS.primary} /></TouchableOpacity>
      <Text style={styles.stepValue}>{value}</Text>
      <Text style={styles.stepUnit}>{unit}</Text>
      <TouchableOpacity style={styles.stepBtn} onPress={onInc}><Ionicons name="add" size={20} color={COLORS.primary} /></TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Learning Goal</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.body}>
        <Text style={styles.subtitle}>Set your daily learning targets</Text>

        <Card style={styles.goalCard}>
          <View style={styles.goalRow}>
            <View style={[styles.goalIcon, { backgroundColor: COLORS.primaryLight }]}>
              <Ionicons name="book" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.goalInfo}>
              <Text style={styles.goalLabel}>Daily Lesson Goal</Text>
              <Text style={styles.goalDesc}>Lessons per day</Text>
            </View>
          </View>
          <Step value={lessons} onDec={() => setLessons(v => Math.max(1, v - 1))} onInc={() => setLessons(v => Math.min(10, v + 1))} unit="lessons / day" />
        </Card>

        <Card style={styles.goalCard}>
          <View style={styles.goalRow}>
            <View style={[styles.goalIcon, { backgroundColor: '#FFF3E8' }]}>
              <Ionicons name="text" size={22} color={COLORS.orange} />
            </View>
            <View style={styles.goalInfo}>
              <Text style={styles.goalLabel}>Daily Vocabulary Goal</Text>
              <Text style={styles.goalDesc}>New words per day</Text>
            </View>
          </View>
          <Step value={words} onDec={() => setWords(v => Math.max(5, v - 5))} onInc={() => setWords(v => Math.min(50, v + 5))} unit="words / day" />
        </Card>

        <Button label="Save Changes" onPress={handleSave} fullWidth style={{ marginTop: SPACING.md }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: SPACING.md + HEADER_TOP_EXTRA, paddingBottom: SPACING.md, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { ...FONTS.medium, fontSize: 17, color: COLORS.text.primary, flex: 1, textAlign: 'center' },
  body: { padding: SPACING.lg, gap: SPACING.md },
  subtitle: { fontSize: 14, color: COLORS.text.secondary },
  goalCard: { padding: SPACING.lg, gap: SPACING.md },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  goalIcon: { width: 44, height: 44, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  goalInfo: { flex: 1 },
  goalLabel: { ...FONTS.medium, fontSize: 15, color: COLORS.text.primary },
  goalDesc: { fontSize: 12, color: COLORS.text.secondary, marginTop: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: RADIUS.lg, padding: SPACING.sm, gap: SPACING.md },
  stepBtn: { width: 36, height: 36, borderRadius: RADIUS.full, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  stepValue: { ...FONTS.bold, fontSize: 26, color: COLORS.primary, minWidth: 40, textAlign: 'center' },
  stepUnit: { fontSize: 13, color: COLORS.text.secondary, flex: 1 },
});
