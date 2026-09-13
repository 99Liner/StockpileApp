import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{ title: 'Stockpile' }}
      />

      <Tabs.Screen
        name="scan"
        options={{ title: 'Scan' }}
      />

      <Tabs.Screen
        name="prices"
        options={{ title: 'Prices' }}
      />
    </Tabs>
  );
}