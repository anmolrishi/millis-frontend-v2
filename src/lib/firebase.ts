import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD5AchL_-WyfSCPxMVP8WaSs5naK415tvQ",
  authDomain: "ai-voicebot-89571.firebaseapp.com",
  projectId: "ai-voicebot-89571",
  storageBucket: "ai-voicebot-89571.firebasestorage.app",
  messagingSenderId: "587098001050",
  appId: "1:587098001050:web:f2e3bc3eeb139fee3cd923",
  measurementId: "G-4SXCD3F13R"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);