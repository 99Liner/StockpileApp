import type { SQLiteDatabase } from 'expo-sqlite';

export async function initializeDatabase(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barcode TEXT UNIQUE,
      name TEXT NOT NULL,
      brand TEXT,
      category TEXT,
      size_amount REAL,
      size_unit TEXT
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
}