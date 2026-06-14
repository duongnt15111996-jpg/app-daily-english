import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { COLORS, FONTS, HEADER_TOP_EXTRA, RADIUS, SPACING } from '../../constants/theme';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { ApiSection, fetchSections } from '../../services/api';
import Card from '../../components/ui/Card';

type Nav = StackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'TopicDetail'>;

export default function TopicDetailScreen() {
  const nav = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const [sections, setSections] = useState<ApiSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSections(params.topicId)
      .then(setSections)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.topicId]);

  const headerColor = params.iconColor?.[0] ?? COLORS.primary;

  const renderSection = ({ item }: { item: ApiSection }) => (
    <TouchableOpacity
      onPress={() => nav.navigate('LessonDetail', {
        topicId: params.topicId,
        sectionId: item.id,
        sectionTitle: item.title,
        sectionDescription: item.description,
      })}
      activeOpacity={0.85}
    >
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.checkCircle}>
            <Ionicons name="ellipse-outline" size={16} color={COLORS.text.light} />
          </View>
          <View style={styles.info}>
            <Text style={styles.sectionTitle}>{item.title}</Text>
            {!!item.description && (
              <Text style={styles.sectionDesc} numberOfLines={2}>{item.description}</Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.text.light} />
        </View>
      </Card>
    </TouchableOpacity>
  );

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
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  checkCircle: { width: 32, height: 32, borderRadius: RADIUS.full, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  sectionTitle: { ...FONTS.medium, fontSize: 15, color: COLORS.text.primary, marginBottom: 2 },
  sectionDesc: { fontSize: 12, color: COLORS.text.secondary },
});
