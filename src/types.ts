export interface Category {
  id: string; // matches firestoreId
  nameFr: string;
  nameAr: string;
  icon: string;
  color: string;
  monthlyBudget?: number;
}

export interface LocalTransaction {
  id: number; // Isar incremental
  firestoreId: string;
  amount: number;
  description: string;
  date: string;
  categoryFirestoreId: string;
  paymentMethod: string;
  updatedAt: string;
  isSynced: boolean;
  isDeleted: boolean;
}

export interface LocalBill {
  id: number; // Isar incremental
  firestoreId: string;
  titleFr: string;
  titleAr: string;
  amount: number;
  dueDate: string;
  provider: string; // Lydec, ONEE, etc
  isPaid: boolean;
  paidAt?: string;
  recurrence: string;
  updatedAt: string;
  isSynced: boolean;
  isDeleted: boolean;
}

export interface CloudTransaction {
  firestoreId: string;
  amount: number;
  description: string;
  date: string;
  categoryFirestoreId: string;
  paymentMethod: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface CloudBill {
  firestoreId: string;
  titleFr: string;
  titleAr: string;
  amount: number;
  dueDate: string;
  provider: string;
  isPaid: boolean;
  paidAt?: string;
  recurrence: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface SyncLogEntry {
  timestamp: string;
  type: 'info' | 'success' | 'warn' | 'error' | 'local' | 'cloud';
  message: string;
}
