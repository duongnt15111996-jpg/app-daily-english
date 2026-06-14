import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Platform, AppState } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import AppNavigator from './src/navigation/AppNavigator';

async function enableImmersiveMode() {
  if (Platform.OS !== 'android') return;
  await NavigationBar.setPositionAsync('absolute');
  await NavigationBar.setBehaviorAsync('overlay-swipe');
  await NavigationBar.setVisibilityAsync('hidden');
}

export default function App() {
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    enableImmersiveMode();

    // Re-apply khi app quay lại foreground
    const appStateSub = AppState.addEventListener('change', state => {
      if (state === 'active') enableImmersiveMode();
    });

    // Tự ẩn lại sau khi user vuốt lên xem navigation bar
    const visibilitySub = NavigationBar.addVisibilityListener(({ visibility }) => {
      if (visibility === 'visible') {
        const timer = setTimeout(() => NavigationBar.setVisibilityAsync('hidden'), 2000);
        return () => clearTimeout(timer);
      }
    });

    return () => {
      appStateSub.remove();
      visibilitySub.remove();
    };
  }, []);

  return <AppNavigator />;
}
