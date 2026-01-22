# 🏋️ Gym Inventory Management App

A mobile-first inventory management application built using **React Native (Expo)** and **Firebase**, designed for gyms and small fitness businesses to manage stock, sales, restocking, and revenue analytics in real time.

This project focuses on real-world operational workflows, providing staff-friendly UI, live synchronization, and business reporting features.

---

## 🚀 Features

### 🔐 Authentication

- Firebase Email/Password authentication
- Persistent login using native storage
- Secure staff access control

---

### 📦 Inventory Management

- Add, edit, and delete products
- Floating action button for quick product creation
- Long-press product actions (Edit / Delete)
- Reorder level tracking
- Automatic low-stock detection

---

### 💸 Sales & Restocking

- Sell products with quantity validation
- Prevent overselling using Firestore transactions
- Restock products with notes and supplier tracking
- Real-time stock updates

---

### 📊 Analytics & Reports

- Daily revenue summary
- Weekly revenue bar chart
- Monthly revenue trend chart
- Complete transaction history logs
- Sale vs Restock separation

---

### 🔔 Notifications

- Low stock alert notifications
- Real-time stock monitoring
- Native push support via Expo Notifications (Dev Build / Production)

---

### ⚡ Real-Time Sync

- Firestore real-time listeners
- Multi-device synchronization
- Offline-friendly architecture

---

## 🛠 Tech Stack

### Frontend

- React Native (Expo)
- Expo Router
- TypeScript
- Expo Dev Client

### Backend / Services

- Firebase Authentication
- Firebase Firestore
- Expo Notifications

### Charts

- react-native-chart-kit
- react-native-svg

---

## 📂 Project Structure

app/
├── \_layout.tsx
└── (tabs)/
├── index.tsx # Inventory Screen
├── sell.tsx # Sell Products
├── restock.tsx # Restock Products
└── history.tsx # Reports & Logs

lib/
├── firebase.ts
└── notifications.ts

types/
├── product.ts
└── transaction.ts

---

## ⚙️ Environment Setup

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id

```
