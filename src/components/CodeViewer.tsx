import React, { useState } from 'react';
import { FileText, Copy, Check, ShieldAlert } from 'lucide-react';

interface CodeFile {
  name: string;
  path: string;
  language: string;
  description: string;
  code: string;
}

const DartModels: Record<string, string> = {
  'user.dart': `import 'package:isar/isar.dart';

part 'user.g.dart';

/// Modèle Utilisateur pour Isar DB et Firestore.
/// Réfère à l'utilisateur authentifié.
@collection
class User {
  /// Identifiant local Isar (auto-incrémenté)
  Id id = Isar.autoIncrement;

  /// Référence unique Firestore (Équivalent au UID de Firebase Auth)
  @Index(unique: true, replace: true)
  late String firestoreRefId;

  /// Nom complet ou pseudonyme
  late String name;

  /// Adresse email
  late String email;

  /// Budget limite configuré par mois en Dirhams (MAD)
  late double monthlyBudgetLimit;

  /// Langue de préférence locale de l'utilisateur : 'fr' (Français), 'ar' (Arabe), 'darija' (Darija)
  late String preferredLang;

  /// Horodatage de la dernière modification locale ou distante
  late DateTime updatedAt;

  /// Drapeau déterminant si l'entrée locale est conforme ou en attente d'envoi vers Firestore
  late bool isSynced;

  /// Constructeur par défaut requis par Isar
  User();

  /// Constructeur nommé pour simplifier l'initialisation
  User.create({
    required this.firestoreRefId,
    required this.name,
    required this.email,
    required this.monthlyBudgetLimit,
    required this.preferredLang,
    required this.updatedAt,
    this.isSynced = false,
  });

  /// Factory d'instanciation de données depuis Firestore (Map)
  factory User.fromMap(Map<String, dynamic> map) {
    return User.create(
      firestoreRefId: map['firestoreRefId'] ?? '',
      name: map['name'] ?? '',
      email: map['email'] ?? '',
      monthlyBudgetLimit: (map['monthlyBudgetLimit'] as num?)?.toDouble() ?? 0.0,
      preferredLang: map['preferredLang'] ?? 'fr',
      updatedAt: DateTime.parse(map['updatedAt'] ?? DateTime.now().toIso8601String()),
      isSynced: true,
    );
  }

  /// Exporte l'objet sous format Map utilisable directement par Firebase Firestore
  Map<String, dynamic> toMap() {
    return {
      'firestoreRefId': firestoreRefId,
      'name': name,
      'email': email,
      'monthlyBudgetLimit': monthlyBudgetLimit,
      'preferredLang': preferredLang,
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}`,

  'category.dart': `import 'package:isar/isar.dart';

part 'category.g.dart';

/// Modèle Catégorie pour organiser les transactions.
/// Exemple : Hanout, Souk, Grand Taxi, Café, Loyers, Facture Lydec.
@collection
class Category {
  /// Identifiant local Isar
  Id id = Isar.autoIncrement;

  /// Identifiant universel unique Firestore (UUI)
  @Index(unique: true, replace: true)
  late String firestoreId;

  /// Nom de la catégorie en Français (ex: 'Épicier/Hanout')
  late String nameFr;

  /// Nom de la catégorie en Arabe (ex: 'البقال / الحانوت')
  late String nameAr;

  /// Clé identifiant l'icône à afficher (ex: 'grocery', 'taxi', 'coffee')
  late String icon;

  /// Code Hexadécimal de couleur pour le thème visuel (ex: '#028A4F')
  late String color;

  /// Budget alloué mensuel optionnel pour cette catégorie spécifique (en MAD)
  double? monthlyBudget;

  /// Horodatage de la dernière modification locale ou distante
  late DateTime updatedAt;

  /// Indicateur de synchronisation avec le Cloud Firestore
  late bool isSynced;

  /// Drapeau pour suppression logique ("Soft Delete") hors-ligne
  late bool isDeleted;

  /// Constructeur requis par Isar
  Category();

  /// Constructeur nommé pour initiations directes
  Category.create({
    required this.firestoreId,
    required this.nameFr,
    required this.nameAr,
    required this.icon,
    required this.color,
    this.monthlyBudget,
    required this.updatedAt,
    this.isSynced = false,
    this.isDeleted = false,
  });

  /// Factory d'instanciation de données depuis Firestore (Map)
  factory Category.fromMap(Map<String, dynamic> map) {
    return Category.create(
      firestoreId: map['firestoreId'] ?? '',
      nameFr: map['nameFr'] ?? '',
      nameAr: map['nameAr'] ?? '',
      icon: map['icon'] ?? 'category',
      color: map['color'] ?? '#028A4F',
      monthlyBudget: (map['monthlyBudget'] as num?)?.toDouble(),
      updatedAt: DateTime.parse(map['updatedAt'] ?? DateTime.now().toIso8601String()),
      isSynced: true,
      isDeleted: map['isDeleted'] ?? false,
    );
  }

  /// Exporte l'objet sous format Map utilisable directement par Firebase Firestore
  Map<String, dynamic> toMap() {
    return {
      'firestoreId': firestoreId,
      'nameFr': nameFr,
      'nameAr': nameAr,
      'icon': icon,
      'color': color,
      'monthlyBudget': monthlyBudget,
      'updatedAt': updatedAt.toIso8601String(),
      'isDeleted': isDeleted,
    };
  }
}`,

  'transaction.dart': `import 'package:isar/isar.dart';
import 'category.dart';

part 'transaction.g.dart';

/// Modèle Dépense / Revenu (Transaction) adapté aux usages marocains.
/// Enregistre les transactions locales et contient un IsarLink vers la Catégorie.
@collection
class Transaction {
  /// Identifiant local unique Isar
  Id id = Isar.autoIncrement;

  /// Identifiant universel unique Firestore (UUID)
  @Index(unique: true, replace: true)
  late String firestoreId;

  /// Montant de la transaction en Dirham Marocain (DH / MAD)
  late double amount;

  /// Descriptif textuel de la dépense (ex: "Smen et Khobz chez l'épicier", "Kurs de Petit Taxi")
  late String description;

  /// Date et heure effectives de la transaction
  late DateTime date;

  /// Lien relationnel Isar vers l'objet Catégorie associé
  final category = IsarLink<Category>();

  /// Référence aplatie (Flat Ref) vers l'Id de catégorie Firestore
  /// Crucial pour maintenir les liens relationnels lors de la synchronisation Firestore
  late String categoryFirestoreId;

  /// Méthode de paiement employée (ex: "Espèces (Cash)", "Carte Bancaire", "Virement CIH")
  late String paymentMethod;

  /// Horodatage de la dernière modification locale ou distante
  late DateTime updatedAt;

  /// État du document vis-à-vis de la synchronisation Cloud
  late bool isSynced;

  /// Drapeau pour suppression logique ("Soft Delete") hors-ligne
  late bool isDeleted;

  /// Constructeur par défaut requis par Isar
  Transaction();

  /// Constructeur nommé facilitant la création d'instances
  Transaction.create({
    required this.firestoreId,
    required this.amount,
    required this.description,
    required this.date,
    required this.categoryFirestoreId,
    required this.paymentMethod,
    required this.updatedAt,
    this.isSynced = false,
    this.isDeleted = false,
  });

  /// Instancie un objet Transaction depuis un dictionnaire de données Firebase (Map)
  factory Transaction.fromMap(Map<String, dynamic> map) {
    return Transaction.create(
      firestoreId: map['firestoreId'] ?? '',
      amount: (map['amount'] as num?)?.toDouble() ?? 0.0,
      description: map['description'] ?? '',
      date: DateTime.parse(map['date'] ?? DateTime.now().toIso8601String()),
      categoryFirestoreId: map['categoryFirestoreId'] ?? '',
      paymentMethod: map['paymentMethod'] ?? 'Espèces',
      updatedAt: DateTime.parse(map['updatedAt'] ?? DateTime.now().toIso8601String()),
      isSynced: true,
      isDeleted: map['isDeleted'] ?? false,
    );
  }

  /// Convertit la transaction en dictionnaire structuré prêt à être envoyé à Cloud Firestore
  Map<String, dynamic> toMap() {
    return {
      'firestoreId': firestoreId,
      'amount': amount,
      'description': description,
      'date': date.toIso8601String(),
      'categoryFirestoreId': categoryFirestoreId,
      'paymentMethod': paymentMethod,
      'updatedAt': updatedAt.toIso8601String(),
      'isDeleted': isDeleted,
    };
  }
}`,

  'bill.dart': `import 'package:isar/isar.dart';

part 'bill.g.dart';

/// Modèle pour les Factures Courantes au Maroc (Lydec, ONEE, Redal, etc.).
/// Permet d'enregistrer des rappels de factures avec leur statut de paiement.
@collection
class Bill {
  /// Identifiant local Isar
  Id id = Isar.autoIncrement;

  /// Référence universelle unique Cloud Firestore (UUID)
  @Index(unique: true, replace: true)
  late String firestoreId;

  /// Intitulé de la facture en Français (ex: "Facture Eau & Électricité")
  late String titleFr;

  /// Intitulé de la facture en Arabe (ex: "فاتورة الماء والكهرباء")
  late String titleAr;

  /// Montant estimé ou exact en Dirhams (MAD)
  late double amount;

  /// Date d'échéance de règlement de la facture
  late DateTime dueDate;

  /// Fournisseur / Régie de services marocain :
  /// ex: Lydec (Casablanca), Redal (Rabat), Amendis (Tanger), Radeema (Marrakech), ONEE, Maroc Telecom, Orange, Inwi.
  late String provider;

  /// Drapeau signalant si la facture a été intégralement acquittée
  late bool isPaid;

  /// Date effective de versement (si acquittée)
  DateTime? paidAt;

  /// Périodicité du prélèvement (ex: 'Mensuel', 'Trimestriel', 'Unique')
  late String recurrence;

  /// Horodatage de la dernière modification locale ou distante
  late DateTime updatedAt;

  /// État actuel de synchronisation vis-à-vis de Firebase Firestore
  late bool isSynced;

  /// Drapeau pour suppression logique ("Soft Delete") hors-ligne
  late bool isDeleted;

  /// Constructeur par défaut requis par Isar
  Bill();

  /// Constructeur nommé pour faciliter l'initialisation de données
  Bill.create({
    required this.firestoreId,
    required this.titleFr,
    required this.titleAr,
    required this.amount,
    required this.dueDate,
    required this.provider,
    required this.isPaid,
    this.paidAt,
    required this.recurrence,
    required this.updatedAt,
    this.isSynced = false,
    this.isDeleted = false,
  });

  /// Instancie un objet Bill depuis un dictionnaire Firestore (Map)
  factory Bill.fromMap(Map<String, dynamic> map) {
    return Bill.create(
      firestoreId: map['firestoreId'] ?? '',
      titleFr: map['titleFr'] ?? '',
      titleAr: map['titleAr'] ?? '',
      amount: (map['amount'] as num?)?.toDouble() ?? 0.0,
      dueDate: DateTime.parse(map['dueDate'] ?? DateTime.now().toIso8601String()),
      provider: map['provider'] ?? 'Autre',
      isPaid: map['isPaid'] ?? false,
      paidAt: map['paidAt'] != null ? DateTime.parse(map['paidAt']) : null,
      recurrence: map['recurrence'] ?? 'Mensuel',
      updatedAt: DateTime.parse(map['updatedAt'] ?? DateTime.now().toIso8601String()),
      isSynced: true,
      isDeleted: map['isDeleted'] ?? false,
    );
  }

  /// Convertit la facture en dictionnaire pour Firebase Firestore
  Map<String, dynamic> toMap() {
    return {
      'firestoreId': firestoreId,
      'titleFr': titleFr,
      'titleAr': titleAr,
      'amount': amount,
      'dueDate': dueDate.toIso8601String(),
      'provider': provider,
      'isPaid': isPaid,
      'paidAt': paidAt?.toIso8601String(),
      'recurrence': recurrence,
      'updatedAt': updatedAt.toIso8601String(),
      'isDeleted': isDeleted,
    };
  }
}`,

  'sync_manager.dart': `import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:isar/isar.dart';
import '../models/transaction.dart';
import '../models/category.dart';
import '../models/bill.dart';

/// Gestionnaire de Synchronisation Offline-First (SyncManager).
/// Orchestre la liaison bidirectionnelle entre Isar DB (Local) et Cloud Firestore (Remote).
class SyncManager {
  final Isar isar;
  final FirebaseFirestore firestore;
  final String userAuthId; // UID de l'utilisateur connecté

  StreamSubscription<List<ConnectivityResult>>? _connectivitySubscription;
  bool _isSyncing = false;

  SyncManager({
    required this.isar,
    required this.firestore,
    required this.userAuthId,
  });

  /// Initialise l'écouteur de connectivité pour réagir automatiquement au retour de l'internet.
  void initConnectivityListener() {
    _connectivitySubscription = Connectivity()
        .onConnectivityChanged
        .listen((List<ConnectivityResult> results) {
      final isConnected = results.isNotEmpty && 
          results.first != ConnectivityResult.none;
      if (isConnected) {
        print("🌐 Internet détecté ! Lancement de la synchronisation en arrière-plan...");
        triggerSyncCycle();
      }
    });
  }

  /// Libère les écoutes ouvertes.
  void dispose() {
    _connectivitySubscription?.cancel();
  }

  /// Déclenche un cycle complet de synchronisation (Push local vers Firestore + Pull Firestore vers local)
  Future<bool> triggerSyncCycle() async {
    if (_isSyncing) return false;
    _isSyncing = true;

    try {
      print("🔄 [SyncManager] Début de la synchronisation...");

      // 1. PUSH : Envoi des modifications locales vers Firestore
      await _pushDeletesToCloud();
      await _pushLocalChangesToCloud();

      // 2. PULL : Récupération des nouveautés depuis le cloud
      await _pullChangesFromCloud();

      print("✅ [SyncManager] Synchronisation terminée avec succès !");
      return true;
    } catch (e) {
      print("❌ [SyncManager] Échec lors de la synchronisation: $e");
      return false;
    } finally {
      _isSyncing = false;
    }
  }

  /// 1. PUSH DES SUPPRESSIONS LOGIQUES (Soft Deletes)
  Future<void> _pushDeletesToCloud() async {
    final deletedTransactions = await isar.transactions
        .where()
        .filter()
        .isDeletedEqualTo(true)
        .findAll();

    final deletedBills = await isar.bills
        .where()
        .filter()
        .isDeletedEqualTo(true)
        .findAll();

    final WriteBatch batch = firestore.batch();
    bool hasMutations = false;

    for (var tx in deletedTransactions) {
      final ref = firestore
          .collection('users')
          .doc(userAuthId)
          .collection('transactions')
          .doc(tx.firestoreId);
      batch.delete(ref);
      hasMutations = true;
    }

    for (var bill in deletedBills) {
      final ref = firestore
          .collection('users')
          .doc(userAuthId)
          .collection('bills')
          .doc(bill.firestoreId);
      batch.delete(ref);
      hasMutations = true;
    }

    if (hasMutations) {
      await batch.commit();
      
      // Suppression définitive en local après propagation sur le cloud
      await isar.writeTxn(() async {
        final txIds = deletedTransactions.map((e) => e.id).toList();
        final billIds = deletedBills.map((e) => e.id).toList();
        
        if (txIds.isNotEmpty) await isar.transactions.deleteAll(txIds);
        if (billIds.isNotEmpty) await isar.bills.deleteAll(billIds);
      });
      print("🧹 [Outbox] Purge locale réussie de \${deletedTransactions.length} transactions et \${deletedBills.length} factures.");
    }
  }

  /// 2. PUSH DES AJOUTS & MISES À JOUR
  Future<void> _pushLocalChangesToCloud() async {
    final unsyncedTransactions = await isar.transactions
        .where()
        .filter()
        .isSyncedEqualTo(false)
        .and()
        .isDeletedEqualTo(false)
        .findAll();

    final unsyncedBills = await isar.bills
        .where()
        .filter()
        .isSyncedEqualTo(false)
        .and()
        .isDeletedEqualTo(false)
        .findAll();

    if (unsyncedTransactions.isEmpty && unsyncedBills.isEmpty) {
      print("📤 [SyncManager] Pas de nouvelles écritures locales à pousser.");
      return;
    }

    final WriteBatch batch = firestore.batch();

    for (var tx in unsyncedTransactions) {
      final docRef = firestore
          .collection('users')
          .doc(userAuthId)
          .collection('transactions')
          .doc(tx.firestoreId);
      batch.set(docRef, tx.toMap(), SetOptions(merge: true));
    }

    for (var bill in unsyncedBills) {
      final docRef = firestore
          .collection('users')
          .doc(userAuthId)
          .collection('bills')
          .doc(bill.firestoreId);
      batch.set(docRef, bill.toMap(), SetOptions(merge: true));
    }

    await batch.commit();

    await isar.writeTxn(() async {
      for (var tx in unsyncedTransactions) {
        tx.isSynced = true;
        await isar.transactions.put(tx);
      }
      for (var bill in unsyncedBills) {
        bill.isSynced = true;
        await isar.bills.put(bill);
      }
    });

    print("📤 [SyncManager] Push réussi de \${unsyncedTransactions.length} transactions et \${unsyncedBills.length} factures.");
  }

  /// 3. PULL : Récupérer et Fusionner les données du Cloud (Résolution LWW : Last-Write-Wins)
  Future<void> _pullChangesFromCloud() async {
    final QuerySnapshot remoteTxSnapshot = await firestore
        .collection('users')
        .doc(userAuthId)
        .collection('transactions')
        .get();

    await isar.writeTxn(() async {
      for (var doc in remoteTxSnapshot.docs) {
        final Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
        final String fId = doc.id;
        final DateTime cloudUpdatedAt = DateTime.parse(data['updatedAt']);

        final localTx = await isar.transactions
            .where()
            .filter()
            .firestoreIdEqualTo(fId)
            .findFirst();

        if (localTx == null) {
          final newTx = Transaction.fromMap(data);
          final cat = await isar.categorys
              .where()
              .filter()
              .firestoreIdEqualTo(newTx.categoryFirestoreId)
              .findFirst();
          if (cat != null) {
            newTx.category.value = cat;
          }
          await isar.transactions.put(newTx);
          if (cat != null) {
            await newTx.category.save();
          }
        } else {
          if (cloudUpdatedAt.isAfter(localTx.updatedAt)) {
            final updatedLocal = Transaction.fromMap(data);
            updatedLocal.id = localTx.id;
            
            final cat = await isar.categorys
                .where()
                .filter()
                .firestoreIdEqualTo(updatedLocal.categoryFirestoreId)
                .findFirst();
            if (cat != null) {
              updatedLocal.category.value = cat;
            }
            await isar.transactions.put(updatedLocal);
            if (cat != null) {
              await updatedLocal.category.save();
            }
          }
        }
      }
    });

    final QuerySnapshot remoteBillSnapshot = await firestore
        .collection('users')
        .doc(userAuthId)
        .collection('bills')
        .get();

    await isar.writeTxn(() async {
      for (var doc in remoteBillSnapshot.docs) {
        final Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
        final String fId = doc.id;
        final DateTime cloudUpdatedAt = DateTime.parse(data['updatedAt']);

        final localBill = await isar.bills
            .where()
            .filter()
            .firestoreIdEqualTo(fId)
            .findFirst();

        if (localBill == null) {
          final newBill = Bill.fromMap(data);
          await isar.bills.put(newBill);
        } else {
          if (cloudUpdatedAt.isAfter(localBill.updatedAt)) {
            final updatedLocal = Bill.fromMap(data);
            updatedLocal.id = localBill.id;
            await isar.bills.put(updatedLocal);
          }
        }
      }
    });

    print("📥 [SyncManager] Pull & Fusion des modifications distantes terminés.");
  }
}`,

  '.gitignore': `# -------------------------------------------------------------------------
# MOROCCAN EXPENSE & BUDGET TRACKER - FLUTTER GITIGNORE
# -------------------------------------------------------------------------

# Miscellaneous
*.class
*.log
*.pyc
*.swp
.DS_Store
.atom/
.buildlog/
.history
.svn/
migrate.yaml

# IntelliJ Related
*.iml
*.ipr
*.iws
.idea/

# Visual Studio Code Related
.vscode/
!.vscode/extensions.json
.history/

# Mac OS metadata
.DS_Store

# Dart/Flutter/Pub-related
.dart_tool/
.flutter-plugins
.flutter-plugins-dependencies
.packages
.pub-cache/
.pub/
/build/

# Android-specific
android/**/gradle-wrapper.jar
android/.gradle
android/captures/
android/gradlew
android/gradlew.bat
android/local.properties
android/key.properties
*.keystore
*.jks

# iOS-specific
ios/.symlinks/
ios/Pods/
ios/Runner/GeneratedPluginRegistrant.h
ios/Runner/GeneratedPluginRegistrant.m
ios/Runner/Flutter/Generated.xcconfig
ios/Runner/Flutter/flutter_export_environment.sh
ios/Runner/Flutter/App.framework
ios/Runner/Flutter/App.podspec
ios/Runner/Flutter/Info.plist

# Crashlytics and Google Services config files
ios/Runner/GoogleService-Info.plist
android/app/google-services.json

# Local Environment Variables
.env
.env.local
firebase_options.dart`,

  'README.md': `# 🇲🇦 Moroccan Expense & Budget Tracker

Un tracker de budget mobile cross-platform codé en Flutter utilisant une architecture "Offline-First".
Stockage local et ultra-rapide avec Isar DB, et synchronisation cloud transparente avec Firebase Firestore.

## Caractéristiques clés
- 🌐 Fonctionnement 100% autonome sans connexion internet.
- 🔄 Gestionnaire de synchronisation robuste (SyncManager) résolvant automatiquement les conflits (Last-Write-Wins).
- 🇲🇦 Intégration adaptée aux réalités marocaines (Régies de facturation type Lydec, Onee, Redal ; et catégories d'achats Hanout, Souk, Grand Taxi).
- 💰 Devise en Dirhams Marocains (MAD / DH) et interface bilingue (Français/Arabe).`
};

