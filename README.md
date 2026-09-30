# Stockpile

A mobile household inventory and price-tracking application built with React Native, Expo, TypeScript, and SQLite.

Stockpile was created to make it easier to manage household items, pantry products, personal care products, makeup, cleaning supplies, and other stockpiled items.

The app uses a phone camera to scan product barcodes, attempts to identify products through an online product database, and stores inventory and purchase information locally on the device.

It is especially designed for tracking purchases over time, including regular price versus actual price paid, purchase location, quantity, expiration dates, and price-per-unit history.

> Currently developed and tested primarily on Android.

---

## Features

### Barcode Scanning

Use the phone camera to scan UPC and EAN product barcodes.

The scanner supports common barcode formats including:

- UPC-A
- UPC-E
- EAN-13
- EAN-8

If a scanned product has already been saved locally, Stockpile retrieves it directly from SQLite without making another online request.

---

### Product Lookup

When a new barcode is scanned, Stockpile attempts to retrieve product information using the Open Facts ecosystem.

Depending on the product, this may include data from:

- Open Food Facts
- Open Beauty Facts
- Open Products Facts

Retrieved information can include:

- Product name
- Brand
- Category
- Package size
- Unit

If a product cannot be found online, it can be entered manually.

Once manually entered, the product is stored locally and will be recognized the next time the barcode is scanned.

---

## Inventory Management

Each product can contain multiple purchase records.

For example:

```text
Tide Original
92 fl oz

Purchase 1
CVS
Quantity: 2
Regular Price: $15.99
Paid Price: $8.99

Purchase 2
Walmart
Quantity: 3
Regular Price: $14.99
Paid Price: $10.49
```

This allows the app to maintain accurate purchase and pricing history instead of storing only one price per product.

Users can:

- Add products
- Edit product information
- Delete products
- Add additional purchases
- Edit individual purchases
- Delete individual purchases
- Track quantity remaining
- Mark one item as used
- Restock an existing product

---

## Price Tracking

Stockpile keeps purchase history for each product.

The app can compare:

```text
Regular price
vs.
Actual price paid
```

and automatically calculate:

```text
Regular total
Paid total
Savings
Savings percentage
Price per unit
```

Example:

```text
Tide Original
92 fl oz

Regular Price: $15.99
Paid Price: $8.99

Savings: $7.00
Savings Percentage: 43.8%

Paid Unit Price:
$0.098 / fl oz
```

Keeping individual purchase records makes it possible to compare prices between stores and purchases over time.

---

## Purchase Information

Each purchase can store:

```text
Store
Quantity purchased
Quantity remaining
Regular price each
Price paid each
Purchase date
Expiration date
```

Purchase dates can be edited manually.

Expiration dates are optional because many household and cosmetic products do not include a traditional expiration date.

---

## Expiration Tracking

Products with expiration dates can appear in an **Expiring Soon** section.

Products without an expiration date remain in inventory normally and are excluded from expiration alerts.

When using an item, Stockpile prioritizes stock with the earliest expiration date first.

---

## Custom Folders

Products can be organized into custom folders.

Folders are completely user-managed and can be:

```text
Created
Renamed
Deleted
```

Example folders might include:

```text
Pantry
Cleaning
Laundry
Makeup
Personal Care
Bathroom
Paper Products
```

Deleting a folder does **not** delete the products assigned to it. Those products become unfiled.

The Stockpile screen includes:

```text
All
Unfiled
Custom folders...
```

`All` automatically displays the entire inventory.

---

## Search and Filtering

The inventory can be searched by product name or brand.

Products can also be filtered using their assigned folder.

Example:

```text
Search products...

[ All ] [ Unfiled ] [ Pantry ] [ Makeup ] [ Laundry ]
```

---

## CSV / Excel Export

Stockpile can export inventory and purchase data as a CSV file.

CSV files can be opened directly in applications such as:

- Microsoft Excel
- Google Sheets
- LibreOffice Calc

Exported information can include:

```text
Product
Brand
Barcode
Folder
Package Size
Unit
Store
Purchase Date
Quantity Purchased
Quantity Remaining
Current Stock
Regular Price
Paid Price
Regular Total
Paid Total
Savings
Savings Percentage
Price Per Unit
Expiration Date
```

This also provides a simple way to back up or analyze stockpile data outside the application.

---

# Tech Stack

