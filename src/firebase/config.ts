import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, connectAuthEmulator } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBc_B-EWghQ0RrJ9U1CCaRtdnFLP280TnE",
  authDomain: "denim-dynasty-studio2.firebaseapp.com",
  projectId: "denim-dynasty-studio2",
  storageBucket: "denim-dynasty-studio2.firebasestorage.app",
  messagingSenderId: "568849503995",
  appId: "1:568849503995:web:4ef973371684b2084b025e",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// Connect to Local Emulators in Development Mode (with hot-reload protection)
if (
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true"
) {
  const g = globalThis as any;
  if (!g._EMULATORS_CONNECTED) {
    g._EMULATORS_CONNECTED = true;
    console.log("[Firebase Client] Connecting to local Firebase Emulators...");
    
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
  }
}

export default app;