export const CODE_FILES_DATA: CodeFile[] = [
  {
    name: 'architecture_proposal',
    path: 'Architecture & Flow',
    language: 'plaintext',
    description: 'Structure globale bilingue du flux Offline-First et configuration IsarDB + Provider.',
    code: `┌────────────────────────────────────────────────────────────────────────┐
│                        SUIVI DE BUDGET MAROCAIN                       │
│                   Architecture Logicielle Offline-First                │
└────────────────────────────────────────────────────────────────────────┘

1. FLUX D'ÉCRITURE LOCAL (IMMEDIATE FEEDBACK)
┌──────────────────┐     Écriture locale     ┌─────────────┐
│  Utilisateur     │ ──────────────────────> │   Isar DB   │ (isSynced = false)
│  (Saisie Hanout) │ <────────────────────── │ (Local-First)│ (Génère firestoreId : UUID)
└──────────────────┘    Mise à jour rapide    └─────────────┘
  ▲
  │ Écoute via Rerender (reactive query)
  │
┌────────────────────────────────────────────────────────────┐
│   Widget Tree <─── BudgetProvider (ChangeNotifier)         │
└────────────────────────────────────────────────────────────┘

2. FLUX DE SYNCHRONISATION (BACKGROUND SYNC MANAGER)
   Au retour d'Internet :

                        ┌────────────────────────┐
                        │   SyncManager Active   │
                        └──────────┬─────────────┘
                                   │
               ┌───────────────────┴───────────────────┐
               ▼                                       ▼
     [Étape 2.1 : PULL / CLOUD]               [Étape 2.2 : PUSH / LOCAL]
     Récupérer updates de Firestore           Récupérer {isSynced == false}
               │                                       │
     Trouver conflits : comparer                       Pousser vers Firestore via
     updatedAt Cloud vs updatedAt Local               Transactions en batch
               │                                       │
   LWW (Last-Write-Wins) : Overwrite                   Succès? Marquer localement
   si cloudUpdatedAt > localUpdatedAt                  {isSynced = true} dans Isar
               │                                       │
     Mettre à jour Isar DB                             Nettoyer Suppressions "soft"
               ▼                                       ▼
     ┌──────────────────┐                     ┌──────────────────┐
     │  Isar DB Locale  │                     │  Cloud Firestore │
     └──────────────────┘                     └──────────────────┘`
  },
  {
    name: 'user.dart',
    path: 'lib/models/user.dart',
    language: 'dart',
    description: 'Modèle utilisateur lié à Firebase Auth contenant les préférences de budget et de langue.',
    code: DartModels['user.dart']
  },
  {
    name: 'category.dart',
    path: 'lib/models/category.dart',
    language: 'dart',
    description: 'Modèle de catégorisation bilingue avec budget cible mensuel spécifique.',
    code: DartModels['category.dart']
  },
  {
    name: 'transaction.dart',
    path: 'lib/models/transaction.dart',
    language: 'dart',
    description: 'Modèle de suivi d’une dépense ou revenu reliant IsarLink et référencement aplati.',
    code: DartModels['transaction.dart']
  },
  {
    name: 'bill.dart',
    path: 'lib/models/bill.dart',
    language: 'dart',
    description: 'Suivi des échéances et factures récurrentes marocaines (Lydec, REDAL, ONEE).',
    code: DartModels['bill.dart']
  },
  {
    name: 'sync_manager.dart',
    path: 'lib/services/sync_manager.dart',
    language: 'dart',
    description: 'Moteur de synchronisation bidirectionnelle résolvant les conflits et gérant la file de suppression.',
    code: DartModels['sync_manager.dart']
  },
  {
    name: '.gitignore',
    path: '.gitignore',
    language: 'gitignore',
    description: 'Fichier Gitignore optimisé Flutter pour éliminer les fichiers de build, caches et configurations Firebase.',
    code: DartModels['.gitignore']
  },
  {
    name: 'README.md',
    path: 'README.md',
    language: 'markdown',
    description: 'Documentation de référence pour le déploiement local et la synchronisation.',
    code: DartModels['README.md']
  }
];

