import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { View } from '@/components/Themed';
import { useAuth } from '@/src/features/auth/AuthContext';

export default function Index() {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <View style={styles.container}>
      <ActivityIndicator size="large" />
      </View>
    );
  }

  if (status === 'authenticated') {
    return <Redirect href="/(tabs)/chats" />;
  }

  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
