import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, getDocs, collection, query, orderBy } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD0tGmRezXlQUlzLJ586zPYv28lle2tDAw",
  authDomain: "arena-tour-1b3a5.firebaseapp.com",
  projectId: "arena-tour-1b3a5",
  storageBucket: "arena-tour-1b3a5.firebasestorage.app",
  messagingSenderId: "778097067948",
  appId: "1:778097067948:web:8f887eb019c710ced65c09"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Auth helpers
export function registerUser(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export function loginUser(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function logoutUser() {
  return signOut(auth);
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// Firestore: sync player achievements
export async function syncAchievements(userId, playerName, avatar, seasonData) {
  const p = seasonData.player;
  const best = p.best || {};
  const rank = seasonData._lastRank || best.rank || 1001;

  await setDoc(doc(db, "achievements", userId), {
    userId,
    playerName,
    avatar: avatar || "⚔️",
    seasonsPlayed: seasonData.sNum || 1,
    bestRank: Math.min(rank, best.rank || 1001),
    bestSeasonPts: Math.max(p.sp || 0, best.peakS || 0),
    careerMoney: p.money || 0,
    gsTitles: best.gsTitles || 0,
    totalTitles: best.titles || 0,
    finalsWins: best.finals || 0,
    updatedAt: new Date()
  });
}

// Firestore: save full game state to cloud
export async function saveGameToCloud(userId, gameState) {
  if (!userId) return;
  if (!gameState) {
    await setDoc(doc(db, "saves", userId), { gameState: null, updatedAt: new Date() });
    return;
  }
  await setDoc(doc(db, "saves", userId), {
    gameState: JSON.stringify(gameState),
    updatedAt: new Date()
  });
}

// Firestore: load full game state from cloud
export async function loadGameFromCloud(userId) {
  if (!userId) return null;
  const snap = await getDoc(doc(db, "saves", userId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return data.gameState ? JSON.parse(data.gameState) : null;
}

// Firestore: get global leaderboard
export async function getLeaderboard() {
  const q = query(collection(db, "achievements"), orderBy("bestRank", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}
