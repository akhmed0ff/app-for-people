import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0f766e',
        tabBarLabelStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Заказ' }} />
      <Tabs.Screen name="history" options={{ title: 'История' }} />
      <Tabs.Screen name="profile" options={{ title: 'Профиль' }} />
    </Tabs>
  );
}
