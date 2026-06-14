import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

import HomeScreen from '../screens/home/HomeScreen';
import TopicsScreen from '../screens/topics/TopicsScreen';
import VocabularyScreen from '../screens/vocabulary/VocabularyScreen';
import StatisticsScreen from '../screens/statistics/StatisticsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

export type TabParamList = {
  Home: undefined;
  Topics: undefined;
  Vocabulary: undefined;
  Statistics: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { active: IconName; inactive: IconName }> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Topics: { active: 'book', inactive: 'book-outline' },
  Vocabulary: { active: 'text', inactive: 'text-outline' },
  Statistics: { active: 'bar-chart', inactive: 'bar-chart-outline' },
  Profile: { active: 'person', inactive: 'person-outline' },
};

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.text.light,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.border,
          paddingBottom: 16,
          paddingTop: 8,
          height: 68,
        },
        tabBarLabelStyle: { fontSize: 11, marginTop: 2 },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          const name = focused ? icons.active : icons.inactive;
          return <Ionicons name={name} size={size - 2} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Topics" component={TopicsScreen} options={{ title: 'Topics' }} />
      <Tab.Screen name="Vocabulary" component={VocabularyScreen} options={{ title: 'Words' }} />
      <Tab.Screen name="Statistics" component={StatisticsScreen} options={{ title: 'Stats' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
