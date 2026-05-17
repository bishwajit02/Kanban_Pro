// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyACThF7GvDmucelqKnscPK7gFkRar_zWvA",
  authDomain: "kanban-pro-f2f77.firebaseapp.com",
  projectId: "kanban-pro-f2f77",
  storageBucket: "kanban-pro-f2f77.firebasestorage.app",
  messagingSenderId: "4723102804",
  appId: "1:4723102804:web:5ef173feb145782ed889c1",
  measurementId: "G-68TXPH0255",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app); // Remove unused analytics

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore
export const db = getFirestore(app);
