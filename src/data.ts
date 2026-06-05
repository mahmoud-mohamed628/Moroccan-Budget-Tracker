import { Category, LocalTransaction, LocalBill, CloudTransaction, CloudBill } from './types';

export const MOROCCAN_CATEGORIES: Category[] = [
  {
    id: 'cat_hanout',
    nameFr: "Épicier / Hanout",
    nameAr: "البقال / الحانوت",
    icon: 'Store',
    color: '#065F46', // Mint green
    monthlyBudget: 1200
  },
  {
    id: 'cat_souk',
    nameFr: "Souk & Marché",
    nameAr: "السوق والخضر",
    icon: 'ShoppingBag',
    color: '#B45309', // Amber / Warm orange
    monthlyBudget: 2500
  },
  {
    id: 'cat_taxi',
    nameFr: "Taxi & Transports",
    nameAr: "سيارات الأجرة والنقل",
    icon: 'Car',
    color: '#1D4ED8', // Royal Blue
    monthlyBudget: 600
  },
  {
    id: 'cat_cafe',
    nameFr: "Café & Restos",
    nameAr: "المقهى والمطاعم",
    icon: 'Coffee',
    color: '#9D174D', // Deep Rose
    monthlyBudget: 500
  },
  {
    id: 'cat_factures',
    nameFr: "Factures & Logement",
    nameAr: "الفواتير والكراء",
    icon: 'FileText',
    color: '#4338CA', // Indigo
    monthlyBudget: 3500
  }
];

export const INITIAL_LOCAL_TRANSACTIONS: LocalTransaction[] = [
  {
    id: 1,
    firestoreId: 'tx_uuid_1',
    amount: 150,
    description: "Fruits, Légumes et Menthe (Souk Hebdomadaire)",
    date: "2026-06-02T10:30:00Z",
    categoryFirestoreId: 'cat_souk',
    paymentMethod: "Espèces (Cash)",
    updatedAt: "2026-06-02T10:30:00Z",
    isSynced: true,
    isDeleted: false
  },
  {
    id: 2,
    firestoreId: 'tx_uuid_2',
    amount: 85,
    description: "Sucre, Thé, Huile d'Argan (Hanout Moul l'Hrayri)",
    date: "2026-06-03T09:12:00Z",
    categoryFirestoreId: 'cat_hanout',
    paymentMethod: "Espèces (Cash)",
    updatedAt: "2026-06-03T09:12:00Z",
    isSynced: true,
    isDeleted: false
  },
  {
    id: 3,
    firestoreId: 'tx_uuid_3',
    amount: 20,
    description: "Grand Taxi Bab Doukkala vers Sidi Youssef",
    date: "2026-06-04T08:00:00Z",
    categoryFirestoreId: 'cat_taxi',
    paymentMethod: "Espèces (Cash)",
    updatedAt: "2026-06-04T08:00:00Z",
    isSynced: false, // Created offline / unsynced!
    isDeleted: false
  },
  {
    id: 4,
    firestoreId: 'tx_uuid_4',
    amount: 15,
    description: "Café Nouss-Nouss + Eau de table",
    date: "2026-06-04T12:15:00Z",
    categoryFirestoreId: 'cat_cafe',
    paymentMethod: "Espèces (Cash)",
    updatedAt: "2026-06-04T12:15:00Z",
    isSynced: false, // Created offline / unsynced!
    isDeleted: false
  }
];

export const INITIAL_LOCAL_BILLS: LocalBill[] = [
  {
    id: 1,
    firestoreId: 'bill_uuid_1',
    titleFr: "Facture Électricité & Eau (Lydec)",
    titleAr: "فاتورة الكهرباء والماء (ليدك)",
    amount: 420,
    dueDate: "2026-06-15",
    provider: "Lydec",
    isPaid: false,
    recurrence: "Mensuel",
    updatedAt: "2026-06-01T08:00:00Z",
    isSynced: true,
    isDeleted: false
  },
  {
    id: 2,
    firestoreId: 'bill_uuid_2',
    titleFr: "Abonnement Fibre Optique (Maroc Telecom)",
    titleAr: "اشتراك الألياف البصرية (اتصالات المغرب)",
    amount: 249,
    dueDate: "2026-06-05",
    provider: "Maroc Telecom",
    isPaid: true,
    paidAt: "2026-06-03T18:40:00Z",
    recurrence: "Mensuel",
    updatedAt: "2026-06-03T18:40:00Z",
    isSynced: false, // Paid offline, needs sync!
    isDeleted: false
  },
  {
    id: 3,
    firestoreId: 'bill_uuid_3',
    titleFr: "Recharge Mobile Inwi",
    titleAr: "تعبئة الهاتف إنوي",
    amount: 50,
    dueDate: "2026-06-20",
    provider: "Inwi",
    isPaid: false,
    recurrence: "Mensuel",
    updatedAt: "2026-06-01T08:00:00Z",
    isSynced: true,
    isDeleted: false
  }
];

// Firestore initial cloud items (mock database server-side)
export const INITIAL_CLOUD_TRANSACTIONS: CloudTransaction[] = [
  {
    firestoreId: 'tx_uuid_1',
    amount: 150,
    description: "Fruits, Légumes et Menthe (Souk Hebdomadaire)",
    date: "2026-06-02T10:30:00Z",
    categoryFirestoreId: 'cat_souk',
    paymentMethod: "Espèces (Cash)",
    updatedAt: "2026-06-02T10:30:00Z",
    isDeleted: false
  },
  {
    // Let's create a CONFLICT candidate here!
    // Cloud has been modified at 2026-06-04T10:00:00Z (updatedAmount = 90, additional item bought!)
    firestoreId: 'tx_uuid_2',
    amount: 90, // Changed on Cloud (e.g. from web application or co-user)
    description: "Sucre, Thé, Huile d'Argan (Hanout Moul l'Hrayri) + Boutons menthe",
    date: "2026-06-03T09:12:00Z",
    categoryFirestoreId: 'cat_hanout',
    paymentMethod: "Espèces (Cash)",
    updatedAt: "2026-06-04T10:00:00Z", // Cloud updatedAt is LATER than Local (06-03)
    isDeleted: false
  }
];

export const INITIAL_CLOUD_BILLS: CloudBill[] = [
  {
    firestoreId: 'bill_uuid_1',
    titleFr: "Facture Électricité & Eau (Lydec)",
    titleAr: "فاتورة الكهرباء والماء (ليدك)",
    amount: 420,
    dueDate: "2026-06-15",
    provider: "Lydec",
    isPaid: false,
    recurrence: "Mensuel",
    updatedAt: "2026-06-01T08:00:00Z",
    isDeleted: false
  },
  {
    // Cloud hasn't seen the payment yet
    firestoreId: 'bill_uuid_2',
    titleFr: "Abonnement Fibre Optique (Maroc Telecom)",
    titleAr: "اشتراك الألياف البصرية (اتصالات المغرب)",
    amount: 249,
    dueDate: "2026-06-05",
    provider: "Maroc Telecom",
    isPaid: false, // Cloud is still false! But offline local paid it.
    recurrence: "Mensuel",
    updatedAt: "2026-06-01T08:00:00Z", // Local has newer updatedAt (06-03)
    isDeleted: false
  },
  {
    firestoreId: 'bill_uuid_3',
    titleFr: "Recharge Mobile Inwi",
    titleAr: "تعبئة الهاتف إنوي",
    amount: 50,
    dueDate: "2026-06-20",
    provider: "Inwi",
    isPaid: false,
    recurrence: "Mensuel",
    updatedAt: "2026-06-01T08:00:00Z",
    isDeleted: false
  }
];
