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
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { Octop, OctopDark } from '@/constants/OctopTheme';
import { AgentProvider } from '@/src/features/agents/AgentContext';
import { AuthProvider } from '@/src/features/auth/AuthContext';
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
  const colorScheme = useColorScheme();
  const theme = useMemo(
    () => (colorScheme === 'dark' ? OctopDarkNavTheme : OctopLightTheme),
    [colorScheme],
  );

  return (
    <I18nProvider>
      <AuthProvider>
        <AgentProvider>
          <ThemeProvider value={theme}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="settings" />
              <Stack.Screen name="expert/[agentId]" />
              <Stack.Screen name="chat/[threadId]" />
              <Stack.Screen name="chat/new" />
            </Stack>
          </ThemeProvider>
        </AgentProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
