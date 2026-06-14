import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigatorScreenParams } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../constants/theme';

import TabNavigator, { TabParamList } from './TabNavigator';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import TopicDetailScreen from '../screens/topics/TopicDetailScreen';
import LessonDetailScreen from '../screens/topics/LessonDetailScreen';
import ListeningExerciseScreen from '../screens/listening/ListeningExerciseScreen';
import SavedWordsScreen from '../screens/vocabulary/SavedWordsScreen';
import LearningGoalScreen from '../screens/profile/LearningGoalScreen';

export type RootStackParamList = {
  Onboarding: undefined;
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  TopicDetail: { topicId: string; topicTitle: string; iconColor: string[]; iconName: string };
  LessonDetail: { topicId: string; sectionId: string; sectionTitle: string; sectionDescription?: string };
  ListeningExercise: { topicId: string; sectionId: string; lessonId: string; lessonTitle: string };
  SavedWords: undefined;
  LearningGoal: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const [initialRoute, setInitialRoute] = useState<'Onboarding' | 'Tabs' | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('onboarding_done').then(val => {
      setInitialRoute(val ? 'Tabs' : 'Onboarding');
    });
  }, []);

  if (!initialRoute) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: COLORS.background },
        }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Tabs" component={TabNavigator} />
        <Stack.Screen name="TopicDetail" component={TopicDetailScreen} />
        <Stack.Screen name="LessonDetail" component={LessonDetailScreen} />
        <Stack.Screen name="ListeningExercise" component={ListeningExerciseScreen} />
        <Stack.Screen name="SavedWords" component={SavedWordsScreen} />
        <Stack.Screen name="LearningGoal" component={LearningGoalScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
