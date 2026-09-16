import { Ionicons } from '@expo/vector-icons';
import ActionButton from '../../components/ActionButton';

import {
  Alert,
  Button,
  Pressable,
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
  folder_id: number | null;
};

type Folder = {
  id: number;
  name: string;
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

  const [folders, setFolders] =
  useState<Folder[]>([]);

  const [
    selectedFolderId,
    setSelectedFolderId,
  ] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
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
        setProduct(null);
        return;
      }

      setProduct(foundProduct);
      setName(foundProduct.name);
      setBrand(foundProduct.brand ?? '');
      setSelectedFolderId(
        foundProduct.folder_id
      );

      const folderRows =
        await db.getAllAsync<Folder>(`
          SELECT id, name
          FROM folders
          ORDER BY name COLLATE NOCASE
        `);

      setFolders(folderRows);

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
    } catch (error) {
      console.error(
        'LOAD PRODUCT ERROR:',
        error
      );
    }
  }, [db, productId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
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
        brand = ?,
        folder_id = ?
        WHERE id = ?
        `,
        name.trim(),
        brand.trim(),
        selectedFolderId,
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

  async function useOne() {
    const batch =
        await db.getFirstAsync<{
        id: number;
        quantity_remaining: number;
        }>(
        `
        SELECT
            id,
            quantity_remaining
        FROM purchases
        WHERE
            product_id = ?
            AND quantity_remaining > 0

        ORDER BY
            CASE
            WHEN expiration_date IS NULL THEN 1
            ELSE 0
            END,
            expiration_date ASC,
            purchase_date ASC,
            id ASC

        LIMIT 1
        `,
        productId
        );

    if (!batch) {
        Alert.alert(
        'Out of Stock',
        'There are no remaining items for this product.'
        );

        return;
    }

    await db.runAsync(
        `
        UPDATE purchases
        SET quantity_remaining = quantity_remaining - 1
        WHERE id = ?
        `,
        batch.id
    );

    await loadData();
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

      <View style={styles.actionRow}>
        <ActionButton
          title="Use One"
          icon="remove-circle-outline"
          variant="secondary"
          style={styles.actionButton}
          onPress={useOne}
        />

        <ActionButton
          title="Restock"
          icon="add-circle-outline"
          style={styles.actionButton}
          onPress={() =>
            router.push({
              pathname: '/add-purchase/[productId]',
              params: {
                productId: productId.toString(),
              },
            })
          }
        />
      </View>

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

      <Text style={styles.label}>e
        Folder
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.folderRow}
      >
        <Pressable
          style={[
            styles.folderChip,
            selectedFolderId === null &&
              styles.selectedFolderChip,
          ]}
          onPress={() =>
            setSelectedFolderId(null)
          }
        >
          <Text
            style={[
              styles.folderChipText,
              selectedFolderId === null &&
                styles.selectedFolderChipText,
            ]}
          >
            Unfiled
          </Text>
        </Pressable>

        {folders.map((folder) => {
          const selected =
            selectedFolderId === folder.id;

          return (
            <Pressable
              key={folder.id}
              style={[
                styles.folderChip,
                selected &&
                  styles.selectedFolderChip,
              ]}
              onPress={() =>
                setSelectedFolderId(folder.id)
              }
            >
              <Text
                style={[
                  styles.folderChipText,
                  selected &&
                    styles.selectedFolderChipText,
                ]}
              >
                {folder.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {product.size_amount !== null && (
        <Text style={styles.sizeText}>
          Size: {product.size_amount}{' '}
          {product.size_unit}
        </Text>
      )}

      <ActionButton
        title="Save Changes"
        icon="save-outline"
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

          <View style={styles.purchaseHeader}>
            <View>
              <Text style={styles.store}>
                {purchase.store || 'Unknown Store'}
              </Text>

              {purchase.purchase_date && (
                <Text>
                  {purchase.purchase_date}
                </Text>
              )}
            </View>

            <Pressable
              style={styles.editIcon}
              onPress={() =>
                router.push({
                  pathname: '/purchase/[id]',
                  params: {
                    id: purchase.id.toString(),
                  },
                })
              }
            >
              <Ionicons
                name="create-outline"
                size={22}
                color="#222"
              />
            </Pressable>
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

  folderOptions: {
    marginTop: 5,
    marginBottom: 15,
  },

  folderButton: {
    marginTop: 8,
  },

  store: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  deleteSection: {
    marginTop: 30,
  },

  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
    marginBottom: 25,
  },

  actionButton: {
    flex: 1,
  },

  purchaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  editIcon: {
    padding: 8,
  },

  folderRow: {
    gap: 8,
    paddingVertical: 8,
    paddingRight: 20,
  },

  folderChip: {
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  folderChipText: {
    color: '#222',
  },

  selectedFolderChip: {
    backgroundColor: '#333',
    borderColor: '#333',
  },

  selectedFolderChipText: {
    color: 'white',
    fontWeight: '600',
  },
});