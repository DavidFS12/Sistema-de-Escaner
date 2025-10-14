import {initializeApp} from "firebase/app";
import {getFirestore} from "firebase/firestore";
import {getStorage} from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDCTs5PsbkvIU77EryNTs0bGLW6jDPlBxs",
  authDomain: "ferreteriaapp-a167c.firebaseapp.com",
  projectId: "ferreteriaapp-a167c",
  storageBucket: "ferreteriaapp-a167c.firebasestorage.app",
  messagingSenderId: "14463853969",
  appId: "1:14463853969:web:cb707a72f7d806dc8d2630",
  measurementId: "G-SV7ESCD8GS"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);