import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../firebase';
import {
  Account,
  AgentProfile,
  CustomerMember,
  PosSale,
  Product,
  Transaction,
  CashMutation,
} from '../types';

/**
 * Normalizes document ID to satisfy valid ID requirements (<= 128 chars, alphanumeric + _ -).
 */
export function sanitizeDocId(id: string): string {
  const cleaned = (id || '').replace(/[^a-zA-Z0-9_-]/g, '_');
  return (cleaned.slice(0, 100) || `doc_${Date.now()}`);
}

/**
 * Saves a single transaction to Firestore under the user's workspace.
 */
export async function syncTransactionToFirestore(
  userId: string,
  transaction: Transaction
): Promise<void> {
  const path = `users/${userId}/transactions`;
  const docId = sanitizeDocId(transaction.id);
  const docRef = doc(db, path, docId);

  const payload = {
    ...transaction,
    id: docId,
    ownerId: userId,
  };

  try {
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${docId}`);
  }
}

/**
 * Saves an account to Firestore under the user's workspace.
 */
export async function syncAccountToFirestore(
  userId: string,
  account: Account
): Promise<void> {
  const path = `users/${userId}/accounts`;
  const docId = sanitizeDocId(account.id);
  const docRef = doc(db, path, docId);

  const payload = {
    ...account,
    id: docId,
    ownerId: userId,
  };

  try {
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${docId}`);
  }
}

/**
 * Saves a POS product to Firestore.
 */
export async function syncProductToFirestore(
  userId: string,
  product: Product
): Promise<void> {
  const path = `users/${userId}/products`;
  const docId = sanitizeDocId(product.id);
  const docRef = doc(db, path, docId);

  const payload = {
    ...product,
    id: docId,
    ownerId: userId,
  };

  try {
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${docId}`);
  }
}

/**
 * Saves a POS sale order to Firestore.
 */
export async function syncPosSaleToFirestore(
  userId: string,
  sale: PosSale
): Promise<void> {
  const path = `users/${userId}/posSales`;
  const docId = sanitizeDocId(sale.id);
  const docRef = doc(db, path, docId);

  const payload = {
    ...sale,
    id: docId,
    ownerId: userId,
  };

  try {
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${docId}`);
  }
}

/**
 * Saves a cash mutation to Firestore.
 */
export async function syncMutationToFirestore(
  userId: string,
  mutation: CashMutation
): Promise<void> {
  const path = `users/${userId}/mutations`;
  const docId = sanitizeDocId(mutation.id);
  const docRef = doc(db, path, docId);

  const payload = {
    ...mutation,
    id: docId,
    ownerId: userId,
  };

  try {
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${docId}`);
  }
}

/**
 * Saves store profile to Firestore.
 */
export async function syncStoreProfileToFirestore(
  userId: string,
  profile: AgentProfile
): Promise<void> {
  const path = `users/${userId}/storeProfile`;
  const docId = 'main';
  const docRef = doc(db, path, docId);

  const payload = {
    ...profile,
    ownerId: userId,
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${docId}`);
  }
}

/**
 * Synchronizes full user workspace to Firebase Firestore.
 */
export async function syncFullWorkspaceToFirestore(
  userId: string,
  data: {
    profile?: AgentProfile;
    accounts?: Account[];
    transactions?: Transaction[];
    products?: Product[];
    posSales?: PosSale[];
    mutations?: CashMutation[];
    members?: CustomerMember[];
  }
): Promise<{ success: boolean; message: string }> {
  try {
    if (data.profile) {
      await syncStoreProfileToFirestore(userId, data.profile);
    }

    if (Array.isArray(data.accounts)) {
      for (const acc of data.accounts) {
        await syncAccountToFirestore(userId, acc);
      }
    }

    if (Array.isArray(data.transactions)) {
      for (const trx of data.transactions) {
        await syncTransactionToFirestore(userId, trx);
      }
    }

    if (Array.isArray(data.products)) {
      for (const prod of data.products) {
        await syncProductToFirestore(userId, prod);
      }
    }

    if (Array.isArray(data.posSales)) {
      for (const sale of data.posSales) {
        await syncPosSaleToFirestore(userId, sale);
      }
    }

    if (Array.isArray(data.mutations)) {
      for (const mut of data.mutations) {
        await syncMutationToFirestore(userId, mut);
      }
    }

    return { success: true, message: 'Data berhasil disinkronisasi ke Firebase Cloud Firestore' };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn('Workspace sync notice:', errorMsg);
    return { success: false, message: errorMsg };
  }
}

/**
 * Fetches all transactions for a user from Firestore.
 */
export async function fetchTransactionsFromFirestore(userId: string): Promise<Transaction[]> {
  const path = `users/${userId}/transactions`;
  try {
    const colRef = collection(db, path);
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => d.data() as Transaction);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Subscribes to real-time transactions from Firestore for a given user.
 */
export function subscribeToTransactions(
  userId: string,
  onData: (transactions: Transaction[]) => void
): Unsubscribe {
  const path = `users/${userId}/transactions`;
  const colRef = collection(db, path);

  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Transaction[] = [];
      snapshot.forEach((d) => {
        items.push(d.data() as Transaction);
      });
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

/**
 * Subscribes to real-time accounts from Firestore.
 */
export function subscribeToAccounts(
  userId: string,
  onData: (accounts: Account[]) => void
): Unsubscribe {
  const path = `users/${userId}/accounts`;
  const colRef = collection(db, path);

  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Account[] = [];
      snapshot.forEach((d) => {
        items.push(d.data() as Account);
      });
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

/**
 * Subscribes to real-time products from Firestore.
 */
export function subscribeToProducts(
  userId: string,
  onData: (products: Product[]) => void
): Unsubscribe {
  const path = `users/${userId}/products`;
  const colRef = collection(db, path);

  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Product[] = [];
      snapshot.forEach((d) => {
        items.push(d.data() as Product);
      });
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}
