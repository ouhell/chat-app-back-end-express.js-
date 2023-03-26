const { initializeApp } = require("firebase/app");
const { getStorage } = require("firebase/storage");

const firebaseConfig = {
  apiKey: "AIzaSyCD-yAVJ1V8Fs69M9_gaRH5gN3iuLhytis",
  authDomain: "chatapp-717fc.firebaseapp.com",
  projectId: "chatapp-717fc",
  storageBucket: "chatapp-717fc.appspot.com",
  messagingSenderId: "731043611505",
  appId: "1:731043611505:web:3d22e6b4443b0051cd2cd0",
  measurementId: "G-NVCH2P1RLN",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

module.exports = { storage };
