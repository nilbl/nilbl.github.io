// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC_VjafHFqsebwUNRMH4b7ecC98rFlJ_Ww",
    authDomain: "nilbl-portfolio.firebaseapp.com",
    projectId: "nilbl-portfolio",
    storageBucket: "nilbl-portfolio.firebasestorage.app",
    messagingSenderId: "1077104974665",
    appId: "1:1077104974665:web:07b30ee9ce97f856935898"
};

// Initialize Firebase (using modular SDK v9+)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, addDoc, getDocs, query, orderBy, limit };
