// lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app'
import { getDatabase, ref, get, set, update, remove, push, child } from 'firebase/database'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
}

// Firebase ko multiple times initialize hone se bachao
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()

export const db = getDatabase(app)
export { ref, get, set, update, remove, push, child }
