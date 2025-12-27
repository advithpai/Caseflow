import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Validate environment variables
const requiredEnvVars = {
  VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check for missing environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value || value.trim() === "")
  .map(([key]) => key);

if (missingVars.length > 0) {

  throw new Error(
    `Missing Firebase configuration. Please check your .env file. Missing: ${missingVars.join(", ")}`
  );
}

const firebaseConfig = {
  apiKey: requiredEnvVars.VITE_FIREBASE_API_KEY,
  authDomain: requiredEnvVars.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: requiredEnvVars.VITE_FIREBASE_PROJECT_ID,
  storageBucket: requiredEnvVars.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: requiredEnvVars.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: requiredEnvVars.VITE_FIREBASE_APP_ID,
};

// Log config for debugging (without sensitive data)


// Initialize Firebase
let app;
let auth;
let db;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
 
  
  // Provide specific guidance based on error
  if (error.code === "auth/invalid-api-key" || error.message?.includes("CONFIGURATION_NOT_FOUND")) {
    throw new Error(
      `Firebase configuration not found. Please verify:\n` +
      `1. Your Firebase project exists: ${firebaseConfig.projectId}\n` +
      `2. Email/Password authentication is enabled in Firebase Console\n` +
      `3. Firestore Database is enabled\n` +
      `4. Your API key matches the project\n` +
      `5. Check Firebase Console > Project Settings > General > Your apps`
    );
  }
  
  throw new Error(
    `Failed to initialize Firebase: ${error.message}. Please check your Firebase configuration.`
  );
}

export { auth, db };
export default app;

