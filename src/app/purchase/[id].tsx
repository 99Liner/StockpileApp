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

type Purchase = {
  id: number;
  product_id: number;
  store: string | null;
  quantity_purchased: number;
  quantity_remaining: number;
  regular_price_each: number | null;
  paid_price_each: number | null;
  purchase_date: string | null;
  expiration_date: string | null;
};

export default function PurchaseDetailScreen() {
  const db = useSQLiteContext();
  const router = useRouter();

  const { id } =
    useLocalSearchParams<{ id: string }>();

  const purchaseId = Number(id);

  const [purchase, setPurchase] =
    useState<Purchase | null>(null);

  const [productName, setProductName] =
    useState('');

  const [store, setStore] =
    useState('');

  const [
    quantityPurchased,
    setQuantityPurchased,
  ] = useState('');

  const [
    quantityRemaining,
    setQuantityRemaining,
  ] = useState('');

  const [
    regularPrice,
    setRegularPrice,
  ] = useState('');

  const [
    paidPrice,
    setPaidPrice,
  ] = useState('');

  const [
    purchaseDate,
    setPurchaseDate,
  ] = useState('');

  const [
    expirationDate,
    setExpirationDate,
  ] = useState('');

  async function loadPurchase() {
    const foundPurchase =
      await db.getFirstAsync<
        Purchase & { product_name: string }
      >(
        `
        SELECT
          purchases.*,
          products.name AS product_name
        FROM purchases
        JOIN products
          ON products.id = purchases.product_id
        WHERE purchases.id = ?
        `,
        purchaseId
      );

    if (!foundPurchase) {
      return;
    }

    setPurchase(foundPurchase);

    setProductName(
      foundPurchase.product_name
    );

    setStore(
      foundPurchase.store ?? ''
    );

    setQuantityPurchased(
      foundPurchase.quantity_purchased.toString()
    );

    setQuantityRemaining(
      foundPurchase.quantity_remaining.toString()
    );

    setRegularPrice(
      foundPurchase.regular_price_each?.toString()
        ?? ''
    );

    setPaidPrice(
      foundPurchase.paid_price_each?.toString()
        ?? ''
    );

    setPurchaseDate(
      foundPurchase.purchase_date ?? ''
    );

    setExpirationDate(
      foundPurchase.expiration_date ?? ''
    );
  }

  useEffect(() => {
    loadPurchase();
  }, []);

  async function saveChanges() {
    const purchased =
      Number.parseInt(
        quantityPurchased,
        10
      );

    const remaining =
      Number.parseInt(
        quantityRemaining,
        10
      );

    const regular =
      Number.parseFloat(
        regularPrice
      );

    const paid =
      Number.parseFloat(
        paidPrice
      );

    if (!store.trim()) {
      Alert.alert(
        'Store Required',
        'Enter the store where you bought this item.'
      );

      return;
    }

    if (
      Number.isNaN(purchased) ||
      purchased < 1
    ) {
      Alert.alert(
        'Invalid Quantity',
        'Quantity purchased must be at least 1.'
      );

      return;
    }

    if (
      Number.isNaN(remaining) ||
      remaining < 0
    ) {
      Alert.alert(
        'Invalid Quantity',
        'Quantity remaining cannot be negative.'
      );

      return;
    }

    if (remaining > purchased) {
      Alert.alert(
        'Invalid Quantity',
        'Quantity remaining cannot be greater than quantity purchased.'
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
        'Enter a valid paid price.'
      );

      return;
    }

    try {
      await db.runAsync(
        `
        UPDATE purchases
        SET
          store = ?,
          quantity_purchased = ?,
          quantity_remaining = ?,
          regular_price_each = ?,
          paid_price_each = ?,
          purchase_date = ?,
          expiration_date = ?
        WHERE id = ?
        `,
        store.trim(),
        purchased,
        remaining,
        regular,
        paid,
        purchaseDate.trim() || null,
        expirationDate.trim() || null,
        purchaseId
      );

      Alert.alert(
        'Saved',
        'Purchase updated successfully.',
        [
          {
            text: 'OK',
            onPress: () =>
              router.back(),
          },
        ]
      );
    } catch (error) {
      console.error(
        'UPDATE PURCHASE ERROR:',
        error
      );

      Alert.alert(
        'Error',
        'The purchase could not be updated.'
      );
    }
  }

  function confirmDelete() {
    Alert.alert(
      'Delete Purchase',
      'Delete this purchase from your history?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: deletePurchase,
        },
      ]
    );
  }

  async function deletePurchase() {
    try {
      await db.runAsync(
        `
        DELETE FROM purchases
        WHERE id = ?
        `,
        purchaseId
      );

      router.back();
    } catch (error) {
      console.error(
        'DELETE PURCHASE ERROR:',
        error
      );

      Alert.alert(
        'Error',
        'The purchase could not be deleted.'
      );
    }
  }

  if (!purchase) {
    return (
      <View style={styles.center}>
        <Text>
          Loading purchase...
        </Text>
      </View>
    );
  }

  const regular =
    Number.parseFloat(regularPrice) || 0;

  const paid =
    Number.parseFloat(paidPrice) || 0;

  const quantity =
    Number.parseInt(
      quantityPurchased,
      10
    ) || 0;

  const regularTotal =
    regular * quantity;

  const paidTotal =
    paid * quantity;

  const savings =
    regularTotal - paidTotal;

  const savingsPercent =
    regularTotal > 0
      ? (savings / regularTotal) * 100
      : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>
        Edit Purchase
      </Text>

      <Text style={styles.productName}>
        {productName}
      </Text>

      <Text style={styles.label}>
        Store
      </Text>

      <TextInput
        style={styles.input}
        value={store}
        onChangeText={setStore}
        placeholder="CVS, Walmart..."
      />

      <Text style={styles.label}>
        Quantity Purchased
      </Text>

      <TextInput
        style={styles.input}
        value={quantityPurchased}
        onChangeText={setQuantityPurchased}
        keyboardType="number-pad"
      />

      <Text style={styles.label}>
        Quantity Remaining
      </Text>

      <TextInput
        style={styles.input}
        value={quantityRemaining}
        onChangeText={setQuantityRemaining}
        keyboardType="number-pad"
      />

      <Text style={styles.label}>
        Regular Price Each
      </Text>

      <TextInput
        style={styles.input}
        value={regularPrice}
        onChangeText={setRegularPrice}
        keyboardType="decimal-pad"
      />

      <Text style={styles.label}>
        Price Paid Each
      </Text>

      <TextInput
        style={styles.input}
        value={paidPrice}
        onChangeText={setPaidPrice}
        keyboardType="decimal-pad"
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
        placeholder="YYYY-MM-DD"
      />

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>
          Purchase Summary
        </Text>

        <Text>
          Regular total: $
          {regularTotal.toFixed(2)}
        </Text>

        <Text>
          Paid total: $
          {paidTotal.toFixed(2)}
        </Text>

        <Text>
          Savings: $
          {savings.toFixed(2)}
        </Text>

        <Text>
          Savings: {savingsPercent.toFixed(1)}%
        </Text>
      </View>

      <Button
        title="Save Changes"
        onPress={saveChanges}
      />

      <View style={styles.spacer} />

      <Button
        title="Delete This Purchase"
        color="red"
        onPress={confirmDelete}
      />

      <View style={styles.bottomSpace} />
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
      fontSize: 20,
      marginTop: 5,
      marginBottom: 25,
    },

    label: {
      fontSize: 15,
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

    spacer: {
      height: 15,
    },

    bottomSpace: {
      height: 60,
    },
  });