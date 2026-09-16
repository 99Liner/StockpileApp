import {
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from 'expo-camera';

import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import type { ProductLookup } from '../../services/productApi';
import lookupProduct from '../../services/productApi';

type Folder = {
  id: number;
  name: string;
};

export default function ScanScreen() {
  const db = useSQLiteContext();
  const router = useRouter();

  const [permission, requestPermission] =
    useCameraPermissions();

  const [scanned, setScanned] = useState(false);
  const [barcode, setBarcode] = useState('');

  const [product, setProduct] =
    useState<ProductLookup | null>(null);

  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);

  // Purchase information
  const [quantity, setQuantity] = useState(1);
  const [store, setStore] = useState('');
  const [regularPrice, setRegularPrice] = useState('');
  const [paidPrice, setPaidPrice] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [purchaseDate, setPurchaseDate] =
    useState(
      new Date().toISOString().split('T')[0]
    );

  {/*Manual input for items*/}
  const [manualName, setManualName] = useState('');
  const [manualBrand, setManualBrand] = useState('');
  const [manualCategory, setManualCategory] = useState('');
  const [manualSize, setManualSize] = useState('');
  const [manualUnit, setManualUnit] = useState('');

  const [folders, setFolders] = useState<Folder[]>([]);

  const [
    selectedFolderId,
    setSelectedFolderId,
  ] = useState<number | null>(null);

  async function loadFolders() {
    const results =
      await db.getAllAsync<Folder>(`
        SELECT id, name
        FROM folders
        ORDER BY name COLLATE NOCASE
      `);

    setFolders(results);
  }

   useEffect(() => {
    loadFolders();
  }, []);

  
  if (!permission) {
    return (
      <View style={styles.center}>
        <Text>Checking camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>
          Camera permission is required to scan products.
        </Text>

        <Button
          title="Allow Camera"
          onPress={requestPermission}
        />
      </View>
    );
  }

  async function handleBarcodeScanned(
    result: BarcodeScanningResult
  ) {
    if (scanned) {
      return;
    }

    const scannedBarcode = result.data;

    setScanned(true);
    setBarcode(scannedBarcode);
    setLoading(true);
    setNotFound(false);
    setProduct(null);

    console.log('Looking up:', scannedBarcode);

    try {
      // Check own SQLite database first.
      const localProduct =
        await db.getFirstAsync<{
          barcode: string;
          name: string;
          brand: string | null;
          category: string | null;
          size_amount: number | null;
          size_unit: string | null;
          folder_id: number | null;
        }>(
          `
          SELECT
            barcode,
            name,
            brand,
            category,
            size_amount,
            size_unit,
            folder_id

          FROM products
          WHERE barcode = ?
          `,
          scannedBarcode
        );

      if (localProduct) {
        console.log(
          'Product found locally:',
          localProduct.name
        );

        const savedProduct: ProductLookup = {
          barcode: localProduct.barcode,
          name: localProduct.name,
          brand: localProduct.brand ?? '',
          category: localProduct.category ?? '',

          quantity:
            localProduct.size_amount !== null &&
            localProduct.size_unit
              ? `${localProduct.size_amount} ${localProduct.size_unit}`
              : '',

          sizeAmount:
            localProduct.size_amount,

          sizeUnit:
            localProduct.size_unit ?? '',
        };

        setProduct(savedProduct);

        setSelectedFolderId(
          localProduct.folder_id
        );

        return;
      }

      // STEP 2:
      // We don't know it yet, so search online.
      console.log(
        'Not in local database. Checking product API...'
      );

      const foundProduct =
        await lookupProduct(scannedBarcode);

      if (foundProduct) {
        setProduct(foundProduct);
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error(
        'Unexpected lookup error:',
        error
      );

      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  async function savePurchase() {
    console.log('SAVE BUTTON PRESSED');
    if (!product) {
      return;
    }

    if (!store.trim()) {
      Alert.alert(
        'Store Required',
        'Enter where you bought the product.'
      );
      return;
    }

    const regular = parseFloat(regularPrice);
    const paid = parseFloat(paidPrice);

    if (
      Number.isNaN(regular) ||
      Number.isNaN(paid)
    ) {
      Alert.alert(
        'Price Required',
        'Enter both the regular price and the price you paid.'
      );
      return;
    }

    if (regular < 0 || paid < 0) {
      Alert.alert(
        'Invalid Price',
        'Prices cannot be negative.'
      );
      return;
    }

    setSaving(true);

    try {
      // Check whether this product already exists.
      let savedProduct =
        await db.getFirstAsync<{ id: number }>(
          `
          SELECT id
          FROM products
          WHERE barcode = ?
          `,
          barcode
        );

      // If it doesn't exist, create it.
      if (!savedProduct) {
        const result = await db.runAsync(
          `
          INSERT INTO products
          (
            barcode,
            name,
            brand,
            category,
            size_amount,
            size_unit,
            folder_id
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
          barcode,
          product.name,
          product.brand,
          product.category,
          product.sizeAmount,
          product.sizeUnit,
          selectedFolderId
        );

        savedProduct = {
          id: result.lastInsertRowId,
        };
      }

      else {
        await db.runAsync(
          `
          UPDATE products
          SET folder_id = ?
          WHERE id = ?
          `,
          selectedFolderId,
          savedProduct.id
        );
      }

      const today =
        new Date().toISOString().split('T')[0];

      // Add this specific purchase.
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
        savedProduct.id,
        store.trim(),
        quantity,
        quantity,
        regular,
        paid,
        today,
        expirationDate.trim() || null
      );

      console.log('PURCHASE SAVED');

      const testPurchases = await db.getAllAsync(
        'SELECT * FROM purchases'
      );

      console.log(
        'PURCHASES IN DATABASE:',
        testPurchases
      );

      
      Alert.alert(
        'Added to Stockpile',
        `${quantity} × ${product.name} added successfully.`,
        [
          {
            text: 'OK',
            onPress: () => router.replace('/'),
          },
        ]
      );
    } catch (error) {
      console.error(
        'SAVE PURCHASE ERROR:',
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

  function scanAgain() {
    setBarcode('');
    setProduct(null);
    setNotFound(false);
    setScanned(false);

    setQuantity(1);
    setStore('');
    setRegularPrice('');
    setPaidPrice('');
    setExpirationDate('');
    setPurchaseDate(
      new Date().toISOString().split('T')[0]
    );

    setManualName('');
    setManualBrand('');
    setManualCategory('');
    setManualSize('');
    setManualUnit('');

    setSelectedFolderId(null);
  }

  const regular =
    parseFloat(regularPrice) || 0;

  const paid =
    parseFloat(paidPrice) || 0;

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

function continueWithManualProduct() {
  if (!manualName.trim()) {
    Alert.alert(
      'Product Name Required',
      'Enter a name for this product.'
    );
    return;
  }

  const parsedSize =
    manualSize.trim() === ''
      ? null
      : Number.parseFloat(manualSize);

  if (
    manualSize.trim() !== '' &&
    Number.isNaN(parsedSize)
  ) {
    Alert.alert(
      'Invalid Size',
      'Enter a valid package size.'
    );
    return;
  }

  const manualProduct: ProductLookup = {
    barcode,
    name: manualName.trim(),
    brand: manualBrand.trim(),
    category: manualCategory.trim(),

    quantity:
      parsedSize !== null && manualUnit.trim()
        ? `${parsedSize} ${manualUnit.trim()}`
        : '',

    sizeAmount: parsedSize,
    sizeUnit: manualUnit.trim(),
  };

  setProduct(manualProduct);
  setNotFound(false);
}


  return (
    <View style={styles.container}>
      {!scanned && (
        <>
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={
              handleBarcodeScanned
            }
            barcodeScannerSettings={{
              barcodeTypes: [
                'upc_a',
                'upc_e',
                'ean13',
                'ean8',
              ],
            }}
          />

          <View style={styles.scannerOverlay}>
            <View style={styles.scanBox} />
          </View>

          <View style={styles.scanInstructions}>
            <Text style={styles.scanTitle}>
              Scan a Product
            </Text>

            <Text>
              Point the camera at the barcode.
            </Text>
          </View>
        </>
      )}

      {loading && (
        <View style={styles.centerWhite}>
          <ActivityIndicator size="large" />

          <Text style={styles.loadingText}>
            Looking up product...
          </Text>
        </View>
      )}

      {!loading && product && (
        <ScrollView
          style={styles.form}
          contentContainerStyle={styles.formContent}
        >
          <Text style={styles.found}>
            Product Found
          </Text>

          <Text style={styles.productName}>
            {product.name}
          </Text>

          {product.brand !== '' && (
            <Text style={styles.productDetail}>
              {product.brand}
            </Text>
          )}

          {product.quantity !== '' && (
            <Text style={styles.productDetail}>
              Size: {product.quantity}
            </Text>
          )}

          <Text style={styles.barcode}>
            UPC: {barcode}
          </Text>

          <Text style={styles.sectionTitle}>
            Purchase Details
          </Text>

          <Text style={styles.label}>
            Quantity
          </Text>

          <View style={styles.quantityRow}>
            <Button
              title="−"
              onPress={() =>
                setQuantity((current) =>
                  Math.max(1, current - 1)
                )
              }
          />

          <Text style={styles.label}>
            Folder
          </Text>

          <View style={styles.folderOptions}>
            <Button
              title={
                selectedFolderId === null
                  ? '✓ Unfiled'
                  : 'Unfiled'
              }
              onPress={() =>
                setSelectedFolderId(null)
              }
            />

            {folders.map((folder) => (
              <View
                key={folder.id}
                style={styles.folderButton}
              >
                <Button
                  title={
                    selectedFolderId === folder.id
                      ? `✓ ${folder.name}`
                      : folder.name
                  }
                  onPress={() =>
                    setSelectedFolderId(
                      folder.id
                    )
                  }
                />
              </View>
            ))}
          </View>


          <Text style={styles.quantity}>
             {quantity}
          </Text>

          <Button
            title="+"
            onPress={() =>
              setQuantity((current) => current + 1)
              }
          />
          </View>

          <Text style={styles.label}>
            Store
          </Text>

          <TextInput
            style={styles.input}
            placeholder="CVS, Publix, Walmart..."
            value={store}
            onChangeText={setStore}
          />

          <Text style={styles.label}>
            Regular Price Each
          </Text>

          <TextInput
            style={styles.input}
            placeholder="5.99"
            keyboardType="decimal-pad"
            value={regularPrice}
            onChangeText={setRegularPrice}
          />

          <Text style={styles.label}>
            Price Paid Each
          </Text>

          <TextInput
            style={styles.input}
            placeholder="2.99"
            keyboardType="decimal-pad"
            value={paidPrice}
            onChangeText={setPaidPrice}
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
            placeholder="YYYY-MM-DD (optional)"
            value={expirationDate}
            onChangeText={setExpirationDate}
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
                : 'Add to Stockpile'
            }
            onPress={savePurchase}
            disabled={saving}
          />

          <View style={styles.buttonSpacer} />

          <Button
            title="Scan Another Product"
            onPress={scanAgain}
          />

          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}

      {!loading && notFound && (
        <ScrollView
          style={styles.form}
          contentContainerStyle={styles.formContent}
        >
          <Text style={styles.notFound}>
            Product Not Found
          </Text>

          <Text style={styles.barcode}>
            UPC: {barcode}
          </Text>

          <Text style={styles.notFoundMessage}>
            Enter the product information manually.
            It will be saved so you won't need to
            enter it again next time.
          </Text>

          <Text style={styles.label}>
            Product Name *
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Tide Original"
            value={manualName}
            onChangeText={setManualName}
          />

          <Text style={styles.label}>
            Brand
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Tide"
            value={manualBrand}
            onChangeText={setManualBrand}
          />

          <Text style={styles.label}>
            Category
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Laundry, Personal Care..."
            value={manualCategory}
            onChangeText={setManualCategory}
          />

          <Text style={styles.label}>
            Package Size
          </Text>

          <TextInput
            style={styles.input}
            placeholder="92"
            keyboardType="decimal-pad"
            value={manualSize}
            onChangeText={setManualSize}
          />

          <Text style={styles.label}>
            Unit
          </Text>

          <TextInput
            style={styles.input}
            placeholder="fl oz, oz, count, rolls..."
            value={manualUnit}
            onChangeText={setManualUnit}
          />

          <View style={{ marginTop: 25 }}>
            <Button
              title="Continue to Purchase"
              onPress={continueWithManualProduct}
            />
          </View>

          <View style={{ marginTop: 12 }}>
            <Button
              title="Scan Another Product"
              onPress={scanAgain}
            />
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },

  camera: {
    flex: 1,
  },

  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },

  scanBox: {
    width: 300,
    height: 160,
    borderWidth: 3,
    borderColor: 'white',
    borderRadius: 16,
  },

  scanInstructions: {
    padding: 24,
    backgroundColor: 'white',
  },

  scanTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 5,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  centerWhite: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  permissionText: {
    textAlign: 'center',
    marginBottom: 20,
  },

  loadingText: {
    marginTop: 15,
  },

  form: {
    flex: 1,
    backgroundColor: 'white',
  },

  formContent: {
    padding: 24,
    paddingTop: 60,
  },

  found: {
    fontSize: 16,
    marginBottom: 5,
  },

  productName: {
    fontSize: 28,
    fontWeight: 'bold',
  },

  productDetail: {
    fontSize: 16,
    marginTop: 4,
  },

  barcode: {
    fontSize: 14,
    marginTop: 10,
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 20,
  },

  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 14,
  },

  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },

  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },

  quantity: {
    fontSize: 22,
    fontWeight: 'bold',
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

  buttonSpacer: {
    height: 12,
  },

  bottomSpacer: {
    height: 40,
  },

  notFound: {
    fontSize: 26,
    fontWeight: 'bold',
  },

  notFoundMessage: {
    marginBottom: 20,
  },

  folderOptions: {
  marginBottom: 15,
},

folderButton: {
  marginTop: 8,
},


});