export function CodeViewer() {
  const [activeTab, setActiveTab] = useState<string>('architecture_proposal');
  const [copied, setCopied] = useState<boolean>(false);

  const activeFile = CODE_FILES_DATA.find(f => f.name === activeTab) || CODE_FILES_DATA[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="code-viewer-container" className="flex flex-col h-full bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-700/50">
      {/* File Navigation tab */}
      <div className="flex bg-slate-950 px-4 py-2 space-x-1 overflow-x-auto border-b border-slate-800 scrollbar-none">
        {CODE_FILES_DATA.map((file) => (
          <button
            key={file.name}
            id={`tab-${file.name}`}
            onClick={() => setActiveTab(file.name)}
            className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeTab === file.name
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <FileText size={13} />
            <span>{file.path}</span>
          </button>
        ))}
      </div>

      {/* Description block */}
      <div className="bg-slate-800/40 px-5 py-3 border-b border-slate-800 flex justify-between items-center">
        <div>
          <span className="text-xs font-mono text-slate-500 uppercase tracking-widest block mb-0.5">Fichier Flutter / Dart</span>
          <p className="text-sm font-medium text-slate-200">{activeFile.description}</p>
        </div>
        <button
          id="btn-copy-code"
          onClick={handleCopy}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl shadow-lg transition-all cursor-pointer"
        >
          {copied ? (
            <>
              <Check size={14} />
              <span>Copié !</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copier</span>
            </>
          )}
        </button>
      </div>

      {/* Code viewport container */}
      <div className="p-4 flex-1 overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed max-h-[500px]">
        <pre className="whitespace-pre">
          {activeFile.code.split('\n').map((line, index) => (
            <div key={index} className="flex hover:bg-slate-800/30 py-0.5 px-1 rounded">
              <span className="w-8 text-slate-600 select-none text-right pr-3 border-r border-slate-800 mr-3">{index + 1}</span>
              <span className="flex-1 whitespace-pre-wrap">{line}</span>
            </div>
          ))}
        </pre>
      </div>
      
      {/* Footer warning */}
      <div className="bg-slate-950 px-5 py-3 text-[11px] text-slate-400 flex items-center border-t border-slate-800">
        <ShieldAlert size={14} className="text-amber-500 mr-2 flex-shrink-0" />
        <span>Les annotations <code>@collection</code> et <code>@Index</code> requièrent le paquet Flutter <code>isar</code> pour la génération du fichier <code>.g.dart</code>.</span>
      </div>
    </div>
  );
}
