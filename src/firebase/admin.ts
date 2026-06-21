import { initializeApp, getApps, getApp, cert, applicationDefault } from "firebase-admin";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let app: any;
let dbInstance: Firestore;

const initAdmin = () => {
  if (getApps().length > 0) {
    app = getApp();
    dbInstance = getFirestore(app);
    return;
  }

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
    dbInstance = getFirestore(app);
    console.log("[Firebase Admin] SDK initialized successfully.");
  } catch (err: any) {
    console.error("[Firebase Admin Error] Failed to initialize Firebase Admin SDK:", err.message || err);
    throw new Error("Database configuration error. The server could not load credentials.");
  }
};

export const getAdminDb = (): Firestore => {
  if (!dbInstance) {
    initAdmin();
  }
  return dbInstance;
};

// Export adminDb as a Proxy to enable transparent lazy initialization
export const adminDb = new Proxy({} as any, {
  get(target, prop) {
    const instance = getAdminDb();
    const value = Reflect.get(instance, prop);
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  }
}) as unknown as Firestore;

export { FieldValue, Timestamp } from "firebase-admin/firestore";

