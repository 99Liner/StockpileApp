import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  useCallback,
  useState,
} from 'react';

import {
  useFocusEffect,
} from 'expo-router';

import {
  useSQLiteContext,
} from 'expo-sqlite';

type PriceRow = {
  purchase_id: number;

  product_id: number;
  name: string;
  brand: string | null;

  size_amount: number | null;
  size_unit: string | null;

  store: string | null;

  quantity_purchased: number;

  regular_price_each: number | null;
  paid_price_each: number | null;

  purchase_date: string | null;
};

type ProductPriceHistory = {
  productId: number;
  name: string;
  brand: string | null;

  sizeAmount: number | null;
  sizeUnit: string | null;

  purchases: PriceRow[];
};

export default function PricesScreen() {
  const db = useSQLiteContext();

  const [
    products,
    setProducts,
  ] = useState<ProductPriceHistory[]>([]);

  async function loadPriceHistory() {
    const rows =
      await db.getAllAsync<PriceRow>(`
        SELECT
          purchases.id AS purchase_id,

          products.id AS product_id,
          products.name,
          products.brand,
          products.size_amount,
          products.size_unit,

          purchases.store,
          purchases.quantity_purchased,
          purchases.regular_price_each,
          purchases.paid_price_each,
          purchases.purchase_date

        FROM purchases

        JOIN products
          ON products.id =
             purchases.product_id

        ORDER BY
          products.name,
          purchases.purchase_date DESC,
          purchases.id DESC
      `);

    const grouped =
      new Map<number, ProductPriceHistory>();

    for (const row of rows) {
      if (!grouped.has(row.product_id)) {
        grouped.set(
          row.product_id,
          {
            productId: row.product_id,
            name: row.name,
            brand: row.brand,

            sizeAmount:
              row.size_amount,

            sizeUnit:
              row.size_unit,

            purchases: [],
          }
        );
      }

      grouped
        .get(row.product_id)!
        .purchases
        .push(row);
    }

    setProducts(
      Array.from(grouped.values())
    );
  }

  useFocusEffect(
    useCallback(() => {
      loadPriceHistory();
    }, [])
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
    >
      <Text style={styles.title}>
        Price History
      </Text>

      <Text style={styles.subtitle}>
        Compare what you've paid over time.
      </Text>

      {products.length === 0 && (
        <Text style={styles.empty}>
          No purchase history yet.
        </Text>
      )}

      {products.map((product) => {
        const validPaidPrices =
          product.purchases
            .map(
              (purchase) =>
                purchase.paid_price_each
            )
            .filter(
              (price): price is number =>
                price !== null
            );

        const bestPrice =
          validPaidPrices.length > 0
            ? Math.min(
                ...validPaidPrices
              )
            : null;

        let bestUnitPrice:
          | number
          | null = null;

        if (
          bestPrice !== null &&
          product.sizeAmount !== null &&
          product.sizeAmount > 0
        ) {
          bestUnitPrice =
            bestPrice /
            product.sizeAmount;
        }

        const totalSavings =
          product.purchases.reduce(
            (total, purchase) => {
              const regular =
                purchase.regular_price_each ??
                0;

              const paid =
                purchase.paid_price_each ??
                0;

              return (
                total +
                (regular - paid) *
                  purchase.quantity_purchased
              );
            },
            0
          );

        return (
          <View
            key={product.productId}
            style={styles.productCard}
          >
            <Text
              style={styles.productName}
            >
              {product.name}
            </Text>

            {product.brand && (
              <Text
                style={styles.brand}
              >
                {product.brand}
              </Text>
            )}

            {product.sizeAmount !== null &&
              product.sizeUnit && (
                <Text
                  style={styles.size}
                >
                  {product.sizeAmount}{' '}
                  {product.sizeUnit}
                </Text>
              )}

            <View
              style={styles.summary}
            >
              <Text>
                Best price paid:{' '}
                <Text
                  style={
                    styles.summaryValue
                  }
                >
                  {bestPrice !== null
                    ? `$${bestPrice.toFixed(
                        2
                      )}`
                    : 'N/A'}
                </Text>
              </Text>

              {bestUnitPrice !== null &&
                product.sizeUnit && (
                  <Text>
                    Best unit price:{' '}
                    <Text
                      style={
                        styles.summaryValue
                      }
                    >
                      $
                      {bestUnitPrice.toFixed(
                        3
                      )}{' '}
                      /{' '}
                      {product.sizeUnit}
                    </Text>
                  </Text>
                )}

              <Text>
                Total saved:{' '}
                <Text
                  style={
                    styles.summaryValue
                  }
                >
                  $
                  {totalSavings.toFixed(
                    2
                  )}
                </Text>
              </Text>

              <Text>
                Purchases recorded:{' '}
                <Text
                  style={
                    styles.summaryValue
                  }
                >
                  {
                    product.purchases
                      .length
                  }
                </Text>
              </Text>
            </View>

            <Text
              style={
                styles.historyTitle
              }
            >
              Purchase History
            </Text>

            {product.purchases.map(
              (purchase) => (
                <View
                  key={
                    purchase.purchase_id
                  }
                  style={
                    styles.purchaseRow
                  }
                >
                  <Text
                    style={
                      styles.store
                    }
                  >
                    {purchase.store ||
                      'Unknown Store'}
                  </Text>

                  {purchase.purchase_date && (
                    <Text
                      style={
                        styles.date
                      }
                    >
                      {
                        purchase.purchase_date
                      }
                    </Text>
                  )}

                  <Text>
                    Quantity:{' '}
                    {
                      purchase.quantity_purchased
                    }
                  </Text>

                  <Text>
                    Regular:{' '}
                    {purchase.regular_price_each !==
                    null
                      ? `$${purchase.regular_price_each.toFixed(
                          2
                        )}`
                      : 'N/A'}
                  </Text>

                  <Text>
                    Paid:{' '}
                    {purchase.paid_price_each !==
                    null
                      ? `$${purchase.paid_price_each.toFixed(
                          2
                        )}`
                      : 'N/A'}
                  </Text>

                  {purchase.paid_price_each !==
                    null &&
                    product.sizeAmount !==
                      null &&
                    product.sizeAmount >
                      0 &&
                    product.sizeUnit && (
                      <Text>
                        Unit price: $
                        {(
                          purchase.paid_price_each /
                          product.sizeAmount
                        ).toFixed(3)}
                        {' / '}
                        {
                          product.sizeUnit
                        }
                      </Text>
                    )}
                </View>
              )
            )}
          </View>
        );
      })}
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
      paddingBottom: 60,
    },

    title: {
      fontSize: 30,
      fontWeight: 'bold',
    },

    subtitle: {
      fontSize: 16,
      marginTop: 5,
      marginBottom: 25,
    },

    empty: {
      textAlign: 'center',
      marginTop: 40,
      fontSize: 16,
    },

    productCard: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 12,
      padding: 18,
      marginBottom: 24,
    },

    productName: {
      fontSize: 22,
      fontWeight: 'bold',
    },

    brand: {
      fontSize: 16,
      marginTop: 3,
    },

    size: {
      marginTop: 3,
    },

    summary: {
      marginTop: 18,
      padding: 14,
      backgroundColor: '#f5f5f5',
      borderRadius: 8,
      gap: 6,
    },

    summaryValue: {
      fontWeight: 'bold',
    },

    historyTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginTop: 22,
      marginBottom: 10,
    },

    purchaseRow: {
      borderTopWidth: 1,
      borderTopColor: '#ddd',
      paddingTop: 12,
      paddingBottom: 12,
    },

    store: {
      fontSize: 17,
      fontWeight: '600',
    },

    date: {
      marginBottom: 6,
    },
  });