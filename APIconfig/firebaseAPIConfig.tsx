import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  // 👇 importa los tipos normalmente
  type Auth,
} from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

// 👇 importa la función real desde el runtime interno (sin tipos)
const { getReactNativePersistence } = require("@firebase/auth/dist/rn/index.js");

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_WEB_API_KEY,
  authDomain: `${process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: `${process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// ✅ Inicializar la app solo una vez
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ✅ Inicializar Auth con persistencia real
let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
} catch {
  // si ya estaba inicializado (por hot reload)
  auth = getAuth(app);
}

export { auth };

