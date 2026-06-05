# 🇲🇦 Moroccan Expense & Budget Tracker

[![Flutter](https://img.shields.io/badge/Flutter-v3.22+-02569B?logo=flutter&logoColor=white)](#)
[![IsarDB](https://img.shields.io/badge/Database-Isar%20NoSQL-00B2A9?logo=dart&logoColor=white)](#)
[![Firebase](https://img.shields.io/badge/Cloud-Firestore%20Sync-FFCA28?logo=firebase&logoColor=amber)](#)
[![Provider](https://img.shields.io/badge/State-Provider-0175C2?logo=dart&logoColor=white)](#)
[![License](https://img.shields.io/badge/License-MIT-green)](#)

An enterprise-ready, **Offline-First** cross-platform mobile application meticulously engineered for Moroccan citizens to manage daily budgets, track micro-transactions, and organize recurring national utility bills. Fully functional without internet connectivity, the application synchronizes seamlessly with Firebase Cloud Firestore in the background using conflict-resilient protocols.

---

## 🗺️ High-Level Technical Architecture

The application is structured following clean architectural boundaries. It segregates logic into **Data, Repository, and Presentation/State** layers, utilizing **Isar NoSQL** as the local-first source of truth and **Firebase Firestore** as the cloud replica.

```
       ┌────────────────────────────────────────────────────────┐
       │             PRESENTATION (Flutter UI & Views)         │
       └───────────────────────────┬────────────────────────────┘
                                   │ listens to
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │              STATE MANAGER (Provider / ChangeNotifier) │
       └───────────────────────────┬────────────────────────────┘
                                   │ calls
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │             REPOSITORY / SYNC LAYER (SyncManager)      │
       └───────────────────────────┬────────────────────────────┘
                                   │
                  ┌────────────────┴────────────────┐
                  ▼ (Writes First / Outbox Read)   ▼ (Sync Push & Pull)
       ┌─────────────────────┐             ┌────────────────────┐
       │   LOCAL DATABASE    │             │   CLOUD DATABASE   │
       │    (Isar DB)        │             │ (Firebase Firestore)│
       └─────────────────────┘             └────────────────────┘
```

### Key Pillars of the Offline-First Architecture

1. **Local-First Writes**: Every user interaction (adding a transaction, marking a bill paid, changing settings) is instantly written to the local **Isar database** with local timestamp metadata (`updatedAt`) and a tracking flag `isSynced = false`. The UI updates reactively and instantly via `ChangeNotifier`.
2. **Deterministic Cloud Document IDs**: We use **UUIDs (String)** as the primary key (`firestoreId`) for all records across both local and cloud databases. Utilizing UUIDs prevents key collisions when multiple devices write offline, which is a major issue with auto-incremented local integers.
3. **Background Sync SyncManager**: A specialized engine that monitors database mutation logs and internet connections using `connectivity_plus` and standard stream triggers.
4. **Soft Deletions**: Records are deleted by setting `isDeleted = true`. During synchronize passes, these soft deletes are propagated to Firestore, after which they are safely pruned from the local database.

---

## 🔄 Synchronization Strategy & Conflict Resolution

Our synchronization utilizes a **Last-Write-Wins (LWW)** conflict resolution algorithm backed by strict transaction markers.

### Step-by-Step Sync Workflow

1. **Internet Restored Trigger**: The `SyncManager` registers an active listener on the device's internet connection. Once online, it fires a sync event.
2. **Push (Local-to-Cloud)**:
   - Identify all local entities with `isSynced == false`.
   - Separate inserts, updates, and deletes (where `isDeleted == true`).
   - Push mutations to Firestore using transactional batch writes.
   - On successful write, update local records to `isSynced = true` and remove soft-deleted records from Isar.
3. **Pull (Cloud-to-Local)**:
   - Fetch remote documents updated since the last sync.
   - For each cloud record, compare timestamps (`updatedAt`) with the local counterpart:
     - **Cloud is Newer**: Overwrite the local Isar database.
     - **Local is Newer / Modified Offline**: Keep local version, set `isSynced = false`, and let the next push cycle resolve it.
     - **Equal**: Do nothing.

---

## 📂 Project Folder Structure

```
lib/
├── main.dart                      # App entry-point & provider initializations
├── models/                        # Isar Collection definitions
│   ├── user.dart
│   ├── transaction.dart
│   ├── category.dart
│   └── bill.dart
├── services/                      # Operational infrastructure & Sync core
│   ├── isar_service.dart          # Database open, query, write utilities
│   ├── firebase_service.dart      # Firestore write/read helper
│   └── sync_manager.dart          # Synchronization orchestrator & sync scheduler
├── providers/                     # State objects
│   ├── budget_provider.dart       # State for dashboard calculations
│   └── sync_provider.dart         # Exposes sync progression & network status to UI
└── views/                         # Moroccan-themed visual screens
    ├── dashboard_view.dart        # Main budget bento grid
    ├── transaction_form_view.dart # Hanout/Souk quick entry
    ├── bills_view.dart            # Monthly Moroccan utilities reminders (Lydec, REDAL, ONEE)
    └── sync_diagnostic_view.dart  # Offline testing console
```

---

## 🛠️ Installation & Getting Started

### Prerequisites
- [Flutter SDK (v3.22.0 or higher)](https://docs.flutter.dev/get-started/install)
- [Firebase Command Line Tooling](https://firebase.google.com/docs/cli)

### Setup Directions

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/moroccan_expense_tracker.git
   cd moroccan_expense_tracker
   ```

2. **Obtain Dart Dependencies**:
   ```bash
   flutter pub get
   ```

3. **Code Generation**:
   Isar DB utilizes source-generation for high-speed queries. Build the generated binders:
   ```bash
   flutter pub run build_runner build --delete-conflicting-outputs
   ```

4. **Connect Firebase**:
   Configure Firebase using FlutterFire CLI:
   ```bash
   flutterfire configure
   ```
   *Note: Ensure `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) are properly created and excluded from commit logs via our `.gitignore`.*

5. **Execute in Debug Mode**:
   ```bash
   flutter run
   ```

---

## 🔒 Security & Data Compliance
- **Local Storage Encryption**: Isar collections can be configured with secure encryption keys stored inside Android Keystore and iOS Keychain.
- **Firebase Security Rules**: Write-access rules restrict cross-user database reads, verifying that `request.auth.uid == resource.data.userId`.
