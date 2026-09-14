import {
    Alert,
    Button,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import {
    useLocalSearchParams,
    useRouter,
} from 'expo-router';

import { useSQLiteContext } from 'expo-sqlite';

import {
    useEffect,
    useState,
} from 'react';

type Product = {
  id: number;
  name: string;
  brand: string | null;
};

export default function AddPurchaseScreen() {
  const db = useSQLiteContext();
  const router = useRouter();

  const { productId } =
    useLocalSearchParams<{ productId: string }>();

  const id = Number(productId);

  const [product, setProduct] =
    useState<Product | null>(null);

  const [quantity, setQuantity] =
    useState('1');

  const [store, setStore] =
    useState('');

  const [regularPrice, setRegularPrice] =
    useState('');

  const [paidPrice, setPaidPrice] =
    useState('');

  const [purchaseDate, setPurchaseDate] =
    useState(
      new Date().toISOString().split('T')[0]
    );
    
  const [expirationDate, setExpirationDate] =
    useState('');

  const [saving, setSaving] =
    useState(false);

  async function loadProduct() {
    const found =
      await db.getFirstAsync<Product>(
        `
        SELECT id, name, brand
        FROM products
        WHERE id = ?
        `,
        id
      );

    setProduct(found ?? null);
  }

  useEffect(() => {
    loadProduct();
  }, []);

  async function savePurchase() {
    const qty =
      Number.parseInt(quantity, 10);

    const regular =
      Number.parseFloat(regularPrice);

    const paid =
      Number.parseFloat(paidPrice);

    if (
      Number.isNaN(qty) ||
      qty < 1
    ) {
      Alert.alert(
        'Invalid Quantity',
        'Quantity must be at least 1.'
      );

      return;
    }

    if (!store.trim()) {
      Alert.alert(
        'Store Required',
        'Enter where you bought this product.'
      );

      return;
    }

    if (
      Number.isNaN(regular) ||
      regular < 0
    ) {
      Alert.alert(
        'Invalid Price',
        'Enter a valid regular price.'
      );

      return;
    }

    if (
      Number.isNaN(paid) ||
      paid < 0
    ) {
      Alert.alert(
        'Invalid Price',
        'Enter a valid price paid.'
      );

      return;
    }

    setSaving(true);

    try {
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
          purchase_date,
          expiration_date
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        id,
        store.trim(),
        qty,
        qty,
        regular,
        paid,
        purchaseDate.trim() || null,
        expirationDate.trim() || null
      );

      Alert.alert(
        'Purchase Added',
        `${qty} × ${product?.name ?? 'product'} added.`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error(
        'ADD PURCHASE ERROR:',
        error
      );

      Alert.alert(
        'Error',
        'The purchase could not be saved.'
      );
    } finally {
      setSaving(false);
    }
  }

  const qty =
    Number.parseInt(quantity, 10) || 0;

  const regular =
    Number.parseFloat(regularPrice) || 0;

  const paid =
    Number.parseFloat(paidPrice) || 0;

  const regularTotal =
    regular * qty;

  const paidTotal =
    paid * qty;

  const savings =
    regularTotal - paidTotal;

  const savingsPercent =
    regularTotal > 0
      ? (savings / regularTotal) * 100
      : 0;

  if (!product) {
    return (
      <View style={styles.center}>
        <Text>Loading product...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>
        Add Purchase
      </Text>

      <Text style={styles.productName}>
        {product.name}
      </Text>

      {product.brand && (
        <Text style={styles.brand}>
          {product.brand}
        </Text>
      )}

      <Text style={styles.label}>
        Quantity
      </Text>

      <TextInput
        style={styles.input}
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="number-pad"
      />

      <Text style={styles.label}>
        Store
      </Text>

      <TextInput
        style={styles.input}
        value={store}
        onChangeText={setStore}
        placeholder="CVS, Publix, Walmart..."
      />

      <Text style={styles.label}>
        Regular Price Each
      </Text>

      <TextInput
        style={styles.input}
        value={regularPrice}
        onChangeText={setRegularPrice}
        keyboardType="decimal-pad"
        placeholder="5.99"
      />

      <Text style={styles.label}>
        Price Paid Each
      </Text>

      <TextInput
        style={styles.input}
        value={paidPrice}
        onChangeText={setPaidPrice}
        keyboardType="decimal-pad"
        placeholder="2.99"
      />

      <Text style={styles.label}>
        Purchase Date
      </Text>

      <TextInput
        style={styles.input}
        value={purchaseDate}
        onChangeText={setPurchaseDate}
        placeholder="YYYY-MM-DD"
      />


      <Text style={styles.label}>
        Expiration Date
      </Text>

      <TextInput
        style={styles.input}
        value={expirationDate}
        onChangeText={setExpirationDate}
        placeholder="YYYY-MM-DD (optional)"
      />

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>
          Purchase Summary
        </Text>

        <Text>
          Regular total: ${regularTotal.toFixed(2)}
        </Text>

        <Text>
          Paid total: ${paidTotal.toFixed(2)}
        </Text>

        <Text>
          Savings: ${savings.toFixed(2)}
        </Text>

        <Text>
          Savings: {savingsPercent.toFixed(1)}%
        </Text>
      </View>

      <Button
        title={
          saving
            ? 'Saving...'
            : 'Add Purchase'
        }
        onPress={savePurchase}
        disabled={saving}
      />

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'white',
    },

    content: {
      padding: 24,
      paddingTop: 60,
    },

    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },

    title: {
      fontSize: 30,
      fontWeight: 'bold',
    },

    productName: {
      fontSize: 22,
      fontWeight: '600',
      marginTop: 8,
    },

    brand: {
      fontSize: 16,
      marginBottom: 20,
    },

    label: {
      fontWeight: '600',
      marginTop: 15,
      marginBottom: 6,
    },

    input: {
      borderWidth: 1,
      borderColor: '#aaa',
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
    },

    summary: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 10,
      padding: 16,
      marginTop: 25,
      marginBottom: 20,
      gap: 5,
    },

    summaryTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 5,
    },
  });