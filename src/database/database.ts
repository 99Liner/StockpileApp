import type { SQLiteDatabase } from 'expo-sqlite';

export async function initializeDatabase(
  db: SQLiteDatabase
) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barcode TEXT UNIQUE,
      name TEXT NOT NULL,
      brand TEXT,
      category TEXT,
      size_amount REAL,
      size_unit TEXT,
      folder_id INTEGER
    );

    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      store TEXT,
      quantity_purchased INTEGER NOT NULL DEFAULT 1,
      quantity_remaining INTEGER NOT NULL DEFAULT 1,
      regular_price_each REAL,
      paid_price_each REAL,
      purchase_date TEXT,
      expiration_date TEXT,
      notes TEXT,

      FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE
    );
  `);

  // MIGRATION:
  // Existing databases already have the products table,
  // so CREATE TABLE above will NOT add folder_id automatically.
  const columns =
    await db.getAllAsync<{ name: string }>(
      `PRAGMA table_info(products)`
    );

  const hasFolderId =
    columns.some(
      (column) =>
        column.name === 'folder_id'
    );

  if (!hasFolderId) {
    console.log(
      'Adding folder_id to products...'
    );

    await db.execAsync(`
      ALTER TABLE products
      ADD COLUMN folder_id INTEGER;
    `);
  }

  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS
      idx_products_folder_id
    ON products(folder_id);
  `);
}