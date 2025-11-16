// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDIwtAl4roUJDykI_4MthVfbUoOTjBnqvs",
  authDomain: "insubuddy-bb8ee.firebaseapp.com",
  projectId: "insubuddy-bb8ee",
  storageBucket: "insubuddy-bb8ee.firebasestorage.app",
  messagingSenderId: "919200313014",
  appId: "1:919200313014:web:fc5679eb0b458107ef8017",
  measurementId: "G-KDQZ8RQVF1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
//export
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);