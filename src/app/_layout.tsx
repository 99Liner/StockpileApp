// import '../global.css';

import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';

import { initializeDatabase } from '../database/database';

export default function RootLayout() {
  return (
    <SQLiteProvider
      databaseName="stockpile.db"
      onInit={initializeDatabase}
    >
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SQLiteProvider>
  );
}