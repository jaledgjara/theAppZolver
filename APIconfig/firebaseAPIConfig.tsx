import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, initializeAuth, Auth } from "firebase/auth";
import { getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// ============================================
// TODO: REPLACE WITH YOUR ACTUAL FIREBASE KEYS
// Get them from: https://console.firebase.google.com
// ============================================
const HARDCODED_CONFIG = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// Try to use env vars first, fallback to hardcoded
const firebaseConfig = {
  apiKey:
    process.env.EXPO_PUBLIC_FIREBASE_WEB_API_KEY || HARDCODED_CONFIG.apiKey,
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || HARDCODED_CONFIG.authDomain,
  projectId:
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || HARDCODED_CONFIG.projectId,
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    HARDCODED_CONFIG.storageBucket,
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    HARDCODED_CONFIG.messagingSenderId,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || HARDCODED_CONFIG.appId,
};

// Debug: Show what's being used
console.log("🔥 Firebase Config Source:", {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_WEB_API_KEY
    ? "✅ From .env"
    : "⚠️  Using hardcoded",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
    ? "✅ From .env"
    : "⚠️  Using hardcoded",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID
    ? "✅ From .env"
    : "⚠️  Using hardcoded",
});

// Validate
if (firebaseConfig.apiKey === "YOUR_API_KEY_HERE") {
  console.error("❌ FIREBASE CONFIG ERROR:");
  console.error("You need to either:");
  console.error(
    "1. Add your Firebase keys to HARDCODED_CONFIG in firebaseAPIConfig.tsx",
  );
  console.error("2. Create a .env file with EXPO_PUBLIC_FIREBASE_* variables");
  console.error("3. Get your keys from: https://console.firebase.google.com");
  throw new Error("Firebase API key not configured");
}

let app: FirebaseApp;
let auth: Auth;

// Initialize Firebase
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  console.log("✅ Firebase initialized");
} else {
  app = getApps()[0];
  console.log("✅ Firebase already initialized");
}

// Initialize Auth with platform-specific persistence
if (Platform.OS === "web") {
  auth = getAuth(app);
  console.log("✅ Auth initialized for WEB");
} else {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
    console.log("✅ Auth initialized for MOBILE");
  } catch (error: any) {
    if (error.code === "auth/already-initialized") {
      auth = getAuth(app);
      console.log("✅ Auth already initialized");
    } else {
      throw error;
    }
  }
}

export { app, auth };

// // ✅ Importación correcta en Firebase 11+
// import { initializeApp } from "firebase/app";
// import { getAuth, initializeAuth } from "firebase/auth";
// import { getReactNativePersistence } from "firebase/auth";

// import AsyncStorage from "@react-native-async-storage/async-storage";

// const firebaseConfig = {
//   apiKey: process.env.EXPO_PUBLIC_FIREBASE_WEB_API_KEY,
//   authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
//   projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
//   storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
//   appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
// };

// const app = initializeApp(firebaseConfig);
// const auth = initializeAuth(app, {

//   persistence: getReactNativePersistence(AsyncStorage),
// });

// export { auth };
