import 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
  type Theme,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { useOctopColorScheme } from '@/src/components/useOctopTheme';
import { Octop, OctopDark } from '@/constants/OctopTheme';
import { ToastProvider } from '@/src/components/Toast';
import { AgentProvider } from '@/src/features/agents/AgentContext';
import { AuthProvider } from '@/src/features/auth/AuthContext';
import { initPalette } from '@/src/features/theme/paletteStore';
import { initThemeMode } from '@/src/features/theme/themeModeStore';
import { I18nProvider } from '@/src/i18n/I18nProvider';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync();

const OctopLightTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Octop.brand,
    background: Octop.bgLayout,
    card: Octop.bg,
    text: Octop.text,
    border: Octop.border,
    notification: Octop.brand,
  },
};

const OctopDarkNavTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: OctopDark.brand,
    background: OctopDark.bgLayout,
    card: OctopDark.bg,
    text: OctopDark.text,
    border: OctopDark.border,
    notification: OctopDark.brand,
  },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    void initPalette();
    void initThemeMode();
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useOctopColorScheme();
  const theme = useMemo(
    () => (colorScheme === 'dark' ? OctopDarkNavTheme : OctopLightTheme),
    [colorScheme],
  );

  return (
    <GestureHandlerRootView style={styles.root}>
      <I18nProvider>
        <AuthProvider>
          <AgentProvider>
            <ToastProvider>
              <ThemeProvider value={theme}>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="settings" />
                  <Stack.Screen name="about" />
                  <Stack.Screen name="expert/[agentId]" />
                  <Stack.Screen name="chat/[threadId]" />
                  <Stack.Screen name="chat/new" />
                </Stack>
              </ThemeProvider>
            </ToastProvider>
          </AgentProvider>
        </AuthProvider>
      </I18nProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
