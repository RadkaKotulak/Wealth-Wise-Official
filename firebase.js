import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Replace with your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCBdjJskd2G4QqVx5h2e9mnVrpsdOgSxLM",
  authDomain: "wealth-wise-official.firebaseapp.com",
  projectId: "wealth-wise-official",
  storageBucket: "wealth-wise-official.firebasestorage.app",
  messagingSenderId: "1044022092525",
  appId: "1:1044022092525:web:12a28f6fd0dd83099fe2e4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
