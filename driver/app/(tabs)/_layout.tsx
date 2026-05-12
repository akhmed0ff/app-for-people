import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1d4ed8',
        tabBarLabelStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Заказы' }} />
      <Tabs.Screen name="balance" options={{ title: 'Баланс' }} />
      <Tabs.Screen name="history" options={{ title: 'История' }} />
      <Tabs.Screen name="profile" options={{ title: 'Профиль' }} />
    </Tabs>
  );
}
