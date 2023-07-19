"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = exports.app = void 0;
const app_1 = require("firebase/app");
const storage_1 = require("firebase/storage");
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
exports.app = (0, app_1.initializeApp)(firebaseConfig);
exports.storage = (0, storage_1.getStorage)(exports.app);
