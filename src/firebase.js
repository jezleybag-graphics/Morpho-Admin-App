import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// --- 1. FIREBASE CONFIGURATION ---
// Now pulling from .env file
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Export the Database connection
export const db = getFirestore(app);

// --- 2. EXISTING CONFIG (For Orders & Chat) ---
export const GOOGLE_SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
export const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET;
export const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;