import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Stockpile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="cube-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="scan-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="prices"
        options={{
          title: 'Prices',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="pricetag-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}