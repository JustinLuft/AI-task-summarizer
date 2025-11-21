// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";

// Firebase config (replace with your keys)
const firebaseConfig = {
  apiKey: "AIzaSyBvo9QUiSDLvHh2ygorQWjHvJjHq0YLq2s",
  authDomain: "ai-task-summarizer.firebaseapp.com",
  projectId: "ai-task-summarizer",
  storageBucket: "ai-task-summarizer.firebasestorage.app",
  messagingSenderId: "955728715302",
  appId: "1:955728715302:web:ae9bfab67bfde84d3790e7",
  measurementId: "G-DRCEJ2CKKZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Firestore functions for tasks
export async function saveTasks(userId, tasks) {
  await setDoc(doc(db, "tasks", userId), { tasks });
}

export async function loadTasks(userId) {
  const docRef = doc(db, "tasks", userId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data().tasks : [];
}

// Auth functions
export { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut };
export { db };
