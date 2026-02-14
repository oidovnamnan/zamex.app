import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBvwEFiFG9yqQs_PoHsTNTspX3QbSLHY3E",
    authDomain: "zamex-40ec0.firebaseapp.com",
    projectId: "zamex-40ec0",
    storageBucket: "zamex-40ec0.firebasestorage.app",
    messagingSenderId: "948369069927",
    appId: "1:948369069927:web:5c23bdec9f3ccefedc81c2",
    measurementId: "G-LZCQ62YMK0"
};

// Initialize Firebase (avoid multiple instances)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
auth.languageCode = 'mn'; // Mongolian

export { RecaptchaVerifier, signInWithPhoneNumber };
export type { ConfirmationResult };
