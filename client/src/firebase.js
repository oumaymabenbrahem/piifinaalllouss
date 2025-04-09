import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, FacebookAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBFJCBcplRPK3ue7aKIgx7-OB1T_4JG8-s",
  authDomain: "sustainafood-51a21.firebaseapp.com",
  projectId: "sustainafood-51a21",
  storageBucket: "sustainafood-51a21.firebasestorage.app",
  messagingSenderId: "508879457237",
  appId: "1:508879457237:web:2dee56c7b8798807cb4b5c",
  measurementId: "G-TFY293K8PS"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const fbProvider = new FacebookAuthProvider();
fbProvider.addScope('email');
fbProvider.setCustomParameters({
    display: 'popup'
});

export { auth, provider, signInWithPopup, FacebookAuthProvider, fbProvider }; 