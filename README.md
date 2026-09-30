# Stockpile

A mobile household inventory and price-tracking application built with React Native, Expo, TypeScript, and SQLite.

Stockpile was created to make it easier to manage household items, pantry products, personal care products, makeup, cleaning supplies, and other stockpiled items.

The app uses a phone camera to scan product barcodes, attempts to identify products through an online product database, and stores inventory and purchase information locally on the device.

It is especially designed for tracking purchases over time, including regular price versus actual price paid, purchase location, quantity, expiration dates, and price-per-unit history.

> Currently developed and tested primarily on Android.

---

# Why I Built This

This project started as a personal tool for managing my personal cuponing stockpile and compare prices overtime. 

Traditional inventory apps often focus primarily on quantity. I wanted an application that also keeps track of:

```text
What the regular price was
What I actually paid
How much I saved
What the price per unit was
When/Where I purchased it
When it expires
How much I currently have
```

The application also serves as a practical mobile-development project involving device hardware, external APIs, relational data, offline storage, navigation, data analysis, and file export.

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

## Search and Filtering

The inventory can be searched by product name or brand.

Products can also be filtered using their assigned folder.

---

## CSV / Excel Export

Stockpile can export inventory and purchase data as a CSV file.

CSV files can be opened directly in applications such as:

- Microsoft Excel
- Google Sheets

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

A single product can have multiple purchase records.

This allows Stockpile to preserve price history while still calculating current inventory.

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
Unit conversions
Cloud synchronization
Optional multi-device support
```

The project is intentionally being developed incrementally, with core functionality prioritized before additional features.

---


## Status

🚧 **Active development**

The application is currently being developed and tested primarily on Android.

Core inventory, barcode scanning, purchase tracking, folders, price history, expiration tracking, and local SQLite storage are functional.
