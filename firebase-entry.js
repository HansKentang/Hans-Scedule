import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

var config = {
  apiKey: "AIzaSyBLrSNOLrpGEsvkUMddC4aZONqQ6AAVyWc",
  authDomain: "haven-schdule.firebaseapp.com",
  projectId: "haven-schdule",
  storageBucket: "haven-schdule.firebasestorage.app",
  messagingSenderId: "115419547977",
  appId: "1:115419547977:web:473fed3b70a004ca8a7298"
};

var app = initializeApp(config);
var auth = getAuth(app);
var provider = new GoogleAuthProvider();

window.__firebase = { auth: auth, provider: provider, signInWithPopup: signInWithPopup };
