import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 🔑 KLISTRA IN DIN CONFIG HÄR
const firebaseConfig = {
    apiKey: "AIzaSyBDf7wFAybRoUoofVXr-4vJMFXwfmATn8k",
    authDomain: "familydash-9d0dd.firebaseapp.com",
    projectId: "familydash-9d0dd",
    storageBucket: "familydash-9d0dd.firebasestorage.app",
    messagingSenderId: "1087350004176",
    appId: "1:1087350004176:web:8660e048082b2db0f781d5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const colRef = collection(db, "komIhag");

const q = query(colRef, orderBy("createdAt", "desc"), limit(8));

onSnapshot(q, (snapshot) => {
  const list = document.getElementById("komihag-list");
  list.innerHTML = "";

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();

    const li = document.createElement("li");
    li.textContent = data.text;

    li.onclick = () => deleteDoc(doc(db, "komIhag", docSnap.id));

    list.appendChild(li);
  });
});

window.addKomIhag = async () => {
  const input = document.getElementById("komihag-input");
  const text = input.value.trim();

  if (!text) return;

  await addDoc(colRef, {
    text,
    createdAt: Date.now()
  });

  input.value = "";
};
