import { initializeApp } from 'firebase/app';
import { getAnalytics, Analytics } from 'firebase/analytics';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: 'AIzaSyAr4PNkRJh20mVSIyrUjUQWn641fnsoPFQ',
  authDomain: 'swiftstack-a75b2.firebaseapp.com',
  projectId: 'swiftstack-a75b2',
  storageBucket: 'swiftstack-a75b2.firebasestorage.app',
  messagingSenderId: '934988104581',
  appId: '1:934988104581:web:b3ad31152ecda0ab183aec',
  measurementId: 'G-Y9K67T9C6H',
};

export const app = initializeApp(firebaseConfig);
export const firebaseApp = app;

export let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch {
    analytics = null;
  }
}

export const firebaseAuth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({ prompt: 'select_account' });

export const firestoreDb = getFirestore(app);
