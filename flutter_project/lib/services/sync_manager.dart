import 'dart:async';
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
    // Collecte les transactions marquées supprimées localement
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
      print("🧹 [Outbox] Purge locale réussie de ${deletedTransactions.length} transactions et ${deletedBills.length} factures.");
    }
  }

  /// 2. PUSH DES AJOUTS & MISES À JOUR
  Future<void> _pushLocalChangesToCloud() async {
    // On récupère toutes les transactions créées ou modifiées en offline (non-synchronisées)
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

    // Valide le batch sur Firestore
    await batch.commit();

    // Met à jour l'indicateur isSynced localement par transaction
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

    print("📤 [SyncManager] Push réussi de ${unsyncedTransactions.length} transactions et ${unsyncedBills.length} factures.");
  }

  /// 3. PULL : Récupérer et Fusionner les données du Cloud (Résolution LWW : Last-Write-Wins)
  Future<void> _pullChangesFromCloud() async {
    // 3.1. Synchronisation des Transactions
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

        // Recherche si le document existe déjà en local
        final localTx = await isar.transactions
            .where()
            .filter()
            .firestoreIdEqualTo(fId)
            .findFirst();

        if (localTx == null) {
          // Document absent localement, on l'insère directement
          final newTx = Transaction.fromMap(data);
          // Retrouver la catégorie correspondante si elle existe
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
          // Conflit : Document existant localement ET modifié à distance
          if (cloudUpdatedAt.isAfter(localTx.updatedAt)) {
            // Firestore l'emporte (Last-Write-Wins)
            final updatedLocal = Transaction.fromMap(data);
            updatedLocal.id = localTx.id; // Garde l'id d'auto-incrément local Isar !
            
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
          // Si updatedAt local est postérieur ou égal, la transaction locale sera poussée
          // au prochain cycle de push, ou a déjà été poussée.
        }
      }
    });

    // 3.2. Synchronisation des Factures (Bills)
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
            updatedLocal.id = localBill.id; // Conserver l'Id Isar existant
            await isar.bills.put(updatedLocal);
          }
        }
      }
    });

    print("📥 [SyncManager] Pull & Fusion des modifications distantes terminés.");
  }
}
