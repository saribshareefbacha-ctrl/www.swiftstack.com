import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
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

// Initialize Firebase App
export const firebaseApp = initializeApp(firebaseConfig);

// Safely initialize Firebase Analytics in browser environments
export let firebaseAnalytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  isSupported()
    .then((supported) => {
      if (supported) {
        try {
          firebaseAnalytics = getAnalytics(firebaseApp);
        } catch {
          // Ignore browser storage/privacy blocks in embedded previews
        }
      }
    })
    .catch(() => {});
}

// Initialize Firebase Authentication & Google Provider
export const firebaseAuth = getAuth(firebaseApp);
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Cloud Firestore
export const firestoreDb = getFirestore(firebaseApp);
