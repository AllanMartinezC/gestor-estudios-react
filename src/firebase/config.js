import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCa6tAmCSvJhuLIZKEVf9xCQvmwY-8XMy0",
  authDomain: "gestor-estudios.firebaseapp.com",
  projectId: "gestor-estudios",
  storageBucket: "gestor-estudios.appspot.com",
  messagingSenderId: "139021643997",
  appId: "1:139021643997:web:b0dca22e7081cea33feb34"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