| Technology | Purpose |
|---|---|
| React Native | Mobile application framework |
| Expo | React Native development and build tooling |
| TypeScript | Application language |
| Expo Router | File-based navigation |
| Expo Camera | Camera and barcode scanning |
| Expo SQLite | Local persistent database |
| Expo File System | CSV file creation |
| Expo Sharing | Export/share CSV files |
| Open Facts API | Product barcode lookup |
| EAS Build | Standalone Android application builds |

---

# Database Structure

Stockpile uses SQLite for local storage.

The main tables are:

### Products

```text
id
barcode
name
brand
category
size_amount
size_unit
folder_id
```

### Purchases

```text
id
product_id
store
quantity_purchased
quantity_remaining
regular_price_each
paid_price_each
purchase_date
expiration_date
notes
```

### Folders

```text
id
name
```

A single product can have multiple purchase records.

This allows Stockpile to preserve price history while still calculating current inventory.

---

# Project Structure

```text
src/
│
├── app/
│   │
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── scan.tsx
│   │   └── prices.tsx
│   │
│   ├── product/
│   │   └── [id].tsx
│   │
│   ├── purchase/
│   │   └── [id].tsx
│   │
│   ├── add-purchase/
│   │   └── [productId].tsx
│   │
│   ├── folders.tsx
│   └── _layout.tsx
│
├── components/
│   └── ActionButton.tsx
│
├── database/
│   └── database.ts
│
└── services/
    ├── productApi.ts
    └── exportCsv.ts
```

---

# Running the Project

## Requirements

Install:

```text
Node.js
npm
Git
```

For physical-device testing, install **Expo Go** on your Android device.

---

## Clone the Repository

```bash
git clone YOUR-GITHUB-REPOSITORY-URL
```

Move into the project:

```bash
cd StockpileApp
```

Install dependencies:

```bash
npm install
```

Start Expo:

```bash
npx expo start
```

A QR code will appear in the terminal.

Open Expo Go on your Android phone and scan the QR code.

---

# Running With a Clean Expo Cache

If Expo appears to be using old code or does not recognize a newly created route, stop the development server and run:

```bash
npx expo start -c
```

The `-c` option clears the Metro cache.

This is generally only necessary after larger project changes or when Expo appears to be loading stale code.

---

# Building a Standalone Android APK

Stockpile can also be installed as a standalone Android application without Expo Go or a development computer.

Install EAS CLI:

```bash
npm install --global eas-cli
```

Log in:

```bash
eas login
```

Configure EAS if necessary:

```bash
eas build:configure
```

Then create the Android preview build:

```bash
eas build -p android --profile preview
```

The preview profile uses internal distribution and creates an Android build that can be installed directly on a device.

After the build completes, EAS provides a link or QR code that can be opened on the Android device to install the application.

---

# Local-First Architecture

Stockpile follows a local-first approach.

When scanning a barcode:

```text
Barcode Scan
     ↓
Check SQLite
     ↓
Product already saved?
   /              \
 Yes              No
  ↓                ↓
Use local       Open Facts
product            ↓
                Product found?
                 /        \
               Yes        No
                ↓          ↓
             Use data   Manual entry
```

This reduces unnecessary API requests and allows previously saved products to continue working without an internet connection.

Internet access is primarily required when identifying a barcode that has not previously been saved locally.

---

# Current Development Goals

Current and future improvements may include:

```text
Improved UI and animations
Native date pickers
Low-stock alerts
Expiration notifications
Product images
CSV import
Inventory backup and restore
Additional price analytics
Unit conversions
Shopping mode
Cloud synchronization
Optional multi-device support
```

The project is intentionally being developed incrementally, with core functionality prioritized before additional features.

---

# Why I Built This

This project started as a personal tool for managing a household stockpile.

Traditional inventory apps often focus primarily on quantity. I wanted an application that also keeps track of:

```text
Where I purchased something
What the regular price was
What I actually paid
How much I saved
What the price per unit was
When I purchased it
When it expires
How much I currently have
```

The application also serves as a practical mobile-development project involving device hardware, external APIs, relational data, offline storage, navigation, data analysis, and file export.

---

## Status

🚧 **Active development**

The application is currently being developed and tested primarily on Android.

Core inventory, barcode scanning, purchase tracking, folders, price history, expiration tracking, and local SQLite storage are functional.
