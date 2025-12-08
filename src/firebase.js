import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "change it",
  authDomain: "change it",
  projectId: "change it",
  storageBucket: "change it",
  messagingSenderId: "change it",
  appId: "change it",
  measurementId: "change it"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

