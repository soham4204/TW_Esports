import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';

const firebaseConfig = {
    apiKey: "AIzaSyCGUawUW8fDbaFFLFOd9DmsmMGVAvMJBmo",
    authDomain: "tw-esports-46ca3.firebaseapp.com",
    databaseURL: "https://tw-esports-46ca3-default-rtdb.firebaseio.com",
    projectId: "tw-esports-46ca3",
    storageBucket: "tw-esports-46ca3.appspot.com",
    messagingSenderId: "589459370219",
    appId: "1:589459370219:web:e673086591d8cad071ceae",
    measurementId: "G-T5BYC4Z804"
};

firebase.initializeApp(firebaseConfig);
export const auth = firebase.auth();
export const db = firebase.firestore();






