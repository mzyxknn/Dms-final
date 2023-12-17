import { initializeApp } from "firebase/app";

import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Import the functions you need from the SDKs you need
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC_9OqoFn0-Zd2QXGXiwyuvfKc0MeAVSUI",
  authDomain: "lgudms.firebaseapp.com",
  projectId: "lgudms",
  storageBucket: "lgudms.appspot.com",
  messagingSenderId: "517744715353",
  appId: "1:517744715353:web:a51b50939b7ea2a49d3348",
};

// Initialize Firebas
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
