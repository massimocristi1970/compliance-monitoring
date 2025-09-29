import { initializeApp } from "firebase/app";
import { getAuth, GithubAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDrTb9daKVmyYa7MhA3-Bb0rBxkdVKaEY4",
  authDomain: "compliance-dashboard-prod.firebaseapp.com",
  projectId: "compliance-dashboard-prod",
  storageBucket: "compliance-dashboard-prod.firebasestorage.app",
  messagingSenderId: "22376679121",
  appId: "1:22376679121:web:81816b8604485e030d67f0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const githubProvider = new GithubAuthProvider();

// IMPORTANT: This is required to allow the app to access the GitHub Issues and Contents API.
githubProvider.addScope('repo');

// Export all necessary functions for components
export { signInWithPopup, signOut, onAuthStateChanged };