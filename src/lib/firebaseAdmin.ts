import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let app: App | null = null;

/**
 * Validates and formats the Firebase Admin private key.
 * Resolves escaped newlines (\\n) commonly found in .env files.
 */
function formatPrivateKey(key: string | undefined): string | undefined {
  if (!key) return undefined;
  let formatted = key.trim();
  // Strip surrounding quotes if present
  if ((formatted.startsWith('"') && formatted.endsWith('"')) || (formatted.startsWith("'") && formatted.endsWith("'"))) {
    formatted = formatted.slice(1, -1);
  }
  return formatted.replace(/\\n/g, '\n');
}

/**
 * Checks whether all required Firebase Admin environment variables are set.
 */
export function isFirebaseConfigured(): boolean {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  return Boolean(projectId && clientEmail && privateKey);
}

/**
 * Initializes and returns the Firebase Admin App instance (singleton pattern).
 */
export function getFirebaseAdminApp(): App {
  if (app) {
    return app;
  }

  const existingApps = getApps();
  if (existingApps.length > 0 && existingApps[0]) {
    app = existingApps[0];
    return app;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !rawPrivateKey) {
    const missing: string[] = [];
    if (!projectId) missing.push('FIREBASE_PROJECT_ID');
    if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
    if (!rawPrivateKey) missing.push('FIREBASE_PRIVATE_KEY');

    throw new Error(
      `Firebase Admin configuration error: Missing required environment variable(s): ${missing.join(
        ', '
      )}. Please set them in .env.local.`
    );
  }

  const privateKey = formatPrivateKey(rawPrivateKey);

  try {
    app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    return app;
  } catch (error: any) {
    console.error('[Firebase Admin Initialization Error]:', error?.message || error);
    throw new Error(`Failed to initialize Firebase Admin SDK: ${error?.message || 'Invalid credentials'}`);
  }
}

/**
 * Returns the Firestore database instance.
 */
let firestoreDbInstance: Firestore | null = null;

export function getFirestoreDb(): Firestore {
  if (firestoreDbInstance) {
    return firestoreDbInstance;
  }
  const adminApp = getFirebaseAdminApp();
  const db = getFirestore(adminApp);
  try {
    db.settings({ ignoreUndefinedProperties: true });
  } catch (_) {
    // If settings were already locked/configured, ignore error
  }
  firestoreDbInstance = db;
  return firestoreDbInstance;
}

