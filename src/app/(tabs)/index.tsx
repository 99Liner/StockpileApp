import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import ActionButton from '../../components/ActionButton';
import { exportStockpileCsv } from '../../services/exportCsv';

import {
  Alert,
  Button,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

type StockItem = {
  id: number;
  name: string;
  brand: string | null;
  quantity: number;
  nextExpiration: string | null;
  folderId: number | null;
};

type ExpiringItem = {
  purchaseId: number;
  productName: string;
  quantity: number;
  expirationDate: string;
};

type Folder = {
  id: number;
  name: string;
};

export default function StockpileScreen() {
  const db = useSQLiteContext();

  const router = useRouter();

  const [items, setItems] =
    useState<StockItem[]>([]);

  const [expiringItems, setExpiringItems] =
    useState<ExpiringItem[]>([]);

  const [folders, setFolders] =
    useState<Folder[]>([]);

  const [search, setSearch] =
    useState('');

  const [
    selectedFolder,
    setSelectedFolder,
] =
  useState<
    'all' | 'unfiled' | number
  >('all');

  async function loadItems() {
    const results =
      await db.getAllAsync<StockItem>(`
        SELECT
          products.id,
          products.name,
          products.brand,
          products.folder_id AS folderId,

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

        ORDER BY
          products.name COLLATE NOCASE
      `);

    setItems(results);

    const expiring =
      await db.getAllAsync<ExpiringItem>(`
        SELECT
          purchases.id AS purchaseId,
          products.name AS productName,
          purchases.quantity_remaining AS quantity,
          purchases.expiration_date AS expirationDate

        FROM purchases

        JOIN products
          ON products.id = purchases.product_id

        WHERE
          purchases.quantity_remaining > 0
          AND purchases.expiration_date IS NOT NULL
          AND date(purchases.expiration_date) >= date('now')
          AND date(purchases.expiration_date)
            <= date('now', '+30 days')

        ORDER BY
          purchases.expiration_date ASC
      `);

    setExpiringItems(expiring);
  
    const folderRows =
    await db.getAllAsync<Folder>(`
      SELECT id, name
      FROM folders
      ORDER BY name COLLATE NOCASE
    `);
    setFolders(folderRows);
  
  }

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [])
  );

  async function handleExport() {
  try {
    await exportStockpileCsv(db);
  } catch (error) {
    console.error(
      'EXPORT ERROR:',
      error
    );

    Alert.alert(
      'Export Failed',
      'The CSV file could not be exported.'
    );
  }
}

  const filteredItems =
  items.filter((item) => {
    const matchesSearch =
      item.name
        .toLowerCase()
        .includes(
          search.toLowerCase()
        ) ||
      (item.brand ?? '')
        .toLowerCase()
        .includes(
          search.toLowerCase()
        );

    let matchesFolder = true;

    if (
      selectedFolder ===
      'unfiled'
    ) {
      matchesFolder =
        item.folderId === null;
    }

    if (
      typeof selectedFolder ===
      'number'
    ) {
      matchesFolder =
        item.folderId ===
        selectedFolder;
    }

    return (
      matchesSearch &&
      matchesFolder
    );
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        My Stockpile
      </Text>

      <Text style={styles.subtitle}>
        {items.length} products
      </Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Search products..."
        value={search}
        onChangeText={setSearch}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.folderScroll}
        contentContainerStyle={styles.folderRow}
      >
        <Pressable
          style={[
            styles.folderChip,
            selectedFolder === 'all' &&
              styles.selectedFolderChip,
          ]}
          onPress={() =>
            setSelectedFolder('all')
          }
        >
          <Text
            style={[
              styles.folderChipText,
              selectedFolder === 'all' &&
                styles.selectedFolderChipText,
            ]}
          >
            All
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.folderChip,
            selectedFolder === 'unfiled' &&
              styles.selectedFolderChip,
          ]}
          onPress={() =>
            setSelectedFolder('unfiled')
          }
        >
          <Text
            style={[
              styles.folderChipText,
              selectedFolder === 'unfiled' &&
                styles.selectedFolderChipText,
            ]}
          >
            Unfiled
          </Text>
        </Pressable>

        {folders.map((folder) => {
          const isSelected =
            selectedFolder === folder.id;

          return (
            <Pressable
              key={folder.id}
              style={[
                styles.folderChip,
                isSelected &&
                  styles.selectedFolderChip,
              ]}
              onPress={() =>
                setSelectedFolder(folder.id)
              }
            >
              <Text
                style={[
                  styles.folderChipText,
                  isSelected &&
                    styles.selectedFolderChipText,
                ]}
              >
                {folder.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={{ marginBottom: 20 }}>
        <Button
          title="Manage Folders"
          onPress={() =>
            router.push('/folders')
          }
        />
      </View>

      <View style={{ marginBottom: 10 }}>
        <ActionButton
          title="Export CSV"
          icon="download-outline"
          variant="secondary"
          onPress={handleExport}
        />
      </View>
  

    {/* Expiring items section */}
    {expiringItems.length > 0 && (
      <View style={styles.expiringSection}>
        <Text style={styles.expiringTitle}>
          Expiring Soon
        </Text>

        {expiringItems.map((item) => (
          <View
            key={item.purchaseId}
            style={styles.expiringItem}
          >
            <Text style={styles.expiringName}>
              {item.productName}
            </Text>

            <Text>
              Qty: {item.quantity}
            </Text>

            <Text>
              Expires: {item.expirationDate}
            </Text>
          </View>
        ))}
      </View>
    )}

  {/* Normal stockpile list */}
    {filteredItems.length === 0 ? (
      <Text style={styles.empty}>
        No products found.
      </Text>
    ) : (
      <FlatList
        data={filteredItems}
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

  expiringSection: {
    marginBottom: 25,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
  },

  expiringTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  expiringItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  expiringName: {
    fontWeight: '600',
  },

  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },

  folderScroll: {
    marginBottom: 15,
    flexGrow: 0,
  },

  folderRow: {
    gap: 8,
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
    fontSize: 14,
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