// import { initializeApp } from "firebase/app";
// import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
// import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";

export const FirebaseMgr = {
    auth: null,
    db: null,
    appId: 'local-mode',
    currentUser: { uid: 'local-user', isAnonymous: true }, // Mock user

    init: async () => {
        console.log("Firebase disabled (Local Mode)");
    },

    saveScore: async (state) => {
        console.log("Score saving disabled (Local Mode)", state.skulls);
        // Local storage saving could be added here if desired
    },

    getRankings: async () => {
        console.log("Rankings disabled (Local Mode)");
        // Return dummy ranking for UI testing
        return [
            { uid: 'cpu1', name: 'Alpha', skulls: 5000, difficulty: 'HARD' },
            { uid: 'cpu2', name: 'Bravo', skulls: 3000, difficulty: 'NORMAL' },
            { uid: 'cpu3', name: 'Charlie', skulls: 1000, difficulty: 'EASY' }
        ];
    }
};

// onAuthStateChanged... (Disabled)
