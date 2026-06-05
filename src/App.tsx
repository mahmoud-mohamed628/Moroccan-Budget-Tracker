/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Database, 
  RefreshCw, 
  Play, 
  Terminal, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  TrendingDown, 
  Coins, 
  Calendar, 
  ArrowRight, 
  BookOpen, 
  Layers,
  Sparkles,
  Smartphone,
  Server,
  Cloud,
  X,
  Edit2,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Category, 
  LocalTransaction, 
  LocalBill, 
  CloudTransaction, 
  CloudBill, 
  SyncLogEntry 
} from './types';
import { 
  MOROCCAN_CATEGORIES, 
  INITIAL_LOCAL_TRANSACTIONS, 
  INITIAL_LOCAL_BILLS, 
  INITIAL_CLOUD_TRANSACTIONS, 
  INITIAL_CLOUD_BILLS 
} from './data';
import { CodeViewer } from './components/CodeViewer';

export default function App() {
  // Mobile app simulator state
  const [localTransactions, setLocalTransactions] = useState<LocalTransaction[]>(INITIAL_LOCAL_TRANSACTIONS);
  const [localBills, setLocalBills] = useState<LocalBill[]>(INITIAL_LOCAL_BILLS);
  
  // Cloud server simulator state
  const [cloudTransactions, setCloudTransactions] = useState<CloudTransaction[]>(INITIAL_CLOUD_TRANSACTIONS);
  const [cloudBills, setCloudBills] = useState<CloudBill[]>(INITIAL_CLOUD_BILLS);
  
  // System configurations
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [language, setLanguage] = useState<'FR' | 'AR'>('FR');
  
  // Terminal log messages
  const [logs, setLogs] = useState<SyncLogEntry[]>([
    { timestamp: new Date().toLocaleTimeString(), type: 'info', message: '🚀 Système d’architecture initialisé. Isar DB chargée.' },
    { timestamp: new Date().toLocaleTimeString(), type: 'info', message: '📶 Statut du réseau : ONLINE. SyncManager en veille.' }
  ]);
  
  // Quick Transaction form state
  const [newAmount, setNewAmount] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newCatId, setNewCatId] = useState<string>('cat_hanout');
  const [newPayment, setNewPayment] = useState<string>('Espèces (Cash)');
  
  // Quick Custom Cloud Editor state (to inject remote conflicts)
  const [editingCloudTxId, setEditingCloudTxId] = useState<string | null>(null);
  const [editCloudAmount, setEditCloudAmount] = useState<string>('');
  const [editCloudDesc, setEditCloudDesc] = useState<string>('');

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll terminal logs
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Helper to push a system log
  const pushLog = (type: 'info' | 'success' | 'warn' | 'error' | 'local' | 'cloud', message: string) => {
    setLogs(prev => [
      ...prev, 
      { 
        timestamp: new Date().toLocaleTimeString(), 
        type, 
        message 
      }
    ]);
  };

  // Listen to network status changes and trigger auto-sync
  useEffect(() => {
    if (isOnline) {
      pushLog('info', '📶 Connexion détectée ! Déclenchement automatique de SyncManager...');
      runSynchronization();
    } else {
      pushLog('warn', '🛑 Connexion coupée. Passage en mode 100% autonome (Isar DB uniquement).');
    }
  }, [isOnline]);

  // Sync Outbox & Influx simulation with timers representing Flutter background flows
  const runSynchronization = async () => {
    if (syncing) return;
    setSyncing(true);
    pushLog('info', '🔄 [SyncManager] Lancement du cycle de synchronisation bidirectionnelle...');
    
    // Step 1: Detect Network
    await delay(650);
    pushLog('info', '📡 Établissement du canal sécurisé avec le projet Firestore...');
    
    // Step 2: Push Deletions (Soft deletes in outbox)
    await delay(600);
    const localDeletesTx = localTransactions.filter(t => t.isDeleted);
    const localDeletesBills = localBills.filter(b => b.isDeleted);
    
    if (localDeletesTx.length > 0 || localDeletesBills.length > 0) {
      pushLog('warn', `🧹 [Outbox] Purge détectée : ${localDeletesTx.length} transactions et ${localDeletesBills.length} factures à supprimer.`);
      
      // Sync cloud deletions
      setCloudTransactions(prev => prev.filter(ct => !localDeletesTx.some(lt => lt.firestoreId === ct.firestoreId)));
      setCloudBills(prev => prev.filter(cb => !localDeletesBills.some(lb => lb.firestoreId === cb.firestoreId)));
      
      // Delete locally from Isar
      setLocalTransactions(prev => prev.filter(t => !t.isDeleted));
      setLocalBills(prev => prev.filter(b => !b.isDeleted));
      
      pushLog('success', `🧹 Suppressions propagées sur Cloud Firestore et effacées du stockage local.`);
      await delay(400);
    }

    // Step 3: Push Local Additions/Changes (IsSynced = false)
    const unsyncedTx = localTransactions.filter(t => !t.isSynced && !t.isDeleted);
    const unsyncedBills = localBills.filter(b => !b.isSynced && !b.isDeleted);

    if (unsyncedTx.length > 0 || unsyncedBills.length > 0) {
      pushLog('local', `📤 [Push] Préparation de la file d’envoi : ${unsyncedTx.length} dépenses & ${unsyncedBills.length} statuts de factures.`);
      await delay(700);

      // Map local unsynced models to Firestore map models
      const txToPush: CloudTransaction[] = unsyncedTx.map(tx => ({
        firestoreId: tx.firestoreId,
        amount: tx.amount,
        description: tx.description,
        date: tx.date,
        categoryFirestoreId: tx.categoryFirestoreId,
        paymentMethod: tx.paymentMethod,
        updatedAt: tx.updatedAt,
        isDeleted: false
      }));

      const billsToPush: CloudBill[] = unsyncedBills.map(bill => ({
        firestoreId: bill.firestoreId,
        titleFr: bill.titleFr,
        titleAr: bill.titleAr,
        amount: bill.amount,
        dueDate: bill.dueDate,
        provider: bill.provider,
        isPaid: bill.isPaid,
        paidAt: bill.paidAt,
        recurrence: bill.recurrence,
        updatedAt: bill.updatedAt,
        isDeleted: false
      }));

      // Insert/update Cloud replica
      setCloudTransactions(prev => {
        const filtered = prev.filter(ct => !txToPush.some(pt => pt.firestoreId === ct.firestoreId));
        return [...filtered, ...txToPush];
      });

      setCloudBills(prev => {
        const filtered = prev.filter(cb => !billsToPush.some(pb => pb.firestoreId === cb.firestoreId));
        return [...filtered, ...billsToPush];
      });

      // Update Local Isar model isSynced flag
      setLocalTransactions(prev => prev.map(t => {
        if (unsyncedTx.some(ut => ut.firestoreId === t.firestoreId)) {
          return { ...t, isSynced: true };
        }
        return t;
      }));

      setLocalBills(prev => prev.map(b => {
        if (unsyncedBills.some(ub => ub.firestoreId === b.firestoreId)) {
          return { ...b, isSynced: true };
        }
        return b;
      }));

      pushLog('success', `📤 Téléversement terminé ! Documents mis à jour dans le cloud.`);
      await delay(500);
    } else {
      pushLog('info', '📤 Aucun changement local détecté dans l’Outbox.');
    }

    // Step 4: Pull remote changes & execute Last-Write-Wins resolve triggers
    pushLog('cloud', '📥 [Pull] Analyse des documents sur le serveur Firestore...');
    await delay(800);

    let conflictCount = 0;
    let localOverwritten = 0;

    // We fetch cloud items and inspect if write conflicts exist with local versions
    const updatedLocalTransactions = [...localTransactions];
    const updatedLocalBills = [...localBills];

    // Read Cloud transactions schema
    for (const remoteTx of cloudTransactions) {
      const correspondingLocalNode = localTransactions.find(t => t.firestoreId === remoteTx.firestoreId);
      
      if (!correspondingLocalNode) {
        // Document doesn't exist locally, import it from Firestore
        updatedLocalTransactions.push({
          id: getNextLocalId(updatedLocalTransactions),
          firestoreId: remoteTx.firestoreId,
          amount: remoteTx.amount,
          description: remoteTx.description,
          date: remoteTx.date,
          categoryFirestoreId: remoteTx.categoryFirestoreId,
          paymentMethod: remoteTx.paymentMethod,
          updatedAt: remoteTx.updatedAt,
          isSynced: true,
          isDeleted: false
        });
        pushLog('success', `📥 Nouveau document distant importé : "${remoteTx.description}" (${remoteTx.amount} DH)`);
      } else {
        // Conflit potential match: Check updatedAt timestamp
        const localTime = new Date(correspondingLocalNode.updatedAt).getTime();
        const remoteTime = new Date(remoteTx.updatedAt).getTime();

        if (remoteTime > localTime) {
          conflictCount++;
          // Cloud has newer timestamp. Last-Write-Wins applies: replace local
          const index = updatedLocalTransactions.findIndex(t => t.firestoreId === remoteTx.firestoreId);
          if (index !== -1) {
            updatedLocalTransactions[index] = {
              ...correspondingLocalNode,
              amount: remoteTx.amount,
              description: remoteTx.description,
              date: remoteTx.date,
              categoryFirestoreId: remoteTx.categoryFirestoreId,
              paymentMethod: remoteTx.paymentMethod,
              updatedAt: remoteTx.updatedAt,
              isSynced: true
            };
            localOverwritten++;
          }
        }
      }
    }

    // Read Cloud Bills schema
    for (const remoteBill of cloudBills) {
      const correspondingLocalBill = localBills.find(b => b.firestoreId === remoteBill.firestoreId);

      if (!correspondingLocalBill) {
        updatedLocalBills.push({
          id: getNextLocalId(updatedLocalBills),
          firestoreId: remoteBill.firestoreId,
          titleFr: remoteBill.titleFr,
          titleAr: remoteBill.titleAr,
          amount: remoteBill.amount,
          dueDate: remoteBill.dueDate,
          provider: remoteBill.provider,
          isPaid: remoteBill.isPaid,
          paidAt: remoteBill.paidAt,
          recurrence: remoteBill.recurrence,
          updatedAt: remoteBill.updatedAt,
          isSynced: true,
          isDeleted: false
        });
        pushLog('success', `📥 Facture distante importée : "${remoteBill.titleFr}" (${remoteBill.amount} DH)`);
      } else {
        const localTime = new Date(correspondingLocalBill.updatedAt).getTime();
        const remoteTime = new Date(remoteBill.updatedAt).getTime();

        if (remoteTime > localTime) {
          conflictCount++;
          const index = updatedLocalBills.findIndex(b => b.firestoreId === remoteBill.firestoreId);
          if (index !== -1) {
            updatedLocalBills[index] = {
              ...correspondingLocalBill,
              isPaid: remoteBill.isPaid,
              paidAt: remoteBill.paidAt,
              updatedAt: remoteBill.updatedAt,
              isSynced: true
            };
            localOverwritten++;
          }
        }
      }
    }

    if (conflictCount > 0) {
      pushLog('warn', `⚠️ CONFLIT : ${conflictCount} enregistrements concurrents détectés.`);
      pushLog('info', `⚖️ Arbitrage Last-Write-Wins branché : ${localOverwritten} modifications locales écrasées par les versions cloud plus récentes.`);
      setLocalTransactions(updatedLocalTransactions);
      setLocalBills(updatedLocalBills);
    } else {
      pushLog('success', '📥 Données locales à jour. Aucun conflit temporel détecté.');
    }

    await delay(400);
    setSyncing(false);
    pushLog('success', '🏆 Cycle complet achevél Isar DB et Firestore sont 100% synchrone.');
  };

  // Helper delays
  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  // Auto incremental generator for static Local IDs
  const getNextLocalId = (arr: any[]) => {
    return arr.length > 0 ? Math.max(...arr.map(x => x.id)) + 1 : 1;
  };

  // Create local transaction
  const handleAddLocalTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAmount || isNaN(parseFloat(newAmount)) || parseFloat(newAmount) <= 0) {
      alert("Veuillez saisir un montant valide en DH.");
      return;
    }

    const value = parseFloat(newAmount);
    const uuid = 'tx_uuid_' + Math.random().toString(36).substr(2, 9);
    const timeNow = new Date().toISOString();

    const newTx: LocalTransaction = {
      id: getNextLocalId(localTransactions),
      firestoreId: uuid,
      amount: value,
      description: newDesc || "Dépense rapide sans description",
      date: timeNow,
      categoryFirestoreId: newCatId,
      paymentMethod: newPayment,
      updatedAt: timeNow,
      isSynced: isOnline, // Directly synced if online, otherwise offline outbox
      isDeleted: false
    };

    // Add to Local Isar DB Simulation
    setLocalTransactions(prev => [...prev, newTx]);
    pushLog('local', `✍️ Enregistrement local Isar réussi : "${newTx.description}" (${newTx.amount} DH)`);

    // If online, immediately write to cloud mock
    if (isOnline) {
      const cloudTx: CloudTransaction = {
        firestoreId: uuid,
        amount: value,
        description: newTx.description,
        date: timeNow,
        categoryFirestoreId: newCatId,
        paymentMethod: newPayment,
        updatedAt: timeNow,
        isDeleted: false
      };
      setCloudTransactions(prev => [...prev, cloudTx]);
      pushLog('cloud', `⚡ Réseau en ligne : Écriture instantanée dans Cloud Firestore pour ${newTx.firestoreId}`);
    } else {
      pushLog('warn', `⏳ Hors-Ligne : Enregistré uniquement dans Isar DB local. Mis en boîte d'envoi.`);
    }

    // Reset inputs
    setNewAmount('');
    setNewDesc('');
  };

  // Handle pay bill locally
  const handlePayBillOffline = (billId: number) => {
    const timeNow = new Date().toISOString();
    
    setLocalBills(prev => prev.map(bill => {
      if (bill.id === billId) {
        const updatedBill = {
          ...bill,
          isPaid: true,
          paidAt: timeNow,
          updatedAt: timeNow,
          isSynced: isOnline // If online, marked synced instantly
        };

        if (isOnline) {
          // Sync directly on Cloud too
          setCloudBills(cbPrev => cbPrev.map(cb => {
            if (cb.firestoreId === bill.firestoreId) {
              return {
                ...cb,
                isPaid: true,
                paidAt: timeNow,
                updatedAt: timeNow
              };
            }
            return cb;
          }));
          pushLog('cloud', `⚡ Statut réglé répercuté directement sur Cloud Firestore.`);
        } else {
          pushLog('warn', `⏳ Facture acquittée hors-ligne. Changement stocké dans Isar. En attente de connexion.`);
        }

        return updatedBill;
      }
      return bill;
    }));

    const billObj = localBills.find(b => b.id === billId);
    if (billObj) {
      pushLog('local', `💳 Facture "${billObj.titleFr}" marquée Réglement Offline.`);
    }
  };

  // Mark local transaction for soft deletion
  const handleDeleteLocalTransaction = (id: number) => {
    const txObj = localTransactions.find(t => t.id === id);
    if (!txObj) return;

    if (txObj.isSynced) {
      // Soft deletion: set isDeleted to true, need background sync to clear from Cloud then from DB
      const timeNow = new Date().toISOString();
      setLocalTransactions(prev => prev.map(t => {
        if (t.id === id) {
          return { ...t, isDeleted: true, isSynced: false, updatedAt: timeNow };
        }
        return t;
      }));
      pushLog('local', `🗑️ Transaction "${txObj.description}" marquée Soft-Delete en local. En attente de propagation.`);
      
      if (isOnline) {
        // If online, immediately run sync cycle to clean both sides
        setTimeout(() => runSynchronization(), 500);
      }
    } else {
      // Unsynced item can be deleted permanently right away
      setLocalTransactions(prev => prev.filter(t => t.id !== id));
      pushLog('local', `🧹 Transaction hors-ligne définitivement effacée d'Isar.`);
    }
  };

  // Remote injection helper: modify Cloud item directly (tests LWW resolving)
  const handleModifyCloudItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCloudTxId) return;

    const parseVal = parseFloat(editCloudAmount);
    if (isNaN(parseVal) || parseVal <= 0) {
      alert("Saisissez un montant valide.");
      return;
    }

    setCloudTransactions(prev => prev.map(ct => {
      if (ct.firestoreId === editingCloudTxId) {
        return {
          ...ct,
          amount: parseVal,
          description: editCloudDesc,
          updatedAt: new Date().toISOString() // Gives it a current (newer) timestamp!
        };
      }
      return ct;
    }));

    pushLog('cloud', `⚙️ [Simulateur Cloud] Document "${editCloudDesc}" édité directement sur le serveur. Conflit programmé.`);
    setEditingCloudTxId(null);
  };

  const handleStartConflictSimulation = (tx: CloudTransaction) => {
    setEditingCloudTxId(tx.firestoreId);
    setEditCloudAmount(tx.amount.toString());
    setEditCloudDesc(tx.description);
  };

  // Reset demo datasets
  const handleResetData = () => {
    setLocalTransactions(INITIAL_LOCAL_TRANSACTIONS);
    setLocalBills(INITIAL_LOCAL_BILLS);
    setCloudTransactions(INITIAL_CLOUD_TRANSACTIONS);
    setCloudBills(INITIAL_CLOUD_BILLS);
    setLogs([
      { timestamp: new Date().toLocaleTimeString(), type: 'info', message: '🧹 Données réinitialisées aux valeurs usines.' }
    ]);
  };

  // Calculate local budget stats
  const activeLocalTx = localTransactions.filter(t => !t.isDeleted);
  const totalExpenses = activeLocalTx.reduce((acc, t) => acc + t.amount, 0);
  const totalBillsBudget = localBills.filter(b => !b.isDeleted).reduce((acc, b) => acc + (b.isPaid ? 0 : b.amount), 0);
  const spentPercent = Math.min(Math.round((totalExpenses / 5000) * 100), 100);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-800 font-sans selection:bg-emerald-100 selection:text-emerald-800">
      
      {/* Visual background accents reflecting modern moroccan architecture */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-emerald-800 to-emerald-950 shadow-md">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
      </div>

      {/* Main Container */}
      <div className="relative max-w-7xl mx-auto px-4 pt-6 pb-20">
        
        {/* Top Header Card */}
        <header className="bg-white/95 backdrop-blur rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-100 border border-emerald-800/10 mb-8 mt-1 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="bg-emerald-800 text-amber-100 p-3.5 rounded-2xl shadow-lg shadow-emerald-800/20">
              <Layers size={28} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-semibold rounded-md tracking-wider uppercase">ARCHITECT PREVIEW</span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="flex items-center text-xs font-mono text-emerald-700 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  <Coins size={12} className="mr-1" /> Isar DB & Firestore
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">Moroccan Expense & Budget Tracker</h1>
              <p className="text-xs text-slate-500 mt-0.5">Console interactive d’architecture & de simulation Offline-First</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 w-full md:w-auto">
            
            {/* Simulation reset */}
            <button
              id="btn-reset-simulator"
              onClick={handleResetData}
              className="px-3.5 py-2 hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              title="Réinitialiser la simulation"
            >
              Réinitialiser
            </button>

            {/* Language select (Français / Darija) */}
            <div className="bg-slate-100 p-1 rounded-xl flex border border-slate-200">
              <button
                id="btn-lang-fr"
                onClick={() => setLanguage('FR')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  language === 'FR' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                FR
              </button>
              <button
                id="btn-lang-ar"
                onClick={() => setLanguage('AR')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  language === 'AR' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                عربي
              </button>
            </div>

            {/* Connection Status Trigger */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-1.5 flex items-center space-x-1.5">
              <button
                id="toggle-connectivity-online"
                onClick={() => setIsOnline(true)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer ${
                  isOnline 
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/15' 
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-amber-100 animate-ping absolute' : ''}`}></div>
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-200' : 'bg-slate-300'}`}></div>
                <Wifi size={14} />
                <span>En Ligne (Online)</span>
              </button>
              <button
                id="toggle-connectivity-offline"
                onClick={() => setIsOnline(false)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer ${
                  !isOnline 
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/15' 
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${!isOnline ? 'bg-red-200 animate-ping absolute' : ''}`}></div>
                <div className={`w-2 h-2 rounded-full ${!isOnline ? 'bg-amber-300' : 'bg-slate-300'}`}></div>
                <WifiOff size={14} />
                <span>Hors-Ligne (Offline)</span>
              </button>
            </div>

          </div>
        </header>

        {/* Offline Banner alert when offline */}
        <AnimatePresence>
          {!isOnline && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-6 overflow-hidden"
              id="offline-banner-alert"
            >
              <div className="bg-amber-500/10 border-2 border-amber-500/30 text-amber-900 px-6 py-4 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-amber-500/20 text-amber-700 rounded-xl">
                    <Cloud size={20} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">L'application fonctionne actuellement en mode isolél</h3>
                    <p className="text-xs text-amber-800 mt-0.5">Toutes les opérations d'écriture sont stockées localement dans Isar DB. Elles seront poussées vers Firestore au retour du réseau.</p>
                  </div>
                </div>
                <span className="text-amber-700 font-mono text-[10px] bg-amber-500/20 px-2 py-1 rounded border border-amber-500/20 font-bold self-start sm:self-center">OUTBOX: {localTransactions.filter(t => !t.isSynced || t.isDeleted).length + localBills.filter(b => !b.isSynced || b.isDeleted).length} mutations</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Three Columns Main Grid */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
          
          {/* COLUMN 1 : Mobile client simulator device (Isar DB local state) */}
          <section className="lg:col-span-5 flex flex-col space-y-6">
            
            <div className="flex items-center space-x-2">
              <Smartphone size={18} className="text-emerald-700" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                1. Écran Mobile (Isar DB Locale)
              </h2>
            </div>

            {/* Mobile shell container */}
            <div className="bg-slate-900 text-slate-100 rounded-[40px] p-5 shadow-2xl border-4 border-slate-800 shadow-slate-900/30 flex flex-col relative overflow-hidden min-h-[640px]">
              
              {/* Phone speaker top */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-950 rounded-full flex justify-center items-center">
                <span className="w-10 h-1 bg-slate-800 rounded-full"></span>
              </div>

              {/* Simulated internal display */}
              <div className="mt-4 flex-1 flex flex-col bg-slate-950 rounded-[28px] overflow-hidden p-4 border border-slate-900">
                
                {/* Mobile app bar */}
                <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-xs text-white">M</div>
                    <span className="text-xs font-semibold text-slate-200">Moroccan Tracker</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    {/* Visual network status dot */}
                    <div className="flex items-center text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-850">
                      <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'} mr-1.5`}></div>
                      <span>{isOnline ? 'En Ligne' : 'Hors-Ligne'}</span>
                    </div>
                  </div>
                </div>

                {/* Mobile balance hero */}
                <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 p-4 rounded-2xl shadow-inner border border-emerald-700/30 mb-4 text-center">
                  <span className="text-[10px] text-emerald-300 font-mono tracking-widest uppercase mb-1 block">Reste en Poche / Disponible</span>
                  <div className="text-2xl font-black text-amber-200 flex items-center justify-center">
                    {(5000 - totalExpenses - totalBillsBudget).toLocaleString()} <span className="text-sm font-medium ml-1.5 text-emerald-100">DH</span>
                  </div>
                  <div className="mt-3 bg-slate-900/30 rounded-lg p-1.5 flex items-center justify-around text-[10px] text-emerald-200 font-mono">
                    <div>Limit: <span className="text-white font-medium">5,000 DH</span></div>
                    <div className="w-px h-3 bg-emerald-800"></div>
                    <div>Dépensé: <span className="text-white font-medium">{totalExpenses} DH</span></div>
                  </div>
                  {/* Progress Line */}
                  <div className="w-full bg-emerald-950 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className="bg-amber-400 h-1.5 rounded-full transition-all duration-500" style={{ width: `${spentPercent}%` }}></div>
                  </div>
                </div>

                {/* Categories quick budget views */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {MOROCCAN_CATEGORIES.slice(0, 4).map((cat) => {
                    const spent = localTransactions
                      .filter(t => !t.isDeleted && t.categoryFirestoreId === cat.id)
                      .reduce((sum, current) => sum + current.amount, 0);
                    const pct = Math.min(Math.round((spent / (cat.monthlyBudget || 1)) * 100), 100);

                    return (
                      <div key={cat.id} className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                        <div className="flex items-center justify-between text-[10px] mb-1 text-slate-400 font-semibold">
                          <span className="truncate">{language === 'FR' ? cat.nameFr : cat.nameAr}</span>
                          <span className="text-amber-200">{spent}/{cat.monthlyBudget} DH</span>
                        </div>
                        <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ backgroundColor: cat.color, width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Quick Expense Form inside Mobile app */}
                <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 mb-4">
                  <h3 className="text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-2 flex items-center">
                    <Plus size={12} className="text-emerald-400 mr-1" /> Consigner une dépense (Hanout, Taxi, Souk...)
                  </h3>
                  <form onSubmit={handleAddLocalTransaction} className="space-y-2">
                    <div className="flex gap-2">
                      <div className="w-1/3 relative">
                        <input
                          id="input-expense-amount"
                          type="text"
                          placeholder="Ex: 50"
                          value={newAmount}
                          onChange={(e) => setNewAmount(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-600 pr-5"
                          required
                        />
                        <span className="absolute right-1.5 top-2 text-[8px] font-mono text-slate-500 font-bold">DH</span>
                      </div>
                      <input
                        id="input-expense-desc"
                        type="text"
                        placeholder="Qu'avez-vous acheté ? (ex: Smen, Atay)"
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-600"
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <select
                        id="select-expense-category"
                        value={newCatId}
                        onChange={(e) => setNewCatId(e.target.value)}
                        className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg p-1 text-[10px] text-slate-300 focus:outline-none focus:border-emerald-600"
                      >
                        {MOROCCAN_CATEGORIES.map(c => (
                          <option key={c.id} value={c.id}>{language === 'FR' ? c.nameFr : c.nameAr}</option>
                        ))}
                      </select>
                      <select
                        value={newPayment}
                        onChange={(e) => setNewPayment(e.target.value)}
                        className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg p-1 text-[10px] text-slate-300 focus:outline-none focus:border-emerald-600"
                      >
                        <option value="Espèces (Cash)">Espèces (Cash)</option>
                        <option value="Carte Bancaire">Carte Bancaire (CIH)</option>
                        <option value="Virement Direct">Virement (Attijari)</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      id="btn-save-expense"
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[10px] py-1.5 rounded-lg shadow-md hover:shadow-emerald-600/10 cursor-pointer transition-all"
                    >
                      Enregistrer dans Isar DB
                    </button>
                  </form>
                </div>

                {/* Sub-Header: Local Registry ledger list */}
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  
                  {/* Ledger segment selector tabs */}
                  <div className="flex border-b border-slate-900 pb-1 mb-2 justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ledger Local (Isar DB Collections)</span>
                    <span className="text-[9px] font-mono text-slate-500">isSynced: true (🟢) / false (⏳)</span>
                  </div>

                  {/* Combined scroll viewport */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[220px]">
                    
                    {/* Bills Block */}
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-mono text-slate-500 block">Factures (Bills Collection)</span>
                      {localBills.filter(lb => !lb.isDeleted).map((bill) => (
                        <div key={bill.id} id={`local-bill-${bill.id}`} className="bg-slate-900 p-2 rounded-lg border border-slate-850 flex items-center justify-between text-xs hover:border-slate-800">
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="text-[10px] font-bold text-slate-300 leading-tight">
                                {language === 'FR' ? bill.titleFr : bill.titleAr}
                              </span>
                              {!bill.isSynced ? (
                                <AlertTriangle size={11} className="text-amber-500" title="Outbox: en attente de sync" />
                              ) : (
                                <span className="text-[9px] text-emerald-400" title="Cloud Firestore Synced">🟢</span>
                              )}
                            </div>
                            <span className="text-[9px] text-slate-500 block">Paiement : {bill.provider}</span>
                          </div>
                          <div className="text-right flex items-center space-x-3">
                            <span className="font-mono text-[10px] font-semibold text-amber-200">{bill.amount} DH</span>
                            {bill.isPaid ? (
                              <span className="px-1.5 py-0.5 bg-emerald-900/40 text-emerald-400 text-[8px] font-bold rounded">Payé</span>
                            ) : (
                              <button
                                onClick={() => handlePayBillOffline(bill.id)}
                                id={`btn-pay-bill-${bill.id}`}
                                className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-bold text-[9px] rounded transition-all cursor-pointer"
                              >
                                Payer
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Transactions Block */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[9px] font-mono text-slate-500 block">Dépenses (Transactions Collection)</span>
                      {localTransactions.filter(t => !t.isDeleted).length === 0 ? (
                        <p className="text-[9px] font-mono text-slate-600 text-center py-2">Aucune dépense enregistrée. Utilisez le formulaire ci-dessus.</p>
                      ) : (
                        localTransactions.filter(t => !t.isDeleted).map((tx) => {
                          const cat = MOROCCAN_CATEGORIES.find(c => c.id === tx.categoryFirestoreId);
                          return (
                            <div key={tx.id} id={`local-tx-${tx.id}`} className="bg-slate-900 p-2 rounded-lg border border-slate-850 flex items-center justify-between text-xs hover:border-slate-800">
                              <div className="flex items-center space-x-2 truncate">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat?.color || '#94A3B8' }}></div>
                                <div className="truncate">
                                  <div className="flex items-center space-x-1.5">
                                    <span className="font-bold text-slate-300 truncate leading-tight">{tx.description}</span>
                                    {!tx.isSynced ? (
                                      <span className="text-[10px]" title="Outbox Pending Sync">⏳</span>
                                    ) : (
                                      <span className="text-[9px] text-emerald-400" title="Cloud Firestore Synced">🟢</span>
                                    )}
                                  </div>
                                  <span className="text-[9px] text-slate-500 font-mono italic">
                                    {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {tx.paymentMethod}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right flex items-center space-x-2 flex-shrink-0">
                                <span className="font-mono text-xs font-bold text-slate-100">{tx.amount} DH</span>
                                <button
                                  onClick={() => handleDeleteLocalTransaction(tx.id)}
                                  id={`btn-delete-tx-${tx.id}`}
                                  className="p-1 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded cursor-pointer transition-colors"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                  </div>
                </div>

              </div>

              {/* Phone home indicator bottom */}
              <div className="w-32 h-1 bg-slate-800 rounded-full self-center mt-3 flex-shrink-0"></div>
            </div>
          </section>

          {/* COLUMN 2 : Operational Cloud Firestore Replica (Simulating target synchronization state) */}
          <section className="lg:col-span-4 flex flex-col space-y-6">
            
            <div className="flex items-center space-x-2">
              <Server size={18} className="text-emerald-700" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                2. Console Cloud Firestore (Firebase)
              </h2>
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-xl shadow-slate-100 border border-slate-200/80 min-h-[640px] flex flex-col">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <Cloud size={16} className="text-emerald-600" />
                    <span className="text-xs font-bold text-slate-800">m_budget_tracker_db</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400">Firestore Cloud Replica</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-600">ID: users/{language === 'FR' ? 'mahmoud_uid' : 'ar_uid'}</span>
                </div>
              </div>

              {/* Instructions on simulating conflicts */}
              <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-500/10 text-[11px] text-slate-600 mb-4">
                <span className="font-bold text-emerald-800 block mb-0.5">🧠 Simuler des conflits hors-ligne :</span>
                Modifiez un document directement dans Firestore pendant que l'application est **Hors-Ligne**. Repassez **En Ligne** pour voir comment le <code className="bg-emerald-100 font-bold px-1 rounded text-emerald-800">SyncManager</code> Dart arbitre avec Last-Write-Wins (LWW) !
              </div>

              {/* Editing Cloud Item inline form */}
              {editingCloudTxId && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-4 animate-fade-in">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-emerald-800">Editeur Firestore Direct (Simulation)</span>
                    <button onClick={() => setEditingCloudTxId(null)} className="text-slate-400 hover:text-slate-600">
                      <X size={12} />
                    </button>
                  </div>
                  <form onSubmit={handleModifyCloudItem} className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="number"
                        id="input-cloud-edit-amount"
                        value={editCloudAmount}
                        onChange={(e) => setEditCloudAmount(e.target.value)}
                        className="w-1/4 bg-white border border-slate-350 rounded px-1.5 py-1 text-[11px] focus:outline-none"
                        required
                      />
                      <input
                        type="text"
                        id="input-cloud-edit-desc"
                        value={editCloudDesc}
                        onChange={(e) => setEditCloudDesc(e.target.value)}
                        className="flex-1 bg-white border border-slate-350 rounded px-1.5 py-1 text-[11px] focus:outline-none"
                        required
                      />
                    </div>
                    <button type="submit" id="btn-cloud-save-conflict" className="w-full py-1 bg-amber-600 text-white font-bold text-[10px] rounded cursor-pointer">
                      Modifier valeur distant (Créer Conflit)
                    </button>
                  </form>
                </div>
              )}

              {/* Simulated lists inside Cloud Firestore */}
              <div className="flex-1 overflow-y-auto space-y-4">
                
                {/* Cloud Bills collection */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    <span>Collection: bills</span>
                    <span className="font-mono">{cloudBills.length} docs</span>
                  </div>
                  <div className="space-y-1.5">
                    {cloudBills.map((cb) => (
                      <div key={cb.firestoreId} className="bg-slate-50 p-2.5 rounded-xl border border-slate-150/80 flex items-center justify-between text-xs hover:bg-slate-100 transition-colors">
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-slate-800">{language === 'FR' ? cb.titleFr : cb.titleAr}</span>
                            <span className="text-[8px] font-mono text-slate-400">({cb.provider})</span>
                          </div>
                          <span className="text-[9px] font-mono text-slate-400 block">UPDATEDAt: {new Date(cb.updatedAt).toLocaleTimeString()}</span>
                        </div>
                        <div className="text-right flex items-center space-x-2">
                          <span className="font-mono text-[10px] font-bold text-slate-700">{cb.amount} DH</span>
                          <span className={`px-1 rounded text-[8px] font-bold ${cb.isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                            {cb.isPaid ? 'PAID' : 'DUE'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cloud Transactions collection */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    <span>Collection: transactions</span>
                    <span className="font-mono">{cloudTransactions.length} docs</span>
                  </div>
                  
                  <div className="space-y-1.5">
                    {cloudTransactions.length === 0 ? (
                      <p className="text-xs text-slate-400 font-mono italic p-3 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        La database Firestore est vide.
                      </p>
                    ) : (
                      cloudTransactions.map((ct) => {
                        const cat = MOROCCAN_CATEGORIES.find(c => c.id === ct.categoryFirestoreId);
                        
                        return (
                          <div key={ct.firestoreId} className="bg-slate-50 p-2.5 rounded-xl border border-slate-150/80 flex items-center justify-between text-xs hover:bg-slate-100 transition-colors group relative">
                            <div className="truncate pr-4">
                              <span className="font-bold text-slate-800 block truncate">{ct.description}</span>
                              <div className="flex items-center space-x-1.5 text-[9px] font-mono text-slate-400 mt-0.5">
                                <span className="bg-slate-200 px-1 rounded text-slate-600">{cat?.nameFr || 'Autre'}</span>
                                <span>UPDATEDAt: {new Date(ct.updatedAt).toLocaleTimeString()}</span>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 flex items-center space-x-2">
                              <span className="font-mono text-[11px] font-bold text-emerald-700">{ct.amount} DH</span>
                              <button
                                onClick={() => handleStartConflictSimulation(ct)}
                                id={`btn-edit-cloud-${ct.firestoreId}`}
                                className="p-1 hover:bg-emerald-100 text-slate-400 hover:text-emerald-700 rounded transition-colors"
                                title="Modifier sur Firestore pour forcer un conflit"
                              >
                                <Edit2 size={11} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>

              {/* Status indicators */}
              <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400 flex justify-between items-center">
                <span>⚡ Real-Time Connection Active</span>
                <span className="font-mono text-emerald-600 font-medium">SSL / Firestore Security Active</span>
              </div>

            </div>
          </section>

          {/* COLUMN 3 : Sync action logs & Terminal Console outputs */}
          <section className="lg:col-span-3 flex flex-col space-y-6">
            
            <div className="flex items-center space-x-2">
              <Terminal size={18} className="text-emerald-700" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                3. Logs de Trace (Sync Debugger)
              </h2>
            </div>

            <div className="bg-slate-950 text-slate-200 rounded-3xl p-5 shadow-2xl border border-slate-900 min-h-[640px] flex flex-col font-mono text-[10px]">
              
              {/* Header debugger */}
              <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-red-400"></div>
                  <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                  <span className="text-slate-500 ml-1">sync_manager_debug.log</span>
                </div>
                <button
                  id="btn-run-manual-sync"
                  onClick={runSynchronization}
                  disabled={syncing || !isOnline}
                  className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg border border-emerald-500/20 flex items-center space-x-1.5 transition-all text-[9px] font-bold disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                >
                  <RefreshCw size={10} className={syncing ? "animate-spin" : ""} />
                  <span>SYNCHRONISER</span>
                </button>
              </div>

              {/* Logs area */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[500px]">
                {logs.map((log, index) => {
                  let colorClass = 'text-slate-400';
                  let mark = '•';

                  if (log.type === 'success') {
                    colorClass = 'text-emerald-400';
                    mark = '✓';
                  } else if (log.type === 'warn') {
                    colorClass = 'text-amber-400';
                    mark = '⚠';
                  } else if (log.type === 'error') {
                    colorClass = 'text-red-400';
                    mark = '✗';
                  } else if (log.type === 'local') {
                    colorClass = 'text-cyan-400';
                    mark = '📥';
                  } else if (log.type === 'cloud') {
                    colorClass = 'text-purple-400';
                    mark = '📤';
                  }

                  return (
                    <div key={index} className={`leading-relaxed border-l-2 pl-2 ${
                      log.type === 'success' 
                        ? 'border-emerald-500' 
                        : log.type === 'warn' 
                        ? 'border-amber-500' 
                        : log.type === 'local' 
                        ? 'border-cyan-500' 
                        : log.type === 'cloud' 
                        ? 'border-purple-500' 
                        : 'border-slate-800'
                    }`}>
                      <span className="text-slate-600 mr-1 text-[9px] font-normal">[{log.timestamp}]</span>
                      <span className={`font-semibold mr-1.5 ${colorClass}`}>{mark}</span>
                      <span className="text-slate-300 font-light whitespace-pre-wrap">{log.message}</span>
                    </div>
                  );
                })}
                <div ref={terminalEndRef}></div>
              </div>

              {/* Footer debugger parameters */}
              <div className="mt-4 pt-3 border-t border-slate-900 text-slate-500 flex justify-between items-center text-[9px]">
                <span>Connectivity: {isOnline ? 'CONNECTED' : 'DISCONNECTED'}</span>
                <span>Buffer queue: {localTransactions.filter(t => !t.isSynced).length} unsynced</span>
              </div>

            </div>
          </section>

        </main>

        {/* BOTTOM SECTION : CODE HUBS FOR DART MODELS */}
        <section className="mt-12 space-y-6">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <BookOpen size={20} className="text-emerald-800" />
              <div>
                <h2 className="text-lg font-bold tracking-tight text-slate-900">
                  Livrables & Modèles de Données Isar (Dart)
                </h2>
                <p className="text-xs text-slate-500">
                  Cliquez sur les différents fichiers pour afficher les codes sources et les copier dans votre projet Flutter.
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl">
              <Sparkles size={14} className="text-emerald-700" />
              <span>Fichiers réels créés dans l'espace de build `/flutter_project` !</span>
            </div>
          </div>

          <CodeViewer />

        </section>

      </div>
    </div>
  );
}
