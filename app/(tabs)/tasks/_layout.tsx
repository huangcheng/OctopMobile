import { Stack } from "expo-router";

import { HeaderGear } from "@/src/components/HeaderGear";
import { t } from "@/src/i18n";

export default function TasksLayout() {
  return (
    <Stack
      screenOptions={{
        headerRight: () => <HeaderGear />,
      }}
    >
      <Stack.Screen name="index" options={{ title: t("tasks.title") }} />
      <Stack.Screen name="[threadId]" options={{ title: t("tasks.chatTitle") }} />
    </Stack>
  );
}
