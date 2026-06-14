import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { COLORS, FONTS, HEADER_TOP_EXTRA, RADIUS, SPACING } from '../../constants/theme';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { ApiTopic, fetchTopics } from '../../services/api';
import Card from '../../components/ui/Card';

type Nav = StackNavigationProp<RootStackParamList>;

export default function TopicsScreen() {
  const nav = useNavigation<Nav>();
  const [topics, setTopics] = useState<ApiTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopics()
      .then(data => {
        console.log('[TopicsScreen] topics received:', data.length, JSON.stringify(data));
        setTopics(data);
      })
      .catch(err => console.error('[TopicsScreen] fetchTopics error:', err))
      .finally(() => setLoading(false));
  }, []);

  const renderItem = ({ item }: { item: ApiTopic }) => (
    <TouchableOpacity
      onPress={() => nav.navigate('TopicDetail', {
        topicId: item.id,
        topicTitle: item.title,
        iconColor: item.iconColor,
        iconName: item.iconName,
      })}
      activeOpacity={0.85}
    >
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={[styles.icon, { backgroundColor: item.iconColor[0] ?? COLORS.primary }]}>
            <Ionicons name={item.iconName as any} size={22} color={COLORS.white} />
          </View>
          <View style={styles.info}>
            <Text style={styles.title}>{item.title}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.text.light} />
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Learning Topics</Text>
        <Text style={styles.headerSub}>Choose your learning path</Text>
      </View>
      {loading ? (
        <ActivityIndicator style={styles.loader} color={COLORS.primary} size="large" />
      ) : (
        <FlatList
          data={topics}
          keyExtractor={i => i.id}
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
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.xl + HEADER_TOP_EXTRA, paddingBottom: SPACING.md },
  headerTitle: { ...FONTS.bold, fontSize: 24, color: COLORS.text.primary },
  headerSub: { fontSize: 14, color: COLORS.text.secondary, marginTop: 4 },
  loader: { flex: 1 },
  list: { padding: SPACING.lg, gap: SPACING.md },
  card: { padding: SPACING.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  icon: { width: 48, height: 48, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  title: { ...FONTS.medium, fontSize: 16, color: COLORS.text.primary },
});
