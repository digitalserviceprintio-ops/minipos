import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from 'firebase/auth';
import {
  initializeFirestore,
  doc,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom database ID and auto-detect long polling for optimal connection stability
export const db = initializeFirestore(
  app,
  {
    experimentalAutoDetectLongPolling: true,
  },
  firebaseConfig.firestoreDatabaseId
);

// Initialize Firebase Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Standard OperationType for Firestore error logging
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

/**
 * Standard Firestore error handler conforming to skill requirements.
 * Catches errors, logs rich diagnostic context as a JSON string, and re-throws.
 */
export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const currentUser = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo:
        currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Checks readiness of Firebase and network connectivity.
 */
export async function testConnection(): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return false;
    }
    return Boolean(db && app);
  } catch (error) {
    console.warn('Firebase connection check notice:', error);
    return false;
  }
}

/**
 * Login with Google popup for secure authentication.
 * Gracefully handles popup-blocked / iframe restriction scenarios.
 */
export async function loginWithGoogle(): Promise<FirebaseUser> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err: unknown) {
    const errorStr = String(err);
    const isBlocked =
      (err as { code?: string })?.code === 'auth/popup-blocked' ||
      errorStr.includes('popup-blocked');
    const isCancelled =
      (err as { code?: string })?.code === 'auth/popup-closed-by-user' ||
      errorStr.includes('popup-closed-by-user') ||
      (err as { code?: string })?.code === 'auth/cancelled-popup-request' ||
      errorStr.includes('cancelled-popup-request');

    if (isBlocked || isCancelled) {
      console.warn('Google Sign-in popup was blocked or closed:', err);
    } else {
      console.warn('Google Sign-in attempt encountered an issue:', err);
    }
    throw err;
  }
}

/**
 * Sign out from Firebase.
 */
export async function logoutFirebase(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (err) {
    console.error('Logout error:', err);
  }
}

export interface FirebaseRegisterResult {
  success: boolean;
  message: string;
  verificationSent: boolean;
  user?: FirebaseUser;
}

/**
 * Register user with email and password in Firebase Authentication
 * and send email verification / confirmation link to the registered email address.
 */
export async function registerWithFirebaseEmail(
  email: string,
  pass: string,
  displayName?: string
): Promise<FirebaseRegisterResult> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (displayName && cred.user) {
      try {
        await updateProfile(cred.user, { displayName });
      } catch (e) {
        console.warn('Notice updating profile name:', e);
      }
    }

    // Send verification email to the newly registered email address
    let verificationSent = false;
    try {
      await sendEmailVerification(cred.user);
      verificationSent = true;
    } catch (e) {
      console.warn('Notice sending verification email:', e);
    }

    return {
      success: true,
      message: verificationSent
        ? `Pendaftaran berhasil. Link validasi telah dikirim ke ${email}.`
        : `Pendaftaran berhasil untuk ${email}.`,
      verificationSent,
      user: cred.user,
    };
  } catch (err: unknown) {
    const errorStr = String(err);
    if (errorStr.includes('auth/email-already-in-use')) {
      return {
        success: false,
        message: 'Alamat email ini sudah terdaftar di Firebase. Silakan gunakan email lain atau masuk langsung.',
        verificationSent: false,
      };
    }
    if (errorStr.includes('auth/weak-password')) {
      return {
        success: false,
        message: 'Kata sandi minimal 6 karakter sesuai standar keamanan Firebase.',
        verificationSent: false,
      };
    }
    if (errorStr.includes('auth/invalid-email')) {
      return {
        success: false,
        message: 'Format email tidak valid. Pastikan format penulisan benar (contoh@domain.com).',
        verificationSent: false,
      };
    }
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Gagal mendaftar akun di Firebase Auth.',
      verificationSent: false,
    };
  }
}

/**
 * Resend validation/verification email to the given Firebase user or the currently authenticated user.
 */
export async function resendVerificationEmail(
  targetUser?: FirebaseUser | null
): Promise<{ success: boolean; message: string }> {
  const u = targetUser || auth.currentUser;
  if (!u) {
    return { success: false, message: 'Tidak ada sesi pengguna aktif untuk pengiriman email verifikasi.' };
  }
  try {
    await sendEmailVerification(u);
    return {
      success: true,
      message: `Link validasi berhasil dikirim ulang ke ${u.email || 'email terdaftar'}. Periksa kotak masuk atau spam.`,
    };
  } catch (err: unknown) {
    console.warn('Error resending email verification:', err);
    return {
      success: false,
      message: 'Gagal mengirim ulang email validasi. Coba beberapa saat lagi.',
    };
  }
}

export { onAuthStateChanged };
export type { FirebaseUser };
