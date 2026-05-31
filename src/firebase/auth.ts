import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";

import { auth } from "./config";

// LOGIN
export const loginAdmin = async (email: string, password: string) => {
  return await signInWithEmailAndPassword(auth, email, password);
};

// LOGOUT
export const logoutAdmin = async () => {
  return await signOut(auth);
};

// LISTENER
export const listenToAuth = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};