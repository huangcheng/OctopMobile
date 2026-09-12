import { Tabs } from "expo-router";

import { PillTabBar } from "@/src/components/PillTabBar";

/**
 * 4-tab layout per the design constitution (Ardot `PillTabBar`):
 * Chats / Experts / Knowledge / Automation. Screens render their own
 * large-title headers (designs 03/08/11/13), so headers are hidden here.
 */
export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <PillTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: "none",
      }}
    >
      <Tabs.Screen name="chats" />
      <Tabs.Screen name="experts" />
      <Tabs.Screen name="knowledge" />
      <Tabs.Screen name="automation" />
      </Tabs>
  );
}
