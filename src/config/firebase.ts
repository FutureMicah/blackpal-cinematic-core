import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyANqJLTCWXsAp1qae3pN1vQ4U7LPcWQZXA",
  authDomain: "blacktradeacademy-7e5d1.firebaseapp.com",
  projectId: "blacktradeacademy-7e5d1",
  storageBucket: "blacktradeacademy-7e5d1.firebasestorage.app",
  messagingSenderId: "621527256199",
  appId: "1:621527256199:web:6cee835b6ec4c5712e7c22"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
