import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database"; // أضف هذا

const firebaseConfig = {
  apiKey: "AIzaSyDI4hsmypB7G72biIWiK-OQUIFBZTf9mtQ",
  authDomain: "workflow-pro-f2edd.firebaseapp.com",
  databaseURL: "https://workflow-pro-f2edd-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "workflow-pro-f2edd",
  storageBucket: "workflow-pro-f2edd.firebasestorage.app",
  messagingSenderId: "248994990014",
  appId: "1:248994990014:web:cc41cc127ac2551cef1bef",
  measurementId: "G-ZVLBEFM8PQ",
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = getDatabase(app); // 

export { app, analytics, database }; // 