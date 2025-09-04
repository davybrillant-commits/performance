import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Configuration Firebase sécurisée via variables d'environnement
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBL4bojX30tp_wNdN1etnEnD1mXZE8mct8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "perf-44f46.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "perf-44f46",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "perf-44f46.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "811372331131",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:811372331131:web:9a4899a54de78e018362de",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-8TF86CJK00"
};

// Initialisation Firebase
const app = initializeApp(firebaseConfig);

// Services Firebase
export const db = getFirestore(app);
export const auth = getAuth(app);

// Analytics (uniquement en environnement navigateur)
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { analytics };
export default app;