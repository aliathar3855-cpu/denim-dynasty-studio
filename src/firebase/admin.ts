import { initializeApp, getApps, getApp, cert, applicationDefault } from "firebase-admin";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";

let app;
if (getApps().length === 0) {
  try {
    let credential;

    // Option 1: Parse a single JSON string containing the service account credentials
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      console.log("[Firebase Admin] Initializing via FIREBASE_SERVICE_ACCOUNT_KEY JSON string.");
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      credential = cert(serviceAccount);
    } 
    // Option 2: Use individual key environment variables
    else if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ) {
      console.log("[Firebase Admin] Initializing via individual service account environment variables.");
      credential = cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      });
    } 
    // Option 3: Fallback to Application Default Credentials (ADC)
    else {
      console.warn(
        "[Firebase Admin Warning] Missing Firebase Admin environment variables. " +
        "Serverless API routes will attempt to fallback to Application Default Credentials."
      );
      credential = applicationDefault();
    }

    app = initializeApp({
      credential,
      projectId: process.env.FIREBASE_PROJECT_ID || "denim-dynasty-studio2",
    });
    console.log("[Firebase Admin] SDK initialized successfully.");
  } catch (err: any) {
    console.error("[Firebase Admin Error] Failed to initialize Firebase Admin SDK:", err.message || err);
  }
} else {
  app = getApp();
}

export const adminDb = getFirestore();
export { FieldValue, Timestamp };
