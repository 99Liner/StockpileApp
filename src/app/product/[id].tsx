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
    useFocusEffect,
    useLocalSearchParams,
    useRouter,
} from 'expo-router';

import { useSQLiteContext } from 'expo-sqlite';

import {
    useCallback,
    useState,
} from 'react';

type Product = {
  id: number;
  barcode: string;
  name: string;
  brand: string | null;
  category: string | null;
  size_amount: number | null;
  size_unit: string | null;
};

type Purchase = {
  id: number;
  store: string | null;
  quantity_purchased: number;
  quantity_remaining: number;
  regular_price_each: number | null;
  paid_price_each: number | null;
  purchase_date: string | null;
  expiration_date: string | null;
};

export default function ProductDetailScreen() {
  const db = useSQLiteContext();
  const router = useRouter();

  const { id } =
    useLocalSearchParams<{ id: string }>();

  const productId = Number(id);

  const [product, setProduct] =
    useState<Product | null>(null);

  const [purchases, setPurchases] =
    useState<Purchase[]>([]);

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');

  async function loadData() {
    const foundProduct =
      await db.getFirstAsync<Product>(
        `
        SELECT *
        FROM products
        WHERE id = ?
        `,
        productId
      );

    if (!foundProduct) {
      return;
    }

    setProduct(foundProduct);

    setName(foundProduct.name);
    setBrand(foundProduct.brand ?? '');

    const purchaseRows =
      await db.getAllAsync<Purchase>(
        `
        SELECT *
        FROM purchases
        WHERE product_id = ?
        ORDER BY purchase_date DESC, id DESC
        `,
        productId
      );

    setPurchases(purchaseRows);
  }

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [productId])
    );

  async function saveProductInfo() {
    if (!name.trim()) {
      Alert.alert(
        'Name Required',
        'Product name cannot be empty.'
      );

      return;
    }

    await db.runAsync(
      `
      UPDATE products
      SET
        name = ?,
        brand = ?
      WHERE id = ?
      `,
      name.trim(),
      brand.trim(),
      productId
    );

    Alert.alert(
      'Saved',
      'Product information updated.'
    );

    await loadData();
  }

  function confirmDeleteProduct() {
    Alert.alert(
      'Delete Product',
      'This will delete the product and all of its purchase history. Are you sure?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: deleteProduct,
        },
      ]
    );
  }

  async function deleteProduct() {
    await db.runAsync(
      `
      DELETE FROM products
      WHERE id = ?
      `,
      productId
    );

    router.replace('/');
  }

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
        {product.name}
      </Text>

      <Text style={styles.barcode}>
        UPC: {product.barcode}
      </Text>

      <Text style={styles.sectionTitle}>
        Product Information
      </Text>

      <Text style={styles.label}>
        Product Name
      </Text>

      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>
        Brand
      </Text>

      <TextInput
        style={styles.input}
        value={brand}
        onChangeText={setBrand}
      />

      {product.size_amount !== null && (
        <Text style={styles.sizeText}>
          Size: {product.size_amount}{' '}
          {product.size_unit}
        </Text>
      )}

      <Button
        title="Save Product Info"
        onPress={saveProductInfo}
      />

      <Text style={styles.sectionTitle}>
        Purchase History
      </Text>

      {purchases.map((purchase) => (
        <View
          key={purchase.id}
          style={styles.purchaseCard}
        >
          <Text style={styles.store}>
            {purchase.store || 'Unknown Store'}
          </Text>

          <Text>
            Purchased:{' '}
            {purchase.quantity_purchased}
          </Text>

          <Text>
            Remaining:{' '}
            {purchase.quantity_remaining}
          </Text>

          {purchase.regular_price_each !== null && (
            <Text>
              Regular: $
              {purchase.regular_price_each.toFixed(2)}
            </Text>
          )}

          {purchase.paid_price_each !== null && (
            <Text>
              Paid: $
              {purchase.paid_price_each.toFixed(2)}
            </Text>
          )}

          {purchase.purchase_date && (
            <Text>
              Purchased:{' '}
              {purchase.purchase_date}
            </Text>
          )}

          {purchase.expiration_date && (
            <Text>
              Expires:{' '}
              {purchase.expiration_date}
            </Text>
          )}

          <View style={{ marginTop: 12 }}>
            <Button
                title="Edit Purchase"
                onPress={() =>
                router.push({
                    pathname: '/purchase/[id]',
                    params: {
                    id: purchase.id.toString(),
                    },
                })
                }
            />
            </View>

        </View>
      ))}

      <View style={styles.deleteSection}>
        <Button
          title="Delete Product"
          color="red"
          onPress={confirmDeleteProduct}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },

  content: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 50,
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

  barcode: {
    marginTop: 5,
    marginBottom: 25,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 15,
  },

  label: {
    fontWeight: '600',
    marginBottom: 5,
    marginTop: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },

  sizeText: {
    marginTop: 15,
    marginBottom: 15,
  },

  purchaseCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },

  store: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  deleteSection: {
    marginTop: 30,
  },
});