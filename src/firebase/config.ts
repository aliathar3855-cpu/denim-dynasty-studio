import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBc_B-EWghQ0RrJ9U1CCaRtdnFLP280TnE",
  authDomain: "denim-dynasty-studio2.firebaseapp.com",
  projectId: "denim-dynasty-studio2",
  storageBucket: "denim-dynasty-studio2.firebasestorage.app",
  messagingSenderId: "568849503995",
  appId: "1:568849503995:web:4ef973371684b2084b025e",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

export default app;