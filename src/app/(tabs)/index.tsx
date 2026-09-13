import { useEffect, useState } from 'react';
import {
  Button,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useSQLiteContext } from 'expo-sqlite';

type StockItem = {
  id: number;
  name: string;
  quantity: number;
};

export default function StockpileScreen() {
  const db = useSQLiteContext();

  const [items, setItems] = useState<StockItem[]>([]);

  async function loadItems() {
    const results = await db.getAllAsync<StockItem>(`
      SELECT
        products.id,
        products.name,
        SUM(purchases.quantity_remaining) AS quantity
      FROM products
      JOIN purchases
        ON purchases.product_id = products.id
      GROUP BY products.id
      ORDER BY products.name
    `);

    setItems(results);
  }

  async function addSampleItem() {
    let product = await db.getFirstAsync<{ id: number }>(
      'SELECT id FROM products WHERE barcode = ?',
      'TEST123'
    );

    if (!product) {
      const result = await db.runAsync(
        `
        INSERT INTO products
        (barcode, name, brand, category, size_amount, size_unit)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        'TEST123',
        'Sample Toothpaste',
        'Sample Brand',
        'Personal Care',
        4.8,
        'oz'
      );

      product = {
        id: result.lastInsertRowId,
      };
    }

    await db.runAsync(
      `
      INSERT INTO purchases
      (
        product_id,
        store,
        quantity_purchased,
        quantity_remaining,
        regular_price_each,
        paid_price_each,
        purchase_date
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      product.id,
      'CVS',
      2,
      2,
      5.99,
      2.99,
      new Date().toISOString()
    );

    await loadItems();
  }

  useEffect(() => {
    loadItems();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        My Stockpile
      </Text>

      <Text style={styles.subtitle}>
        {items.length} products
      </Text>

      <Button
        title="Add Sample Item"
        onPress={addSampleItem}
      />

      <FlatList
        data={items}
        keyExtractor={(item) =>
          item.id.toString()
        }
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemName}>
              {item.name}
            </Text>

            <Text>
              Quantity: {item.quantity}
            </Text>
          </View>
        )}
      />
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

  item: {
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 8,
  },

  itemName: {
    fontSize: 18,
    fontWeight: '600',
  },
});