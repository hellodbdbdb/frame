// firebase.js — auth + sync layer for frame
// Firebase v10 modular SDK loaded from gstatic CDN (no bundler, GitHub Pages friendly).

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signOut as fbSignOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { firebaseConfig } from "./firebase-config.js";
import { SEED_QUESTIONS } from "./data.js";

// ---------- init ----------

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// ---------- auth ----------

export function onAuth(cb) {
  return onAuthStateChanged(auth, cb);
}

export async function signIn() {
  // Popup first, fall back to redirect on mobile browsers that block popups.
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    if (
      err.code === "auth/popup-blocked" ||
      err.code === "auth/popup-closed-by-user" ||
      err.code === "auth/operation-not-supported-in-this-environment"
    ) {
      await signInWithRedirect(auth, provider);
    } else {
      throw err;
    }
  }
}

export async function handleRedirect() {
  try {
    await getRedirectResult(auth);
  } catch (err) {
    console.warn("redirect result", err);
  }
}

export async function signOut() {
  await fbSignOut(auth);
}

export function currentUser() {
  return auth.currentUser;
}

// ---------- firestore layout ----------
//
// users/{uid}                          — profile doc (displayName, email, createdAt, seedVersion)
// users/{uid}/questions/{qid}          — per-question state (answer, anchor, beats, lastEditedAt)
// users/{uid}/logs/{autoId}            — practice log entry (questionId, mode, rating, duration, sessionId, ts)
// users/{uid}/sessions/{autoId}        — a mock or drill session (startedAt, endedAt, mode, notes)

function userDoc(uid) {
  return doc(db, "users", uid);
}

function questionsCol(uid) {
  return collection(db, "users", uid, "questions");
}

function questionDoc(uid, qid) {
  return doc(db, "users", uid, "questions", qid);
}

function logsCol(uid) {
  return collection(db, "users", uid, "logs");
}

function sessionsCol(uid) {
  return collection(db, "users", uid, "sessions");
}

// ---------- seeding ----------

const SEED_VERSION = 2;

export async function ensureSeed(user) {
  const uref = userDoc(user.uid);
  const usnap = await getDoc(uref);

  if (!usnap.exists()) {
    await setDoc(uref, {
      displayName: user.displayName || null,
      email: user.email || null,
      createdAt: serverTimestamp(),
      seedVersion: 0
    });
  }

  const profile = (await getDoc(uref)).data() || {};
  const current = profile.seedVersion || 0;
  if (current >= SEED_VERSION) return;

  const batch = writeBatch(db);

  if (current < 1) {
    // First-time seed: write all question entries in full.
    for (const q of SEED_QUESTIONS) {
      batch.set(questionDoc(user.uid, q.id), {
        order: q.order,
        theme: q.theme,
        type: q.type,
        title: q.title,
        prompt: q.prompt,
        answer: q.answer,
        anchor: q.anchor,
        beats: q.beats || [],
        baseline: q.baseline || 3,
        lastEditedAt: serverTimestamp()
      });
    }
  } else if (current < 2) {
    // v2 migration: refresh anchor + beats from data.js (answers, ratings, etc. untouched).
    for (const q of SEED_QUESTIONS) {
      batch.set(questionDoc(user.uid, q.id), {
        anchor: q.anchor,
        beats: q.beats || [],
        lastEditedAt: serverTimestamp()
      }, { merge: true });
    }
  }

  batch.set(uref, { seedVersion: SEED_VERSION }, { merge: true });
  await batch.commit();
}

// ---------- questions ----------

export async function loadQuestions(uid) {
  const snap = await getDocs(questionsCol(uid));
  const rows = [];
  snap.forEach((d) => rows.push({ id: d.id, ...d.data() }));
  rows.sort((a, b) => (a.order || 0) - (b.order || 0));
  return rows;
}

export async function saveQuestion(uid, qid, patch) {
  await updateDoc(questionDoc(uid, qid), {
    ...patch,
    lastEditedAt: serverTimestamp()
  });
}

export async function deleteQuestion(uid, qid) {
  await deleteDoc(questionDoc(uid, qid));
}

export async function createQuestion(uid, data) {
  const ref = await addDoc(questionsCol(uid), {
    order: typeof data.order === "number" ? data.order : Date.now(),
    theme: data.theme,
    type: data.type || "framework",
    title: data.title,
    prompt: data.prompt || "",
    answer: data.answer || "",
    anchor: data.anchor || "",
    beats: Array.isArray(data.beats) ? data.beats : [],
    baseline: data.baseline || 3,
    custom: true,
    createdAt: serverTimestamp(),
    lastEditedAt: serverTimestamp()
  });
  return ref.id;
}


// ---------- logs ----------

export async function logPractice(uid, entry) {
  // entry: { questionId, mode, rating (1-5), durationSec, sessionId, note }
  await addDoc(logsCol(uid), {
    ...entry,
    ts: serverTimestamp()
  });
}

export async function loadLogs(uid, max = 500) {
  const q = query(logsCol(uid), orderBy("ts", "desc"), limit(max));
  const snap = await getDocs(q);
  const rows = [];
  snap.forEach((d) => rows.push({ id: d.id, ...d.data() }));
  return rows;
}

export async function clearAllLogs(uid) {
  const snap = await getDocs(logsCol(uid));
  if (snap.empty) return 0;
  // Firestore batches cap at 500 writes.
  const docs = [];
  snap.forEach((d) => docs.push(d.ref));
  for (let i = 0; i < docs.length; i += 450) {
    const batch = writeBatch(db);
    for (const ref of docs.slice(i, i + 450)) batch.delete(ref);
    await batch.commit();
  }
  return docs.length;
}

export async function clearLogsByIds(uid, ids) {
  if (!ids.length) return 0;
  for (let i = 0; i < ids.length; i += 450) {
    const batch = writeBatch(db);
    for (const id of ids.slice(i, i + 450)) {
      batch.delete(doc(db, "users", uid, "logs", id));
    }
    await batch.commit();
  }
  return ids.length;
}

// ---------- sessions ----------

export async function startSession(uid, mode, meta = {}) {
  const ref = await addDoc(sessionsCol(uid), {
    mode,
    startedAt: serverTimestamp(),
    endedAt: null,
    ...meta
  });
  return ref.id;
}

export async function endSession(uid, sessionId, meta = {}) {
  await updateDoc(doc(db, "users", uid, "sessions", sessionId), {
    endedAt: serverTimestamp(),
    ...meta
  });
}

export async function loadSessions(uid, max = 50) {
  const q = query(sessionsCol(uid), orderBy("startedAt", "desc"), limit(max));
  const snap = await getDocs(q);
  const rows = [];
  snap.forEach((d) => rows.push({ id: d.id, ...d.data() }));
  return rows;
}
