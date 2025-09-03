// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// إعدادات Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAD0lj90OX-tb4B-JFL134RQ_Rqa09wHh4",
    authDomain: "whatsapp-almggaly.firebaseapp.com",
    projectId: "whatsapp-almggaly",
    storageBucket: "whatsapp-almggaly.appspot.com",
    messagingSenderId: "613808236092",
    appId: "1:613808236092:web:932e2eaabc94038e954539",
    measurementId: "G-BY8J7MX142"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);

// تهيئة Firestore
export const db = getFirestore(app);
