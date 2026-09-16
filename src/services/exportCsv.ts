import type { SQLiteDatabase } from 'expo-sqlite';

import {
    File,
    Paths,
} from 'expo-file-system';

import * as Sharing from 'expo-sharing';

type ExportRow = {
  barcode: string | null;
  product_name: string;
  brand: string | null;
  folder_name: string | null;

  size_amount: number | null;
  size_unit: string | null;

  store: string | null;

  quantity_purchased: number;
  quantity_remaining: number;
  current_product_stock: number;

  regular_price_each: number | null;
  paid_price_each: number | null;

  purchase_date: string | null;
  expiration_date: string | null;
};

function csvValue(
  value: string | number | null | undefined
) {
  if (value === null || value === undefined) {
    return '';
  }

  const text = String(value);

  return `"${text.replace(/"/g, '""')}"`;
}

export async function exportStockpileCsv(
  db: SQLiteDatabase
) {
  const rows =
    await db.getAllAsync<ExportRow>(`
      SELECT
        products.barcode,
        products.name AS product_name,
        products.brand,

        folders.name AS folder_name,

        products.size_amount,
        products.size_unit,

        purchases.store,
        purchases.quantity_purchased,
        purchases.quantity_remaining,

        (
          SELECT
            COALESCE(
              SUM(p2.quantity_remaining),
              0
            )
          FROM purchases p2
          WHERE
            p2.product_id = products.id
        ) AS current_product_stock,

        purchases.regular_price_each,
        purchases.paid_price_each,
        purchases.purchase_date,
        purchases.expiration_date

      FROM purchases

      JOIN products
        ON products.id =
           purchases.product_id

      LEFT JOIN folders
        ON folders.id =
           products.folder_id

      ORDER BY
        products.name COLLATE NOCASE,
        purchases.purchase_date DESC,
        purchases.id DESC
    `);

  const headers = [
    'Product',
    'Brand',
    'Barcode',
    'Folder',
    'Package Size',
    'Unit',
    'Store',
    'Purchase Date',
    'Quantity Purchased',
    'Quantity Remaining',
    'Current Product Stock',
    'Regular Price Each',
    'Paid Price Each',
    'Regular Total',
    'Paid Total',
    'Savings',
    'Savings Percent',
    'Paid Price Per Unit',
    'Expiration Date',
  ];

  const csvRows = rows.map((row) => {
    const regular =
      row.regular_price_each ?? 0;

    const paid =
      row.paid_price_each ?? 0;

    const regularTotal =
      regular * row.quantity_purchased;

    const paidTotal =
      paid * row.quantity_purchased;

    const savings =
      regularTotal - paidTotal;

    const savingsPercent =
      regularTotal > 0
        ? (savings / regularTotal) * 100
        : 0;

    const unitPrice =
      row.size_amount !== null &&
      row.size_amount > 0
        ? paid / row.size_amount
        : null;

    return [
      row.product_name,
      row.brand,
      row.barcode,
      row.folder_name ?? 'Unfiled',

      row.size_amount,
      row.size_unit,

      row.store,
      row.purchase_date,

      row.quantity_purchased,
      row.quantity_remaining,
      row.current_product_stock,

      regular.toFixed(2),
      paid.toFixed(2),

      regularTotal.toFixed(2),
      paidTotal.toFixed(2),
      savings.toFixed(2),
      savingsPercent.toFixed(1),

      unitPrice !== null
        ? unitPrice.toFixed(3)
        : '',

      row.expiration_date,
    ]
      .map(csvValue)
      .join(',');
  });

  const csv =
    [
      headers.map(csvValue).join(','),
      ...csvRows,
    ].join('\n');

  const date =
    new Date()
      .toISOString()
      .split('T')[0];

  const fileName =
    `stockpile-${date}-${Date.now()}.csv`;

  const file =
    new File(
      Paths.cache,
      fileName
    );

  file.create();
  file.write(csv);

  const sharingAvailable =
    await Sharing.isAvailableAsync();

  if (!sharingAvailable) {
    throw new Error(
      'Sharing is not available on this device.'
    );
  }

  await Sharing.shareAsync(
    file.uri,
    {
      mimeType: 'text/csv',
      dialogTitle: 'Export Stockpile',
    }
  );
}