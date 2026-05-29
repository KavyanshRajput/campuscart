import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your project's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD0zUVk4njE0Qo1jRQP6gyN5Np1UeahN20",
  authDomain: "campuscart-9c677.firebaseapp.com",
  projectId: "campuscart-9c677",
  storageBucket: "campuscart-9c677.firebasestorage.app",
  messagingSenderId: "785614521056",
  appId: "1:785614521056:web:4fdf81f54d3aef852c8685",
  measurementId: "G-3S66HZKHV5"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
