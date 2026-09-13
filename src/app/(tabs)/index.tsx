import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable } from 'react-native';

import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

type StockItem = {
  id: number;
  name: string;
  brand: string | null;
  quantity: number;
  nextExpiration: string | null;
};

export default function StockpileScreen() {
  const db = useSQLiteContext();

  const router = useRouter();

  const [items, setItems] =
    useState<StockItem[]>([]);

  async function loadItems() {
    const results =
      await db.getAllAsync<StockItem>(`
        SELECT
          products.id,
          products.name,
          products.brand,
          SUM(
            purchases.quantity_remaining
          ) AS quantity,
          MIN(
            purchases.expiration_date
          ) AS nextExpiration
        FROM products
        JOIN purchases
          ON purchases.product_id = products.id
        WHERE purchases.quantity_remaining > 0
        GROUP BY products.id
        ORDER BY products.name
      `);

    setItems(results);
  }

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        My Stockpile
      </Text>

      <Text style={styles.subtitle}>
        {items.length} products
      </Text>

      {items.length === 0 ? (
        <Text style={styles.empty}>
          Your stockpile is empty.
          Scan something to get started.
        </Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) =>
            item.id.toString()
          }

          renderItem={({ item }) => (
            <Pressable
              style={styles.item}
              onPress={() =>
                router.push({
                  pathname: '/product/[id]',
                  params: { id: item.id.toString() },
                })
              }
            >
            
              <Text style={styles.itemName}>
                {item.name}
              </Text>

              {item.brand && (
                <Text>
                  {item.brand}
                </Text>
              )}

              <Text style={styles.quantity}>
                In stock: {item.quantity}
              </Text>

              {item.nextExpiration && (
                <Text>
                  Next expiration:{' '}
                  {item.nextExpiration}
                </Text>
              )}
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
  },

  title: {
    fontSize: 30,
    fontWeight: 'bold',
  },

  subtitle: {
    fontSize: 16,
    marginBottom: 20,
  },

  empty: {
    fontSize: 16,
    marginTop: 30,
    textAlign: 'center',
  },

  item: {
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
  },

  itemName: {
    fontSize: 19,
    fontWeight: 'bold',
  },

  quantity: {
    marginTop: 8,
    fontWeight: '600',
  },
});