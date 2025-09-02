import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getFunctions, type Functions } from 'firebase/functions';

// JepsonMath Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyC5RBFhthQnM50bH8qZSxQAyjsj_MsniD8",
  authDomain: "jepsonmath.firebaseapp.com",
  projectId: "jepsonmath",
  storageBucket: "jepsonmath.firebasestorage.app",
  messagingSenderId: "277621705197",
  appId: "1:277621705197:web:YOUR_APP_ID_HERE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const functions = getFunctions(app, 'us-west1');

// Configure Auth settings
auth.useDeviceLanguage();

// Analytics disabled to prevent auto-creation
let analytics = null;

// Initialize basic Google Auth Provider (no classroom scopes for main login)
import { GoogleAuthProvider } from 'firebase/auth';

export const googleProvider = new GoogleAuthProvider();

// Basic Google login - no additional scopes needed
// Classroom scopes are handled separately in GoogleClassroomImport component

// Authentication configuration for JepsonMath
export const AUTH_CONFIG = {
  enableEmailAuth: true,
  requireEmailVerification: false
};

export { app, db, auth, storage, functions, analytics };
export default app;
